# MatheTrainer Android App (Play Store) über TWA

Dieses Verzeichnis ist die Basis für deine Android-App als Trusted Web Activity.

## Ziel
- Deine Next.js-Website bleibt dein Hauptprojekt.
- Die Android-App im Play Store zeigt deine Live-Web-App.
- Wenn du deine Website aktualisierst und neu deployest, sind die Änderungen auch in der App sichtbar.

## 1) Web-App deployen
Deine Website muss unter HTTPS auf einer echten Domain laufen, z. B.:
- https://app.deinedomain.de

## 2) Werte in `twa-manifest.json` anpassen
Pflichtfelder:
- `packageId`
- `host`
- `iconUrl`
- `maskableIconUrl`
- `monochromeIconUrl`

## 3) Bubblewrap installieren
```bash
npm i -g @bubblewrap/cli
```

## 4) Android-Projekt erzeugen
Im Ordner `twa` ausführen:
```bash
bubblewrap init --manifest ./twa-manifest.json
bubblewrap build
```

## 5) Digital Asset Links einrichten
Die Datei `assetlinks.json.example` anpassen und unter folgender URL veröffentlichen:
```text
https://DEINE-DOMAIN/.well-known/assetlinks.json
```

## 6) Play Store
Am Ende lädst du das generierte `.aab` in der Google Play Console hoch.

## Wichtiger Hinweis
Wenn du später native Funktionen wie Kamera, lokale Dateien oder komplexe Push-Flows willst,
kann man später immer noch auf Capacitor wechseln. Für dein jetziges Ziel ist TWA die schlankste Lösung.
