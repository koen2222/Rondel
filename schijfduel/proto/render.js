/* SCHIJFDUEL — tekenen: bord, figuren, schijven. Geen spelregels hier. */
(function (root) {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, ouder) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (ouder) ouder.appendChild(e);
    return e;
  };
  // Acht van de twaalf beesten hebben al een plaatje in dezelfde stijl uit het
  // vorige spel. De andere vier krijgen een embleem tot de art er is
  // (prompt: docs/vinyl-prompts.md).
  const ART = {
    draugr: 'skeleton.png', cycloop: 'apprentice.png', fenrir: 'lupine.png', golem: 'warden.png',
    kelpie: 'puca.png', griffin: 'anzu.png', 'witte-wieven': 'peri.png', banshee: 'morrigan.png',
  };
  const ART_PAD = '../../art/';
  const KLEUR = { WHITE: '#E8E0D0', GOLD: '#C9A227', PURPLE: '#5B3A8C', DODGE: '#2A6F6A', MISS: '#5C2B2B' };
  const DONKER = { PURPLE: 1, DODGE: 1, MISS: 1 };
  const NAAM_KLEUR = { WHITE: 'Aanval', GOLD: 'Goud', PURPLE: 'Paars', DODGE: 'Ontwijk', MISS: 'Mis' };
  const EFFECT_NL = { KO: 'KO', WAIT: 'Wacht', PUSH: 'Duw', SWAP: 'Wissel', PIN: 'Vastpin', RETURN: 'Terug', ENTRYLOCK: 'Poortslot' };
  const effectTekst = e => { if (!e) return ''; const [n, a] = e.split(':'); return (EFFECT_NL[n] || n) + (a ? ' ' + a : ''); };

  function beeldHtml(id, naam) {
    if (ART[id]) return `<img src="${ART_PAD + ART[id]}" alt="${naam}">`;
    return `<div class="embleem" aria-label="${naam}">${naam[0]}</div>`;
  }

  // ── het bord ────────────────────────────────────────────────────────────────
  const CEL = 58, RAND = 36;
  const px = x => RAND + x * CEL, py = y => RAND + y * CEL;
  const MAAT = RAND * 2 + CEL * 8;

  function tekenBord(svg, M, st, opts) {
    opts = opts || {};
    svg.setAttribute('viewBox', `0 0 ${MAAT} ${MAAT}`);
    svg.innerHTML = '';
    // De spil: het gat van de schijf, met groeven eromheen — het bord ÍS een plaat
    const cx = px(4), cy = py(4);
    for (let r = 60; r < 250; r += 14) el('circle', { cx, cy, r, class: 'groef' }, svg);
    for (const [a, b] of Object.keys(M.BUREN).flatMap(a => M.BUREN[a].filter(b => a < b).map(b => [a, b]))) {
      const A = M.KNOPEN[a], B = M.KNOPEN[b];
      el('line', { x1: px(A.x), y1: py(A.y), x2: px(B.x), y2: py(B.y), class: 'lijn' }, svg);
    }
    el('circle', { cx, cy, r: 26, class: 'spil' }, svg);
    el('circle', { cx, cy, r: 5, fill: '#C9A227' }, svg);
    const kant = { red: 'rood', blue: 'blauw' };
    for (const n of Object.values(M.KNOPEN)) {
      let cls = 'knoop';
      if (n.role === 'axis') cls += ' as';
      if (n.role === 'entry') cls += ' entry-' + kant[n.owner];
      if (n.role === 'goal') cls += ' doel-' + kant[n.owner];
      const lock = st && Object.values(st.entryLock).some(l => l && l.knoop === n.id);
      if (lock) cls += ' lock';
      const r = n.role === 'goal' ? 21 : 13;
      if (n.role === 'goal') el('circle', { cx: px(n.x), cy: py(n.y), r: r + 7, class: 'doel-puls', stroke: n.owner === 'red' ? '#e0584a' : '#4f86c9' }, svg);
      const c = el('circle', { cx: px(n.x), cy: py(n.y), r, class: cls, 'data-knoop': n.id }, svg);
      if (opts.opKnoop) c.addEventListener('click', () => opts.opKnoop(n.id));
    }
    // doelwitten (waar mag je heen / wie kun je aanvallen)
    for (const k of (opts.doelwitten || [])) {
      const n = M.KNOPEN[k];
      // De ring pulseert; het tikvlak eronder staat stil (een bewegend doel is
      // lastig raken, en de tests weigeren erop te klikken).
      el('circle', { cx: px(n.x), cy: py(n.y), r: 19, class: 'doelwit' + (opts.vijandDoel ? ' vijand' : ''), 'pointer-events': 'none' }, svg);
      const d = el('circle', { cx: px(n.x), cy: py(n.y), r: 24, fill: 'transparent', class: 'doelwit-tik', 'data-doel': k }, svg);
      if (opts.opKnoop) d.addEventListener('click', () => opts.opKnoop(k));
    }
    // figuren
    if (st) for (const b of Object.values(st.beesten)) {
      if (!b.knoop) continue;
      const n = M.KNOPEN[b.knoop];
      const g = el('g', { class: `fig ${b.kant}${opts.gekozen === b.uid ? ' gekozen' : ''}${b.rust ? ' rust' : ''}`,
                          transform: `translate(${px(n.x)},${py(n.y)})`, 'data-uid': b.uid }, svg);
      el('rect', { x: -26, y: -58, width: 52, height: 76, fill: 'transparent' }, g);   // vast tikvlak
      el('ellipse', { cx: 0, cy: 8, rx: 20, ry: 8, class: 'voet' }, g);
      const v = M.VINYLS[b.id];
      if (ART[b.id]) {
        const im = el('image', { x: -22, y: -50, width: 44, height: 58, href: ART_PAD + ART[b.id], class: 'fig-art' }, g);
        im.style.animationDelay = (-((b.uid.charCodeAt(1) * 7) % 34) / 10) + 's';
      } else {
        el('circle', { cx: 0, cy: -18, r: 17, fill: '#C9A227', class: 'emb' }, g);
        const t = el('text', { x: 0, y: -12, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 900, fill: '#0B1C2C', 'font-family': 'Georgia, serif' }, g);
        t.textContent = v.name[0];
      }
      const m = el('circle', { cx: 16, cy: 8, r: 8, fill: b.kant === 'rood' ? '#B42318' : '#1D4E89', stroke: '#F3E6C8', 'stroke-width': 1.5 }, g);
      const mt = el('text', { x: 16, y: 11.5, 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 900, fill: '#fff' }, g);
      mt.textContent = v.mp;
      if (b.rust || b.wacht) { const w = el('text', { x: -16, y: 12, 'text-anchor': 'middle', 'font-size': 12 }, g); w.textContent = '⏳'; }
      if (b.pin || b.pinNu) { const w = el('text', { x: -16, y: 12, 'text-anchor': 'middle', 'font-size': 12 }, g); w.textContent = '📌'; }
      if (opts.opFiguur) g.addEventListener('click', e => { e.stopPropagation(); opts.opFiguur(b.uid); });
    }
  }

  // ── een schijf, met de kans per segment ─────────────────────────────────────
  function tekenWiel(svg, vinyl, totaal) {
    svg.setAttribute('viewBox', '0 0 200 200');
    svg.innerHTML = '';
    const g = el('g', { class: 'wiel' }, svg);
    let hoek = -90;
    const hoeken = [];
    for (const s of vinyl.wheel) {
      const deel = s.ticks / totaal * 360, a0 = hoek, a1 = hoek + deel;
      const r = 92, rad = a => a * Math.PI / 180;
      const x0 = 100 + r * Math.cos(rad(a0)), y0 = 100 + r * Math.sin(rad(a0));
      const x1 = 100 + r * Math.cos(rad(a1)), y1 = 100 + r * Math.sin(rad(a1));
      el('path', { d: `M100 100 L${x0} ${y0} A${r} ${r} 0 ${deel > 180 ? 1 : 0} 1 ${x1} ${y1} Z`,
                   fill: KLEUR[s.color], stroke: '#0B1C2C', 'stroke-width': 2 }, g);
      const mid = rad(a0 + deel / 2);
      const tx = 100 + 58 * Math.cos(mid), ty = 100 + 58 * Math.sin(mid);
      const t = el('text', { x: tx, y: ty, 'text-anchor': 'middle', class: 'seg-tekst' + (DONKER[s.color] ? ' licht' : '') }, g);
      t.textContent = s.power ? s.power : s.stars ? '★'.repeat(s.stars) : (s.color === 'DODGE' ? '↺' : '×');
      const p = el('text', { x: tx, y: ty + 11, 'text-anchor': 'middle', class: 'seg-pct' + (DONKER[s.color] ? ' licht' : '') }, g);
      p.textContent = Math.round(s.ticks / totaal * 100) + '%';
      hoeken.push({ a0, a1 });
      hoek = a1;
    }
    el('circle', { cx: 100, cy: 100, r: 18, fill: '#0B1C2C', stroke: '#C9A227', 'stroke-width': 3 }, svg);
    return { groep: g, hoeken };
  }
  // Draai zo dat het midden van segment `i` onder de wijzer (boven) eindigt.
  function draaiNaar(wiel, i, ms, extraRondes) {
    const { a0, a1 } = wiel.hoeken[i];
    const midden = (a0 + a1) / 2;               // gemeten vanaf de 3-uur-as, -90 = boven
    const doel = 360 * (extraRondes || 4) + (-90 - midden) + (Math.random() - 0.5) * (a1 - a0) * 0.6;
    wiel.groep.style.transition = `transform ${ms}ms cubic-bezier(.12,.7,.18,1)`;
    requestAnimationFrame(() => { wiel.groep.style.transform = `rotate(${doel}deg)`; });
  }
  function oddsHtml(vinyl, totaal) {
    return vinyl.wheel.map(s => `<div><span><i class="stip" style="background:${KLEUR[s.color]}"></i>${s.label || NAAM_KLEUR[s.color]}
      ${s.power ? s.power : s.stars ? '★'.repeat(s.stars) : ''} ${effectTekst(s.effect)}</span><b>${Math.round(s.ticks / totaal * 1000) / 10}%</b></div>`).join('');
  }

  root.SchijfduelRender = { tekenBord, tekenWiel, draaiNaar, oddsHtml, beeldHtml, effectTekst, KLEUR, ART, px, py, MAAT };
})(this);
