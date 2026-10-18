#!/usr/bin/env python3
"""Cut one source image into the game's quality tiers.

usage: python3 tools/make_tiers.py SOURCE OUT_STEM [--normal HEIGHT_IMAGE] [--png] [--no-wrap]
  SOURCE    full-size image from ChatGPT (art/source/G01.png)
  OUT_STEM  e.g. textures/ground/dirt -> textures/ground/{ultra,high,med,low}/dirt.jpg
Sizes and JPEG quality: low 512/72 (256 with --small, for props), med 1024/80, high 2048/85, and ultra at the source's own
size (only if it is over 2048 px) at 90. --neutral turns the colour map into the grey albedo the ground shader expects
(it tints by vertex colour): grey, mean 119, spread 28, like the current pack.
--png keeps transparency (sprites and icons). Ground and materials are made seamless by blending the
edges unless --no-wrap is given. --normal makes dirt_n.jpg normal maps from a height map in each tier.
"""
import sys, os
from PIL import Image, ImageFilter
import numpy as np

# the game's ground pack: low 512, med 1024, high 2048; ultra is the source itself (4096 once upscaled), kept for the planned Ultra tier
TIERS = [('low', 512, 72), ('med', 1024, 80), ('high', 2048, 85)]

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

def to_neutral(im, mean=119.0, std=28.0):
    g = np.asarray(im.convert('L'), dtype=np.float32)
    g = (g - g.mean()) / (g.std() + 1e-6) * std + mean
    return Image.fromarray(np.clip(g, 0, 255).astype(np.uint8)).convert('RGB')

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
    neutral = '--neutral' in flags
    im = Image.open(src)
    im = im.convert('RGBA' if png else 'RGB')
    side = min(im.size) if not png else None
    if side:
        im = im.crop(((im.width - side) // 2, (im.height - side) // 2, (im.width + side) // 2, (im.height + side) // 2))
    if wrap:
        im = seamless(im)
    d, base = os.path.split(stem)
    tiers = TIERS + ([('ultra', im.width, 90)] if not png and im.width > 2048 else [])
    if neutral:
        im = to_neutral(im)
    for tier, size, q in tiers:
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
