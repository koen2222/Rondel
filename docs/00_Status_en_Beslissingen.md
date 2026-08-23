RONDEL — STATUS EN BESLISSINGEN
Laatste update: 22 augustus 2026 (sessie 25)

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

Bord (DEFINITIEF — sessie 25: gelijkgetrokken met het ECHTE Duel-bord, 28 posities)
- 28 posities = 26 punten + 2 doelen, exact zoals pokemon.com Duel beschrijft
  ("fields made up of 26 points (and two goals)").
- Vorm: 7x5 BUITENRAND (20 randpunten) + 3x3 BINNENVIERKANT (8 randpunten,
  midden leeg). Bron voor de vorm: een nagebouwd fysiek Duel-bord beschrijft
  het als "a 7x5 measurement on the outer square and an even 3x3 inner square,
  with the corners of both squares connecting".
- Doelen G1/G2 in het midden van onder- en bovenrand; 4 entries op de hoeken.
- Routes (32): buitenring 20 + binnenring 8 + 4 hoekdiagonalen (elke entry naar
  de dichtstbijzijnde hoek van het binnenvierkant). MEER verbindingen tussen
  binnen en buiten zijn er NIET.
- Geverifieerd: volledig verbonden, 180°-rotatiesymmetrisch, entry→vijandelijk
  doel = 7 stappen vanaf ALLE vier de entries, en elk doel houdt precies 2
  toegangen. De rush-fix van sessie 17 blijft dus intact.
- VERVALLEN: de 32-node layout met 5x3 binnenrechthoek (sessie 6/17). Die had
  4 punten te veel t.o.v. het echte Duel-bord.
- Weergave: sinds sessie 17 in PERSPECTIEF (trapezoïde, schuin zoals een echte
  duel-tafel). De oudere "vlak conform foto"-beslissing van sessie 6 is daarmee
  vervallen; de topologie staat daar los van.
- Topologie headless gevalideerd: 28 nodes, 32 edges, volledig verbonden, 180° rotatiesymmetrisch

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

SPEEL-SIMULATIE (nieuw in sessie 25): test/simulate.js speelt N volledige
potjes headless. De testspeler doet ofwel willekeurige legale zetten ("random",
test of de regels blijven werken) ofwel beent zo hard mogelijk naar het doel
("rush", test de keeper-logica en of de rush-exploit dood blijft).
Draai: python3 -m http.server 8123 & node test/simulate.js 8 moeilijk rush

RUSH-METING (sessie 25, na de bord-ombouw) — BELANGRIJK OPEN PUNT
Een beenende speler won eerst 8/8 in 2 beurten tegen de ZWAARSTE AI. Onderzocht
en vier echte AI-bugs gevonden en gefixt (zie sessie 25 hieronder). Daarna:
7/8 in gemiddeld 11 beurten, en de AI wint er soms zelf een.
De rush blijft dus STERK. Dat is nu een balans-/ontwerpvraag voor Koen, geen
bug meer. Opties, in oplopende ingrijpendheid:
  a) niets doen — in Duel is rushen ook een legitieme, sterke strategie
  b) AI verder tunen (meer onderscheppen; gemeten poging hielp niet aantoonbaar)
  c) bord: entry->doel van 7 naar 8-9 stappen, of een derde toegang schrappen
  d) regel: figuur die op een doel staat kan niet worden aangevallen zolang er
     een bondgenoot naast staat (verzonnen regel — WIJKT AF van Duel)
LET OP bij (c)/(d): het bord komt nu exact overeen met het echte Duel-bord
(26 punten + 2 doelen). Elke wijziging daaraan is een bewuste afwijking.

GEDAAN IN SESSIE 25 (22 aug 2026) — BORD GELIJKGETROKKEN MET DUEL
Koen: "het bord klopt nog niet met Pokémon Duel, die heeft nog een lijn na het
een-na-laatste puntje naar het startpunt toe — zoek maar even op en zorg dat het
bord klopt; en zorg dat alle poppen ongeveer dezelfde MP hebben; kopieer gewoon
de hele mechaniek."

- BORD: onderzocht en gecorrigeerd. pokemon.com zegt letterlijk dat Duel-velden
  bestaan uit "26 points (and two goals)" = 28 posities. Wij hadden er 32.
  De vorm blijkt een 7x5 buitenrand (20 randpunten) met een 3x3 BINNENVIERKANT
  (8 randpunten), waarbij de hoeken van beide vierkanten verbonden zijn — ons
  binnenvierkant was een 5x3 rechthoek met 12 punten, dus 4 te veel.
  Nu: 20 + 8 = 28 posities, 32 routes (buitenring 20 + binnenring 8 + 4
  hoekdiagonalen). De hoekdiagonalen zijn precies de lijnen die vanaf elk
  startpunt het bord in lopen (waarschijnlijk wat Koen bedoelde).
  GEVERIFIEERD na de ombouw: volledig verbonden, 180°-rotatiesymmetrisch,
  entry→vijandelijk doel = 7 stappen vanaf alle vier de entries, elk doel houdt
  precies 2 toegangen. De rush-fix van sessie 17 is dus NIET ongedaan gemaakt.
- MP GELIJKGETROKKEN: was 1 MP (4 units), 2 MP (10), 3 MP (4). Op een bord van
  7 stappen betekende 1 MP zeven beurten oversteken — die units voelden
  onspeelbaar. Nu 2 MP voor 14 units en 3 MP voor de vier snelle verkenners
  (Forest Scout, Lupine Hunter, Imp, Hellhound): hoogstens 1 stap verschil over
  de hele roster. LET OP: dit is een BEWUSTE balanswijziging. Duel zelf gebruikt
  wél 1 MP voor zware figuren (Charizard), en onze 1-MP-units waren juist de
  sterkste (Warden 90 dmg, Pit Lord 100 + gold). Ze zijn nu dus sterker
  geworden — speeltesten, en makkelijk terug te draaien.
- Deploy-regel nagelopen op Koens vraag ("kunnen ze lopen als je ze inzet"):
  klopt al met Duel — inzetten via een vrij eigen entry kost 1 MP en met de
  resterende MP mag de figuur meteen doorlopen naar lege punten.
- AI-BUGS gevonden met de nieuwe speel-simulatie (alle vier echt, geen tuning):
  1. De verdedigingsbonus zat achter `onBoard >= 1`, dus bij zijn EERSTE inzet
     kreeg de AI geen enkele prikkel om het doel te bemannen — precies wanneer
     een rusher moet worden opgevangen. Gate verwijderd.
  2. De keeper liep elke beurt van G2 af (er is geen "sta stil"-actie, dus met
     één figuur op het bord moet hij die wel verplaatsen). Nu -700 op van het
     doel af lopen zolang er dreiging is.
  3. De AI voerde geen versterking aan tijdens het verdedigen, waardoor hij
     die ene keeper wel MOEST bewegen. Nu extra inzet-prikkel bij dreiging.
  4. De AI stond permanent in paniekstand (een rusher is bijna altijd binnen
     de horizon) en viel dáárdoor nooit aan, terwijl dit een race is. Nu een
     VERDEDIGERS-QUOTUM: maximaal 2 figuren verdedigen, de rest gaat aanvallen.
  Effect: rusher won 8/8 in 2 beurten -> 7/8 in gemiddeld 11 beurten.
  Een zwaarder gewogen onderschepping is geprobeerd en WEER TERUGGEDRAAID:
  meetbaar niet beter, dus niet geshipt.
- 'advance'-knop toegevoegd aan de moeilijkheidsgraden. Zonder die knop maakte
  "Licht" het spel juist KORTER (9 beurten) i.p.v. makkelijker: minder
  verdedigen betekende alleen ongehinderd doorrennen. Nu 14 beurten, gelijk aan
  Normaal. LET OP: dat "Licht" ook echt makkelijker VOELT is niet bewezen —
  de simulatiespeler verliest tegen elke moeilijkheidsgraad. Speeltest nodig.
- Einde-melding gefixt: de reden wordt nu vanuit de kijkende speler
  geformuleerd. Voorheen kon er "VERSLAGEN — DOEL BEREIKT!" staan als de AI
  JOUW doel innam. Zes aanroepplekken gebruiken nu redencodes (goal/lockout/
  time) i.p.v. losse zinnen; ook de Engelse "Lockout!" is weg.
- Tests: 98 → 102 headless (bord 28/26/32, MP-bereik), rooktest 34 (bord-check
  nu exact 28 punten i.p.v. een losse ondergrens), plus de nieuwe
  speel-simulatie. SW-cache v36.

GEDAAN IN SESSIE 24 (22 aug 2026) — "MAAK HET AF ZOALS BEDOELD"
Koens opdracht: het spel afmaken zoals oorspronkelijk bedoeld, zo dicht mogelijk
bij Pokémon Duel, en "de OPTIES moeten beter" (twee keer benadrukt).

- INSTELLINGEN-SCHERM (de hoofdvraag; bestond niet). Groepen Geluid /
  Weergave & tempo / Duel-regels / Profiel:
  geluidseffecten aan-uit + volume, achtergrondmuziek, trillen,
  animatiesnelheid (normaal/snel/uit), hints tonen, bedenktijd (3/5/10/uit),
  AI-moeilijkheid (licht/normaal/zwaar), bevestiging bij verlaten, profiel
  wissen (dubbele bevestiging, behoudt instellingen), voortgang + versie-info.
  Instellingen leven in profile.settings, worden bij ELKE load per sleutel
  gevalideerd (SETTING_DEFS + normalizeSettings) zodat een oud of corrupt
  profiel nooit het spel kan breken. setSetting() slaat direct op — geen
  opslaan-knop. Elke instelling is echt aangesloten op de mechaniek.
- GELUID (open punt 13 afgerond): volledig gesynthetiseerd via WebAudio, geen
  enkel extern bestand — de offline-PWA blijft dus intact en het bestand wordt
  er niet zwaarder van. Audio_-object (tone/noise/buzz/muziek) + benoemde
  SFX-tabel. Spin-tikken lopen mee met de vertragende schijf (dezelfde
  easing-curve gesampeld), clash, KO, status, blok, level-up, plate, inzetten,
  beurtwissel, win/verlies-fanfare, kloktik in de laatste 5 sec, afgekeurde
  tikken. AudioContext wordt pas na het eerste gebruikersgebaar ontgrendeld
  (mobiele browsers eisen dat). Trillen via navigator.vibrate.
- HOE SPEEL JE-SCHERM: 11 secties in het Nederlands, geschreven vanaf de
  code (niet vanaf een ideaalbeeld), inclusief kleurstalen voor de vijf
  schijfkleuren. Dit ontbrak volledig terwijl de regels complex zijn.
- FIGUUR-INFO TIJDENS HET DUEL (Duel-gebaar, ontbrak): figuur vasthouden
  (450 ms) op het bord — of een vijand aantikken zonder eigen selectie — toont
  z'n kaart met de schijf ZOALS HIJ NU DRAAIT (applyStatus toegepast), plus
  level, MP, status en ability. Schijven waren tot nu toe alleen in de
  collectie te zien, wat tactisch spelen bijna onmogelijk maakte.
- HINTS werkend gemaakt: MP + actieve ability bij selectie; geblokkeerde
  acties leggen uit waarom.
- OPGESLAGEN TEAMS: 3 deck-slots met laad-/bewaarknop. Slots worden bij het
  laden gevalideerd (niet-bezeten unit of onbekende plate → slot leeg), zodat
  een oud slot nooit een ongeldig potje start.
- AI (open punt 12 afgerond): weegt nu abilities mee. Dreigingsmeting telt
  ability-MP mee en behandelt phasers als extra gevaarlijk; combat-EV
  corrigeert voor Onverwoestbaar/Bergvast/contact-status; positiescore beloont
  MP-aura's naast bondgenoten, contact-blockers in de goal-zone en Zegenende
  Aura naast gestatuste bondgenoten. Moeilijkheidsgraad stuurt jitter,
  foutkans, dreigingshorizon, keeper-gewicht en denktijd.
- TEGENSTANDER-DECKS: de AI kreeg 6 willekeurige units op level 1. Nu een echt
  deck per moeilijkheidsgraad (Licht = commons L1 + ondersteunende plates,
  Normaal/Zwaar = factie-samenhangend + rares op L2/L3 + aanvallende plates).
- BOOSTERKIST (Duel-progressie; wij hadden alleen een vaste winkel): 150
  credits, kansen C 65 / U 27 / R 8, duplicaat geeft credits terug, en als een
  hele zeldzaamheidslade vol is levert de kist bewust iets nieuws uit een
  andere lade. Onthul-animatie + "nog een kist". De winkel blijft ONGEWIJZIGD
  ernaast bestaan (gericht kopen, duurder) — dit is een TOEVOEGING aan Koens
  economie, geen vervanging. LET OP: economie-balans opnieuw speeltesten.
- REVIEW-RONDE (zelf gedaan; de parallelle review-agents kregen een kapotte
  tool-omgeving en weigerden terecht te speculeren over ongeziene code):
  * Eigen correctheids-review vond 3 echte fouten, alle gefixt: S() gaf de
    setting-DEFINITIE terug i.p.v. de waarde vóór het profiel geladen was
    (volume werd NaN); een lokale `S` in unitSilhouette overschaduwde de
    globale instellingen-functie (hernoemd naar SIL); spin-tikken plaatsten
    tot ~180 oscillators per gevecht (nu 1 per 2 slots, hard gecapt op 40,
    en opgeruimd bij match-einde/menu). Ook: startClock() start geen interval
    meer als de bedenktijd uit staat.
  * Telefoon-UX-audit op 390×844: alle bedienelementen waren TE KLEIN voor een
    duim (schakelaars 30px, segmentknoppen 28px, volumeschuif 16px — norm is
    44px). Gefixt: segmentknoppen en schuif naar 44px, schakelaars houden hun
    look maar krijgen via ::before een opgerekt tikgebied. Bewaakt door een
    rooktest. Ook de verweesde INSTELLINGEN-tegel over de volle breedte gezet.
  * Uitleg-vs-code geverifieerd en VASTGELEGD in 8 tests: bedenktijd, max
    level, HC-capaciteit, één-status-regel, frozen-na-gevecht, plate kost geen
    actie, eerste-zet-MP, en de vijf kleurstalen == de echte schijfkleuren.
    Zo kan het uitlegscherm niet stilletjes gaan liegen als we balanceren.
- Tests: 70 → 98 headless (instellingen, team-validatie, boosterkansen,
  uitleg-vs-code), rooktest 20 → 34 (info-kaart, instellingen bewaren, uitleg,
  kist, slots, tikdoel-maten). SW-cache v34.
- NIET gedaan / bewust laten liggen: fusion-systeem (open punt 10, groot en
  raakt de hele economie), online multiplayer (fase 3), bord-thema-art.
- KANTTEKENING: een parallelle research-workflow om Duel-features te
  verifiëren liep vast op sessielimieten; dit werk is gebaseerd op dit
  statusdocument, de eerder geverifieerde Duel-regels (sessies 19-23) en
  eigen code-analyse.

GEDAAN IN SESSIE 23 (7 juli 2026, vervolg)
- KOENS MISS-LOOP (2e patstelling-melding, screenshot: burned Imp-vs-Imp met
  wielen zonder één aanvalsvak). WORTEL: elke unit had maar ÉÉN white-aanval
  (bv. Imp 5×20); burn/paralysis ("kleinste White → Miss") wiste daarmee het
  complete aanvalsvermogen. In Duel kan dat niet omdat figuren MEERDERE
  aanvallen met verschillende waardes hebben.
- HERONTWERP DISK-DATA: elke unit heeft nu TWEE onderscheiden white-aanvallen
  (hoofdaanval + snelle bijaanval, verschillende waarde, eigen naam) — burn/
  paralysis pakt alleen de bijaanval af. Namen zitten nu ÍN de slots
  (W/G/P-helpers hebben een naam-parameter); MOVE_NAMES-tabel vervallen.
  Totale white-schade per unit ~gelijk gehouden (±20). Dit vervult ook Koens
  eerdere wens ("verschillende waardes, kleine vakjes") nu écht.
  LET OP: dit is een bewuste balanswijziging — speeltest opnieuw (open punt 2).
- DISK_LAYOUT bijgewerkt (bijaanval gescheiden van hoofdaanval door Miss-zone).
- REGRESSIETESTS: elke unit ≥2 onderscheiden aanvallen; na burn houdt elke
  unit ≥1 werkende aanval over (anti-miss-loop-garantie); elk aanvalsslot
  heeft een naam. Tests 67 → 70 headless, rooktest 20/20. SW-cache v30.

GEDAAN IN SESSIE 22 (7 juli 2026)
- KOENS PATSTELLING onderzocht (screenshot: iedereen gestatust, niemand kan
  nog raken). Twee spec-afwijkingen gevonden en gefixt na web-verificatie:
  * ÉÉN CONDITION TEGELIJK (Bulbapedia): een nieuwe special condition VERVANGT
    de oude. Wij stapelden (burn+paralysis+... samen = wiel kapot). Nieuwe
    applyCondition() op alle plekken (combat, contact-abilities, plates);
    'wait'/'bulwark' zijn geen conditions en blijven staan.
  * FROZEN wordt na een gevecht gewist, ongeacht uitkomst (Serebii). Was:
    genezen via aangrenzende bondgenoot. Sleep houdt de bondgenoot-genezing.
  * Poison/burn/paralysis/confusion slijten in Duel NIET vanzelf — dat bleek
    correct; genezing via Cleanse-plate, KO→HC en abilities (hebben we al).
- SCHAAKKLOK (Duel-regel geverifieerd: 5 min per speler, tijd op = verlies —
  hét anti-patstellings-mechanisme van Duel): tikt alleen tijdens je eigen
  beurt, pauzeert tijdens animaties/gevechten, zichtbaar in de beurt-banner
  (rood onder 30 sec). Geldt voor beide spelers (solo én hotseat).
- RESULTAATSCHERM: einde match toont nu een echt paneel (OVERWINNING/
  VERSLAGEN of SPELER X WINT, reden, credits) i.p.v. een toast; knop terug
  naar het menu. endMatch zet nu ook expliciet state.over (latente bug: AI
  kon in het oude 3-sec-venster doorspelen).
- Tests: 63 → 67 headless (4 condition-checks); rooktest 19 → 20 (klok).
  SW-cache v29.

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
12. AFGEROND (sessie 24): AI weegt abilities mee in dreiging, combat-EV en
    positiescore; moeilijkheidsgraad instelbaar.
13. AFGEROND (sessie 24): gevechts-presentatie (s21), resultaatscherm + klok
    i.p.v. sudden death (s22), geluid (s24). Hele lijst is nu af.
14. NIEUW (sessie 24): boosterkist-economie balanceren — 150 credits, C65/U27/
    R8, duplicaat-terugbetaling 60/120/240. Eerste gok, speeltesten.
15. NIEUW (sessie 24): AI-moeilijkheidsgraden speeltesten — is "Licht" echt
    toegankelijk en "Zwaar" echt uitdagend maar eerlijk?

INSPIRATIE-REFERENTIE
- Mechanics: Pokémon Duel / Comaster — Duel is bron van waarheid
- Roster-feel: high fantasy, mythologie en folklore (public domain)
- Géén beschermd IP gebruiken
