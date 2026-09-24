# SCHIJFDUEL — handoff voor Claude

**Export:** 2026-09-24  
**Concept:** Koen  
**Status:** reconstructie uit Grok-projectgeheugen (sprint 2026-08-30–09-04). Dit is geen transcript-dump. Originelen (mocks, SVG, site.json, proto-code) zitten niet in deze sessie. Als Koen die later plakt, winnen die van dit document.

**Namen**
- Werknaam NL: **Schijfduel**
- Werknaam kort/EN: **Rondel**
- Tagline: *Draai de schijf. Verover het doel.*
- **Apsis** = ander project (orbital sandbox, gravity/trails). Niet in deze codebase.

---

## Instructie aan Claude

Je bouwt Schijfduel verder uit: ruleset + data + speelbare hotseat-proto.

IP-regel: publiek domein mythologie. Geen Pokémon-namen, -types, -moves, -plates, -league-terminologie.

Niet doen: extra systemen verzinnen voordat de kernlus speelbaar is. Apsis-fysica niet mengen. Geen gacha.

Eerste deliverable:
1. `board.json` (28 knopen + edges, zoals hieronder)
2. `vinyls.json` (12 beesten)
3. `proto/index.html` + JS: hotseat, zetten, wiel, KO, winst
4. Korte `rules.md`

Stel alleen vragen als iets uit §9 de proto blokkeert.

---

## 1. Pitch

Twee spelers. Zes vinylfiguren per kant. Bord van 28 punten. Je zet in via eigen entries, loopt in MP-stappen, en duelleert met aanvalsschijven. Positie is skill. De draai is gewogen kans met zichtbare odds. Win door een eigen vinyl op het vijandelijke doel te parkeren.

Geestelijk nageslacht van Pokémon Duel / Trading Figure Game. Eigen IP.

---

## 2. Merk

| Token | Hex |
|---|---|
| Navy | `#0B1C2C` |
| Cream | `#F3E6C8` |
| Gold | `#C9A227` |
| Team rood | `#B42318` |
| Team blauw | `#1D4E89` |
| Miss | `#5C2B2B` |
| Purple | `#5B3A8C` |
| Dodge / teal | `#2A6F6A` |
| White-aanval | `#E8E0D0` |

UI-sans strak. Display-serif voor de titel. Geen Reijn-terracotta, geen Poppins.

Termen: **vinyl** / **beest**, **schijf**, **stadion**, **doel**, **bank**, **wachtplaats**. Niet figure/plate/PC/Pokémon.

Rood start zuid. Blauw start noord.

---

## 3. Bord (bevroren)

Precies 28 knopen. Spiegel om de evenaar (y=4) en om de as x=4.  
(4,4) is **geen knoop**: visueel het gat van de schijf / spil. Je staat er niet.

### 3.1 Knopen

| id | x | y | rol |
|---|---|---|---|
| N_GOAL | 4 | 0 | doel blauw |
| N_E1 | 3 | 1 | entry blauw |
| N_CUP | 4 | 1 | drempel blauw |
| N_E2 | 5 | 1 | entry blauw |
| NW | 1 | 2 | flank |
| C_N | 4 | 2 | as |
| NE | 7 | 2 | flank |
| W_H | 0 | 3 | zij |
| L_N | 3 | 3 | binnen |
| C_N2 | 4 | 3 | as |
| R_N | 5 | 3 | binnen |
| E_H | 8 | 3 | zij |
| W_M | 0 | 4 | zij |
| CORE_W | 3 | 4 | poort west |
| CORE_E | 5 | 4 | poort oost |
| E_M | 8 | 4 | zij |
| W_L | 0 | 5 | zij |
| L_S | 3 | 5 | binnen |
| C_S2 | 4 | 5 | as |
| R_S | 5 | 5 | binnen |
| E_L | 8 | 5 | zij |
| SW | 1 | 6 | flank |
| C_S | 4 | 6 | as |
| SE | 7 | 6 | flank |
| S_E1 | 3 | 7 | entry rood |
| S_CUP | 4 | 7 | drempel rood |
| S_E2 | 5 | 7 | entry rood |
| S_GOAL | 4 | 8 | doel rood |

28 rijen. Bevries IDs.

### 3.2 Edges (ongericht)

Alleen deze lijnen. Geen extra diagonalen.

```
N_GOAL–N_CUP
N_GOAL–N_E1
N_GOAL–N_E2
N_E1–N_CUP–N_E2
N_E1–NW
N_E2–NE
N_CUP–C_N
NW–C_N–NE
NW–W_H
NE–E_H
NW–L_N
NE–R_N
C_N–C_N2
W_H–L_N–C_N2–R_N–E_H
W_H–W_M–W_L
E_H–E_M–E_L
L_N–CORE_W
R_N–CORE_E
C_N2–CORE_W
C_N2–CORE_E
W_M–CORE_W–C_S2? NEE. CORE_W–CORE_E bestaat niet (spil ertussen).
CORE_W–L_S
CORE_E–R_S
W_L–L_S–C_S2–R_S–E_L
L_S–SW
R_S–SE
C_S2–C_S
W_L–SW
E_L–SE
SW–C_S–SE
SW–S_E1
SE–S_E2
C_S–S_CUP
S_E1–S_CUP–S_E2
S_CUP–S_GOAL
S_E1–S_GOAL
S_E2–S_GOAL
CORE_W–W_M
CORE_E–E_M
```

Kortste pad N_GOAL → S_GOAL via as:  
N_GOAL–N_CUP–C_N–C_N2–CORE_W–L_S–C_S2–C_S–S_CUP–S_GOAL = 9 stappen.  
Via CORE_E spiegel. OK (≥ 6).

### 3.3 Bijzondere knopen

- **Inzetten** alleen op eigen vrije entry: blauw `N_E1`/`N_E2`, rood `S_E1`/`S_E2`. Cup en doel zijn geen entry.
- **Winst:** eigen vinyl op vijandelijk GOAL aan het einde van jouw beurt.
- **Surround:** alle buren van een knoop zijn vijandelijk bezet, degree ≥ 2 → directe KO, geen schijf.

---

## 4. Beurt

Team: 6 vinyls, start op de **bank**.

1. Start beurt: WAIT −1. Vinyls waarvan wachtplaats-timer 0 is gaan naar de bank.
2. Eén actie:
   - **Inzet:** bank → eigen vrije entry. Daarna mag die vinyl nog bewegen met zijn MP (startspeler ronde 1: MP −1 na inzet).
   - **of** een vinyl die al op het stadion staat: tot MP stappen.
3. Beweging: alleen langs edges. Niet door bezette knopen. Eindigen op leeg.
4. Na de beweging (of inzet zonder loop): maximaal **één** duel tegen een adjacent vijand. Optioneel. Geen automatisch contact-duel.
5. Winstcheck.
6. Einde beurt.

Knock-out → **wachtplaats**, terug naar bank na **1 volledige eigen beurt**.  
Startspeler: beurt 1 alle MP −1.

Geen plates in v1.

---

## 5. Schijf

24 ticks per vinyl. Segmentgrootte in gehele ticks. RNG gewogen op ticks. Geen “tik om te stoppen”.

| Kleur | Vs |
|---|---|
| DODGE | wint van alles; twee DODGE = niets. Sommige DODGE hebben WAIT op jezelf. |
| GOLD | wint van PURPLE. Vs WHITE/GOLD: hoogste schade wint. Gelijk = niets. |
| PURPLE | wint van WHITE. Verliest van GOLD. Vs PURPLE: meeste sterren. Gelijk = niets, effecten vuren niet. |
| WHITE | vs WHITE/GOLD op schade. Verliest van PURPLE en DODGE. |
| MISS | verliest van alles behalve MISS. Twee MISS = niets. |

DODGE vs DODGE, MISS vs MISS, gelijke schade, gelijke sterren: beide blijven staan.

Keywords v1: `KO` (standaard bij schadewinst), `WAIT:n`, `PUSH` (1 knoop van de winnaar af, langs een edge naar lege knoop; anders geen PUSH), `SWAP`, `PIN` (doel MP 0 volgende eigen beurt), `RETURN` (doel naar bank), `ENTRYLOCK` (één vijandelijke entry telt 1 ronde als bezet).

Geen poison-stacks.

---

## 6. Twaalf vinyls

Wiel somt altijd tot 24 ticks. Schade 20–130. MP 1–3.

1. **Minotaurus** MP2  
   WHITE 80×8, WHITE 50×6, GOLD 100×3, PURPLE 2★ PUSH×2, MISS×5  
   Passief: +10 op WHITE als hij op as staat (`C_N`,`C_N2`,`C_S2`,`C_S`).

2. **Basilisk** MP2  
   WHITE 70×7, WHITE 40×4, PURPLE 3★ PIN×4, DODGE×3, MISS×6

3. **Chimera** MP2  
   WHITE 90×6, WHITE 30×6, GOLD 60×4, PURPLE 1★ WAIT:1×3, MISS×5

4. **Witte Wieven** MP3  
   WHITE 20×8, PURPLE 2★ SWAP×4, DODGE×6, MISS×6  
   Passief: bewegen door bevriende vinyls (niet eindigen op hen).

5. **Kelpie** MP3  
   WHITE 40×8, WHITE 70×4, PURPLE 2★ SWAP×4, DODGE×4, MISS×4

6. **Griffin** MP3  
   WHITE 60×8, GOLD 50×6, DODGE×4, MISS×6

7. **Draugr** MP1  
   WHITE 110×8, WHITE 70×8, PURPLE 2★ PIN×4, MISS×4  
   Passief: na KO extra +1 beurt op wachtplaats.

8. **Phoenix** MP2  
   WHITE 50×10, GOLD 40×4, DODGE×4, MISS×6  
   Passief `REBIRTH`: eerste KO dit duel → bank i.p.v. wachtplaats.

9. **Cycloop** MP1  
   WHITE 130×10, WHITE 40×4, PURPLE 1★ ENTRYLOCK×2, MISS×8

10. **Fenrir** MP3  
    WHITE 60×8, WHITE 30×4, GOLD 90×3, PURPLE 2★ WAIT:1×4, MISS×5

11. **Golem** MP1  
    WHITE 100×10, WHITE 40×8, DODGE×2, MISS×4  
    Passief: immuun voor SWAP en PUSH.

12. **Banshee** MP2  
    WHITE 20×8, PURPLE 3★ WAIT:1×5, DODGE×5, MISS×6

Team: 6 uit 12, geen uniques.

---

## 7. Proto v1

```
schijfduel/
  README.md
  rules.md
  board.json
  vinyls.json
  proto/index.html
  proto/game.js
  proto/render.js
  proto/style.css
```

Must:
- Bord + highlights legale zetten
- Hotseat 2 spelers
- Wiel-animatie, tick-gewogen
- Hover = odds in %
- Bank / veld / wachtplaats
- Surround + winst
- `?seed=` voor RNG

v1.1: greedy-AI, replay-log.  
Niet v1: netwerk, shop, 3D, verplicht geluid.

---

## 8. Wat ontbreekt uit de originele sprint

Grok heeft in deze sessie geen toegang tot de chats van 30 aug–4 sep 2026. Alleen deze geheugenregel:

Rondel = Pokémon Duel Kanto-opvolger; 28-pt stadium; vinyl monsters; attack wheels; rood/blauw; publiek domein myth; tagline *Draai de schijf. Verover het doel.* Ook Schijfduel genoemd. Apsis apart. Palet navy/cream/gold + rood-blauw. KOEN-branding liep parallel.

Dus: naam, exacte originele graaf, en of plates bestonden, zijn niet geverifieerd.

---

## 9. Open (Koen)

1. Definitieve naam?
2. Bestond er al een 28-puntenkaart? Zo ja: die wint van §3.
3. Plates in v1 of nee?
4. Proto first of print-and-play first?
5. UI-taal: NL of NL+EN?
6. Apsis strikt gescheiden?

---

## 10. Plakblok voor nieuwe Claude-chat

```
Werk verder aan SCHIJFDUEL (aka Rondel).
Source of truth: het bestand SCHIJFDUEL_CLAUDE_HANDOFF.md.
Publiek domein mythologie. Geen Pokémon-IP.
28 knopen volgens de tabel in §3. (4,4) is geen knoop.
Twee doelen, twee entries per kant, cup = drempel geen entry.
Duel: 24-tick wiel. DODGE slaat alles. GOLD slaat PURPLE.
WHITE/GOLD vergelijken schade. Gelijke uitkomst = niets.
Win: eigen vinyl op vijandelijk doel aan einde van je beurt.
Merk: navy/cream/gold + rood/blauw.
Apsis is een ander project.
Start met board.json, vinyls.json en een hotseat HTML-proto.
Bevries de graaf. Vraag alleen §9 als het blokkeert.
```
