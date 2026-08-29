#!/usr/bin/env python3
"""
Een vel met figuurtjes opknippen tot losse transparante PNG's.

Gemini levert de figuren aan als één groot vel: een raster van figuurtjes op een
donkere stenen muur, elk op een eigen sokkel, met de naam eronder. Het spel heeft
ze los nodig, zonder achtergrond EN zonder sokkel — want het tekent zelf al een
sokkel in de teamkleur onder elk figuur.

WAAROM HIER EEN MODEL EN GEEN DREMPEL STAAT
De eerste vier versies van dit script probeerden het figuur van de muur te
scheiden op helderheid. Dat kan niet: de muur heeft lichte voegen en gloeiende
runen, en Morrígan heeft een zwarte mantel met dezelfde mediane luminantie (32)
en verzadiging (9) als zo'n voeg. Elke drempel die de voeg weggooit vreet haar
mantel op, en andersom. Daarom knipt `rembg` (een U²-Net-model) het onderwerp
uit — dat kijkt naar vorm en samenhang in plaats van naar helderheid.

Wat het model NIET doet is de sokkel weghalen; die hoort bij het beeldje. En
automatisch vinden waar het beeldje ophoudt en de steen begint lukt niet: bij
Morrígan hangt haar mantel even breed door tot ver boven de schijf, bij Anansi
is de schijf even breed als de spin zelf. Elke vormregel die de een goed doet
snijdt de ander de benen af. Daarom staat de snijhoogte per figuur in de tabel
SOKKEL hieronder, met de hand afgelezen van het lineaalvel (--lineaal-vel).

Gebruik (rembg staat in een losse venv, niet in de repo):
    pip install "rembg[cpu]"
    python3 tools/sheet_split.py vel.png --namen namen.txt -o art-nieuw/
    python3 tools/sheet_split.py vel.png --namen namen.txt --houd-sokkel
    python3 tools/sheet_split.py vel.png --namen namen.txt --masker-vel masker.png
    python3 tools/sheet_split.py vel.png --namen namen.txt --lineaal-vel lineaal.png
"""
import argparse
import os
import sys

try:
    from PIL import Image, ImageDraw, ImageFilter
except ImportError:
    sys.exit("Pillow ontbreekt. Installeer met: pip install pillow")


# Welk uitknipmodel voor welk figuur? isnet-general-use doet het voor bijna
# iedereen het beste, maar laat bij een handvol figuren een stuk muur staan —
# op een donkere achtergrond zie je dat niet, op het gevechtstoneel wel. Bij die
# paar knipt u2net wel schoon. Controleer nieuwe figuren dus altijd op een
# FELLE achtergrond (magenta), niet op een donkere.
MODEL = {
    "harpy.png": "u2net",
    "hydra.png": "u2net",
    "ahuizotl.png": "u2net",
    "jaguarwarrior.png": "u2net",
    "tiamat.png": "u2net",
}


# Waar houdt het figuur op en begint de sokkel? Per bestand een fractie van de
# EIGEN hoogte van het figuur (0 = bovenkant, 1 = onderkant), afgelezen van het
# lineaalvel. Staat een figuur er niet in, dan blijft de sokkel staan en zegt
# het script dat erbij.
SOKKEL = {
    # vel 1 — IJsvlakte, Berghart
    "frostwight.png": 0.82, "jotun.png": 0.96, "ymir.png": 0.81,
    "gnome.png": 0.80, "mountaintroll.png": 0.80, "mountainking.png": 0.87,
    # vel 1 — Woestijnwind, Savanne
    "peri.png": 0.93, "marid.png": 0.89, "ifrit.png": 0.93,
    "anansi.png": 0.83, "mamiwata.png": 0.95, "shango.png": 0.87,
    # vel 1 — Nevelheuvels, Sterrenhof
    "puca.png": 0.81, "cusidhe.png": 1.00, "morrigan.png": 0.89,
    "lamassu.png": 0.79, "anzu.png": 0.83, "tiamat.png": 0.93,
    # vel 2 — Zeediepte, Stormhoogte
    "siren.png": 0.83, "hydra.png": 0.90, "poseidon.png": 0.95,
    "harpy.png": 0.76, "roc.png": 0.90, "thunderbird.png": 0.86,
    # vel 2 — Zandrijk, Zonnetempel
    "shabti.png": 0.80, "sphinx.png": 0.96, "anubis.png": 0.83,
    "jaguarwarrior.png": 0.80, "ahuizotl.png": 0.97, "tezcatlipoca.png": 0.84,
    # vel 2 — Bamboewoud, Diepe Woud
    "kappa.png": 0.79, "tengu.png": 0.83, "ryujin.png": 0.88,
    "domovoi.png": 0.94, "leshy.png": 0.88, "babayaga.png": 0.92,
}


def luminantie(px, x, y):
    r, g, b = px[x, y][:3]
    return 0.299 * r + 0.587 * g + 0.114 * b


# ---------------------------------------------------------------- raster


def kolomgrenzen(im, kolommen, lum_hoog=105):
    """Zoek eerst de BLOKKEN (grote lege stroken zijn de scheiding) en verdeel
    daarna elk blok gelijkmatig. Vellen komen vaak als twee blokken van drie met
    een brede kloof ertussen; een gelijkmatige verdeling over de hele breedte
    klopt dan niet."""
    b, h = im.size
    px = im.load()
    inhoud = []
    for x in range(b):
        n = 0
        for y in range(0, int(h * 0.9), 3):     # naamregels onderaan buiten beschouwing
            if luminantie(px, x, y) > lum_hoog:
                n += 1
        inhoud.append(n)
    leeg = [v <= 1 for v in inhoud]
    minkloof = max(20, int(b * 0.03))
    blokken, start, gat = [], None, 0
    for x in range(b):
        if not leeg[x]:
            if start is None:
                start = x
            gat = 0
        elif start is not None:
            gat += 1
            if gat >= minkloof:
                blokken.append((start, x - gat + 1)); start = None; gat = 0
    if start is not None:
        blokken.append((start, b))
    blokken = [(a, c) for a, c in blokken if c - a > b * 0.05]
    if not blokken or kolommen % len(blokken) != 0:
        return None
    per = kolommen // len(blokken)
    uit = []
    for a, c in blokken:
        w = (c - a) / per
        for i in range(per):
            uit.append((int(a + i * w), int(a + (i + 1) * w)))
    return uit


def rijgrenzen(im, rijen):
    """Rijen afbakenen op de NAAMREGELS, niet op gelijke derden.

    De naamregel van een rij loopt door tot ONDER de rekenkundige rijgrens: op
    de vellen van 1504x704 staat de tekst van rij 1 op y 226-239 terwijl de
    grens op 234 ligt. Deel je in gelijke derden, dan begint rij 2 midden in de
    tekst van rij 1 en staat er een stuk naam in het plaatje.

    Zoek daarom per rij de LAATSTE band lichte pixels rond de rekenkundige
    grens: dat is de naamregel. De banden ervoor zijn de sokkels.
    """
    b, h = im.size
    px = im.load()
    helder = []
    for y in range(h):
        helder.append(sum(1 for x in range(0, b, 2) if luminantie(px, x, y) > 150) > 40)

    def laatste_band(lo, hi):
        lo, hi = max(0, lo), min(h, hi)
        banden, start = [], None
        for y in range(lo, hi):
            if helder[y] and start is None:
                start = y
            elif not helder[y] and start is not None:
                banden.append((start, y)); start = None
        if start is not None:
            banden.append((start, hi))
        return banden[-1] if banden else None

    labels = []
    for i in range(rijen):
        grens = (i + 1) * h / rijen
        band = laatste_band(int(grens - 50), int(grens + 40))
        labels.append(band or (int(grens), int(grens)))

    uit, boven = [], 0
    for lo, hi in labels:
        uit.append((boven, max(boven + 1, lo - 6)))
        boven = min(h, hi + 6)
    return uit


# ---------------------------------------------------------------- sokkel


def grootste_vorm(alpha, b, h, drempel=128):
    """Houd alleen de grootste samenhangende vorm plus alles wat daar dicht
    tegenaan ligt. Het model laat af en toe een losse veeg staan."""
    gezien = bytearray(b * h)
    groepen = []
    for start in range(b * h):
        if alpha[start] <= drempel or gezien[start]:
            continue
        groep = [start]
        gezien[start] = 1
        stapel = [start]
        while stapel:
            i = stapel.pop()
            x, y = i % b, i // b
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < b and 0 <= ny < h:
                    j = ny * b + nx
                    if alpha[j] > drempel and not gezien[j]:
                        gezien[j] = 1
                        groep.append(j)
                        stapel.append(j)
        groepen.append(groep)
    if not groepen:
        return alpha
    grootste = max(groepen, key=len)
    houd = set()
    for g in groepen:
        if len(g) >= len(grootste) * 0.05:
            houd.update(g)
    uit = bytearray(b * h)
    for i in houd:
        uit[i] = alpha[i]
    return uit


# ---------------------------------------------------------------- knippen


def knip_figuur(cel, sessie, marge, hoogte, snij=None, masker_uit=None):
    from rembg import remove
    uitgeknipt = remove(cel.convert("RGB"), session=sessie).convert("RGBA")
    b, h = uitgeknipt.size
    alpha = bytearray(uitgeknipt.getchannel("A").tobytes())
    alpha = grootste_vorm(alpha, b, h)
    if snij is not None:
        gevuld = [y for y in range(h) if any(alpha[y * b + x] > 128 for x in range(b))]
        if gevuld:
            boven, onder = gevuld[0], gevuld[-1]
            ys = boven + int(round((onder - boven + 1) * snij))
            for y in range(ys, h):
                for x in range(b):
                    alpha[y * b + x] = 0
    masker = Image.frombytes("L", (b, h), bytes(alpha))
    if masker_uit is not None:
        masker_uit.append((cel.copy(), masker.copy()))
    masker = masker.filter(ImageFilter.GaussianBlur(0.5))
    uit = cel.convert("RGBA")
    uit.putalpha(masker)
    bbox = uit.getbbox()
    if not bbox:
        return None
    x0, y0, x1, y1 = bbox
    x0 = max(0, x0 - marge); y0 = max(0, y0 - marge)
    x1 = min(b, x1 + marge); y1 = min(h, y1 + marge)
    uit = uit.crop((x0, y0, x1, y1))
    if hoogte and uit.height:
        f = hoogte / uit.height
        uit = uit.resize((max(1, round(uit.width * f)), hoogte), Image.LANCZOS)
    return uit


def maskervel(paren, pad, kolommen):
    """Contactvel met de maskerrand in magenta over het origineel.

    Naar de eindplaatjes kijken zegt te weinig: je ziet dat er iets mis is maar
    niet wat. Op deze weergave zie je meteen of het masker lekt of juist een
    stuk figuur mist."""
    if not paren:
        return
    cb = max(c.width for c, _ in paren)
    ch = max(c.height for c, _ in paren)
    rijen = (len(paren) + kolommen - 1) // kolommen
    vel = Image.new("RGB", (cb * kolommen, ch * rijen), (20, 20, 26))
    for i, (cel, masker) in enumerate(paren):
        laag = cel.convert("RGB").copy()
        binnen = masker.point(lambda v: 255 if v > 128 else 0)
        rand = binnen.filter(ImageFilter.MaxFilter(3))
        omtrek = Image.frombytes("L", masker.size, bytes(
            bytearray(255 if a and not bn else 0
                      for a, bn in zip(rand.tobytes(), binnen.tobytes()))))
        laag.paste(Image.new("RGB", masker.size, (255, 0, 200)), (0, 0), omtrek)
        r, k = divmod(i, kolommen)
        vel.paste(laag, (k * cb, r * ch))
    vel.save(pad)
    print("maskervel:", pad)


def lineaalvel(paren, pad, kolommen, namen):
    """Elk figuur op eigen hoogte geschaald, met hoogtelijnen erover.

    Hiermee lees je de getallen voor SOKKEL af: zoek de lijn waar het beeldje
    ophoudt en de steen begint, en zet dat getal in de tabel."""
    TH, TB = 300, 190
    rijen = (len(paren) + kolommen - 1) // kolommen
    vel = Image.new("RGB", (TB * kolommen, (TH + 18) * rijen), (18, 18, 24))
    tek = ImageDraw.Draw(vel)
    for i, (cel, masker) in enumerate(paren):
        fig = cel.convert("RGBA")
        fig.putalpha(masker)
        bbox = fig.getbbox()
        if not bbox:
            continue
        fig = fig.crop(bbox)
        f = min(TH / fig.height, (TB - 40) / fig.width)
        fig = fig.resize((max(1, round(fig.width * f)), max(1, round(fig.height * f))), Image.LANCZOS)
        r, k = divmod(i, kolommen)
        ox, oy = k * TB, r * (TH + 18)
        vel.paste(fig, (ox + (TB - fig.width) // 2, oy), fig)
        for n in range(60, 101, 2):
            y = oy + round(fig.height * n / 100) - 1
            dik = n % 10 == 0
            tek.line([(ox + 4, y), (ox + TB - 4, y)], fill=(255, 0, 200) if dik else (90, 90, 120))
            if dik:
                tek.text((ox + 6, y - 10), f".{n}", fill=(255, 120, 220))
        naam = namen[i] if i < len(namen) else str(i)
        tek.text((ox + 6, oy + TH + 3), naam.replace(".png", ""), fill=(220, 220, 230))
    vel.save(pad)
    print("lineaalvel:", pad)


def main():
    ap = argparse.ArgumentParser(description="Knip een vel met figuurtjes op tot losse transparante PNG's.")
    ap.add_argument("vel")
    ap.add_argument("-o", "--uit", default="art-nieuw")
    ap.add_argument("--namen", help="tekstbestand, één bestandsnaam per regel, in leesvolgorde")
    ap.add_argument("--kolommen", type=int, default=6)
    ap.add_argument("--rijen", type=int, default=3)
    ap.add_argument("--model", default="isnet-general-use")
    ap.add_argument("--marge", type=int, default=2)
    ap.add_argument("--hoogte", type=int, default=220, help="uitvoerhoogte (bestaande art is 220)")
    ap.add_argument("--houd-sokkel", dest="houd_sokkel", action="store_true",
                    help="niets afsnijden, ook niet wat in SOKKEL staat")
    ap.add_argument("--masker-vel", dest="masker_vel", help="schrijf een controlevel met de maskerrand erover")
    ap.add_argument("--lineaal-vel", dest="lineaal_vel",
                    help="schrijf een vel met hoogtelijnen, om SOKKEL mee af te lezen")
    args = ap.parse_args()

    try:
        from rembg import new_session
    except ImportError:
        sys.exit('rembg ontbreekt. Installeer met: pip install "rembg[cpu]"')

    os.makedirs(args.uit, exist_ok=True)
    im = Image.open(args.vel).convert("RGB")
    b, h = im.size

    kb = kolomgrenzen(im, args.kolommen)
    if kb:
        print("kolommen gemeten:", ", ".join(f"{a}-{c}" for a, c in kb))
    else:
        w = b // args.kolommen
        kb = [(i * w, (i + 1) * w) for i in range(args.kolommen)]
        print("kolommen niet te meten -> gelijkmatig raster")
    rb = rijgrenzen(im, args.rijen)
    print("rijen gemeten:  ", ", ".join(f"{a}-{c}" for a, c in rb))

    namen = []
    if args.namen:
        with open(args.namen) as f:
            namen = [r.strip() for r in f if r.strip()]

    sessies = { args.model: new_session(args.model) }
    def sessie_voor(naam):
        m = MODEL.get(naam, args.model)
        if m not in sessies: sessies[m] = new_session(m)
        return sessies[m]
    paren = [] if (args.masker_vel or args.lineaal_vel) else None
    n = 0
    for y0, y1 in rb:
        for x0, x1 in kb:
            cel = im.crop((x0, y0, x1, y1))
            naam = namen[n] if n < len(namen) else f"fig{n}.png"
            n += 1
            snij = None if args.houd_sokkel else SOKKEL.get(naam)
            fig = knip_figuur(cel, sessie_voor(naam), args.marge, args.hoogte, snij, paren)
            if fig is None:
                print(f"  ! {naam}: niets gevonden")
                continue
            fig.save(os.path.join(args.uit, naam))
            hoe = (f"  sokkel bij {snij:.2f}" if snij is not None else "  SOKKEL ONBEKEND") + (f"  [{MODEL[naam]}]" if naam in MODEL else "")
            print(f"  ✓ {naam}  {fig.size[0]}x{fig.size[1]}{hoe}")
    if paren:
        if args.masker_vel:
            maskervel(paren, args.masker_vel, args.kolommen)
        if args.lineaal_vel:
            lineaalvel(paren, args.lineaal_vel, args.kolommen, namen)


if __name__ == "__main__":
    main()
