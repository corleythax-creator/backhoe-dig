#!/usr/bin/env python3
"""Cut one source image into the game's quality tiers.

usage: python3 tools/make_tiers.py SOURCE OUT_STEM [--normal HEIGHT_IMAGE] [--png] [--no-wrap]
  SOURCE    full-size image from ChatGPT (art/source/G01.png)
  OUT_STEM  e.g. textures/ground/dirt -> textures/ground/{ultra,high,med,low}/dirt.jpg
Sizes and JPEG quality: ultra 2048/90, high 1024/85, med 512/80, low 512/72 (256 with --small, for props).
--png keeps transparency (sprites and icons). Ground and materials are made seamless by blending the
edges unless --no-wrap is given. --normal makes dirt_n.jpg normal maps from a height map in each tier.
"""
import sys, os
from PIL import Image, ImageFilter
import numpy as np

TIERS = [('ultra', 2048, 90), ('high', 1024, 85), ('med', 512, 80), ('low', 512, 72)]

def seamless(im, band=0.12):
    """Cross-fade the image with a half-shifted copy so the borders wrap."""
    a = np.asarray(im.convert('RGB'), dtype=np.float32)
    h, w, _ = a.shape
    b = np.roll(np.roll(a, h // 2, 0), w // 2, 1)
    y, x = np.mgrid[0:h, 0:w]
    ey = np.minimum(y, h - 1 - y) / (h * band)
    ex = np.minimum(x, w - 1 - x) / (w * band)
    m = np.clip(np.minimum(ey, ex), 0, 1)[..., None]
    return Image.fromarray((a * m + b * (1 - m)).astype(np.uint8))

def normal_from_height(im, strength=3.0):
    h = np.asarray(im.convert('L'), dtype=np.float32) / 255
    dx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * strength
    dy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * strength
    n = np.dstack([-dx, -dy, np.ones_like(h)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    return Image.fromarray(((n * 0.5 + 0.5) * 255).astype(np.uint8))

def main(a):
    flags = [x for x in a if x.startswith('--')]
    args = [x for x in a if not x.startswith('--')]
    if len(args) < 2:
        sys.exit(__doc__)
    src, stem = args[0], args[1]
    png, wrap, small = '--png' in flags, '--no-wrap' not in flags and '--png' not in flags, '--small' in flags
    normal = '--normal' in flags
    im = Image.open(src)
    im = im.convert('RGBA' if png else 'RGB')
    side = min(im.size) if not png else None
    if side:
        im = im.crop(((im.width - side) // 2, (im.height - side) // 2, (im.width + side) // 2, (im.height + side) // 2))
    if wrap:
        im = seamless(im)
    d, base = os.path.split(stem)
    for tier, size, q in TIERS:
        if tier == 'low' and small:
            size = 256
        t = im if png else im.resize((size, size), Image.LANCZOS) if im.width != size else im
        if png:
            t = im.copy(); t.thumbnail((size, size), Image.LANCZOS)
        else:
            t = t.filter(ImageFilter.UnsharpMask(1, 40, 2)) if size < im.width else t
        if normal:
            t = normal_from_height(t); base_name = base + '_n'
        else:
            base_name = base
        os.makedirs(os.path.join(d, tier), exist_ok=True)
        out = os.path.join(d, tier, base_name + ('.png' if png else '.jpg'))
        t.save(out, optimize=True) if png else t.save(out, quality=q, optimize=True, progressive=True)
        print(out, t.size, os.path.getsize(out) // 1024, 'KB')

main(sys.argv[1:])
