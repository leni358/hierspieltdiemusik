(() => {
  "use strict";

  const CLIENT_ID = "c65a12efad33433c992d46e3e1c5f3ce";
  const REDIRECT_URI = "https://leni358.github.io/hierspieltdiemusik/";
  const SCOPES = [
    "streaming",
    "user-read-email",
    "user-read-private",
    "user-modify-playback-state",
    "user-read-playback-state"
  ];

  const TOKEN_KEY = "leni_spotify_tokens_v1";
  const VERIFIER_KEY = "leni_pkce_verifier";
  const STATE_KEY = "leni_oauth_state";
  const CARD_KEY = "leni_card_id";

  const cardNumber = document.getElementById("cardNumber");
  const playButton = document.getElementById("playButton");
  const playLabel = document.getElementById("playLabel");
  const playIcon = document.getElementById("playIcon");
  const status = document.getElementById("status");

  let cardId = "";
  let trackUri = "";
  let player = null;
  let deviceId = "";
  let playerReady = false;
  let isPlaying = false;
  let songs = null;

  function normalizeCardId(value) {
    const raw = (value || "").trim();
    if (!raw) return "";
    return /^\d+$/.test(raw) ? raw.padStart(4, "0") : raw;
  }

  function setButton(label, icon = "▶", disabled = false) {
    playLabel.textContent = label;
    playIcon.textContent = icon;
    playButton.disabled = disabled;
  }

  function getCardIdFromUrl() {
    const params = new URLSearchParams(location.search);
    return normalizeCardId(params.get("id"));
  }

  function spotifyUrlToUri(url) {
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split("/").filter(Boolean);
      const trackIndex = parts.indexOf("track");
      if (trackIndex >= 0 && parts[trackIndex + 1]) {
        return `spotify:track:${parts[trackIndex + 1]}`;
      }
    } catch (_) {}
    if ((url || "").startsWith("spotify:track:")) return url;
    return "";
  }

  function base64UrlEncode(bytes) {
    let binary = "";
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function randomString(byteLength = 48) {
    const bytes = new Uint8Array(byteLength);
    crypto.getRandomValues(bytes);
    return base64UrlEncode(bytes);
  }

  async function sha256Base64Url(text) {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(text)
    );
    return base64UrlEncode(new Uint8Array(digest));
  }

  function loadTokens() {
    try {
      return JSON.parse(localStorage.getItem(TOKEN_KEY) || "null");
    } catch (_) {
      return null;
    }
  }

  function saveTokens(tokenResponse, previous = null) {
    const now = Date.now();
    const data = {
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token || previous?.refresh_token || "",
      expires_at: now + Math.max(30, Number(tokenResponse.expires_in || 3600) - 60) * 1000
    };
    localStorage.setItem(TOKEN_KEY, JSON.stringify(data));
    return data;
  }

  async function refreshAccessToken(tokens) {
    if (!tokens?.refresh_token) throw new Error("Keine Spotify-Anmeldung vorhanden.");

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: tokens.refresh_token,
      client_id: CLIENT_ID
    });

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });

    if (!response.ok) {
      localStorage.removeItem(TOKEN_KEY);
      throw new Error("Spotify-Anmeldung ist abgelaufen.");
    }

    return saveTokens(await response.json(), tokens);
  }

  async function getValidAccessToken() {
    let tokens = loadTokens();
    if (!tokens) return "";

    if (tokens.access_token && Date.now() < tokens.expires_at) {
      return tokens.access_token;
    }

    tokens = await refreshAccessToken(tokens);
    return tokens.access_token;
  }

  async function startAuthorization() {
    if (cardId) sessionStorage.setItem(CARD_KEY, cardId);

    const verifier = randomString(64);
    const challenge = await sha256Base64Url(verifier);
    const state = randomString(24);

    sessionStorage.setItem(VERIFIER_KEY, verifier);
    sessionStorage.setItem(STATE_KEY, state);

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: "code",
      redirect_uri: REDIRECT_URI,
      scope: SCOPES.join(" "),
      code_challenge_method: "S256",
      code_challenge: challenge,
      state
    });

    location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async function handleOAuthCallback() {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    const returnedState = params.get("state");
    const error = params.get("error");

    if (error) {
      history.replaceState(null, "", REDIRECT_URI);
      throw new Error("Spotify-Zugriff wurde nicht bestätigt.");
    }

    if (!code) return false;

    const expectedState = sessionStorage.getItem(STATE_KEY);
    const verifier = sessionStorage.getItem(VERIFIER_KEY);

    if (!returnedState || !expectedState || returnedState !== expectedState || !verifier) {
      throw new Error("Spotify-Anmeldung konnte nicht sicher abgeschlossen werden.");
    }

    const body = new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier
    });

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });

    if (!response.ok) {
      throw new Error("Spotify-Anmeldung ist fehlgeschlagen.");
    }

    saveTokens(await response.json());

    sessionStorage.removeItem(VERIFIER_KEY);
    sessionStorage.removeItem(STATE_KEY);

    const restoredId = normalizeCardId(sessionStorage.getItem(CARD_KEY));
    if (restoredId) {
      cardId = restoredId;
      history.replaceState(null, "", `${REDIRECT_URI}?id=${encodeURIComponent(restoredId)}`);
    } else {
      history.replaceState(null, "", REDIRECT_URI);
    }

    return true;
  }

  async function loadSongs() {
    const response = await fetch("songs.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Songliste konnte nicht geladen werden.");
    songs = await response.json();
  }

  function loadSpotifySDK() {
    if (window.Spotify?.Player) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const oldReady = window.onSpotifyWebPlaybackSDKReady;
      window.onSpotifyWebPlaybackSDKReady = () => {
        if (typeof oldReady === "function") oldReady();
        resolve();
      };

      const existing = document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]');
      if (existing) return;

      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      script.onerror = () => reject(new Error("Spotify-Player konnte nicht geladen werden."));
      document.body.appendChild(script);

      setTimeout(() => {
        if (window.Spotify?.Player) resolve();
      }, 4000);
    });
  }

  async function initializePlayer() {
    const token = await getValidAccessToken();
    if (!token) return false;

    status.textContent = "Spotify-Player wird verbunden …";
    setButton("Spotify wird verbunden …", "♪", true);

    await loadSpotifySDK();

    if (player) return playerReady;

    player = new Spotify.Player({
      name: "Hier spielt die Musik by Leni",
      getOAuthToken: async cb => {
        try {
          cb(await getValidAccessToken());
        } catch (_) {
          cb("");
        }
      },
      volume: 0.85
    });

    player.addListener("ready", ({ device_id }) => {
      deviceId = device_id;
      playerReady = true;
      status.textContent = "Bereit. Titel und Interpret bleiben verborgen.";
      setButton("Song starten", "▶", false);
    });

    player.addListener("not_ready", () => {
      playerReady = false;
      deviceId = "";
      status.textContent = "Spotify-Player ist gerade nicht verfügbar.";
      setButton("Erneut verbinden", "↻", false);
    });

    player.addListener("initialization_error", ({ message }) => {
      status.textContent = "Der Spotify-Player konnte nicht gestartet werden.";
      console.error(message);
    });

    player.addListener("authentication_error", ({ message }) => {
      localStorage.removeItem(TOKEN_KEY);
      status.textContent = "Bitte erneut mit Spotify verbinden.";
      setButton("Mit Spotify verbinden", "♫", false);
      console.error(message);
    });

    player.addListener("account_error", ({ message }) => {
      status.textContent = "Für die Wiedergabe wird Spotify Premium benötigt.";
      console.error(message);
    });

    player.addListener("playback_error", ({ message }) => {
      status.textContent = "Der Song konnte gerade nicht abgespielt werden.";
      console.error(message);
    });

    player.addListener("autoplay_failed", () => {
      status.textContent = "Tippe noch einmal auf „Song starten“.";
      setButton("Song starten", "▶", false);
    });

    player.addListener("player_state_changed", state => {
      if (!state) return;
      isPlaying = !state.paused;
      if (isPlaying) {
        setButton("Pausieren", "❚❚", false);
        status.textContent = "Musik läuft – Songdaten bleiben verborgen.";
      } else if (playerReady) {
        setButton("Weiter", "▶", false);
      }
    });

    const connected = await player.connect();
    if (!connected) {
      throw new Error("Spotify-Player konnte nicht verbunden werden.");
    }
    return true;
  }

  async function startSpecificTrack() {
    if (!player || !playerReady || !deviceId) {
      await initializePlayer();
      if (!playerReady || !deviceId) {
        status.textContent = "Spotify verbindet sich noch. Bitte gleich erneut tippen.";
        return;
      }
    }

    // Must be triggered from the user's click on mobile browsers.
    try { player.activateElement(); } catch (_) {}

    const token = await getValidAccessToken();
    if (!token) {
      await startAuthorization();
      return;
    }

    const endpoint = `https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`;
    const response = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ uris: [trackUri] })
    });

    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      await startAuthorization();
      return;
    }

    if (response.status === 403) {
      throw new Error("Spotify Premium oder die nötige Berechtigung fehlt.");
    }

    if (!response.ok) {
      throw new Error(`Spotify Wiedergabefehler (${response.status}).`);
    }

    isPlaying = true;
    setButton("Pausieren", "❚❚", false);
    status.textContent = "Musik läuft – Songdaten bleiben verborgen.";
  }

  async function onMainButtonClick() {
    playButton.disabled = true;

    try {
      const token = await getValidAccessToken();

      if (!token) {
        status.textContent = "Einmalig mit Spotify verbinden …";
        await startAuthorization();
        return;
      }

      if (!playerReady) {
        await initializePlayer();
      }

      if (isPlaying) {
        await player.pause();
        isPlaying = false;
        setButton("Weiter", "▶", false);
        status.textContent = "Pausiert.";
      } else {
        await startSpecificTrack();
      }
    } catch (error) {
      console.error(error);
      status.textContent = error?.message || "Spotify konnte gerade nicht gestartet werden.";
      setButton("Erneut versuchen", "↻", false);
    }
  }

  async function boot() {
    try {
      cardId = getCardIdFromUrl() || normalizeCardId(sessionStorage.getItem(CARD_KEY));

      const callbackHandled = await handleOAuthCallback();
      if (callbackHandled) {
        cardId = getCardIdFromUrl() || normalizeCardId(sessionStorage.getItem(CARD_KEY));
      }

      if (!cardId) {
        cardNumber.textContent = "Keine Karte erkannt";
        status.textContent = "Bitte öffne diese Seite über den QR-Code einer Spielkarte.";
        setButton("Song starten", "▶", true);
        return;
      }

      sessionStorage.setItem(CARD_KEY, cardId);
      cardNumber.textContent = `Karte #${cardId}`;

      await loadSongs();
      const songUrl = songs[cardId];
      trackUri = spotifyUrlToUri(songUrl);

      if (!trackUri) {
        status.textContent = `Für Karte #${cardId} ist kein gültiger Spotify-Song hinterlegt.`;
        setButton("Song starten", "▶", true);
        return;
      }

      playButton.addEventListener("click", onMainButtonClick);

      const token = await getValidAccessToken();
      if (!token) {
        status.textContent = "Einmalig mit Spotify verbinden, danach spielt der Song direkt hier.";
        setButton("Mit Spotify verbinden", "♫", false);
        return;
      }

      await initializePlayer();
    } catch (error) {
      console.error(error);
      status.textContent = error?.message || "Die Seite konnte nicht vollständig geladen werden.";
      setButton("Erneut versuchen", "↻", false);
      playButton.addEventListener("click", onMainButtonClick);
    }
  }

  boot();
})();
