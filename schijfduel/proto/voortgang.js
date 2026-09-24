/* SCHIJFDUEL — campagne, ladder en je stal
 *
 * Pure rekenlogica, los van het scherm, zodat de tests het kunnen draaien.
 * Groks regel: geen winkel, geen gacha. Je verdient beesten door de campagne
 * te spelen; de ladder levert alleen rang en titel op.
 */
(function (root) {
  'use strict';
  const { maakRng } = (typeof module !== 'undefined' && module.exports) ? require('./game.js') : root.Schijfduel;

  // Waar je mee begint: zes beesten, allemaal met een plaatje.
  const STARTERS = ['draugr', 'cycloop', 'fenrir', 'golem', 'kelpie', 'griffin'];
  // Twaalf hoofdstukken, één per beest. Eerst de zes die je nog niet hebt, zodat
  // je vanaf hoofdstuk 1 iets verdient; daarna de zes waar je mee begon.
  const CAMPAGNE = ['witte-wieven', 'banshee', 'basilisk', 'chimera', 'minotaurus', 'phoenix',
                    'kelpie', 'griffin', 'fenrir', 'draugr', 'golem', 'cycloop'];
  const GEVECHTEN = 3;
  const TREDEN = ['makkelijk', 'normaal', 'moeilijk'];

  function freshProfiel() {
    return { stal: [...STARTERS], campagne: {}, ladder: { plek: 0, sterren: 0, hoogste: 0 },
             stats: { gewonnen: 0, verloren: 0, gelijk: 0 }, team: null };
  }
  function migreer(p) {
    if (!p || !Array.isArray(p.stal)) return freshProfiel();
    for (const k of STARTERS) if (!p.stal.includes(k)) p.stal.push(k);
    if (!p.campagne || typeof p.campagne !== 'object') p.campagne = {};
    if (!p.ladder || typeof p.ladder.plek !== 'number') p.ladder = { plek: 0, sterren: 0, hoogste: 0 };
    if (!p.stats) p.stats = { gewonnen: 0, verloren: 0, gelijk: 0 };
    return p;
  }

  // Vaste willekeur per gevecht: de vooruitblik toont precies het team dat je
  // tegenkomt, en opnieuw spelen geeft hetzelfde team.
  function campagneGevecht(h, g, alleIds) {
    const kern = CAMPAGNE[h];
    const r = maakRng(5000 + h * 10 + g);
    const rest = alleIds.filter(k => k !== kern), anderen = [];
    while (anderen.length < 5) { const k = rest[Math.floor(r() * rest.length)]; if (!anderen.includes(k)) anderen.push(k); }
    const trede = Math.min(2, (h < 4 ? 0 : h < 8 ? 1 : 2) + (g === GEVECHTEN - 1 ? 1 : 0));
    return { kern, team: [kern, ...anderen], niveau: TREDEN[trede], baas: g === GEVECHTEN - 1, zaad: 9000 + h * 10 + g };
  }
  function campagneOpen(voortgang, h, g) {
    const gedaan = n => (voortgang && voortgang[CAMPAGNE[n]]) || 0;
    if (h > 0 && gedaan(h - 1) < GEVECHTEN) return false;
    return g <= gedaan(h);
  }
  // Eerste winst van dit gevecht verwerken. Het hoofdstuk uitspelen voegt het
  // beest toe aan je stal (als je het nog niet had).
  function campagneWinst(p, h, g) {
    const kern = CAMPAGNE[h], gedaan = p.campagne[kern] || 0;
    const uit = { nieuw: false, beest: null, hoofdstukKlaar: false };
    if (g < gedaan) return uit;
    p.campagne[kern] = g + 1; uit.nieuw = true;
    if (g === GEVECHTEN - 1) {
      uit.hoofdstukKlaar = true;
      if (!p.stal.includes(kern)) { p.stal.push(kern); uit.beest = kern; }
    }
    return uit;
  }

  // Ladder: Brons, Zilver, Goud, Platina (III → I) en Legende. Winst +1 ster,
  // drie is een divisie omhoog; verlies −1, maar nooit onder de bodem van je rang.
  const RANGEN = ['Brons', 'Zilver', 'Goud', 'Platina', 'Legende'];
  const STERREN = 3, TOP = 12;
  const TITELS = ['Schijfdraaier', 'Stadionganger', 'Doeljager', 'Poortwachter', 'Legende van de Schijf'];
  const rang = plek => Math.min(4, Math.floor(plek / 3));
  const ladderNaam = plek => plek >= TOP ? 'Legende' : `${RANGEN[rang(plek)]} ${['III', 'II', 'I'][plek % 3]}`;
  function ladderNaUitslag(l, gewonnen) {
    const n = { ...l }, oudeRang = rang(n.plek);
    if (gewonnen) {
      if (n.plek >= TOP) n.sterren++;
      else if (++n.sterren >= STERREN) { n.plek++; n.sterren = 0; }
    } else if (n.sterren > 0) n.sterren--;
    else {
      const bodem = n.plek >= TOP ? TOP : oudeRang * 3;
      if (n.plek > bodem) { n.plek--; n.sterren = STERREN - 1; }
    }
    const nieuweRang = rang(n.plek);
    const nieuweTitel = nieuweRang > rang(l.hoogste || 0) ? TITELS[nieuweRang] : null;
    n.hoogste = Math.max(l.hoogste || 0, n.plek);
    return { ladder: n, promotie: nieuweRang > oudeRang, nieuweTitel };
  }
  function ladderTegenstander(plek, alleIds, zaad) {
    const r = maakRng(zaad), team = [];
    while (team.length < 6) { const k = alleIds[Math.floor(r() * alleIds.length)]; if (!team.includes(k)) team.push(k); }
    const niveau = ['makkelijk', 'makkelijk', 'normaal', 'moeilijk', 'moeilijk'][rang(plek)];
    return { team, niveau };
  }

  const API = { STARTERS, CAMPAGNE, GEVECHTEN, freshProfiel, migreer, campagneGevecht, campagneOpen, campagneWinst,
                RANGEN, STERREN, TOP, TITELS, rang, ladderNaam, ladderNaUitslag, ladderTegenstander };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.SchijfduelVoortgang = API;
})(this);
