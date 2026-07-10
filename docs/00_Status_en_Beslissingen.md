RONDEL — STATUS EN BESLISSINGEN
Laatste update: 14 juni 2026 (sessie 15)

KERNCONCEPT
- Tabletop-first fantasy bordspel, einddoel = digitale app
- Werknaam: Rondel
- Mechanics 1-op-1 overgenomen uit Pokémon Duel / Comaster
- Setting: high fantasy, folklore- en mythologie-creatures (public domain, geen beschermd IP)

META-PRINCIPE
Bij contradictie tussen project-instructies en Pokémon Duel-structuur: Duel wint.

WERKAFSPRAAK BESTANDEN (geüpdatet sessie 14)
- Project draait nu in een git-repo (Claude Code on the web); Claude KAN bestanden lezen
  EN schrijven/committen op de feature-branch. De oude read-only-aanname (sessie 9) vervalt.
- Repo-structuur (sessie 14): index.html (game) + manifest.webmanifest + sw.js + icon-192/512.png
  in de root, art/ met 18 losse unit-PNG's, docs/00_Status_en_Beslissingen.md (dit document).
- Werkafspraak: edit bestaande bestanden, herbouw niet vanaf nul. De gebalanceerde disk-data,
  bord-layout en visuals in index.html zijn maandenlang werk — nooit ongevraagd weggooien.

VAST BESLOTEN MECHANICS

Disk-spec (Duel 1-op-1)
- 16 slots van 22.5°, 5 kleuren
- White = damage (cijfer)
- Purple = status/special (sterren tellen bij Purple-vs-Purple)
- Blue = defense (blokt White/Purple/Red, verliest van Gold)
- Gold = priority (slaat door Purple/Blue/Red heen, vs White/Gold = damage compare)
- Red = Miss

Combat-uitkomsten (Duel-correct, SYMMETRISCH — sessie 5 opnieuw geverifieerd via headless tests)
- KO en status zijn ONAFHANKELIJKE uitkomsten
- Red vs White/Gold → Red-spinner valt
- Red vs Purple → Purple's status landt op de Red-spinner
- Red vs Blue → niemand wint
- Blue blokt White en Purple → niemand KO; Blue verliest van Gold
- Gold doorbreekt Purple/Blue/Red → Gold-spinner wint
- Purple vs White → status op de White-spinner
- Purple vs Purple → meeste sterren wint, gelijk = niets
- White/Gold vs White/Gold → hoogste damage wint, gelijk = niets

Statussen (ALLEMAAL functioneel in code sinds sessie 5)
- Poison: White/Gold damage -20 (vloer 10)
- Badly Poisoned: damage -40 (vloer 10)
- Burn: kleinste White → Miss + alle damage -10
- Paralysis: kleinste White → Miss
- Confusion: gespind slot schuift 1 positie (zit in mini-combat)
- Sleep: kan niet bewegen; geneest via adjacent ally bij beurtwissel
- Frozen: kan niet aanvallen (eigen spin = Miss); kan WEL bewegen (sessie-5 fix conform spec); geneest via adjacent ally
- Curse: gereserveerd (relevant zodra revive-mechanics bestaan)

Bord (DEFINITIEF — sessie 6: terug naar 32-node layout, vlak, exact conform Koens foto)
- 32 nodes: outer ring 20 (7 top / 7 bottom incl. goals + entries, 3 per zijkant)
  + inner rechthoek 12 (5 boven IT1-5, 5 onder IB1-5, 1 mid per zijde IL/IR)
- Spokes: 4 hoek-diagonalen (entry → inner hoek), G2→IT2 (diagonaal linksaf),
  G1→IB4 (180°-spiegel, rechtsaf)
- GESCHRAPT (sessie-3 markeringen, blijft gelden): G2↔IT3, G1↔IB2-kant, L2↔IL, R2↔IR
- Vlakke 2D-weergave (cirkels), donkere stijl conform foto — de v12-trapezoïde met
  8-node octagon is hiermee VERVALLEN op expliciete aanwijzing van Koen
- Topologie headless gevalideerd: 32 nodes, 38 edges, volledig verbonden, 180° rotatiesymmetrisch

Win conditions
- Goal-rush: figure eindigt op tegenstander's goal
- Lockout: speler kan niets meer doen
- GEEN "elimineer alle units"-victory

Beurt-economie (sessie 7: Duel-correct gemaakt na web-verificatie)
- 1 actie per beurt; move-into-enemy = battle als volledige actie
- DEPLOY = via een vrij eigen entry-punt, kost 1 MP; resterende MP mag direct
  doorbewegen (alleen naar lege punten). Bezet entry (eigen óf vijand) blokkeert deploy.
- ALLEREERSTE zet van het potje: MP-1 (Duel-regel, dempt first-player rush)
- SURROUND-KO: figure zonder vrij buurpunt en met ≥1 aangrenzende vijand gaat
  direct KO, zonder gevecht
- Eigen figure mag op het EIGEN goal staan als keeper (Duel-regel)
- MP globaal gecapt op 3 (ook met Rally/War Cry)
- HEALING CENTER (sessie 15, Duel-correct gemaakt na web-verificatie): KO'd unit
  → HC met max 2 plekken per speler; pas als een DERDE unit KO gaat, schuift de
  oudste terug naar de bench met 'wait' (weer inzetbaar vanaf eigen volgende beurt).
  Statussen genezen in het HC; level blijft behouden. De oude regel (KO → direct
  bench + wait) was te mild en is VERVALLEN.
- Maximaal 1 Plate per beurt, kost géén actie, eenmalig gebruik

Level-up (Duel-spec, sinds sessie 5 in code)
- KO scoren = +1 level (max level 4)
- Per level: sterkste White/Gold-slot wordt 1 wedge groter, 1 Miss-wedge verdwijnt
- Levels blijven behouden na eigen KO; level-badge zichtbaar op het bord

ROSTER (18 units — ALLEMAAL in code, elk 16-slot)
Knights & Humans: Squire, Battle Cleric, Knight Commander
Elves & Sylvan: Forest Scout, Elven Archer, Arcane Weaver
Dwarves & Forge: Stone Apprentice, Runesmith, Mountain Warden
Undead & Necropolis: Restless Skeleton, Ghoul, Necromancer
Beasts & Wilds: Boar Brute, Lupine Hunter, Wyrmling
Inferno & Demonic: Imp, Hellhound, Pit Lord
LET OP: disk-data is in sessie 5 herontworpen (v4-data was verloren). Archetypes:
commons veel Miss / laag damage, rares Gold-slots / weinig Miss. Valideren in speeltest.

PLATES (10, in code met targeting-UI)
Rally (+1 MP 1 unit), War Cry (+1 MP alle units), Cleanse (status wissen),
Hex (confusion), Ensnare (paralysis), Scorch (burn), Venom (poison),
Bulwark (volgende combat Red→Blue, eenmalig), Blink (teleport naar leeg buurpunt,
bewust NIET naar goal — anti-instawin), Recall (terug naar bench).
- AI: status-plates defensief (op vijand ≤2 stappen van eigen goal), Cleanse op eigen
  unit met status. Blink/Recall laat AI links liggen.

DECK-SELECTIE (sinds sessie 5)
- Pre-game scherm: kies exact 6 units + 3 plates, of knop Random
- Geldt voor P1; P2 (AI én hotseat) krijgt random team — vereenvoudiging, zie open punten

AI (sessie 7: defensief herbouwd na rush-exploit)
- Rush-dreiging: per speler-unit beurten-tot-G2 berekend (afstand / MP)
- Bij dreiging ≤2 beurten: keeper op G2 zetten (+400), routes T2/T3/IT2
  dichtzetten (+150), rusher aanvallen (+120); keeper verlaat de zone niet (-300)
- Deploy gebruikt nu ook deploy-met-doorbewegen, defensief gewogen bij dreiging
- Move scoort op BFS-afstandswinst richting G1; goal-bereik = score 1000
- Attack scoort op combat-EV: volledige 16×16 slot-matrix incl. statussen (depth-1)
- Kleine random jitter tegen voorspelbaarheid

ONTWIKKELFASEN
- Fase 1.5 (huidig): digitaal prototype voor mechanics-validatie
- Fase 2: volledig digitaal single-player prototype
- Fase 3: multiplayer beoordelen na fase 2

STORE & COLLECTIE (sessie 6, nieuw)
- Persistent spelersprofiel (localStorage, fallback in-memory): credits + collectie
- Start: 6 commons gratis (Squire/Scout/Apprentice/Skeleton/Boar/Imp), 300 credits
- Prijzen: Common 100, Uncommon 200, Rare 400 credits
- Upgraden (permanent level, max 4): L1→2 = 150, L2→3 = 250, L3→4 = 400
- Credits verdienen (alleen solo): winst +100, verlies +25
- Deck-selectie = tegelijk store-scherm: niet-gekochte kaarten grijs met KOOP-prijs,
  eigen kaarten tonen level + upgrade-chip; alleen eigen kaarten selecteerbaar
- P1-units starten in een potje op hun collectie-level; in-game level-ups (KO) blijven tijdelijk
- Silhouetten = placeholder-art; echte kaart-artwork is fase 2 (géén Duel-IP)

HUIDIGE DELIVERABLE
- v21 draait nu als gestructureerde repo i.p.v. één los HTML-bestand (zie sessie 14).
  index.html (~72KB) laadt de 18 unit-PNG's los uit art/; PWA-assets in de root.
- (Historisch) rondel_mobile_v21.html: volledige character-art + status-fx + particles (rondel_pwa_v21.zip)
  - Definitief 32-node bord (vlak, conform foto), Solo (vs AI) + Hotseat
  - Deck-selectie + store/collectie/credits, 6v6, volledige roster, 10 plates,
    level-up, alle statussen functioneel
  - Symmetrische Duel-resolutie (headless getest: 14/14 spec-checks OK)
  - Bord-topologie headless getest: 12/12 checks OK

GEDAAN IN SESSIE 21 (6 juli 2026, vervolg)
- GEVECHTS-PRESENTATIE (open punt 13, deel 1):
  * MOVE-NAMEN: elke aanval heeft nu een eigen (zelfbedachte fantasy-)naam die
    gebogen langs de buitenrand van z'n wedge staat, Duel-look. MOVE_NAMES-tabel
    per unit (white/gold/purple); onderste helft van het wiel gespiegeld zodat
    tekst rechtop leest. Smalle vakjes (1 slot) krijgen geen naam (geen ruimte).
  * CLASH: flits + schok van de wielen zodra beide stilstaan (respecteert
    prefers-reduced-motion).
  * RESULTAAT: moves-regel bovenaan het combat-resultaat ("Vuurspuw 60 ⚔
    Schildstoot 30", aanvaller rood / verdediger blauw) boven de uitslag.
- Tests: 60 → 63 headless (namen dekken exact de vak-soorten van alle 18 units,
  moveLabel-checks); rooktest 19/19. SW-cache v28.
- Resteert van open punt 13: volwaardig resultaat-/winstscherm, sudden death,
  geluid.

GEDAAN IN SESSIE 20 (6 juli 2026)
- ABILITIES ingebouwd (Koens keuze uit de "meer op Duel lijken"-lijst).
  12 abilities, gemodelleerd naar echte Duel-abilities (Serebii-geverifieerd),
  vertaald naar folklore. Commons blijven kaal (Duel-conventie). Toewijzing:
  cleric=Zegenende Aura (cleanse buren bij inzet / Refreshing Aroma),
  commander=Aanvoerder (+1 MP aan buren), scout=Sluipen & wyrmling=Vleugelslag
  (door units heen / Infiltrator+Soar), weaver=Betovering (confusion-contact),
  runesmith=Vuurrune (burn-contact), ghoul=Rottende Greep (poison-contact),
  hellhound=Helse Jacht (beide burn na gevecht / Infernal Hunt),
  warden=Bergvast (KO→bank i.p.v. HC), pitlord=Onverwoestbaar (overleeft 1e KO,
  retour bank / Ruinous Helix), necromancer=Zielenoproep (wis Wacht van bank /
  Sonic Blast), lupine=Roedel (+1 MP naast bondgenoot / Loyalty).
- Hooks: effMP (command/pack), legalMoves+bfs (phasing), doDeploy
  (onDeployComplete), runCombat (contact-status + infernal + undying-retreat),
  koUnit (mountain). Getoond in collectie-detail (paarse ✦-tag).
- BEURT-ECONOMIE (Koen vroeg nogmaals): 3e keer geverifieerd incl. beurt-
  volgorde — Duel = plate(gratis) + 1 figuur bewegen. Deploy IS je actie; niet
  deploy+aanval of aanval+deploy. Bewust ongewijzigd (Duel wint).
- Tests: 50 → 60 headless (10 ability-checks); rooktest 17 → 19 (speelt nu een
  paar beurten + checkt ability in detail). SW-cache v27.

GEDAAN IN SESSIE 19 (6 juli 2026)
- BEURT-ECONOMIE geverifieerd (Koen vroeg: kun je in Duel inzetten ÉN nog
  aanvallen?): NEE — Duel is strikt 1 actie per beurt, en inzetten vanaf de
  bank ís die ene actie (kost 1 MP via entry, mag met rest-MP doorbewegen).
  Bevestigd via pokemon.com + Serebii-mechanics. Onze code was al correct;
  BEWUST NIET aangepast (dat zou van Duel afwijken). Meta-principe toegepast.
- DISK-ICONEN (Duel-stijl, Koens wens "verder uitbreiden"): status-vakken
  tonen nu hun effect-glyph (druppel=poison, vlam=burn, bliksem=paralysis,
  spiraal=confusion, Z=sleep) mét gele stervakjes; blauw = schild-icoon;
  rood = kruis; wit/goud houden het schade-getal, goud krijgt een fonkel als
  doorbraak-markering. Puur cosmetisch, geen kans-/waarde-wijziging.
  Legenda-chips in het detailscherm blijven tekst (leesbaarheid).
- SW-cache v26. Tests 50/50 headless, rooktest 17/17.

GEDAAN IN SESSIE 18 (5 juli 2026, tweede ronde)
- DISK-INDELING gecorrigeerd (Koen: "rommeltje, soms twee keer dezelfde
  mogelijkheid achter elkaar"): nieuwe regel = elke MOVE is één aaneengesloten
  vak, nooit twee identieke wedges naast elkaar; alleen de anonieme Miss-zone
  mag in 2 clusters. DISK_LAYOUT herschreven, headless-check toegevoegd die
  wrap-around dubbele wedges verbiedt (alle 18 units). Kansen nog steeds
  identiek (permutatie-garantie blijft).
- BORD naar Duel-look: licht glanzend veld (was donker/lelijk) met donkere
  routes en punten, witte glans-highlight, subtielere 3D-rand. Rijen compacter
  zodat er ruimte is voor de figuren-rijen boven/onder.
- FIGUREN KLAAR AAN DE ZIJKANT (Koen: "net als Duel, poppetjes staan klaar aan
  elke zijde en je zet ze van daar in"): oude HTML-bench-strips vervangen door
  figuren die ín de bord-SVG staan — P2-team achteraan (kleiner), P1-team
  vooraan, elk op hun sokkel met MP-badge, meeschalend met het perspectief.
  Healing-Center-units staan er half-transparant met ✚ tussen. Inzetten werkt
  ongewijzigd (onBenchTap). #bench-p1/#bench-p2 divs verwijderd.
- Tests: 50/50 headless, rooktest bijgewerkt (figuren i.p.v. bench-cards) 17/17.
  SW-cache v25.

GEDAAN IN SESSIE 17 (5 juli 2026)
- RUSH-FIX DEFINITIEF (open punt 0 BESLIST na Koens tweede rush-melding):
  goal-diagonalen G2→IT2 en G1→IB4 geschrapt (optie c). Entry→vijandelijk doel
  is nu 7 stappen aan BEIDE kanten (was 5 links); MP3-rusher heeft 3 beurten
  nodig i.p.v. 2, en elk doel heeft nog maar 2 toegangen (T2/T3 resp. B2/B3) —
  veel beter te verdedigen, zoals in Duel. G2_ADJ/GOAL_ZONE aangepast.
  Bord: 32 nodes, 36 edges, nog steeds 180°-symmetrisch (headless gecheckt).
- BORD IN PERSPECTIEF (Koens wens: "schuin zoals in Duel, geen zwarte
  achtergrond"): coördinaten geprojecteerd naar een trapezoïde (boven smaller,
  rijen dichter op elkaar) — topologie/logica ongewijzigd, figuren blijven
  rechtop en schalen mee met de diepte (ook in de hop-animatie). Bord is nu
  een blauw-slate duel-tafel met 3D-randwand op een violet-schemering
  achtergrond met arena-gloed. LET OP: dit vervangt de "vlak conform foto"-
  beslissing van sessie 6 op Koens expliciete nieuwe aanwijzing.
- DISK-LAYOUTS per unit (Koens wens: variatie, kleine losse vakjes, moet bij
  het karakter passen): DISK_LAYOUT-tabel + arrangeSlots() — puur een
  PERMUTATIE van de bestaande slots, kansen exact gelijk (headless bewezen
  voor alle 18). Bv. skeleton: Miss verspreid over 4 kleine vakjes.
- DISK-RENDER opgepoetst: gouden metalen rand met tick-markeringen per slot,
  gloss/schaduw-diepte per wedge, glossy naaf, labels met outline (leesbaar
  op elke kleur), fonkel-accent op Gold-slots, kleinere labels in smalle vakjes.
- Tests: 43 → 49 checks (nieuwe topologie-getallen, 7-staps rush-afstanden,
  disk-permutatie-garantie); browser-rooktest 16/16. SW-cache v24.

GEDAAN IN SESSIE 16 (4 juli 2026)
- APP-SHELL gebouwd (Koens opdracht: "volledige app-ervaring, alles in menu's"):
  startscherm met titel, profiel-chips (credits / collectie / W-V) en tegels
  DUEL (solo) / HOTSEAT / COLLECTIE / WINKEL. Simpele router (showScreen).
- COLLECTIE-scherm: alle 18 units als kaarten (level-badge, rarity); tik = detail-
  overlay met grote DISK-PREVIEW (renderDisk hergebruikt!), slot-samenvatting per
  kleur, en upgrade-knop — na upgrade zie je de disk direct groeien. Upgraden
  verhuisd uit de deck-selectie hierheen.
- WINKEL-scherm: kopen verhuisd uit de deck-selectie; niet-bezeten eerst gesorteerd.
- Deck-selectie opgeschoond: alleen team kiezen (bezeten units + plates), locked
  kaarten verwijzen naar Winkel; terug-knop naar menu.
- Flow: home → modus → deck → game; endMatch → stats bijwerken → terug naar home.
  In-game "Menu"-knop (met confirm) vervangt Solo/Reset-knoppen.
- Profiel uitgebreid met stats (wins/losses, alleen solo geteld); migratie voor
  bestaande profielen. SW-cache gebumpt (v23) zodat telefoons de update krijgen.
- NIEUW: browser-rooktest (test/smoke.js, Playwright/Chromium headless): boot,
  alle schermen, detail-disk, deck-flow, bord-render, menu-terug — 16/16 groen.
  Headless suite blijft 43/43.
- Koens speeltest: doel wéér bijna vrij bereikbaar (wyrmling op IT2, G2 leeg,
  AI deployde in plaats van keepen). Wortel gevonden in posScore: de keeper-bonus
  (+400) gold alleen bij LEGE zone — één AI-unit ergens in de 4-node zone (bv. T3)
  telde als "bemand", terwijl alleen een unit ÓP G2 het doel echt blokkeert.
  Scores nagerekend: G2 bezetten ~35 vs deploy ~85 → AI koos deploy. FIX: bij
  dreiging ≤2 beurten en leeg G2 krijgt G2-bezetten +600 (dreiging 3: +250);
  headless gevalideerd op de exacte screenshot-positie (keeper 635 vs deploy 85).
- Bord-analyse n.a.v. dezelfde speeltest: kortste route entry→vijandelijk doel is
  ASYMMETRISCH 5 stappen (E1_BL→IB1→IL→IT1→IT2→G2) vs 7 rechts; MP3-unit haalt
  het doel daarmee in beurt 2. Echt Duel-bord: 26 punten + 2 goals (bron:
  pokemon.com), rush is daar óók kern-meta maar ons linker-laantje is vermoedelijk
  1 stap korter dan Duels kortste route. Bord is DEFINITIEF — eventuele ingreep
  (spoke schrappen/verleggen) is aan Koen. OPEN PUNT toegevoegd.

GEDAAN IN SESSIE 15 (14 juni 2026)
- LIVE: spel staat op GitHub Pages — https://koen2222.github.io/Rondel/ — met
  auto-deploy workflow (elke push naar main deployt automatisch). Repo is public.
- Status-fx overhaal op Koens aanwijzing: frozen = groot ijsblok om het hele
  poppetje (facetten, kristalspitsen, glinsters), burn = 5 omhullende vlammen,
  paralysis = 4 bliksembogen over het lichaam, confusion = 5 draaiende sterren,
  sleep = donker waas + 3 z'jes, poison = bubbels over het hele figuur
- HEALING CENTER ingebouwd (Duel-regel geverifieerd via web search, zie
  beurt-economie): koUnit() centraliseert alle KO-paden (combat + surround);
  HC-kaarten zichtbaar in de bench-strip (roze ✚-badge, gestreepte rand);
  lockout-detectie telt nu alleen inzetbare (niet-wait) bench-units
- Deck-selectie voor P2 in hotseat (open punt 7 afgerond): tweestaps-flow,
  P1 kiest eerst (knop "Volgende"), dan P2, gedeelde collectie/levels op één
  toestel; solo onveranderd (AI random)
- Plate-iconen (open punt 6 art-stap): 10 eigen SVG-iconen in chip-strip en
  deck-scherm, kleurgecodeerd per plate
- Test-suite uitgebreid: 34 → 43 checks (8 HC-checks + syntax-check op de
  volledige game-JS), alles groen

GEDAAN IN SESSIE 14 (13 juni 2026)
- Repo gestructureerd (eerste opschoontaak): losse, vreemd genummerde bestanden
  (00_Status_en_Beslissingen-5.md, rondel_mobile_v21-1.html, rondel_pwa_v21.zip)
  vervangen door een schone layout — zie WERKAFSPRAAK BESTANDEN.
- Art-extractie: de 18 base64-PNG's (samen ~443KB, de bulk van het bestand) uit het
  UNIT_ART-object getrokken naar losse art/<key>.png. index.html van 515KB → 72KB.
  UNIT_ART verwijst nu per unit naar "art/<key>.png"; silhouet-fallback intact.
- Validatie: bewezen via prefix/suffix-diff dat ALLEEN het UNIT_ART-blok wijzigde —
  alle spellogica (combat, topologie, AI, statussen) byte-voor-byte identiek, dus
  geen regressie mogelijk. Elke art-ref gecontroleerd tegen een bestaand bestand (18/18).
- sw.js cachet nu ook de 18 art-bestanden (offline-PWA blijft werken). README.md +
  .gitignore toegevoegd.

EFFECTEN (sessie 13, 12 juni)
- Status-animaties op bord-figuren (max 2 tegelijk zichtbaar): burn = vlammetjes,
  poison/badly poisoned/curse = stijgende bubbels in eigen kleur, paralysis =
  flikkerende bliksems, confusion = roze sterretjes-orbit boven het hoofd,
  sleep = zwevende z'jes, frozen = ijsscherven met langzame bob, bulwark = gouden boog
- Status-badge nu kleurgecodeerd per status (was generiek oranje)
- Particles: stofwolkje bij elke hop-landing, geel-rode burst bij elke KO
  (combat én surround), via pendingFX-queue zodat renders ze niet wegvagen
- Performance-keuzes: alleen transform/opacity-animaties, geen filters;
  alles uit bij prefers-reduced-motion
- Hop-bugs gefixt (eerder in sessie 12/13): tijdstap-klem tegen frame-skips,
  CSS-transitie op unit-fig verwijderd (veroorzaakte wegschieten buiten het bord),
  blur-filters van schaduwen af (jank-bron op telefoon)
- Deliverable: rondel_mobile_v21.html + rondel_pwa_v21.zip

ART — COMPLEET (sessie 12, 12 juni)
- Koen leverde alle 17 resterende figuren als één sprite-sheet (witte achtergrond,
  consistente chibi-stijl); automatisch gesplitst (flood fill + component-clustering,
  interieur-wit zoals de Cleric-tabbard behouden), gecomprimeerd (~18KB/figuur)
- ALLE 18 units hebben nu echte character-art op bord, bench en in de store
- Silhouet-fallback blijft bestaan voor toekomstige units
- Open: kwaliteitscheck op telefoon (formaat op bord, leesbaarheid)

ART-PIPELINE (sessie 11 — werkend!)
- Eerste echte character-art (Squire, chibi-stijl door Koen gegenereerd) ingebouwd
  als test: zichtbaar op bord (op de speler-sokkel), bench en in de store
- UNIT_ART-systeem: elke nieuwe PNG = één regel code; rest valt terug op silhouet
- Schoonmaak-pipeline gebouwd voor ingebakken checkerboards (flood fill + despeckle
  + gaten dichten); échte transparante exports blijven de voorkeur
- Hop-animatie gefixt: schaduw blijft op de grond en krimpt tijdens de sprong
- Godot vs Unity uitgelegd; advies: Godot voor fase 2, vereist wel een PC

GRAPHICS — EERLIJKE STAND VAN ZAKEN (sessie 10)
- Het visuele gat met Pokémon Duel is een ASSET-gat, geen code-gat: Duel heeft
  professionele 3D-character-art + game-engine. In HTML zonder assets is er een plafond.
- Afgesproken route naar echte graphics:
  1) Koen genereert per unit AI-art (transparante PNG, 18 stuks, eigen fantasy-stijl);
     Claude bouwt ze in als bord-figuren en kaart-art. → grootste visuele sprong
  2) Duel-niveau (3D, camera, partikels) = fase 2 in Godot/Unity met echte assets
- Gedaan in code (sessie 10): Duel-stijl hop-animatie (boogje per route-segment met
  afzet- en landings-squash, respecteert prefers-reduced-motion); figuren in
  factie-kleurpaletten (speler herken je aan de sokkel, zoals bij echte figures)

VANDAAG GEDAAN (11 juni 2026, sessie 9 — vijfde sessie vandaag)
- WERKAFSPRAAK verduidelijkt: Claude kan projectbestanden NIET schrijven (read-only);
  Koen vervangt alleen de laatste prototype-versie, ± 1x per werkdag. Status/beslissingen
  zitten ook in Claude's geheugen; het document is de backup/het naslagwerk.
- Visuele overhaul richting Duel-look (signatuur: Duel-sokkels onder elke figure):
  dikke ronde sokkel met zijwand, gradient-bovenvlak en glansboog; holografisch
  indigo bord met subtiele ringen; gloeiende cyaan-witte routes; glossy nodes met
  highlight; pulserende goal-halo's (respecteert prefers-reduced-motion);
  bench-kaarten met mini-sokkel en glans
- PWA-bundel ververst (rondel_pwa_v17.zip)

GEDAAN IN SESSIE 8 (eerder vandaag)
- AI-keeperbug gefixt (Koens speeltest: keeper verliet G2 zodra acute dreiging wegviel):
  laatste verdediger in de goal-zone (G2/T2/T3/IT2) blijft nu ALTIJD (-500 op vertrek),
  zone wordt ook zonder dreiging hermand, dreigingshorizon 2→3 beurten
- App-route besloten (tussenstap vóór fase 2): PWA-bundel gemaakt (manifest, service
  worker, iconen). Route naar echte APK zonder PC: hosten op GitHub Pages → PWABuilder
  genereert installeerbare APK. Native build (Godot/Unity) blijft de fase 2-beslissing.
- Deliverables: rondel_mobile_v16.html + rondel_pwa_v16.zip

GEDAAN IN SESSIE 7 (eerder vandaag)
- Koens rush-exploit (scout 2×3 stappen = winst) geanalyseerd; Duel-regels
  geverifieerd via web search (pokemon.com + community-guides)
- Drie ontbrekende Duel-regels ingebouwd: deploy kost 1 MP + doorbewegen,
  eerste zet van het potje MP-1, surround-KO
- Keeper-op-eigen-goal bevestigd als legale Duel-verdediging (zat al impliciet in code)
- AI defensief herbouwd: dreigingsdetectie, keeper, route-blokkade, intercept
- Headless getest: 9/9 nieuwe mechanics-checks OK
- Deliverable: rondel_mobile_v15.html

GEDAAN IN SESSIE 6 (eerder vandaag)
- Bord teruggezet naar de definitieve 32-node layout exact volgens Koens foto
  (vlak, cirkels, donkere stijl) — v12-trapezoïde vervallen
- Store/collectie/credits-systeem gebouwd (zie sectie hierboven)
- endMatch-flow: winnaar-detectie + credits-beloning op alle 4 game-end paden

GEDAAN IN SESSIE 5 (eerder vandaag)
- Basis: door Koen aangeleverde v12 (nieuw bord/visuals, maar 3 placeholder-units,
  geen plates, random AI, incomplete statussen)
- Volledige 18-unit roster terug in code met herontworpen 16-slot disks + silhouetten
- 10-plate systeem herbouwd: chip-strip UI, targeting-flow (incl. 2-staps Blink), effecten
- Deck-selectie UI (6 units + 3 plates kiezen of random)
- Level-up systeem (Duel-spec: slot groter, Miss kleiner) met level-badges
- Statussen compleet: poison/badly poisoned/burn damage-modifiers toegevoegd;
  paralysis/burn raken nu alleen kleinste White (was incl. Gold — spec-afwijking gefixt)
- Frozen-fix: blokkeerde onterecht ook beweging; mag nu bewegen, niet aanvallen
- Bulwark in combat-resolutie (Red→Blue, consumeert bij eerstvolgende combat)
- AI van random terug naar heuristisch, nu mét 16×16 EV-matrix (open punt 4 meteen gedaan)
- Headless test-suite gedraaid: resolve-tabel en statuseffecten 14/14 conform doc

OPEN PUNTEN — IN VOLGORDE VAN URGENTIE
0. AFGEROND (sessie 17): rush-snelweg dichtgezet via optie c — goal-diagonalen
   geschrapt, entry→doel 7 stappen symmetrisch, doelen nog maar 2 toegangen.
1. Speeltest: is de rush-exploit nu echt dood? Voelt AI-verdediging eerlijk of frustrerend?
   (sessie 16: keeper-gat gefixt; sessie 17: bord-fix — samen zou dit het moeten zijn)
2. Speeltest: nieuwe disk-data van alle 18 units (sessie-5 herontwerp) — balance valideren
3. Store-economie balancen: prijzen, upgrade-kosten, win/verlies-credits (nu eerste gok)
4. Speeltest: 3 plates te swingy? Level-up tempo OK (KO = +1 level)?
5. AI-sterkte beoordelen na speeltest (EV-lookahead nu actief)
6. AFGEROND (sessie 12+13): character-art compleet, status-fx en particles in code.
   AFGEROND (sessie 14): art losgetrokken naar art/, repo gestructureerd.
   AFGEROND (sessie 15): plate-iconen (SVG). Resteert: bord-thema-art (zelfde stijl)
7. AFGEROND (sessie 15): deck-selectie voor P2 in hotseat (tweestaps-flow)
8. Definitieve naam (Rondel is werknaam)
9. Beslissing fase 2 framework: Godot vs Unity vs Web
10. Fusion-systeem ontwerpen voor app-versie (sluit aan op store/upgrade-systeem)
11. Factie-puriteit als design-knop overwegen
12. AI bewust maken van abilities (nu functioneren ze wel, maar de AI weegt ze
    niet in z'n scoring — bv. phasers voor rushes, undying-tanks vooraan)
13. Nog-openstaande "meer-op-Duel"-opties (sessie 19-lijst): gevechts-
    presentatie (move-namen/clash/resultaatscherm), sudden death + winstscherm,
    geluid. Abilities is gedaan (sessie 20).

INSPIRATIE-REFERENTIE
- Mechanics: Pokémon Duel / Comaster — Duel is bron van waarheid
- Roster-feel: high fantasy, mythologie en folklore (public domain)
- Géén beschermd IP gebruiken
