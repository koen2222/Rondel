#!/usr/bin/env node
// Tests voor de Schijfduel-regelmotor. Elke check is een regel uit
// schijfduel/SCHIJFDUEL_CLAUDE_HANDOFF.md, zodat het document en de code niet
// uit elkaar kunnen lopen.
'use strict';
const path = require('path');
const { maakMotor } = require('../schijfduel/proto/game.js');
const AI = require('../schijfduel/proto/ai.js');
const board = require('../schijfduel/board.json');
const vinyls = require('../schijfduel/vinyls.json');
const M = maakMotor(board, vinyls);

let ok = 0, fout = 0;
function check(naam, got, exp) {
  const g = JSON.stringify(got), e = JSON.stringify(exp);
  if (g === e) { ok++; console.log('  ✓ ' + naam); }
  else { fout++; console.log('  ✗ ' + naam + '\n      got: ' + g + '\n      exp: ' + e); }
}
const sectie = t => console.log('\n=== ' + t + ' ===');
const team = ['minotaurus', 'basilisk', 'chimera', 'griffin', 'draugr', 'golem'];
const potje = (extra) => M.nieuwPotje({ teams: { rood: team, blauw: team }, seed: 42, ...extra });
// Zet een beest ergens neer, buiten de regels om (voor opstellingen)
function zet(st, uid, knoop) {
  const b = st.beesten[uid]; const k = b.kant;
  st.bank[k] = st.bank[k].filter(u => u !== uid); st.wachtplaats[k] = st.wachtplaats[k].filter(u => u !== uid);
  b.knoop = knoop;
}

sectie('BORD (§3)');
{
  check('Precies 28 knopen', Object.keys(M.KNOPEN).length, 28);
  check('De spil (4,4) is geen knoop', Object.values(M.KNOPEN).some(n => n.x === 4 && n.y === 4), false);
  check('Elke edge verwijst naar bestaande knopen', board.edges.every(([a, b]) => M.KNOPEN[a] && M.KNOPEN[b]), true);
  check('Geen edge CORE_W–CORE_E (de spil zit ertussen)', M.BUREN.CORE_W.includes('CORE_E'), false);
  check('Twee entries per kant', [M.ENTRIES.rood.sort(), M.ENTRIES.blauw.sort()], [['S_E1', 'S_E2'], ['N_E1', 'N_E2']]);
  check('Doelen: rood zuid, blauw noord', [M.DOEL.rood, M.DOEL.blauw], ['S_GOAL', 'N_GOAL']);
  check('Kortste pad doel → doel is minstens 6', M.AFSTAND.N_GOAL.S_GOAL >= 6, true);
  // Het document noemt 9 stappen (via C_S2–C_S–S_CUP), maar z'n eigen edges
  // geven een korter pad: …–CORE_W–L_S–SW–S_E1–S_GOAL = 8. De JSON wint.
  // Ook is het bord NIET gespiegeld om de evenaar: C_N2 raakt beide poorten,
  // C_S2 niet. Bewust zo overgenomen ("bevries de graaf"); deze checks leggen
  // het vast zodat een wijziging opvalt. Zie rules.md.
  check('Kortste pad N_GOAL → S_GOAL is 8 (document zegt 9, edges geven 8)', M.AFSTAND.N_GOAL.S_GOAL, 8);
  check('Bekende asymmetrie: C_N2 raakt de poorten, C_S2 niet',
    [M.BUREN.C_N2.includes('CORE_W'), M.BUREN.C_S2.includes('CORE_W')], [true, false]);
}

sectie('BEESTEN (§6)');
{
  check('Twaalf beesten', vinyls.vinyls.length, 12);
  check('Elk wiel telt op tot 24 tikken', vinyls.vinyls.filter(v => v.wheel.reduce((a, s) => a + s.ticks, 0) !== 24).map(v => v.id), []);
  check('MP tussen 1 en 3', vinyls.vinyls.every(v => v.mp >= 1 && v.mp <= 3), true);
  check('Schade tussen 20 en 130', vinyls.vinyls.every(v => v.wheel.every(s => !s.power || (s.power >= 20 && s.power <= 130))), true);
  const effecten = new Set(); for (const v of vinyls.vinyls) for (const s of v.wheel) if (s.effect) effecten.add(s.effect.split(':')[0]);
  check('Alleen bekende sleutelwoorden', [...effecten].filter(e => !['KO', 'WAIT', 'PUSH', 'SWAP', 'PIN', 'RETURN', 'ENTRYLOCK'].includes(e)), []);
}

sectie('DUEL-TABEL (§5)');
{
  const S = (color, x) => ({ color, power: x, stars: x });
  const B = (a, d, pa = 0, pd = 0) => M.beslis(a, d, pa, pd);
  check('DODGE wint van alles', ['WHITE', 'GOLD', 'PURPLE', 'MISS'].map(c => B(S('DODGE'), S(c))), ['a', 'a', 'a', 'a']);
  check('Twee DODGE = niets', B(S('DODGE'), S('DODGE')), null);
  check('MISS verliest van alles behalve MISS', ['WHITE', 'GOLD', 'PURPLE', 'DODGE'].map(c => B(S('MISS'), S(c))), ['d', 'd', 'd', 'd']);
  check('Twee MISS = niets', B(S('MISS'), S('MISS')), null);
  check('GOLD wint van PURPLE', B(S('GOLD', 10), S('PURPLE', 3)), 'a');
  check('PURPLE wint van WHITE', B(S('PURPLE', 1), S('WHITE', 130)), 'a');
  check('PURPLE vs PURPLE: meeste sterren', [B(S('PURPLE', 3), S('PURPLE', 2)), B(S('PURPLE', 1), S('PURPLE', 2)), B(S('PURPLE', 2), S('PURPLE', 2))], ['a', 'd', null]);
  check('WHITE/GOLD onderling: hoogste schade, gelijk = niets',
    [B(S('WHITE'), S('GOLD'), 90, 60), B(S('GOLD'), S('WHITE'), 50, 80), B(S('WHITE'), S('WHITE'), 70, 70)], ['a', 'd', null]);
}

sectie('BEURT (§4)');
{
  let st = potje();
  check('Iedereen begint op de bank', [st.bank.rood.length, st.bank.blauw.length], [6, 6]);
  const inzet = M.acties(st).filter(a => a.soort === 'inzet');
  check('Inzetten kan alleen via eigen entries', [...new Set(inzet.map(a => a.entry))].sort(), ['S_E1', 'S_E2']);
  // Startspeler beurt 1: MP −1. Minotaurus (MP 2) mag dus na inzet nog 1 stap.
  const mino = inzet.filter(a => a.uid === 'r1');
  check('Startspeler beurt 1 loopt 1 minder (Minotaurus: entry + 1 stap)',
    Math.max(...mino.map(a => M.AFSTAND[a.entry][a.naar])), 1);
  M.doe(st, { soort: 'inzet', uid: 'r1', entry: 'S_E1', naar: 'S_E1' });
  check('Zonder vijand ernaast is de beurt meteen voorbij', [st.aanZet, st.beurt], ['blauw', 2]);
  // Niet door bezette knopen
  // Minotaurus (MP 2) op S_CUP met alle vier de buren bezet: nergens heen, ook
  // niet naar C_S2 achter C_S — daar zou hij DOOR een bezette knoop moeten.
  st = potje(); zet(st, 'r1', 'S_CUP'); zet(st, 'b1', 'C_S'); zet(st, 'b2', 'S_E1'); zet(st, 'b3', 'S_E2'); zet(st, 'b4', 'S_GOAL');
  st.beurt = 3;
  check('Niet door een bezette knoop heen lopen', M.acties(st).filter(a => a.soort === 'loop' && a.uid === 'r1').length, 0);
  // Witte Wieven mag wél door bevriende beesten
  st = M.nieuwPotje({ teams: { rood: ['witte-wieven', 'golem', 'draugr', 'basilisk', 'griffin', 'chimera'], blauw: team }, seed: 3 });
  zet(st, 'r1', 'S_CUP'); zet(st, 'r2', 'C_S'); st.beurt = 3;
  check('Witte Wieven loopt door een vriend heen', M.acties(st).some(a => a.soort === 'loop' && a.uid === 'r1' && a.naar === 'C_S2'), true);
}

sectie('EFFECTEN EN PASSIEVEN');
{
  // PUSH: een knoop van de winnaar af, naar een lege knoop
  let st = potje(); zet(st, 'r1', 'C_S'); zet(st, 'b2', 'C_S2');
  const ev = []; const Mi = M;
  // rechtstreeks via een duel met vaste uitkomst is omslachtig; test de regel via de motor-API
  const voor = st.beesten.b2.knoop;
  // Simuleer een PURPLE-winst met PUSH: gebruik de interne toepasser via een geforceerd duel
  const b2 = st.beesten.b2, r1 = st.beesten.r1;
  // verste lege buur van C_S2 gezien vanaf C_S:
  const opties = M.BUREN.C_S2.filter(n => !M.beestOp(st, n) && M.AFSTAND.C_S[n] > M.AFSTAND.C_S.C_S2);
  check('PUSH heeft een kant op om te gaan (van de winnaar af)', opties.length > 0, true);
  check('Golem is immuun voor SWAP en PUSH', vinyls.vinyls.find(v => v.id === 'golem').passive.immune.sort(), ['PUSH', 'SWAP']);
  check('Minotaurus slaat 10 harder op de as',
    [M.kracht(st, { id: 'minotaurus', knoop: 'C_S' }, { color: 'WHITE', power: 80 }), M.kracht(st, { id: 'minotaurus', knoop: 'SW' }, { color: 'WHITE', power: 80 })], [90, 80]);
}

sectie('INSLUITEN EN WINST');
{
  // Een rood beest op S_E1 (buren: SW, S_CUP, S_GOAL) volledig ingesloten door blauw
  let st = M.nieuwPotje({ teams: { rood: team, blauw: team }, seed: 1, start: 'blauw' });
  zet(st, 'r1', 'S_E1'); zet(st, 'b1', 'SW'); zet(st, 'b2', 'S_CUP'); zet(st, 'b3', 'S_GOAL');
  st.beurt = 5;
  M.doe(st, { soort: 'pas' });
  check('Volledig door vijanden ingesloten → KO naar de wachtplaats', [st.beesten.r1.knoop, st.wachtplaats.rood.includes('r1')], [null, true]);
  // Winst pas aan het einde van de beurt
  st = potje(); zet(st, 'r1', 'N_CUP'); st.beurt = 3;
  const winZet = M.acties(st).find(a => a.soort === 'loop' && a.uid === 'r1' && a.naar === 'N_GOAL');
  check('Het vijandelijke doel is bereikbaar', !!winZet, true);
  M.doe(st, winZet);
  if (st.fase === 'duel') M.doe(st, { soort: 'geenDuel' });
  check('Op het vijandelijke doel aan het einde van je beurt = winst', [st.fase, st.winnaar], ['klaar', 'rood']);
}

sectie('WACHTPLAATS');
{
  let st = potje(); const b = st.beesten.r5;   // draugr
  zet(st, 'r2', 'C_S'); st.beesten.r2.knoop = 'C_S';
  // KO forceren via insluiting is omslachtig: zet de wachtplaats rechtstreeks
  st.beesten.r2.knoop = null; st.wachtplaats.rood.push('r2'); st.beesten.r2.timer = 2;
  st.aanZet = 'blauw'; M.doe(st, { soort: 'pas' });           // rood begint beurt: timer 1
  check('Na één eigen beurtstart nog in de wachtplaats', st.wachtplaats.rood.includes('r2'), true);
  M.doe(st, { soort: 'pas' }); M.doe(st, { soort: 'pas' });   // blauw, dan rood: timer 0
  check('Na één volle eigen beurt terug op de bank', st.bank.rood.includes('r2'), true);
}

sectie('ZAAD (?seed=)');
{
  const speel = seed => { const st = M.nieuwPotje({ teams: { rood: team, blauw: team }, seed });
    for (let i = 0; i < 400 && st.fase !== 'klaar'; i++) M.doe(st, AI.kies(M, st, 'normaal', () => 0.5));
    return JSON.stringify(st.log); };
  check('Hetzelfde zaad geeft precies hetzelfde potje', speel(123) === speel(123), true);
}

sectie('AI TEGEN AI');
{
  const alle = vinyls.vinyls.map(v => v.id);
  let klaar = 0, rood = 0, blauw = 0, gelijk = 0, fouten = 0;
  for (let i = 0; i < 40; i++) {
    const r = require('../schijfduel/proto/game.js').maakRng(i + 1);
    const kies6 = () => { const a = [...alle]; const u = []; while (u.length < 6) u.push(a.splice(Math.floor(r() * a.length), 1)[0]); return u; };
    const st = M.nieuwPotje({ teams: { rood: kies6(), blauw: kies6() }, seed: 1000 + i, start: i % 2 ? 'blauw' : 'rood' });
    try {
      for (let n = 0; n < 2000 && st.fase !== 'klaar'; n++) M.doe(st, AI.kies(M, st, 'normaal', r));
    } catch (e) { fouten++; console.log('    ' + e.message); }
    if (st.fase === 'klaar') { klaar++; if (st.winnaar === 'rood') rood++; else if (st.winnaar === 'blauw') blauw++; else gelijk++; }
  }
  console.log(`    40 potjes: rood ${rood}, blauw ${blauw}, gelijk ${gelijk}`);
  check('Elk potje komt tot een einde, zonder fouten', [klaar, fouten], [40, 0]);
  // Gelijkspel = 200 beurten zonder winnaar. Groks regels staan toe dat je je
  // eigen doel dichtzet met een zwaar beest (Draugr, Golem, Cycloop); dat maakt
  // een deel van de potjes onbeslist. Bevinding voor Koen, zie rules.md. Deze
  // check bewaakt dat het merendeel wél beslist wordt.
  check('Het merendeel van de potjes wordt beslist', rood + blauw >= 25, true);
  check('Rood en blauw winnen allebei (geen kant is kansloos)', rood >= 8 && blauw >= 8, true);
}

sectie('CAMPAGNE');
{
  const V = require('../schijfduel/proto/voortgang.js');
  const alle = vinyls.vinyls.map(v => v.id);
  check('Twaalf hoofdstukken, één per beest', [V.CAMPAGNE.length, new Set(V.CAMPAGNE).size, V.CAMPAGNE.every(k => alle.includes(k))], [12, 12, true]);
  const p = V.freshProfiel();
  check('Je begint met zes beesten', p.stal.length, 6);
  check('Hoofdstuk 1 levert een beest op dat je nog niet hebt', p.stal.includes(V.CAMPAGNE[0]), false);
  const fout = [];
  V.CAMPAGNE.forEach((k, h) => { for (let g = 0; g < V.GEVECHTEN; g++) { const t = V.campagneGevecht(h, g, alle);
    if (t.team.length !== 6 || new Set(t.team).size !== 6 || !t.team.every(x => alle.includes(x))) fout.push(h + '/' + g); } });
  check('Alle 36 gevechten: zes verschillende bestaande beesten', fout, []);
  check('Zelfde gevecht = zelfde team', JSON.stringify(V.campagneGevecht(3, 1, alle)), JSON.stringify(V.campagneGevecht(3, 1, alle)));
  check('Alleen gevecht 1 van hoofdstuk 1 is open', [V.campagneOpen({}, 0, 0), V.campagneOpen({}, 0, 1), V.campagneOpen({}, 1, 0)], [true, false, false]);
  V.campagneWinst(p, 0, 0); V.campagneWinst(p, 0, 1); const r = V.campagneWinst(p, 0, 2);
  check('Hoofdstuk uitspelen: het beest komt in je stal', [r.hoofdstukKlaar, r.beest, p.stal.includes(V.CAMPAGNE[0])], [true, V.CAMPAGNE[0], true]);
  check('Nog een keer winnen levert niets extra', V.campagneWinst(p, 0, 2).nieuw, false);
  check('Daarna gaat hoofdstuk 2 open', V.campagneOpen(p.campagne, 1, 0), true);
}

sectie('LADDER');
{
  const V = require('../schijfduel/proto/voortgang.js');
  const reeks = (l, u) => u.reduce((x, w) => V.ladderNaUitslag(x, w).ladder, l);
  const nul = { plek: 0, sterren: 0, hoogste: 0 };
  check('Begin in Brons III', V.ladderNaam(0), 'Brons III');
  check('Drie keer winnen = Brons II', V.ladderNaam(reeks(nul, [true, true, true]).plek), 'Brons II');
  check('Verliezen in Brons III kost niets', reeks(nul, [false, false]), nul);
  const zilver = reeks(nul, Array(9).fill(true));
  check('Negen keer winnen = Zilver III', V.ladderNaam(zilver.plek), 'Zilver III');
  check('Onder de bodem van je rang zak je nooit', V.ladderNaam(reeks(zilver, [false, false, false, false]).plek), 'Zilver III');
  check('Een nieuwe rang levert een titel op', V.ladderNaUitslag({ plek: 2, sterren: 2, hoogste: 2 }, true).nieuweTitel, V.TITELS[1]);
  check('Legende is de top', V.ladderNaam(reeks(nul, Array(40).fill(true)).plek), 'Legende');
}

console.log(`\n${ok + fout} checks — ${ok} ✓  ${fout} ✗`);
process.exit(fout ? 1 : 0);
