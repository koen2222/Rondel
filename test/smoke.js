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
  await page.click('.btn-back >> nth=1');

  // 5. Solo-flow: deck kiezen → game start
  await page.click('#tile-solo');
  await page.waitForSelector('#deck-overlay.active');
  ok('Deck-selectie opent', true);
  await page.click('#btn-deck-random');
  ok('Start-knop actief na random', await page.locator('#btn-deck-start:not([disabled])').count() === 1);
  await page.click('#btn-deck-start');
  await page.waitForSelector('#screen-game.active');
  ok('Game-scherm actief', true);
  ok('Bord gerenderd (32 nodes)', await page.locator('#board circle.node-rim, #board [id^="glow-"]').count() >= 32);
  ok('Bench P1 gevuld (6 kaarten)', await page.locator('#bench-p1 .bench-card').count() === 6);

  // 6. Menu terug naar home (state.over is false → confirm; auto-accept)
  page.on('dialog', d => d.accept());
  await page.click('#btn-menu');
  await page.waitForSelector('#screen-home.active');
  ok('Menu-knop keert terug naar home', true);

  ok('Geen JS-runtime-errors', errors.length === 0);
  if (errors.length) console.log(errors.join('\n'));
  await browser.close();
  console.log(process.exitCode ? 'SMOKE FAILED' : 'SMOKE OK');
})().catch(e => { console.error('FATAAL:', e.message); process.exit(1); });
