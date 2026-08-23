#!/usr/bin/env node
// Smoke-test: boot de app headless in Chromium en klik alle schermen door.
// Vereist: python3 -m http.server draait op :8123 in de repo-root.
const path = require('path');
process.env.PLAYWRIGHT_BROWSERS_PATH = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
const { chromium } = require(require('path').join('/opt/node22/lib/node_modules/playwright'));

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 400, height: 850 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  // console-errors tellen mee, behalve netwerkfouten van externe hosts (fonts) — geen internet in de sandbox
  page.on('console', m => { if (m.type() === 'error' && !/ERR_CONNECTION|ERR_NAME|Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });

  const ok = (label, cond) => { console.log(cond ? '  ✓' : '  ✗', label); if (!cond) process.exitCode = 1; };

  await page.goto('http://localhost:8123/', { waitUntil: 'networkidle' });

  // 1. Home toont
  ok('Home-scherm actief na boot', await page.locator('#screen-home.active').count() === 1);
  ok('Credits zichtbaar op home', /\d+/.test(await page.locator('#home-credits').innerText()));

  // 2. Collectie
  await page.click('#tile-collection');
  ok('Collectie-scherm opent', await page.locator('#screen-collection.active').count() === 1);
  ok('18 unit-kaarten in collectie', await page.locator('#coll-grid .coll-card').count() === 18);

  // 3. Unit-detail met disk
  await page.locator('#coll-grid .coll-card:not(.locked)').first().click();
  await page.waitForSelector('#detail-overlay.active');
  ok('Detail-overlay opent', true);
  ok('Disk-preview gerenderd (16 slots → paths)', await page.locator('#disk-preview path, #disk-preview circle').count() > 5);
  ok('Upgrade-knop toont kosten of max', /upgrade|max/i.test(await page.locator('#btn-detail-upgrade').innerText()));
  await page.click('#btn-detail-close');

  // 4. Winkel
  await page.click('.btn-back');
  await page.click('#tile-store');
  ok('Winkel opent', await page.locator('#screen-store.active').count() === 1);
  ok('Koopbare kaarten aanwezig', await page.locator('#store-grid .price-chip').count() === 18);
  ok('Boosterkist zichtbaar in de winkel', await page.locator('#booster-card').count() === 1);
  {
    const snap = () => page.evaluate(() => ({ credits: profile.credits, units: Object.keys(profile.owned).length }));
    const before = await snap();
    await page.click('#booster-card');
    await page.waitForSelector('#booster-overlay.active');
    await page.waitForTimeout(1500);
    const after = await snap();
    // Je krijgt altijd iets: een nieuwe unit, of credits terug bij een duplicaat
    const gotUnit = after.units > before.units;
    const gotRefund = after.credits > before.credits - 150;
    ok('Kist levert een unit of credits terug', gotUnit || gotRefund);
    ok('Kist toont de naam van de unit', (await page.locator('#booster-name').innerText()).length > 2);
    await page.click('#btn-booster-close');
  }
  await page.click('.btn-back >> nth=1');

  // 5. Solo-flow: deck kiezen → game start
  await page.click('#tile-solo');
  await page.waitForSelector('#deck-overlay.active');
  ok('Deck-selectie opent', true);
  await page.click('#btn-deck-random');
  ok('Start-knop actief na random', await page.locator('#btn-deck-start:not([disabled])').count() === 1);
  ok('Drie team-slots zichtbaar', await page.locator('.slot-chip').count() === 3);
  await page.locator('.slot-chip[data-slot="0"] .slot-save').click();
  await page.waitForTimeout(200);
  {
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('rondel_profile')).decks[0]);
    const cost = await page.evaluate(() => plateCost(JSON.parse(localStorage.getItem('rondel_profile')).decks[0].plates));
    ok('Team bewaren werkt', !!saved && saved.units.length === 6 && saved.plates.length > 0);
    ok('Kaarten passen binnen het budget van 8', cost > 0 && cost <= 8);
  }
  await page.click('#btn-deck-start');
  await page.waitForSelector('#screen-game.active');
  ok('Game-scherm actief', true);
  ok('Bord gerenderd met precies 28 punten (Duel: 26 + 2 doelen)', await page.locator('#board [data-node]').count() === 28);
  ok('Bench P1: 6 figuren naast het bord', await page.locator('#board g.bench-p1 g.bench-fig').count() === 6);
  ok('Bench P2: 6 figuren naast het bord', await page.locator('#board g.bench-p2 g.bench-fig').count() === 6);
  await page.waitForTimeout(600);
  ok('Schaakklok tikt (m:ss zichtbaar)', /⏱ [0-9]:[0-5][0-9]/.test(await page.locator('#turn-clock').innerText()));

  // 5a. Een figuur inzetten en z'n info-kaart openen (lang indrukken, Duel-gebaar)
  page.on('dialog', d => d.accept());
  const deployOne = async () => {
    const fig = page.locator('#board g.bench-p1 g.bench-fig').first();
    if (!await fig.count()) return false;
    await fig.click().catch(()=>{});
    await page.waitForTimeout(150);
    const glow = page.locator('#board .node-glow.active').first();
    if (!await glow.count()) return false;
    const gb = await glow.boundingBox();
    if (!gb) return false;
    await page.mouse.click(gb.x + gb.width/2, gb.y + gb.height/2);
    await page.waitForTimeout(700);
    return true;
  };
  await deployOne();
  const unit = page.locator('#board g.unit-fig').first();
  ok('Figuur staat op het bord na inzetten', await unit.count() === 1);
  {
    const box = await unit.boundingBox();
    await page.mouse.move(box.x + box.width/2, box.y + box.height/2);
    await page.mouse.down(); await page.waitForTimeout(650); await page.mouse.up();
    await page.waitForTimeout(350);
  }
  ok('Lang indrukken opent de figuur-info', await page.locator('#info-overlay.active').count() === 1);
  ok('Info-kaart toont de schijf', await page.locator('#info-disk path').count() > 4);
  await page.click('#btn-info-close');

  // 5a2. Nog een paar beurten spelen zodat ability-hooks (deploy/combat/MP) echt draaien
  for (let t = 0; t < 5; t++) {
    if (await page.locator('#btn-end-turn').count()) await page.click('#btn-end-turn').catch(()=>{});
    await page.waitForTimeout(500); // AI-beurt
    await deployOne();
  }
  ok('Enkele beurten gespeeld zonder crash', errors.length === 0);

  // 5a3. Instellingen: geluid uitzetten en controleren dat het bewaard blijft
  if (await page.locator('#screen-game.active').count()) await page.click('#btn-menu');
  await page.waitForSelector('#screen-home.active');
  await page.click('#tile-settings');
  await page.waitForSelector('#screen-settings.active');
  ok('Instellingen-scherm opent', await page.locator('.set-group').count() >= 3);
  {
    // Duim-norm: elk bedienelement minstens 44px hoog (schakelaars tellen hun
    // opgerekte tikgebied mee, dat 9px boven en onder de pil uitsteekt)
    const small = await page.evaluate(() => {
      const bad = [];
      for (const el of document.querySelectorAll('.toggle, .seg button, .set-slider input')) {
        const r = el.getBoundingClientRect();
        const h = el.classList.contains('toggle') ? r.height + 18 : r.height;
        if (h < 44) bad.push((el.className || el.tagName) + ':' + Math.round(h));
      }
      return bad;
    });
    ok('Alle bedienelementen zijn duim-groot (>=44px)', small.length === 0);
    if (small.length) console.log('    te klein:', small.join(', '));
  }
  await page.locator('.toggle[data-setting="sfx"]').click();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('rondel_profile')).settings.sfx);
  ok('Instelling wordt direct opgeslagen', stored === false);
  await page.locator('.seg[data-setting="clockMinutes"] button', { hasText: 'Uit' }).click();
  const clk = await page.evaluate(() => JSON.parse(localStorage.getItem('rondel_profile')).settings.clockMinutes);
  ok('Bedenktijd kan uitgezet worden', clk === 0);
  await page.locator('.toggle[data-setting="sfx"]').click();   // weer aan voor de rest
  await page.click('#screen-settings .btn-back');

  // 5a4. Hoe speel je
  await page.click('#tile-help');
  await page.waitForSelector('#screen-help.active');
  ok('Uitlegscherm toont alle secties', await page.locator('.help-sec').count() >= 10);
  ok('Uitleg noemt de vijf schijfkleuren', await page.locator('.help-swatch').count() === 5);
  await page.click('#screen-help .btn-back');

  // 5b. Ability zichtbaar in collectie-detail
  await page.click('#tile-collection');
  await page.locator('#coll-grid .coll-card', { hasText: 'Hermes' }).click();
  await page.waitForSelector('#detail-overlay.active');
  ok('Ability getoond in unit-detail', /Sluipen/.test(await page.locator('#detail-slots').innerText()));
  await page.click('#btn-detail-close');

  // 6. Terug naar home
  await page.locator('.btn-back').first().click();
  await page.waitForSelector('#screen-home.active');
  ok('Menu-knop keert terug naar home', true);

  ok('Geen JS-runtime-errors', errors.length === 0);
  if (errors.length) console.log(errors.join('\n'));
  await browser.close();
  console.log(process.exitCode ? 'SMOKE FAILED' : 'SMOKE OK');
})().catch(e => { console.error('FATAAL:', e.message); process.exit(1); });
