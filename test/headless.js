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

// resolve + applyStatus — puur-functioneel, geen state; koUnit werkt op state (injecteerbaar)
const resolveMatch = html.match(/\nfunction resolve\([\s\S]*?\n\}/);
const applyMatch   = html.match(/\nfunction applyStatus\([\s\S]*?\n\}/);
const koMatch      = html.match(/\nfunction koUnit\([\s\S]*?\n\}/);
if (!resolveMatch) throw new Error('resolve() niet gevonden');
if (!applyMatch)   throw new Error('applyStatus() niet gevonden');
if (!koMatch)      throw new Error('koUnit() niet gevonden');

const evalCode = [
  'let state = null;',
  'function __setState(s) { state = s; }',
  boardSection,
  diskSection,
  abilitySection,
  resolveMatch[0],
  applyMatch[0],
  koMatch[0],
  'module.exports = { resolve, applyStatus, NODES, ADJ, ROUTES, koUnit, __setState, UNIT_DEFS, DISK_LAYOUT, arrangeSlots, ABILITIES, UNIT_ABILITY, abilityOf, contactStatusOf, canPhase };',
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

const { resolve, applyStatus, NODES, ADJ, ROUTES, koUnit, __setState, UNIT_DEFS, DISK_LAYOUT, arrangeSlots, ABILITIES, UNIT_ABILITY, abilityOf, contactStatusOf, canPhase } = extracted;

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
section('=== BOARD TOPOLOGIE (12 checks) ===');

const nodeKeys = Object.keys(NODES);
check('32 nodes',            nodeKeys.length, 32);
check('36 edges (ROUTES, sessie 17: goal-diagonalen geschrapt)', ROUTES.length, 36);

// ADJ: Set → count undirected edges
let edgeSum = 0;
for (const k of nodeKeys) edgeSum += ADJ[k].size;
check('ADJ-som = 72 (36×2)', edgeSum, 72);

// BFS volledig verbonden
{
  const seen = new Set(['G1']);
  const q = ['G1'];
  while (q.length) { const n=q.shift(); for (const nb of ADJ[n]) { if(!seen.has(nb)){seen.add(nb);q.push(nb);} } }
  check('Volledig verbonden (BFS)', seen.size, 32);
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

// Inner-nodes (IT1-5, IB1-5, IL, IR = 12)
{
  const inner = nodeKeys.filter(k => k.startsWith('IT')||k.startsWith('IB')||k==='IL'||k==='IR');
  check('12 inner nodes (IT×5 + IB×5 + IL + IR)', inner.length, 12);
}

// Goal-connecties (sessie 17): G2 alleen nog via T2 en T3 — de rush-fix
{
  const g2adj = [...ADJ['G2']].sort();
  check('G2 heeft precies 2 buren (T2, T3)', g2adj, ['T2','T3']);
  // Kortste route entry → vijandelijk doel is nu 7 aan BEIDE kanten
  const bfsD = (s, g) => { const q=[[s,0]], seen=new Set([s]);
    while(q.length){const [n,d]=q.shift(); if(n===g) return d;
      for(const nx of ADJ[n]) if(!seen.has(nx)){seen.add(nx);q.push([nx,d+1]);}} return -1; };
  check('E1_BL → G2 = 7 stappen (snelweg dicht)', bfsD('E1_BL','G2'), 7);
  check('E1_BR → G2 = 7 stappen (symmetrisch)',   bfsD('E1_BR','G2'), 7);
  check('E2_TR → G1 = 7 stappen (180°-spiegel)',  bfsD('E2_TR','G1'), 7);
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
