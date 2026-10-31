"""Builds the broadleaf trees' leaf sprays and the bark from CC0 photo scans (ambientCG, credited in CREDITS.md).

Usage: python3 tools/trees_scan.py [CACHE_DIR]
Downloads (once, into CACHE_DIR, default /tmp/trees_scan) the 1K sets: LeafSet010 (maple leaves), LeafSet012 (oak),
LeafSet008 (birch-like serrated leaves) and Bark012 (oak bark). Each leaf of a set is cut out of the set's opacity map
and turned with its stalk toward the twig; then a dense, rounded spray is laid out for each species: a few twigs from
the bottom centre and some 120 to 190 leaves along them, the ones at the back darker (the spray shades itself) and the
front ones lighter, overlapping so a crown made of them has no see-through gaps. The sprays are turned grey (mean about
0.8, a trace of their own hue left) so each tree's tint (TREE_LT in js/trees.js) colours them, and go into the foliage
atlas (textures/tree_leaves.jpg and its mask tree_leaves_a.jpg) at the boxes of tools/trees_tex.py BOX, leaving the
spruce branch and the pine needles that are there. The bark (textures/tree_bark.jpg, tree_bark_n.jpg) is Bark012's
own colour (a little darker and greyer, BARK_K) and NormalGL map at 512 square.
"""
import io
import os
import sys
import urllib.request
import zipfile

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from trees_tex import BOX, OUT, bleed  # noqa: E402

SETS = {'leaves': 'LeafSet010', 'oak': 'LeafSet012', 'birch': 'LeafSet008'}
BARK = 'Bark012'
# per spray: leaves in it, leaf length (share of the cell), twigs, seed
SPRAY = {'leaves': (120, 0.2, 5, 11), 'oak': (150, 0.17, 5, 12), 'birch': (190, 0.13, 6, 13)}
BARK_K = 0.62  # bark brightness
CELL = 1024  # laid out at twice the atlas size, then shrunk


def fetch(cache, aid):
    d = os.path.join(cache, aid)
    if not os.path.isdir(d):
        url = f'https://ambientcg.com/get?file={aid}_1K-JPG.zip'
        req = urllib.request.Request(url, headers={'User-Agent': 'curl/8'})
        zipfile.ZipFile(io.BytesIO(urllib.request.urlopen(req).read())).extractall(d)
    return lambda m: Image.open(os.path.join(d, f'{aid}_1K-JPG_{m}.jpg'))


def label(mask):
    """the connected blobs of a boolean mask (4-neighbour flood fill), as lists of bounding boxes"""
    h, w = mask.shape
    seen = np.zeros_like(mask)
    boxes = []
    for y0 in range(h):
        for x0 in range(w):
            if not mask[y0, x0] or seen[y0, x0]:
                continue
            st = [(y0, x0)]
            seen[y0, x0] = True
            y1, y2, x1, x2, n = y0, y0, x0, x0, 0
            while st:
                y, x = st.pop()
                n += 1
                y1, y2, x1, x2 = min(y1, y), max(y2, y), min(x1, x), max(x2, x)
                for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                    if 0 <= yy < h and 0 <= xx < w and mask[yy, xx] and not seen[yy, xx]:
                        seen[yy, xx] = True
                        st.append((yy, xx))
            if n > 30:
                boxes.append((x1, y1, x2 + 1, y2 + 1))
    return boxes


def leaves(get):
    """each leaf of a set as an RGBA image standing upright, its stalk at the bottom"""
    col = get('Color').convert('RGB')
    op = get('Opacity').convert('L')
    small = np.asarray(op.resize((256, 256))) > 100
    k = op.width / 256
    out = []
    for x1, y1, x2, y2 in label(small):
        b = (max(0, int((x1 - 2) * k)), max(0, int((y1 - 2) * k)), min(op.width, int((x2 + 2) * k)),
             min(op.height, int((y2 + 2) * k)))
        im = col.crop(b).convert('RGBA')
        im.putalpha(op.crop(b))
        if im.width > im.height:
            im = im.rotate(90, expand=True)
        a = np.asarray(im.getchannel('A')) > 100
        rows = a.sum(1)
        n = max(2, len(rows) // 12)
        # the stalk is the thin end
        if rows[:n].mean() < rows[-n:].mean():
            im = im.rotate(180)
        out.append(im)
    return out


def grey(im, shade, rnd):
    a = np.asarray(im).astype(np.float32)
    rgb, al = a[..., :3], a[..., 3]
    lum = rgb @ np.array([0.3, 0.59, 0.11], np.float32)
    m = max(1.0, lum[al > 128].mean())
    mean = 0.8 * shade
    g = lum / m * mean * 255
    # a trace of the leaf's own hue, and a slight warm or cool shift per leaf, so a spray isn't flat under its tint
    hue = np.array([1 + rnd.uniform(-0.06, 0.06), 1, 1 + rnd.uniform(-0.06, 0.06)], np.float32)
    rgb = (g[..., None] * 0.92 + rgb / m * mean * 0.08) * hue
    a[..., :3] = np.clip(rgb, 0, 255)
    return Image.fromarray(a.astype(np.uint8))


def spray(ls, n, size, twigs, seed):
    rnd = np.random.default_rng(seed)
    P = CELL // 8  # drawn on a padded canvas, then cropped, so leaves may run off the edge
    c = Image.new('RGBA', (CELL + 2 * P, CELL + 2 * P), (0, 0, 0, 0))
    d = ImageDraw.Draw(c)
    base = np.array([CELL / 2, CELL * 0.98]) + P
    centre = np.array([CELL / 2, CELL * 0.5]) + P
    R = CELL * 0.4
    twig = []
    for t in range(twigs):
        # twigs fan up and out from the bottom centre, curling, ending inside the round spray
        a = -np.pi / 2 + (t / (twigs - 1) - 0.5) * 1.5 + rnd.uniform(-0.12, 0.12)
        p, pts = base.copy(), [base.copy()]
        L = CELL * rnd.uniform(0.6, 0.78) * (1 - 0.3 * abs(t / (twigs - 1) - 0.5))
        for s in range(10):
            a += rnd.uniform(-0.1, 0.1)
            p = p + np.array([np.cos(a), np.sin(a)]) * L / 10
            pts.append(p.copy())
        for s in range(10):
            d.line([tuple(pts[s]), tuple(pts[s + 1])], fill=(74, 60, 48, 255), width=max(2, int(9 * (1 - s / 10))))
        twig += pts[3:]
    twig = np.array(twig)
    placed = []
    for i in range(n):
        # a spot in the round spray (denser toward the middle), its stalk on the nearest twig
        r, a = R * np.sqrt(rnd.uniform()) ** 1.3, rnd.uniform(0, 2 * np.pi)
        q = centre + np.array([np.cos(a), np.sin(a) * 1.05]) * r
        t = twig[np.argmin(((twig - q) ** 2).sum(1))]
        v = q - t + (q - centre) * 0.6 + rnd.normal(0, 25, 2)
        ang = np.arctan2(v[1], v[0])
        h = CELL * size * rnd.uniform(0.8, 1.2)
        st = t + (q - t) * rnd.uniform(0.0, 0.5)
        placed.append((rnd.uniform() * 0.7 + 0.3 * (1 - r / R), st, ang, h))
    # back to front: depth 0 is the back (darker, drawn first); the middle tends to the front
    for depth, at, ang, h in sorted(placed, key=lambda q: q[0]):
        lf = ls[rnd.integers(len(ls))]
        im = lf.resize((max(2, int(lf.width * h / lf.height)), int(h)), Image.LANCZOS)
        if rnd.uniform() < 0.5:
            im = im.transpose(Image.FLIP_LEFT_RIGHT)
        # foreshortened: a leaf turned away from the eye reads narrower
        im = im.resize((max(2, int(im.width * rnd.uniform(0.55, 1.0))), im.height), Image.LANCZOS)
        im = grey(im, 0.62 + 0.43 * depth, rnd)
        # the image's stalk (bottom) toward the twig: rotate so up points along ang
        im = im.rotate(-np.degrees(ang) - 90, expand=True, resample=Image.BICUBIC)
        x, y = at + np.array([np.cos(ang), np.sin(ang)]) * h * 0.5 - np.array([im.width / 2, im.height / 2])
        c.alpha_composite(im, (max(0, int(x)), max(0, int(y))))
    return c.crop((P, P, P + CELL, P + CELL))


def main(cache):
    for n, aid in SETS.items():
        get = fetch(cache, aid)
        ls = leaves(get)
        print(aid, len(ls), 'leaves')
        x0, y0, x1, y1 = BOX[n]
        sp = spray(ls, *SPRAY[n]).resize((x1 - x0, y1 - y0), Image.LANCZOS)
        globals().setdefault('_sp', {})[n] = sp
    old = Image.open(os.path.join(OUT, 'tree_leaves.jpg')).convert('RGB')
    old.putalpha(Image.open(os.path.join(OUT, 'tree_leaves_a.jpg')).convert('L'))
    at = Image.new('RGBA', old.size, (0, 0, 0, 0))
    at.paste(old, (0, 0))
    for n, sp in _sp.items():  # noqa: F821
        x0, y0, x1, y1 = BOX[n]
        at.paste(Image.new('RGBA', (x1 - x0, y1 - y0), (0, 0, 0, 0)), (x0, y0))
        at.alpha_composite(sp, (x0, y0))
    at = bleed(at)
    at.convert('RGB').save(os.path.join(OUT, 'tree_leaves.jpg'), quality=86)
    at.getchannel('A').save(os.path.join(OUT, 'tree_leaves_a.jpg'), quality=90)
    get = fetch(cache, BARK)
    # darker and a little greyer than the scan, as the game's textures are read without an sRGB decode
    b = np.asarray(get('Color').convert('RGB').resize((512, 512), Image.LANCZOS)).astype(np.float32)
    b = (b * 0.8 + b.mean(2, keepdims=True) * 0.2) * BARK_K
    Image.fromarray(np.clip(b, 0, 255).astype(np.uint8)).save(os.path.join(OUT, 'tree_bark.jpg'), quality=88)
    get('NormalGL').convert('RGB').resize((512, 512), Image.LANCZOS).save(os.path.join(OUT, 'tree_bark_n.jpg'), quality=90)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '/tmp/trees_scan')
