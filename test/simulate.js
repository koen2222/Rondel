#!/usr/bin/env node
// Speel-simulatie: draait N volledige potjes waarin "speler 1" willekeurige
// LEGALE zetten doet tegen de echte AI. Bedoeld om na een regelwijziging te
// zien of potjes nog normaal aflopen (en niet vastlopen of crashen).
// Vereist: python3 -m http.server 8123 in de repo-root.
// Draai: node test/simulate.js [aantal] [moeilijkheid] [random|rush]
process.env.PLAYWRIGHT_BROWSERS_PATH = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const GAMES = Number(process.argv[2] || 8);
const DIFFICULTY = process.argv[3] || 'normaal';
// 'random' = willekeurige legale zetten (test of de regels blijven werken)
// 'rush'   = altijd zo hard mogelijk richting het vijandelijke doel. Dit test
//            de keeper-logica van de AI én of de oude rush-exploit dood blijft.
const STRATEGY = process.argv[4] || 'random';
const MAX_TURNS = 220;

(async () => {
  const browser = await chromium.launch();
  const results = [];
  let crashes = [];

  for (let g = 0; g < GAMES; g++) {
    const page = await browser.newPage({ viewport: { width: 400, height: 900 } });
    page.on('pageerror', e => crashes.push(`game ${g}: ${e.message}`));
    page.on('dialog', d => d.accept());

    // Animaties uit en klok uit: we willen de REGELS testen, niet de timing.
    await page.addInitScript((diff) => localStorage.setItem('rondel_profile', JSON.stringify({
      credits: 9999,
      owned: { squire:1, scout:1, apprentice:1, skeleton:1, boar:1, imp:1, cleric:1, archer:1, runesmith:1, ghoul:1, lupine:1, hellhound:1 },
      stats: { wins:0, losses:0 },
      settings: { sfx:false, sfxVolume:0, music:false, haptics:false, animSpeed:'uit', clockMinutes:0, difficulty:diff, confirmExit:false, showHints:false },
    })), DIFFICULTY);

    await page.goto('http://localhost:8123/', { waitUntil: 'networkidle' });
    await page.click('#tile-solo');
    await page.waitForSelector('#deck-overlay.active');
    await page.click('#btn-deck-random');
    await page.click('#btn-deck-start');
    await page.waitForSelector('#screen-game.active');

    let turns = 0, outcome = null, reason = '';
    while (turns < MAX_TURNS) {
      // Gevecht open? Doorklikken.
      if (await page.locator('#btn-combat-continue:visible').count()) {
        await page.click('#btn-combat-continue').catch(() => {});
        await page.waitForTimeout(30);
        continue;
      }
      // Evolutiescherm open? Altijd evolueren — dat is voor een simulatie de
      // interessante tak, en zonder wegklikken blijft het potje eeuwig hangen.
      if (await page.locator('#evo-overlay.active').count()) {
        await page.click('#btn-evo-ja').catch(() => {});
        await page.waitForTimeout(30);
        continue;
      }
      if (await page.locator('#result-overlay.active').count()) {
        outcome = (await page.locator('#result-title').innerText()).trim();
        reason = (await page.locator('#result-reason').innerText()).trim();
        break;
      }
      // Alleen handelen als het onze beurt is en er niets loopt.
      const st = await page.evaluate(() => ({
        turn: state.turn, over: state.over, locked: state.locked, acts: state.actionsLeft,
      }));
      if (st.over) { await page.waitForTimeout(40); continue; }
      if (st.locked || st.turn !== 'p1') { await page.waitForTimeout(40); continue; }

      // Kies een zet via de spelcode zelf.
      const did = await page.evaluate((strategy) => {
        const opts = [];
        for (const uid of state.bench.p1) {
          const u = state.units[uid];
          if (u.status.includes('wait')) continue;
          for (const t of deployTargets(u)) opts.push({ kind: 'deploy', uid, t });
        }
        for (const u of Object.values(state.units)) {
          if (u.owner !== 'p1' || !u.node || u.status.includes('sleep')) continue;
          for (const t of legalMoves(u)) opts.push({ kind: 'move', uid: u.uid, t });
        }
        if (!opts.length) return 'geen';

        let pick;
        if (strategy === 'rush') {
          // Zo dicht mogelijk bij G2 komen; het doel zelf is uiteraard het beste.
          const dist = n => distTo(n, 'G2');
          let best = -Infinity;
          for (const o of opts) {
            const occ = unitAt(o.t);
            let sc;
            if (NODES[o.t].type === 'goal' && NODES[o.t].owner === 'p2') sc = 1000;
            else if (occ && occ.owner === 'p2') sc = 20 - dist(o.t);      // aanvallen mag, maar liever eromheen
            else sc = 40 - dist(o.t) * 4 - (o.kind === 'deploy' ? 6 : 0);
            if (sc > best) { best = sc; pick = o; }
          }
        } else {
          pick = opts[Math.floor(Math.random() * opts.length)];
        }
        const u = state.units[pick.uid];
        if (pick.kind === 'deploy') {
          state.locked = true;
          doDeploy(u, pick.t).then(() => { state.actionsLeft--; state.locked = false; afterAction(); });
          return 'deploy';
        }
        const occ = unitAt(pick.t);
        if (occ && occ.owner !== 'p1') {
          state.locked = true;
          const path = bfs(u.node, pick.t, canPhase(u));
          const stand = path && path.length > 1 ? path[path.length - 2] : u.node;
          if (stand !== u.node) moveUnit(u, stand).then(() => { state.actionsLeft--; runCombat(u, occ); });
          else { state.actionsLeft--; runCombat(u, occ); }
          return 'aanval';
        }
        state.locked = true;
        moveUnit(u, pick.t).then(() => {
          const goal = NODES[pick.t];
          if (goal.type === 'goal' && goal.owner !== 'p1') { endMatch('p1', 'goal'); return; }
          state.actionsLeft--; state.locked = false; afterAction();
        });
        return 'zet';
      }, STRATEGY);

      if (did === 'geen') {
        await page.click('#btn-end-turn').catch(() => {});
        turns++;
        await page.waitForTimeout(60);
        continue;
      }
      await page.waitForTimeout(70);
      // Beurt afsluiten als de actie op is
      const done = await page.evaluate(() => !state.locked && state.actionsLeft <= 0 && !state.over);
      if (done) { await page.click('#btn-end-turn').catch(() => {}); turns++; }
      await page.waitForTimeout(60);
    }

    results.push({ outcome: outcome || 'GEEN EINDE', reason, turns });
    await page.close();
  }

  await browser.close();

  // Rapport
  const tally = {};
  for (const r of results) {
    const k = `${r.outcome} — ${r.reason || '?'}`;
    tally[k] = (tally[k] || 0) + 1;
  }
  console.log(`\n${GAMES} potjes — moeilijkheid "${DIFFICULTY}", speler speelt "${STRATEGY}":`);
  for (const [k, n] of Object.entries(tally).sort((a, b) => b[1] - a[1])) console.log(`  ${n}×  ${k}`);
  const wins = results.filter(r => /OVERWINNING|SPELER 1/.test(r.outcome)).length;
  console.log(`  speler won: ${wins}/${GAMES}`);
  const finished = results.filter(r => r.outcome !== 'GEEN EINDE');
  const avg = finished.length ? Math.round(finished.reduce((a, r) => a + r.turns, 0) / finished.length) : 0;
  console.log(`  afgerond: ${finished.length}/${GAMES}, gemiddeld ${avg} beurten`);
  if (crashes.length) { console.log('\nJS-FOUTEN:'); for (const c of crashes.slice(0, 10)) console.log('  ' + c); }
  else console.log('  geen JS-fouten');
  process.exitCode = (finished.length === GAMES && !crashes.length) ? 0 : 1;
})().catch(e => { console.error('FATAAL:', e.message); process.exit(1); });
