# Werkafspraken voor dit project

- **Het spel is Schijfduel.** Bron van waarheid: `schijfduel/SCHIJFDUEL_CLAUDE_HANDOFF.md`
  (Grok). Waar die tekst en de JSON botsen, wint de JSON; zie `schijfduel/rules.md`.
- Publiek domein mythologie. **Geen Pokémon-namen, -termen of -IP** in wat de speler ziet.
- **Zuinig werken** (Koens basisregel): gericht lezen, geen brede verkenning als een
  grep het doet, niet opnieuw uitzoeken wat vaststaat.
- Edit bestaande bestanden, herbouw niet vanaf nul zonder dat Koen erom vraagt.
- Animeer alleen `transform` en `opacity`; geen `backdrop-filter`.
- Tests: `node test/schijfduel.test.js` en (met een server op 8123)
  `node test/schijfduel.smoke.js`.
- Het vorige spel (Rondel) staat in de git-geschiedenis op commit `8184d9c`;
  `docs/00_Status_en_Beslissingen.md` is de geschiedenis daarvan.
