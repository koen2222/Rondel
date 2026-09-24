# Schijfduel

*Draai de schijf. Verover het doel.* — concept Koen, ontwerp in `SCHIJFDUEL_CLAUDE_HANDOFF.md`.

```
schijfduel/
  SCHIJFDUEL_CLAUDE_HANDOFF.md   bron van waarheid (Grok)
  rules.md                       de regels in speltaal + gemaakte keuzes
  board.json                     28 knopen + edges (bevroren)
  vinyls.json                    12 beesten, schijven van 24 tikken
  proto/index.html               het spel
  proto/game.js                  regelmotor (puur; draait ook in Node)
  proto/ai.js                    greedy-AI
  proto/voortgang.js             campagne, ladder, stal
  proto/render.js                bord, figuren, schijven
  proto/app.js                   schermen en spelstroom
  proto/style.css                merk: navy / crème / goud
```

Spelen: open `proto/index.html` via een webserver (de JSON wordt met `fetch` geladen).
`?seed=123` speelt een potje exact na; `?snel=1` maakt alle animaties kort.

Testen (vanuit de repo-root):
```
node test/schijfduel.test.js                       # regels, AI, campagne, ladder
python3 -m http.server 8123 & node test/schijfduel.smoke.js   # echte browser
```

Het vorige spel (Rondel, met het Duel-bord en 54 figuren) staat in de git-geschiedenis
op commit `8184d9c`.
