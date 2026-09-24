# Schijfduel — regels

*Draai de schijf. Verover het doel.* Bron van waarheid: `SCHIJFDUEL_CLAUDE_HANDOFF.md`
(van Grok). Waar die tekst en `board.json` / `vinyls.json` elkaar tegenspreken,
wint de JSON — die is concreter. De afwijkingen staan onderaan.

## Opzet
- Twee spelers, zes beesten ("vinyls") per kant, gekozen uit twaalf, geen dubbele.
- Rood start zuid, blauw noord. Rood begint.
- Iedereen begint op de **bank**.

## Het bord
28 knopen, zie `board.json`. De spil (4,4) is geen knoop: dat is het gat van de plaat.
Elke kant heeft twee **entries** (inzetten), een **cup** (drempel, geen entry) en een **doel**.

## Je beurt
1. Begin van je beurt: beesten in de **wachtplaats** tellen af; wie op 0 staat gaat naar de bank.
2. **Eén actie**:
   - **inzetten**: van de bank op een eigen vrije entry, daarna nog lopen met z'n MP; of
   - **lopen** met een beest op het veld: tot MP stappen langs de lijnen, niet door
     bezette knopen, eindigen op een lege knoop. (Je mag ook blijven staan.)
   - De speler die begint heeft in beurt 1 bij alles MP −1.
3. Daarna mag je **één duel** met een vijand naast het beest dat net handelde. Hoeft niet.
4. **Winst**: aan het einde van je beurt staat een eigen beest op het vijandelijke doel.

## Het duel
Elk beest heeft een schijf van 24 tikken; een vak van 6 tikken heeft 25% kans.
- **Ontwijk** wint van alles. Twee keer ontwijk: niets.
- **Goud** wint van paars. Tegen wit of goud: hoogste schade wint.
- **Paars** wint van wit. Paars tegen paars: meeste sterren; gelijk = niets, effecten vuren niet.
- **Wit** tegen wit of goud: hoogste schade wint.
- **Mis** verliest van alles behalve mis.
- Gelijk = niets.

Wint wit of goud: de ander is **knock-out** → wachtplaats, na één volle eigen beurt terug op de bank.
Wint paars: het effect van dat vak.

## Effecten
| woord | wat |
|---|---|
| WAIT:n | de ander doet n eigen beurten niets |
| PUSH | de ander schuift één knoop van de winnaar af naar een lege knoop; kan dat niet, dan niets |
| SWAP | winnaar en verliezer ruilen van plek |
| PIN | de ander heeft z'n volgende beurt MP 0 (mag nog wel duelleren) |
| RETURN | de ander gaat terug naar de bank |
| ENTRYLOCK | één vijandelijke entry telt een ronde als bezet |

## Insluiten
Een beest waarvan álle buren door vijanden bezet zijn (en dat minstens twee buren
heeft) is meteen knock-out, zonder duel.

## Passieven
Minotaurus +10 op wit op de middenas · Witte Wieven loopt door vrienden heen ·
Draugr blijft een beurt langer in de wachtplaats · Phoenix: eerste knock-out → bank ·
Golem: immuun voor SWAP en PUSH.

## Keuzes en afwijkingen (door Claude, sessie 46)
- **Kortste pad doel → doel is 8, niet 9.** De tekst noemt 9 via C_S2–C_S–S_CUP, maar
  de edges zelf geven …–CORE_W–L_S–SW–S_E1–S_GOAL = 8. De JSON wint.
- **Het bord is niet gespiegeld om de evenaar**, anders dan de tekst zegt: C_N2 raakt
  beide poorten (CORE_W/CORE_E), C_S2 niet. Overgenomen zoals het is ("bevries de
  graaf"); een test legt het vast. **Vraag voor Koen: bedoeld, of moeten C_S2–CORE_W en
  C_S2–CORE_E erbij?**
- **"Sommige DODGE hebben WAIT op jezelf"**: geen enkele DODGE in `vinyls.json` heeft
  dat. De motor ondersteunt het (een `effect` op een DODGE-vak gaat naar de ontwijker).
- **REBIRTH "dit duel"** gelezen als "dit potje": één keer.
- **ENTRYLOCK** kiest de vrije entry het dichtst bij het getroffen beest.
- **Vangnet**: na 200 beurten is het gelijkspel (anders kan een proto eeuwig doorgaan).

## Wat het testen liet zien (voor Koen)
- **Je eigen doel dichtzetten werkt erg goed.** Een zwaar beest met MP 1 (Draugr,
  Golem, Cycloop) op of vlak voor je doel is moeilijk te breken. In 40 AI-tegen-AI-potjes
  eindigden er 11 in gelijkspel na 200 beurten.
- **Rennen gaat snel.** Met MP 3 en een pad van 8 kan een beest in drie eigen beurten
  bij het doel zijn als niemand blokkeert.
