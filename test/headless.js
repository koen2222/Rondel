#!/usr/bin/env node
// Headless test-suite voor Rondel — spec: docs/00_Status_en_Beslissingen.md
// Extraheert resolve(), applyStatus(), NODES, ROUTES/ADJ chirurgisch uit index.html.
// Draai: node test/headless.js

'use strict';
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

// ─── Chirurgische extractie ────────────────────────────────────────────────────
// We evalueren alleen de puur-functionele blokken zonder DOM-afhankelijkheden.

function extractBlock(src, startPattern, endMarker) {
  const si = src.search(startPattern);
  if (si < 0) throw new Error('Patroon niet gevonden: ' + startPattern);
  // Zoek eindemarkering (volgende const/function/let op col 0 nà si)
  const after = src.slice(si);
  const mi = after.search(endMarker);
  return mi < 0 ? after : after.slice(0, mi);
}

// NODES, ROUTES, ADJ — alles vóór UNIT_DEFS (incl. perspectief-constanten)
const boardSection = html.slice(
  html.indexOf('\nconst BOARD_CX'),
  html.indexOf('\nconst W=')          // W/G/B/R helpers starten de disk-data
);

// Disk-data: W/G/B/R/P helpers + UNIT_DEFS + DISK_LAYOUT + arrangeSlots,
// tot vóór de apply-loop (zodat we hier de ONGEARRANGEERDE blokken hebben)
const diskSection = html.slice(
  html.indexOf('\nconst W='),
  html.indexOf('// DISK-ARRANGE-APPLY')
);

// Ability-definities (ABILITIES, UNIT_ABILITY, abilityOf, contactStatusOf, canPhase)
const abilitySection = html.slice(
  html.indexOf('const ABILITIES ='),
  html.indexOf('// ABILITIES-END')
);

// Boosterkist (BOOSTER_COST, BOOSTER_ODDS, rollBooster)
const boosterSection = html.slice(
  html.indexOf('const BOOSTER_COST ='),
  html.indexOf('// BOOSTER-END')
);
if (!boosterSection) throw new Error('BOOSTER-blok niet gevonden');

// Instellingen (SETTING_DEFS, freshSettings, normalizeSettings)
const settingsSection = html.slice(
  html.indexOf('const SETTING_DEFS ='),
  html.indexOf('// SETTINGS-END')
);
if (!settingsSection) throw new Error('SETTINGS-blok niet gevonden');

// resolve + applyStatus — puur-functioneel, geen state; koUnit werkt op state (injecteerbaar)
const resolveMatch = html.match(/\nfunction resolve\([\s\S]*?\n\}/);
const applyMatch   = html.match(/\nfunction applyStatus\([\s\S]*?\n\}/);
const koMatch      = html.match(/\nfunction koUnit\([\s\S]*?\n\}/);
const condMatch    = html.match(/\nfunction applyCondition\([\s\S]*?\n\}/);
const platesSection = html.slice(html.indexOf('const PLATE_BUDGET ='), html.indexOf('// PLATES-END'));
// Aanvalsanimaties: trefwoord→soort (FX) en soort→projectiel (DUELFX)
const fxSection = html.slice(html.indexOf('const FX_TREFWOORDEN ='), html.indexOf('// FX-END'));
const duelFxSection = html.slice(html.indexOf('const FX_PROJECTIEL ='), html.indexOf('// DUELFX-END'));
const kleurMatch = html.match(/\nconst FX_KLEUR = \{[\s\S]*?\};/);
if (!fxSection) throw new Error('FX-blok niet gevonden');
if (!duelFxSection) throw new Error('DUELFX-blok niet gevonden');
if (!kleurMatch) throw new Error('FX_KLEUR niet gevonden');
const decksMatch   = html.match(/\nconst DECK_SLOTS[\s\S]*?\nfunction normalizeDecks\([\s\S]*?\n\}/);
if (!platesSection) throw new Error('PLATES-blok niet gevonden');
if (!decksMatch)  throw new Error('normalizeDecks() niet gevonden');
if (!condMatch) throw new Error('applyCondition() niet gevonden');
if (!resolveMatch) throw new Error('resolve() niet gevonden');
if (!applyMatch)   throw new Error('applyStatus() niet gevonden');
if (!koMatch)      throw new Error('koUnit() niet gevonden');

const evalCode = [
  'let state = null;',
  'function __setState(s) { state = s; }',
  boardSection,
  diskSection,
  abilitySection,
  settingsSection,
  boosterSection,
  resolveMatch[0],
  applyMatch[0],
  koMatch[0],
  condMatch[0],
  platesSection,
  decksMatch[0],
  fxSection,
  kleurMatch[0],
  duelFxSection,
  'module.exports = { resolve, applyStatus, NODES, ADJ, ROUTES, koUnit, __setState, UNIT_DEFS, DISK_LAYOUT, arrangeSlots, ABILITIES, UNIT_ABILITY, abilityOf, contactStatusOf, canPhase, moveLabel, applyCondition, SETTING_DEFS, freshSettings, normalizeSettings, PLATES, PLATE_BUDGET, plateCost, DECK_SLOTS, normalizeDecks, BOOSTER_COST, BOOSTER_ODDS, BOOSTER_REFUND, rollBooster, FX_TREFWOORDEN, attackFx, FX_KLEUR, FX_PROJECTIEL, projectielVoor };',
].join('\n');

// Schrijf tijdelijk evalueerbaar bestand (vermijdt new Function-beperkingen)
const tmpPath = path.join(__dirname, '_extracted.cjs');
fs.writeFileSync(tmpPath, evalCode);
let extracted;
try {
  extracted = require(tmpPath);
} finally {
  fs.unlinkSync(tmpPath);
}

const { resolve, applyStatus, NODES, ADJ, ROUTES, koUnit, __setState, UNIT_DEFS, DISK_LAYOUT, arrangeSlots, ABILITIES, UNIT_ABILITY, abilityOf, contactStatusOf, canPhase, moveLabel, applyCondition, SETTING_DEFS, freshSettings, normalizeSettings, PLATES, PLATE_BUDGET, plateCost, DECK_SLOTS, normalizeDecks, BOOSTER_COST, BOOSTER_ODDS, BOOSTER_REFUND, rollBooster, FX_TREFWOORDEN, attackFx, FX_KLEUR, FX_PROJECTIEL, projectielVoor } = extracted;

// ─── Test harness ──────────────────────────────────────────────────────────────
let pass = 0, fail = 0;
function check(label, got, expected) {
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (ok) { console.log('  ✓', label); pass++; }
  else     { console.log('  ✗', label, '\n      got:', JSON.stringify(got), '\n      exp:', JSON.stringify(expected)); fail++; }
}
function section(title) { console.log('\n' + title); }

// ─── 1. COMBAT RESOLVE (14 checks, spec §Combat-uitkomsten) ──────────────────
section('=== COMBAT RESOLVE (14 checks) ===');

const R = (ak, av, ae, as, dk, dv, de, ds) =>
  resolve({ k:ak, v:av||0, effect:ae, stars:as||1 },
          { k:dk, v:dv||0, effect:de, stars:ds||1 });
const KO_ATT = { attKO:true,  defKO:false, statusOnAtt:null, statusOnDef:null };
const KO_DEF = { attKO:false, defKO:true,  statusOnAtt:null, statusOnDef:null };
const NONE   = { attKO:false, defKO:false, statusOnAtt:null, statusOnDef:null };
const SA = s => ({ attKO:false, defKO:false, statusOnAtt:s,    statusOnDef:null });
const SD = s => ({ attKO:false, defKO:false, statusOnAtt:null, statusOnDef:s });

check('Red(att) vs White(def) → att KO',             R('red',0,null,1, 'white',50,null,1), KO_ATT);
check('Red(att) vs Gold(def)  → att KO',             R('red',0,null,1, 'gold',60,null,1),  KO_ATT);
check('Red(att) vs Purple(def) → status op att',     R('red',0,null,1, 'purple',0,'poison',2), SA('poison'));
check('Red(att) vs Blue(def)  → niemand',            R('red',0,null,1, 'blue',0,null,1),   NONE);
check('Blue(att) vs White(def) → niemand',           R('blue',0,null,1,'white',50,null,1), NONE);
check('Blue(att) vs Purple(def) → niemand',          R('blue',0,null,1,'purple',0,'paralysis',1), NONE);
check('Blue(att) vs Gold(def)  → att KO',            R('blue',0,null,1,'gold',70,null,1),  KO_ATT);
check('Gold(att) vs Purple(def) → def KO',           R('gold',60,null,1,'purple',0,'burn',2), KO_DEF);
check('Gold(att) vs Blue(def)   → def KO',           R('gold',60,null,1,'blue',0,null,1),   KO_DEF);
check('Purple(att) vs White(def) → status op def',   R('purple',0,'confusion',2,'white',40,null,1), SD('confusion'));
check('Purple vs Purple: att meer sterren → def',    R('purple',0,'paralysis',3,'purple',0,'burn',1), SD('paralysis'));
check('Purple vs Purple: def meer sterren → att',    R('purple',0,'confusion',1,'purple',0,'poison',4), SA('poison'));
check('Purple vs Purple: gelijk → niemand',          R('purple',0,'confusion',2,'purple',0,'burn',2), NONE);
check('White 60 vs White 40 → def KO',               R('white',60,null,1,'white',40,null,1), KO_DEF);

// ─── 2. APPLY STATUS (8 checks) ───────────────────────────────────────────────
section('=== APPLY STATUS (8 checks) ===');

const baseSlots = [
  {k:'white',v:60}, {k:'white',v:40}, {k:'gold',v:80},
  {k:'blue'}, {k:'red'}, {k:'purple',effect:'confusion',stars:2},
];

{
  const r = applyStatus(baseSlots, ['poison']);
  check('Poison: White 60→40', r.find(s=>s.k==='white'&&s.v===40)?.v ?? r.filter(s=>s.k==='white')[0]?.v, 40);
  check('Poison: Gold 80→60',  r.find(s=>s.k==='gold')?.v, 60);
}
{
  const r = applyStatus(baseSlots, ['badlypoison']);
  check('BadlyPoison: White 40→10 (vloer)', r.filter(s=>s.k==='white').some(s=>s.v===10), true);
  check('BadlyPoison: Gold 80→40',          r.find(s=>s.k==='gold')?.v, 40);
}
{
  const r = applyStatus(baseSlots, ['paralysis']);
  const whites = r.filter(s=>s.k==='white');
  check('Paralysis: kleinste White(40)→Red', whites.every(s=>s.v!==40), true);
  check('Paralysis: grote White(60) intact', whites.some(s=>s.v===60),  true);
}
{
  const r = applyStatus(baseSlots, ['burn']);
  const whites = r.filter(s=>s.k==='white');
  check('Burn: kleinste White(40)→Red',   whites.every(s=>s.v!==40), true);
  check('Burn: grote White(60)→50 (-10)', whites.some(s=>s.v===50),  true);
}

// ─── 3. BOARD TOPOLOGIE (12 checks) ───────────────────────────────────────────
section('=== BOARD TOPOLOGIE (13 checks) ===');

const nodeKeys = Object.keys(NODES);
check('28 nodes (Duel: 26 punten + 2 doelen)', nodeKeys.length, 28);
check('26 gewone punten, exact zoals Duel', nodeKeys.filter(k => NODES[k].type !== 'goal').length, 26);
check('34 edges (ring 20 + binnenring 8 + 4 hoek- + 2 doeldiagonalen)', ROUTES.length, 34);

// ADJ: Set → count undirected edges
let edgeSum = 0;
for (const k of nodeKeys) edgeSum += ADJ[k].size;
check('ADJ-som = 68 (34×2)', edgeSum, 68);

// BFS volledig verbonden
{
  const seen = new Set(['G1']);
  const q = ['G1'];
  while (q.length) { const n=q.shift(); for (const nb of ADJ[n]) { if(!seen.has(nb)){seen.add(nb);q.push(nb);} } }
  check('Volledig verbonden (BFS)', seen.size, 28);
}

// Geïsoleerde nodes
{
  const iso = nodeKeys.filter(k => ADJ[k].size === 0);
  check('Geen geïsoleerde nodes', iso.length, 0);
}

// ADJ symmetrisch
{
  let asym = 0;
  for (const k of nodeKeys) for (const nb of ADJ[k]) { if (!ADJ[nb].has(k)) asym++; }
  check('ADJ volledig symmetrisch', asym, 0);
}

// Goals
check('G1 aanwezig en type=goal',  NODES['G1']?.type, 'goal');
check('G2 aanwezig en type=goal',  NODES['G2']?.type, 'goal');

// Entry-nodes
{
  const entries = nodeKeys.filter(k => NODES[k].type === 'entry');
  check('4 entry-nodes', entries.length, 4);
}

// Binnenvierkant: 3x3 heeft 8 randpunten (Duel-conform, was 12 bij ons 5x3)
{
  const inner = nodeKeys.filter(k => k.startsWith('IT')||k.startsWith('IB')||k==='IL'||k==='IR');
  check('8 binnenpunten (3x3-vierkant, midden leeg)', inner.length, 8);
}

// Goal-connecties (sessie 17): G2 alleen nog via T2 en T3 — de rush-fix
{
  const g2adj = [...ADJ['G2']].sort();
  check('G2 heeft precies 2 buren (T2, T3)', g2adj, ['T2','T3']);
  // Kortste route entry → vijandelijk doel is nu 7 aan BEIDE kanten
  const bfsD = (s, g) => { const q=[[s,0]], seen=new Set([s]);
    while(q.length){const [n,d]=q.shift(); if(n===g) return d;
      for(const nx of ADJ[n]) if(!seen.has(nx)){seen.add(nx);q.push([nx,d+1]);}} return -1; };
  check('E1_BL → G2 = 6 stappen (Duel-afstand)', bfsD('E1_BL','G2'), 6);
  check('E1_BR → G2 = 6 stappen (symmetrisch)',   bfsD('E1_BR','G2'), 6);
  check('E2_TR → G1 = 6 stappen (180°-spiegel)',  bfsD('E2_TR','G1'), 6);
}

// ─── 3b. DISK-LAYOUTS (permutatie-garantie: kansen exact gelijk) ──────────────
section('=== DISK-LAYOUTS (20 checks) ===');
{
  const keys = Object.keys(UNIT_DEFS);
  check('Alle 18 units hebben een layout', keys.every(k => DISK_LAYOUT[k]), true);
  let allPerm = true, all16 = true;
  for (const k of keys) {
    const base = UNIT_DEFS[k].slots;                       // ongearrangeerde blokken
    const arr = arrangeSlots(base, DISK_LAYOUT[k]);
    if (!arr || arr.length !== 16) { all16 = false; console.log('    ✗ layout kapot:', k); continue; }
    const norm = a => JSON.stringify([...a].map(s => JSON.stringify(s)).sort());
    if (norm(arr) !== norm(base)) { allPerm = false; console.log('    ✗ geen permutatie:', k); }
  }
  check('Elke layout levert exact 16 slots', all16, true);
  check('Elke layout is een zuivere permutatie (kansen identiek)', allPerm, true);
  // Duel-regel: elke move één aaneengesloten vak — nooit twee identieke
  // wedges naast elkaar (ook niet over de wrap-grens van de cirkel heen)
  let noDup = true;
  for (const k of keys) {
    const arr = arrangeSlots(UNIT_DEFS[k].slots, DISK_LAYOUT[k]);
    if (!arr) continue;
    // merge runs zoals renderDisk dat doet, mét wrap-check
    const runs = [];
    for (let i = 0; i < arr.length; i++) {
      const prev = runs[runs.length - 1];
      const same = s => s && s.k === arr[i].k && s.v === arr[i].v && s.effect === arr[i].effect && s.stars === arr[i].stars;
      if (prev && same(prev.slot)) prev.n++; else runs.push({ slot: arr[i], n: 1 });
    }
    for (let i = 0; i < runs.length; i++) {
      const a = runs[i].slot, b = runs[(i + 1) % runs.length].slot;
      if (runs.length > 1 && a.k === b.k && a.v === b.v && a.effect === b.effect && a.stars === b.stars) {
        noDup = false; console.log('    ✗ dubbele wedge naast elkaar:', k);
      }
    }
  }
  check('Nooit twee identieke wedges naast elkaar (elke move = één vak)', noDup, true);
  // Steekproef: skeleton heeft precies 2 gescheiden Miss-zones
  const arr = arrangeSlots(UNIT_DEFS.skeleton.slots, DISK_LAYOUT.skeleton);
  let missRuns = 0; for (let i = 0; i < arr.length; i++) if (arr[i].k === 'red' && (i === 0 || arr[i-1].k !== 'red')) missRuns++;
  check('Skeleton: Miss in precies 2 zones', missRuns, 2);
}

// ─── 4. HEALING CENTER (Duel-regel: KO → HC max 2, derde KO duwt oudste terug) ──
section('=== HEALING CENTER (8 checks) ===');

{
  const S = { hc:{p1:[],p2:[]}, bench:{p1:[],p2:[]}, units:{} };
  const mkU = (uid) => S.units[uid] = { uid, owner:'p1', node:'B1', status:['poison'], level:3 };
  const u1 = mkU('u1'), u2 = mkU('u2'), u3 = mkU('u3');
  __setState(S);

  koUnit(u1);
  check('KO 1: unit in HC',                S.hc.p1, ['u1']);
  check('KO 1: van het bord (node null)',  u1.node, null);
  check('KO 1: statussen genezen in HC',   u1.status, []);
  check('KO 1: level blijft behouden',     u1.level, 3);

  koUnit(u2);
  check('KO 2: beide in HC (max 2)',       S.hc.p1, ['u1','u2']);
  check('KO 2: bench nog leeg',            S.bench.p1, []);

  koUnit(u3);
  check('KO 3: oudste (u1) terug naar bench met wait', S.bench.p1.includes('u1') && u1.status.includes('wait'), true);
  check('KO 3: HC bevat nu u2+u3',         S.hc.p1, ['u2','u3']);
}

// ─── 4a2. MP-BEREIK (sessie 25) ────────────────────────────────────────────────
section('=== MP-BEREIK (3 checks) ===');
{
  const mps = Object.values(UNIT_DEFS).map(d => d.mp);
  check('Geen enkele unit onder 2 MP (was 1 = 7 beurten oversteken)', Math.min(...mps), 2);
  check('Snelste units op 3 MP, net als in Duel', Math.max(...mps), 3);
  // "Ongeveer dezelfde MP": hooguit 1 stap verschil tussen traagste en snelste
  check('Hoogstens 1 MP verschil over de hele roster', Math.max(...mps) - Math.min(...mps), 1);
}

// ─── 4b. ABILITIES ─────────────────────────────────────────────────────────────
section('=== ABILITIES (10 checks) ===');
{
  check('12 abilities gedefinieerd', Object.keys(ABILITIES).length, 12);
  check('Elke ability heeft naam + desc', Object.values(ABILITIES).every(a => a.name && a.desc), true);
  check('Alle 12 unit-toewijzingen verwijzen naar bestaande ability',
    Object.values(UNIT_ABILITY).every(a => ABILITIES[a]), true);
  check('abilityOf(warden) === mountain', abilityOf({ defKey:'warden' }), 'mountain');
  check('abilityOf(squire) === undefined (common, geen ability)', abilityOf({ defKey:'squire' }) || null, null);
  // contact-status-mapping
  check('Rottende Greep → poison', contactStatusOf('rot'), 'poison');
  check('Vuurrune → burn',         contactStatusOf('emberrune'), 'burn');
  check('Betovering → confusion',  contactStatusOf('enchant'), 'confusion');
  // canPhase
  check('Scout (stalk) kan phasen', canPhase({ defKey:'scout' }), true);
  // Bergvast: KO → bank i.p.v. HC
  {
    const S = { hc:{p1:[],p2:[]}, bench:{p1:[],p2:[]}, units:{} };
    const w = S.units.w = { uid:'w', owner:'p1', node:'B1', status:['poison'], level:2, defKey:'warden' };
    __setState(S); koUnit(w);
    check('Bergvast: KO → bank, niet HC', S.bench.p1.includes('w') && S.hc.p1.length === 0, true);
  }
}

// ─── 4b2. CONDITION-REGELS (Duel: één status tegelijk) ─────────────────────────
section('=== CONDITION-REGELS (4 checks) ===');
{
  const u = { status: ['burn', 'bulwark'] };
  applyCondition(u, 'paralysis');
  check('Nieuwe condition vervangt de oude (burn → paralysis)', u.status.includes('paralysis') && !u.status.includes('burn'), true);
  check('Bulwark blijft staan (geen special condition)', u.status.includes('bulwark'), true);
  applyCondition(u, 'paralysis');
  check('Zelfde condition opnieuw → geen duplicaat', u.status.filter(s => s === 'paralysis').length, 1);
  const w = { status: ['poison'] };
  applyCondition(w, 'wait');
  check("'wait' toevoegen laat de condition intact", w.status.includes('poison') && w.status.includes('wait'), true);
}

// ─── 4c. MOVES & ANTI-MISS-LOOP (twee-aanvallen-herontwerp, sessie 23) ─────────
section('=== MOVES & ANTI-MISS-LOOP (6 checks) ===');
{
  const keys = Object.keys(UNIT_DEFS);
  // Elke aanval (white/gold/purple) draagt z'n eigen naam in het slot
  let named = true;
  for (const k of keys) for (const s of UNIT_DEFS[k].slots) {
    if (['white','gold','purple'].includes(s.k) && !s.name) { named = false; console.log('    ✗ naamloos slot:', k, s.k); }
  }
  check('Elk aanvalsslot van alle 18 units heeft een naam', named, true);

  // Elke unit heeft ≥2 onderscheiden aanvallen (verschillende white-waarden of gold ernaast)
  let multi = true;
  for (const k of keys) {
    const whites = new Set(UNIT_DEFS[k].slots.filter(s => s.k === 'white').map(s => s.v));
    const hasGold = UNIT_DEFS[k].slots.some(s => s.k === 'gold');
    if (whites.size + (hasGold ? 1 : 0) < 2) { multi = false; console.log('    ✗ maar één aanval:', k); }
  }
  check('Elke unit heeft ≥2 onderscheiden aanvallen', multi, true);

  // DE regressietest voor Koens miss-loop: na burn (kleinste white → Miss)
  // moet elke unit nog minstens één werkende aanval overhouden
  let survivable = true;
  for (const k of keys) {
    const after = applyStatus(UNIT_DEFS[k].slots, ['burn']);
    if (!after.some(s => s.k === 'white' || s.k === 'gold')) { survivable = false; console.log('    ✗ wiel dood na burn:', k); }
  }
  check('Na burn houdt elke unit ≥1 aanval over (anti-miss-loop)', survivable, true);
  {
    const after = applyStatus(UNIT_DEFS.imp.slots, ['burn']);
    const whites = after.filter(s => s.k === 'white');
    check('Imp na burn: hoofdaanval blijft (30-10=20)', whites.length === 3 && whites.every(s => s.v === 20), true);
  }
  check('moveLabel: white → naam + schade', moveLabel({ k:'white', v:40, name:'Schildstoot' }), 'Schildstoot 40');
  check('moveLabel: purple → naam + sterren', moveLabel({ k:'purple', effect:'burn', stars:2, name:'Asadem' }), 'Asadem ★★');
}

// ─── 4d. INSTELLINGEN (sessie 24) ──────────────────────────────────────────────
section('=== INSTELLINGEN (8 checks) ===');
{
  const d = freshSettings();
  check('Verse instellingen bevatten elke sleutel', Object.keys(d).length, Object.keys(SETTING_DEFS).length);
  check('Standaard bedenktijd = 5 min (Duel-regel)', d.clockMinutes, 5);
  check('Standaard moeilijkheid = normaal', d.difficulty, 'normaal');
  // Een leeg/oud profiel krijgt gewoon de defaults (migratie)
  check('normalizeSettings(undefined) → defaults', normalizeSettings(undefined), d);
  // Rommel mag het spel nooit breken
  check('Onzin-waarden vallen terug op default',
    normalizeSettings({ clockMinutes: 999, difficulty: 'hacker', animSpeed: 42, sfx: 'ja' }),
    d);
  // Geldige waarden blijven staan
  check('Geldige waarden blijven behouden',
    normalizeSettings({ clockMinutes: 0, difficulty: 'moeilijk', sfx: false }).clockMinutes, 0);
  check('Volume wordt geklemd tot 0..1', normalizeSettings({ sfxVolume: 5 }).sfxVolume, 1);
  check('Negatief volume wordt 0', normalizeSettings({ sfxVolume: -3 }).sfxVolume, 0);
}

// ─── 4e. OPGESLAGEN TEAMS (sessie 24) ──────────────────────────────────────────
section('=== OPGESLAGEN TEAMS (5 checks) ===');
{
  const owned = { squire:1, scout:1, apprentice:1, skeleton:1, boar:1, imp:1 };
  const good = { units:['squire','scout','apprentice','skeleton','boar','imp'], plates:['fullheal','xattack','respin'] };
  check('Geldig team blijft behouden', normalizeDecks([good], owned)[0].units.length, 6);
  check('Altijd precies 3 slots', normalizeDecks([good], owned).length, DECK_SLOTS);
  // Unit verkocht/niet in bezit → slot wordt ongeldig en dus leeg
  const partial = { units:['squire','scout','apprentice','skeleton','boar','pitlord'], plates:['fullheal','xattack','respin'] };
  check('Team met niet-bezeten unit wordt leeggemaakt', normalizeDecks([partial], owned)[0], null);
  // Onbekende kaart wordt eruit gefilterd; de rest van het team blijft geldig
  const badPlate = { units: good.units, plates:['fullheal','xattack','bestaatniet'] };
  check('Onbekende kaart wordt uit het team gefilterd', normalizeDecks([badPlate], owned)[0].plates, ['fullheal','xattack']);
  // Boven budget → slot ongeldig
  const tooPricey = { units: good.units, plates:['cape','cape','cape','focus','revive'] };
  check('Team boven het kaartbudget wordt leeggemaakt', normalizeDecks([tooPricey], owned)[0], null);
  check('Rommel-invoer geeft lege slots', normalizeDecks('kapot', owned), [null, null, null]);
}

// ─── 4e2. KAARTEN / PLATES (sessie 29, naar de echte Duel-plates) ──────────────
section('=== KAARTEN (7 checks) ===');
{
  const keys = Object.keys(PLATES);
  check('Elke kaart heeft een kostprijs van 1 t/m 3',
    keys.every(k => [1,2,3].includes(PLATES[k].cost)), true);
  check('Elke kaart verwijst naar z\'n Duel-origineel',
    keys.every(k => typeof PLATES[k].duel === 'string' && PLATES[k].duel.length > 2), true);
  check('Kaartbudget is 8, net als in Duel', PLATE_BUDGET, 8);
  check('plateCost telt op', plateCost(['fullheal','focus','cape']), 1 + 2 + 3);
  check('Lege hand kost 0', plateCost([]), 0);
  // Duel-plates richten zich NOOIT op een vijandelijke figuur
  check('Geen enkele kaart mikt op een vijand (Duel-conventie)',
    keys.every(k => PLATES[k].target !== 'enemy'), true);
  // Alle vijf de Duel-categorieen zijn vertegenwoordigd
  const cats = new Set(keys.map(k => PLATES[k].cat));
  check('Alle categorieen aanwezig', ['herstel','draai','gevecht','beweging','bijzonder'].every(c => cats.has(c)), true);
}

// ─── 4f. BOOSTERKIST (sessie 24) ───────────────────────────────────────────────
section('=== BOOSTERKIST (7 checks) ===');
{
  const RAR = { squire:'C', scout:'C', apprentice:'C', skeleton:'C', boar:'C', imp:'C',
    cleric:'U', archer:'U', runesmith:'U', ghoul:'U', lupine:'U', hellhound:'U',
    commander:'R', weaver:'R', warden:'R', necromancer:'R', wyrmling:'R', pitlord:'R' };
  check('Kansen tellen op tot 100%', BOOSTER_ODDS.reduce((a, [, p]) => a + p, 0).toFixed(2), '1.00');
  const none = {};
  check('Lage worp geeft een Common', rollBooster(0.1, 0.5, none, RAR).rarity, 'C');
  check('Hoge worp geeft een Rare', rollBooster(0.99, 0.5, none, RAR).rarity, 'R');
  check('Nieuwe unit is geen duplicaat', rollBooster(0.1, 0.5, none, RAR).duplicate, false);
  // Alle commons in bezit → de kist geeft liever iets nieuws dan een duplicaat
  const allC = { squire:1, scout:1, apprentice:1, skeleton:1, boar:1, imp:1 };
  const r = rollBooster(0.1, 0.5, allC, RAR);
  check('Commons compleet → kist geeft toch iets nieuws', r.duplicate, false);
  // Alles in bezit → duplicaat mét terugbetaling (nooit geld weggooien)
  const all = {}; for (const k of Object.keys(RAR)) all[k] = 1;
  const dup = rollBooster(0.1, 0.5, all, RAR);
  check('Alles in bezit → duplicaat', dup.duplicate, true);
  check('Duplicaat betaalt credits terug', dup.refund > 0, true);
}

// ─── 4g. AANVALSANIMATIES (sessie 37) ─────────────────────────────────────────
// Koen wil dat ELKE aanval een belevenis is. Deze checks bewaken dat er geen
// aanval bestaat zonder animatie, en dat elke animatie ook echt getekend kan
// worden: een soort zonder projectiel-CSS of kleur zou onzichtbaar blijven.
section('=== AANVALSANIMATIES (17 checks) ===');
{
  const soorten = new Set(FX_TREFWOORDEN.map(([, s]) => s));
  for (const s of Object.keys(FX_PROJECTIEL)) soorten.add(s);

  // Elke benoemde aanval van elke unit krijgt een soort
  const zonderFx = [];
  for (const k of Object.keys(UNIT_DEFS)) {
    for (const s of UNIT_DEFS[k].slots) {
      if (s.k === 'red' || s.k === 'blue' || !s.name) continue;
      if (!attackFx(s)) zonderFx.push(UNIT_DEFS[k].name + ' / ' + s.name);
    }
  }
  check('Elke benoemde aanval heeft een animatie', zonderFx, []);

  // Trefwoorden komen op volgorde: 'Schildbeuk' is een schild, geen hamer
  check('Schildbeuk → schild (niet hamer)', attackFx({ k:'blue', name:'Schildbeuk' }) || attackFx({ k:'white', v:20, name:'Schildbeuk' }), 'schild');
  check('Grafzwaard → snede (niet kou)', attackFx({ k:'white', v:40, name:'Grafzwaard' }), 'snede');
  // 'slag' is zó gewoon dat het alles opslokt als het te vroeg staat
  check('Caduceusslag → magie (niet snede via "slag")', attackFx({ k:'white', v:30, name:'Caduceusslag' }), 'magie');
  check('Veerslag → magie (niet snede via "slag")', attackFx({ k:'white', v:20, name:'Veerslag' }), 'magie');
  // 'tand' zit óók in 'drietand'; een drietand is een steekwapen
  check('Drietandprik → snede (niet klauw via "tand")', attackFx({ k:'white', v:30, name:'Drietandprik' }), 'snede');
  check('Speerwering → schild (niet snede via "speer")', attackFx({ k:'blue', name:'Speerwering' }) || attackFx({ k:'white', v:40, name:'Speerwering' }), 'schild');
  check('Kalmerend Woord → magie (had geen trefwoord)', attackFx({ k:'purple', effect:'sleep', name:'Kalmerend Woord' }), 'magie');
  check('Hoefslag → hamer (stomp, geen zwaard)', attackFx({ k:'white', v:30, name:'Hoefslag' }), 'hamer');
  check('Mis (rood) heeft geen aanvalsanimatie', attackFx({ k:'red' }), null);
  check('Blok (blauw) heeft geen aanvalsanimatie', attackFx({ k:'blue' }), null);

  // Statusvakken zonder naam vallen terug op het effect
  check('Naamloos paars vak volgt het effect', attackFx({ k:'purple', effect:'burn', stars:2 }), 'vuur');
  check('Naamloos goud vak krijgt toch iets', attackFx({ k:'gold', v:90 }), 'bliksem');

  // Iedere soort moet een kleur én een projectiel-vorm hebben die in de CSS staat
  const zonderKleur = [...soorten].filter(s => !FX_KLEUR[s]);
  check('Elke soort heeft een kleur', zonderKleur, []);
  const zonderVorm = [...soorten].filter(s => !new RegExp('\\.' + projectielVoor(s) + '\\b').test(html));
  check('Elk projectiel is ook echt getekend in de CSS', zonderVorm, []);
  // Elke soort moet z'n eigen vorm hebben, anders zien twee aanvallen er hetzelfde uit
  const vormen = [...soorten].map(projectielVoor);
  check('Geen twee soorten delen hetzelfde projectiel', vormen.length, new Set(vormen).size);
  // ...en z'n eigen klank, anders klinkt vuur als bliksem
  const sfxBlok = html.slice(html.indexOf('const SFX = {'), html.indexOf('function sfx('));
  const zonderKlank = [...soorten].filter(s => !new RegExp('\\bfx' + s + '\\s*:').test(sfxBlok));
  check('Elke soort heeft een eigen geluid', zonderKlank, []);
}

// ─── 4g2. PRESTATIE-VALKUILEN (sessie 38) ─────────────────────────────────────
// Twee dingen die gemeten de beeldsnelheid halveerden. Ze zijn makkelijk terug
// te zetten zonder het te merken, dus ze staan hier vast.
section('=== PRESTATIE (3 checks) ===');
{
  const css = html.slice(html.indexOf('<style'), html.indexOf('</style>'));
  // 1. backdrop-filter over een schermvullende overlay: 36 i.p.v. 60 fps
  const regels = css.split('\n').filter(l => /backdrop-filter\s*:/.test(l) && !/^\s*(\/\*|\*)/.test(l));
  check('Geen backdrop-filter (kostte de helft van de fps)', regels.map(r => r.trim()), []);
  // 2. De arena-achtergrond hoort in CSS te staan, niet in de SVG: die wordt
  //    bij elke zet herbouwd en zou het filter elke keer opnieuw berekenen.
  const arenas = ['vuur', 'kristal', 'woud'].filter(a => new RegExp(`\\.board-wrap\\[data-arena="${a}"\\]`).test(css));
  check('Alle drie de arena-achtergronden staan in CSS op .board-wrap', arenas, ['vuur', 'kristal', 'woud']);
  // 3. Sintels zijn losse CSS-elementen, niet per render getekende SVG-nodes
  check('Sintels zijn een statische CSS-laag', /#arena-fx i \{/.test(css), true);
}

// ─── 4g3. ART EN OFFLINE-CACHE LOPEN GELIJK (sessie 38) ───────────────────────
// Een hernoemd plaatje dat niet in sw.js staat werkt online prima en is offline
// stuk. Dat merk je pas op een telefoon zonder bereik, dus hier vastgezet.
section('=== ART & CACHE (3 checks) ===');
{
  const sw = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
  const opSchijf = fs.readdirSync(path.join(__dirname, '../art')).filter(f => f.endsWith('.png')).sort();
  const inSw = (sw.match(/art\/[a-z0-9_-]+\.png/gi) || []).map(s => s.slice(4)).sort();
  const artMatch = html.match(/const UNIT_ART = \{[\s\S]*?\};/);
  const inCode = artMatch ? (artMatch[0].match(/art\/[a-z0-9_-]+\.png/gi) || []).map(s => s.slice(4)).sort() : [];
  check('Elk plaatje in art/ staat ook in de offline-cache', inSw, opSchijf);
  check('De code verwijst naar precies die plaatjes', inCode, opSchijf);
  check('Alle 18 units hebben een plaatje', inCode.length, Object.keys(UNIT_DEFS).length);
}

// ─── 4h. UITLEG KLOPT MET DE CODE (sessie 24) ──────────────────────────────────
// Het "Hoe speel je"-scherm beschrijft de regels. Deze checks verankeren de
// belangrijkste getallen aan de echte code, zodat de uitleg niet stilletjes
// kan gaan liegen als we later iets balanceren.
section('=== UITLEG vs CODE (9 checks) ===');
{
  const help = html.slice(html.indexOf('const HELP_SECTIONS'), html.indexOf('function renderHelp'));
  if (!help) throw new Error('HELP_SECTIONS niet gevonden');

  check('Uitleg noemt dezelfde standaard-bedenktijd als de code',
    /standaard 5 minuten/.test(help) && SETTING_DEFS.clockMinutes.def === 5, true);
  check('Uitleg noemt hetzelfde max level als de code',
    /tot level 4/.test(help) && /u\.level >= 4/.test(html), true);
  check('Uitleg noemt dezelfde Healing-Center-capaciteit',
    /maximaal\s*<b>?twee|maximaal twee tegelijk/.test(help) && /state\.hc\[u\.owner\]\.length > 2/.test(html), true);
  check('Uitleg noemt de één-status-regel die applyCondition afdwingt',
    /één status tegelijk/.test(help) && /u\.status = u\.status\.filter\(s => !SPECIAL\.includes\(s\)\)/.test(html), true);
  check('Uitleg zegt dat bevroren na een gevecht weggaat, net als de code',
    /na één gevecht vanzelf weg/.test(help) && /Frozen wordt na een gevecht gewist/.test(html), true);
  check('Uitleg zegt dat een plate geen actie kost, net als de code',
    /kost géén actie/.test(help) && /state\.plateUsed = true/.test(html), true);
  check('Uitleg noemt de eerste-zet-regel die effMP afdwingt',
    /1 MP extra/.test(help) && /allereerste zet van het potje MP-1/.test(html), true);
  // De uitleg belooft dat het GELDENDE vak oplicht, ook als Verwarring of
  // Scherpschutter de wijzer verschuift. Dat moet de code ook echt doen.
  check('Uitleg over het oplichtende vak klopt met markeerSlot',
    /licht het vak op dat telt/.test(help) &&
    /markeerSlot\(attDiskId, finalAIdx\); markeerSlot\(defDiskId, finalDIdx\);/.test(html), true);
  // De vijf kleurstalen in de uitleg moeten exact de disk-kleuren zijn
  const swatch = [...help.matchAll(/\['(#[0-9a-fA-F]{6})',/g)].map(m => m[1].toLowerCase());
  const diskColors = ['#e5e7eb', '#fbbf24', '#3b82f6', '#8b5cf6', '#ef4444'];
  check('De vijf kleurstalen zijn exact de schijfkleuren', swatch, diskColors);
}

// ─── 5. SYNTAX-CHECK volledige game-JS ─────────────────────────────────────────
section('=== SYNTAX (1 check) ===');
{
  const scriptStart2 = html.indexOf('<script>') + 8;
  const scriptEnd2 = html.lastIndexOf('<\/script>');
  const js = html.slice(scriptStart2, scriptEnd2);
  const chk = path.join(__dirname, '_syntax.cjs');
  fs.writeFileSync(chk, js);
  const { spawnSync } = require('child_process');
  const r = spawnSync(process.execPath, ['--check', chk], { encoding: 'utf8' });
  fs.unlinkSync(chk);
  check('Game-JS parseert zonder syntaxfouten', r.status === 0 ? 'OK' : r.stderr.slice(0, 300), 'OK');
}

// ─── Samenvatting ──────────────────────────────────────────────────────────────
const total = pass + fail;
console.log(`\n${'─'.repeat(40)}`);
console.log(`${total} checks  —  ${pass} ✓  ${fail} ✗`);
if (fail === 0) console.log('Alle checks geslaagd ✓');
process.exit(fail > 0 ? 1 : 0);
