HIER SPIELT DIE MUSIK BY LENI – WEBSITE
========================

INHALT
- index.html   = Spieloberfläche
- style.css    = Design
- app.js       = liest die Karten-ID und öffnet den passenden Spotify-Song
- songs.json   = Zuordnung Karte -> Spotify-Link für alle 1.192 Karten
- 404.html     = einfache Rückleitung zur Startseite

SO FUNKTIONIERT EIN QR-CODE
Nach Veröffentlichung lautet ein Karten-Link z. B.:
https://DEIN-NAME.github.io/DEIN-REPO/?id=0001

Die Website zeigt KEINEN Interpret, Titel oder Jahr an.
Erst nach dem Tippen auf "Song starten" wird der hinterlegte Spotify-Track geöffnet.

KOSTENLOS MIT GITHUB PAGES VERÖFFENTLICHEN
1. Bei github.com anmelden oder kostenloses Konto erstellen.
2. Neues Repository anlegen, z. B. "leni-hitster".
3. Die fünf Dateien aus diesem Ordner in das Repository hochladen.
4. Repository öffnen -> Settings -> Pages.
5. Unter "Build and deployment" auswählen:
   Source: Deploy from a branch
   Branch: main / (root)
6. Save.
7. Nach kurzer Zeit zeigt GitHub die öffentliche Adresse, z. B.:
   https://deinname.github.io/leni-hitster/

WICHTIG FÜR DIE ENDGÜLTIGEN QR-CODES
Die endgültigen QR-Codes sollten NICHT direkt auf Spotify zeigen, sondern auf:
https://deinname.github.io/leni-hitster/?id=0001
https://deinname.github.io/leni-hitster/?id=0002
...

Sobald die tatsächliche GitHub-Pages-Adresse feststeht, können daraus automatisch
alle 1.192 neuen QR-Codes und anschließend die endgültige Druck-PDF erzeugt werden.

SONGS ÄNDERN
Wenn später ein Song getauscht werden soll, muss nur die entsprechende Zeile in
songs.json geändert werden. Der gedruckte QR-Code kann unverändert bleiben.
