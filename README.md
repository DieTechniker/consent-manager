# TK Consent Manager (für externe Websites)

## Installation 
Nachdem das Projekt ausgecheckt wurde, muss initial ein `yarn install` ausgeführt werden, um sämtliche Dependencies zu installieren.

## Lokale Entwicklung
Über den Befehl `yarn start` wird mit Hilfe von [Parcel](https://parceljs.org/getting_started.html) ein lokaler Server gestartet, der auf der Adresse https://localhost:1234 läuft und den lokalen Entwicklungsstand reflektiert. Hot-Reloading bei Änderungen am Quellcode wird unterstützt.
Platzhalter werden in diesem Modus nicht ersetzt.

## Testlauf
Über den Befehl `yarn test` wird mit Hilfe von [Parcel](https://parceljs.org/getting_started.html) ein lokaler Server gestartet, der auf der Adresse https://localhost:1234 läuft und den aktuell publizierten.
Die Platzhalter werden in diesem Modus ersetzt, so wie diese im Tealium-Profil der TK hinterlegt sind.
