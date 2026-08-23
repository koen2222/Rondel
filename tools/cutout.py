#!/usr/bin/env python3
"""
Witte achtergrond van gegenereerde figuurtjes weghalen.

Beeldgeneratoren leveren vaak een PNG met een dichte witte achtergrond terwijl
het spel transparantie nodig heeft. Domweg "alle witte pixels wissen" werkt
NIET: dan verdwijnt ook het wit BINNEN de figuur — botten, tanden, Eirs gewaad,
de highlights op een helm.

Daarom vult dit script vanaf de RANDEN naar binnen (flood fill). Alleen wit dat
via de rand bereikbaar is verdwijnt; ingesloten wit blijft staan. Daarna wordt
de rand een paar pixels zacht gemaakt zodat er geen kartels of witte zoom
overblijft.

Gebruik:
    python3 tools/cutout.py art-nieuw/*.png            # schrijft naast het origineel
    python3 tools/cutout.py -o art/ art-nieuw/*.png     # naar een andere map
    python3 tools/cutout.py --drempel 26 plaatje.png    # strenger/losser
"""
import argparse
import os
import sys
from collections import deque

try:
    from PIL import Image, ImageFilter
except ImportError:
    sys.exit("Pillow ontbreekt. Installeer met: pip install pillow")


def maak_transparant(im, drempel=32, zoom=2, marge=8):
    """Geeft een RGBA-kopie terug waarin de buitenste (bijna-)witte rand weg is.

    drempel : hoeveel een pixel van puur wit mag afwijken en toch als
              achtergrond telt (0-255). Hoger = meer weghalen.
    zoom    : hoeveel pixels de rand zacht wordt gemaakt.
    marge   : lege ruimte die rond het figuur blijft staan bij het bijsnijden.
    """
    im = im.convert("RGBA")
    b, h = im.size
    px = im.load()

    def is_achtergrond(x, y):
        r, g, bl, a = px[x, y]
        if a == 0:
            return True
        # bijna-wit: alle kanalen hoog en dicht bij elkaar (dus niet een
        # lichtgele gloed of een bleekblauw pantser)
        return r >= 255 - drempel and g >= 255 - drempel and bl >= 255 - drempel \
            and max(r, g, bl) - min(r, g, bl) <= 18

    # Flood fill vanaf alle randpixels naar binnen
    weg = bytearray(b * h)
    rij = deque()
    for x in range(b):
        for y in (0, h - 1):
            if is_achtergrond(x, y) and not weg[y * b + x]:
                weg[y * b + x] = 1
                rij.append((x, y))
    for y in range(h):
        for x in (0, b - 1):
            if is_achtergrond(x, y) and not weg[y * b + x]:
                weg[y * b + x] = 1
                rij.append((x, y))

    while rij:
        x, y = rij.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < b and 0 <= ny < h and not weg[ny * b + nx] and is_achtergrond(nx, ny):
                weg[ny * b + nx] = 1
                rij.append((nx, ny))

    # Losse spikkels weghalen: kleine eilandjes die van het figuur los staan.
    # Generatoren laten vaak wat ruis of een half weggepoetst restje achter.
    bezet = [not weg[i] for i in range(b * h)]
    gezien = bytearray(b * h)
    eilanden = []
    for start in range(b * h):
        if not bezet[start] or gezien[start]:
            continue
        groep = []
        stapel = [start]
        gezien[start] = 1
        while stapel:
            i = stapel.pop()
            groep.append(i)
            x0, y0 = i % b, i // b
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x0 + dx, y0 + dy
                if 0 <= nx < b and 0 <= ny < h:
                    j = ny * b + nx
                    if bezet[j] and not gezien[j]:
                        gezien[j] = 1
                        stapel.append(j)
        eilanden.append(groep)
    if eilanden:
        grootste = max(len(g) for g in eilanden)
        for g in eilanden:
            if len(g) >= max(24, grootste * 0.02):
                continue                      # groot genoeg: laat staan
            # Klein eilandje. Maar veel figuren hebben LOSSE onderdelen die er
            # wel degelijk bij horen: een zwevend dwaallichtje, een vonk, een
            # magisch kristal. Die zijn fel gekleurd. Poets alleen weg wat ook
            # nog eens grauw of bijna-wit is — dus echte ruis.
            rs = gs = bs = 0
            for i in g:
                r, gg, bb, _ = px[i % b, i // b]
                rs += r; gs += gg; bs += bb
            n = len(g)
            r, gg, bb = rs / n, gs / n, bs / n
            verzadiging = max(r, gg, bb) - min(r, gg, bb)
            grauw = verzadiging <= 26                      # kleurloos
            bijna_wit = min(r, gg, bb) >= 255 - drempel    # restje achtergrond
            if grauw or bijna_wit:
                for i in g:
                    weg[i] = 1

    # Alfamasker bouwen: weggevallen achtergrond wordt doorzichtig
    masker = Image.new("L", (b, h), 255)
    mpx = masker.load()
    for y in range(h):
        rowbase = y * b
        for x in range(b):
            if weg[rowbase + x]:
                mpx[x, y] = 0

    # Rand zacht maken zodat er geen kartels of witte zoom overblijft.
    # Eerst iets krimpen (MinFilter) zodat de witte zoom eraf gaat, dan blurren.
    if zoom > 0:
        masker = masker.filter(ImageFilter.MinFilter(3))
        masker = masker.filter(ImageFilter.GaussianBlur(zoom / 2))

    uit = im.copy()
    uit.putalpha(masker)

    # Bijsnijden op wat er nog over is, met een kleine marge
    bbox = uit.getbbox()
    if bbox:
        x0, y0, x1, y1 = bbox
        x0 = max(0, x0 - marge); y0 = max(0, y0 - marge)
        x1 = min(b, x1 + marge); y1 = min(h, y1 + marge)
        uit = uit.crop((x0, y0, x1, y1))
    return uit


def main():
    ap = argparse.ArgumentParser(description="Haalt de witte achtergrond van figuur-PNG's af.")
    ap.add_argument("bestanden", nargs="+", help="PNG-bestanden")
    ap.add_argument("-o", "--uit", default=None, help="map om naartoe te schrijven (standaard: naast het origineel, met -cut)")
    ap.add_argument("--drempel", type=int, default=32, help="hoe ver van puur wit nog als achtergrond telt (0-255, standaard 32)")
    ap.add_argument("--zoom", type=int, default=2, help="zachtheid van de rand in pixels (standaard 2)")
    ap.add_argument("--hoogte", type=int, default=0, help="optioneel: schaal naar deze hoogte in pixels")
    args = ap.parse_args()

    if args.uit:
        os.makedirs(args.uit, exist_ok=True)

    for pad in args.bestanden:
        try:
            im = Image.open(pad)
        except Exception as e:
            print(f"  ! {pad}: kan niet openen ({e})")
            continue
        uit = maak_transparant(im, args.drempel, args.zoom)
        if args.hoogte and uit.height:
            f = args.hoogte / uit.height
            uit = uit.resize((max(1, round(uit.width * f)), args.hoogte), Image.LANCZOS)
        naam = os.path.basename(pad)
        doel = os.path.join(args.uit, naam) if args.uit else \
            os.path.join(os.path.dirname(pad) or ".", os.path.splitext(naam)[0] + "-cut.png")
        uit.save(doel)
        dekking = sum(1 for a in uit.getchannel("A").getdata() if a > 8) / (uit.width * uit.height)
        print(f"  ✓ {naam}  {im.size[0]}x{im.size[1]} -> {uit.size[0]}x{uit.size[1]}  "
              f"({dekking*100:.0f}% figuur)  -> {doel}")


if __name__ == "__main__":
    main()
