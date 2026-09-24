# Art voor de vier beesten zonder plaatje

Acht van de twaalf beesten gebruiken art uit het vorige spel (zelfde stijl):
Draugr, Cycloop, Fenrir, Golem, Kelpie, Griffin, Witte Wieven en Banshee.
Deze vier hebben nog een embleem: **Minotaurus, Basilisk, Chimera, Phoenix**.

## Werkwijze
1. Nieuw gesprek in Gemini. Sleep `art/lupine.png` (Fenrir), `art/warden.png` (Golem)
   en `art/morrigan.png` (Banshee) mee als stijlreferentie.
2. Plak de master-prompt en daarna de vier beschrijvingen.
3. Vraag om **één vel met de vier figuren naast elkaar**, naam eronder.
4. Knippen: `python3 tools/sheet_split.py vel.png --namen namen.txt --kolommen 4 --rijen 1 -o art/`
   (namen.txt: minotaurus.png, basilisk.png, chimera.png, phoenix.png). Controleer op
   een **felle** achtergrond (`--masker-vel`), niet op een donkere.
5. In `schijfduel/proto/render.js` bij `ART` de vier regels toevoegen, en in `sw.js` de bestanden.

## Master-prompt
> Painted fantasy tabletop miniatures in exactly the same style as the reference images:
> semi-realistic proportions (not chibi), rich hand-painted texture, soft rim light,
> dark neutral background, each figure standing on a simple round stone base, full body
> visible, three-quarter view facing slightly left. One sheet, four figures in a row,
> equal spacing, the name in small serif capitals under each figure. No text on the
> figures, no logos, no modern objects.

## De vier
- **Minotaurus** — a hulking bull-headed warrior, bronze-studded leather harness, a heavy
  double axe held low, one hoof pawing the ground, labyrinth patterns etched in the base.
- **Basilisk** — a coiled serpent-king with a crest of spines and a small crown of bone,
  mouth open, eyes glowing a sickly yellow, scales in moss green and ash grey.
- **Chimera** — a lion's body with a goat's head rising from its back and a snake for a
  tail, lion mane singed at the tips, small flames in the lion's jaws.
- **Phoenix** — a great fire bird rising with wings spread, feathers from deep red to
  gold, trailing embers, the base cracked with glowing ash.
