HIER SPIELT DIE MUSIK BY LENI – SPOTIFY WEB PLAYER

Diese Version spielt den Song direkt im Browser über den Spotify Web Playback SDK.
Der QR-Code bleibt unverändert und verweist weiterhin auf:
https://leni358.github.io/hierspieltdiemusik/?id=0001 usw.

SPOTIFY APP
Client ID: c65a12efad33433c992d46e3e1c5f3ce
Redirect URI: https://leni358.github.io/hierspieltdiemusik/

WICHTIG
- Kein Client Secret wird benötigt oder in der Website gespeichert.
- Spotify Premium ist erforderlich.
- Die Spotify Developer App ist im Development Mode: nur freigeschaltete Nutzer können sich anmelden.
- Für eine Spielrunde reicht es, wenn das Handy des Spielleiters mit einem freigeschalteten Premium-Konto verbunden ist.

GITHUB-AKTUALISIERUNG
1. ZIP entpacken.
2. GitHub Repository 'hierspieltdiemusik' öffnen.
3. Code > Add file > Upload files.
4. Alle Dateien aus diesem Ordner hochladen und vorhandene Dateien überschreiben.
5. Commit changes.
6. 1–3 Minuten warten.
7. Seite mit Strg+F5 neu laden.

TEST
1. Einen vorhandenen Karten-QR-Code scannen.
2. Beim ersten Mal erscheint 'Mit Spotify verbinden'.
3. Spotify-Zugriff bestätigen.
4. Danach landet man wieder auf der Karte.
5. 'Song starten' drücken.
6. Der Song sollte direkt auf der Website abgespielt werden; Titel und Interpret werden nicht angezeigt.

HINWEIS iPHONE / MOBILE
Mobile Browser verlangen einen echten Fingertipp für Audiowiedergabe. Deshalb startet die Musik erst über den Button.


NEU: INTEGRIERTER QR-SCANNER

Die Website kann jetzt die Rückkamera direkt verwenden:
1. Website öffnen.
2. "Karte scannen" antippen.
3. Beim ersten Mal Kamerazugriff erlauben.
4. QR-Code in den Rahmen halten.
5. Die Karte wird automatisch übernommen.
6. "Song starten" drücken.
7. Danach über "Nächste Karte scannen" direkt weiterspielen.

Die vorhandenen gedruckten QR-Codes bleiben unverändert.

Technik:
- Kamera: Browser MediaDevices über html5-qrcode
- QR-Erkennung: html5-qrcode
- Bevorzugte Kamera: Rückkamera
- Es werden nur QR-Codes dieser eigenen Website akzeptiert.
