(() => {
  const cardNumber = document.getElementById('cardNumber');
  const playButton = document.getElementById('playButton');
  const status = document.getElementById('status');

  const params = new URLSearchParams(window.location.search);
  const rawId = (params.get('id') || '').trim();
  const id = /^\d+$/.test(rawId) ? rawId.padStart(4, '0') : rawId;

  if (!id) {
    cardNumber.textContent = 'Keine Karte erkannt';
    status.textContent = 'Bitte öffne diese Seite über den QR-Code einer Spielkarte.';
    return;
  }

  cardNumber.textContent = `Karte #${id}`;

  fetch('songs.json', { cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error('Songliste konnte nicht geladen werden.');
      return response.json();
    })
    .then(songs => {
      const url = songs[id];
      if (!url) {
        status.textContent = `Für Karte #${id} ist kein Song hinterlegt.`;
        return;
      }

      playButton.disabled = false;
      status.textContent = 'Bereit. Der Titel bleibt auf dieser Seite verborgen.';
      playButton.addEventListener('click', () => {
        // Spotify-Track direkt öffnen. Auf Mobilgeräten übernimmt meist die Spotify-App.
        window.location.href = url;
      }, { once: true });
    })
    .catch(() => {
      status.textContent = 'Die Songliste konnte gerade nicht geladen werden.';
    });
})();
