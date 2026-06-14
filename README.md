# Rondel

Tactisch fantasy-bordspel met grid-movement en spinner-disk combat. Mechanics zijn
1-op-1 overgenomen uit Pokémon Duel / Comaster; de setting is eigen high-fantasy
folklore (public domain, geen beschermd IP). Mobile-first prototype, fase 1.5
(mechanics-validatie). Einddoel is een mobiele app.

> **Bron van waarheid:** bij twijfel of conflict tussen een projectkeuze en hoe
> Pokémon Duel werkt, wint Duel. Zie het statusdocument.

## Repo-structuur

```
index.html              Het volledige spel (HTML/CSS/JS in één bestand)
manifest.webmanifest    PWA-manifest
sw.js                   Service worker (cachet index.html + art voor offline gebruik)
icon-192.png            PWA-iconen
icon-512.png
art/                    18 unit-PNG's (character-art), los ingeladen door index.html
docs/
  00_Status_en_Beslissingen.md   Levend statusdocument: beslissingen, mechanics, open punten
```

Tot v21 zaten alle 18 PNG's base64-ingebakken in `index.html` (~515KB). De art is nu
losgetrokken naar `art/`; `index.html` is daardoor ~72KB. Het `UNIT_ART`-object in
`index.html` wijst per unit naar `art/<key>.png`.

## Lokaal draaien

Open `index.html` direct in de browser, of serveer de map voor de volledige
PWA-ervaring (service worker werkt niet via `file://`):

```
python3 -m http.server 8000
# → http://localhost:8000
```

## Naar een installeerbare app

Host de map op GitHub Pages → genereer een APK via PWABuilder. Een native build
(Godot/Unity) is de fase 2-beslissing.

## Een nieuwe unit-PNG toevoegen

Zet `art/<key>.png` neer en voeg in `index.html` één regel toe aan `UNIT_ART`:
`<key>: "art/<key>.png"`. Voeg het pad ook toe aan de `ASSETS`-lijst in `sw.js`
zodat het offline gecachet wordt. Units zonder art vallen terug op een silhouet.
