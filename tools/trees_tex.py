"""Makes the tree textures (js/trees.js) from the raw OpenAI GPT Image renders.

Usage: python3 tools/trees_tex.py RAW_DIR
       python3 tools/trees_tex.py --leaves LEAVES_PNG (only swaps the leaf clump in the existing atlas)
RAW_DIR holds bark.png and birch.png (1024 square, opaque bark photos) and spruce.png (a spruce branch, stem running
bottom to top), leaves.png (a leaf clump) and needles.png (a pine needle tuft), all cut out on a transparent background.
Writes textures/tree_bark.jpg and textures/tree_birch.jpg (512 square, seamless) and the foliage atlas (1024 square):
textures/tree_leaves.jpg its colour and tree_leaves_a.jpg its see-through mask (the shader's alphaMap): the spruce branch in the left 320 px column, the leaf clump top right of it and the
needle tuft below it, at the UV boxes FOL_UV in js/trees.js reads. The leaf clump is turned grey (mean about 0.8) so
each tree's tint (ASSET_LT, autumn golds to greens) colours it; the needles and branch keep their own green. The
colour of see-through pixels is spread out from the foliage so the mipmaps don't fringe dark. Then run
python3 tools/pbr.py tree_bark tree_birch for the bark relief (High graphics).
"""
import os, sys
import numpy as np
from PIL import Image, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from textures import seamless, best_period  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'textures')
# atlas boxes in pixels (x0, y0, x1, y1), image y down; js/trees.js FOL_UV has the same in UV (v up)
BOX = {'spruce': (0, 0, 320, 1024), 'leaves': (320, 0, 832, 512), 'needles': (320, 512, 832, 1024)}


def bark(raw, name, out):
    a = np.asarray(Image.open(os.path.join(raw, name + '.png')).convert('RGB')).astype(np.float32)
    a = a[:best_period(a, 0), :best_period(a, 1)]
    a = seamless(a)
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).resize((512, 512), Image.LANCZOS).save(
        os.path.join(OUT, out + '.jpg'), quality=88)


def cut(raw, name):
    im = Image.open(os.path.join(raw, name + '.png')).convert('RGBA')
    return im.crop(im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox())


def fit(im, w, h, pad=6):
    """scaled to fit the box keeping its shape, centred (the branch's stem end at the bottom edge)"""
    k = min((w - pad * 2) / im.width, (h - pad * 2) / im.height)
    im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
    c = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    c.alpha_composite(im, ((w - im.width) // 2, h - im.height - (0 if h > w * 1.5 else (h - im.height) // 2)))
    return c


def grey(im, mean=0.8):
    a = np.asarray(im).astype(np.float32)
    rgb, al = a[..., :3], a[..., 3]
    lum = rgb @ np.array([0.3, 0.59, 0.11], np.float32)
    m = lum[al > 128].mean()
    g = np.clip(lum / m * mean * 255, 0, 255)
    # a trace of the original hue stays, so the clump isn't flat grey under its tint
    rgb = g[..., None] * 0.85 + rgb / m * mean * 0.15 * (lum[..., None] / np.maximum(lum[..., None], 1))
    a[..., :3] = np.clip(rgb, 0, 255)
    return Image.fromarray(a.astype(np.uint8))


def bleed(im):
    """see-through pixels take the colour of the nearest foliage (a few blur-and-fill rounds)"""
    a = np.asarray(im).astype(np.float32)
    rgb, al = a[..., :3].copy(), a[..., 3] > 100
    have = al.copy()
    for r in (2, 4, 8, 16, 32, 64):
        w = Image.fromarray((have * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))
        w = np.asarray(w).astype(np.float32)[..., None] / 255
        c = np.stack([np.asarray(Image.fromarray(np.clip(rgb[..., i] * have, 0, 255).astype(np.uint8)).filter(
            ImageFilter.GaussianBlur(r))).astype(np.float32) for i in range(3)], -1)
        fill = (~have) & (w[..., 0] > 0.02)
        rgb[fill] = (c / np.maximum(w, 1e-3))[fill]
        have = have | fill
    a[..., :3] = rgb
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def main(raw):
    bark(raw, 'bark', 'tree_bark')
    bark(raw, 'birch', 'tree_birch')
    at = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    for n, (x0, y0, x1, y1) in BOX.items():
        im = fit(cut(raw, n), x1 - x0, y1 - y0)
        if n == 'leaves':
            im = grey(im)
        at.alpha_composite(im, (x0, y0))
    at = bleed(at)
    at.convert('RGB').save(os.path.join(OUT, 'tree_leaves.jpg'), quality=86)
    at.getchannel('A').save(os.path.join(OUT, 'tree_leaves_a.jpg'), quality=90)


def leaves_only(png):
    """puts a new leaf clump into the atlas, keeping the spruce branch and needle tuft that are there"""
    rgb = Image.open(os.path.join(OUT, 'tree_leaves.jpg')).convert('RGB')
    at = rgb.copy()
    at.putalpha(Image.open(os.path.join(OUT, 'tree_leaves_a.jpg')).convert('L'))
    x0, y0, x1, y1 = BOX['leaves']
    at.paste(Image.new('RGBA', (x1 - x0, y1 - y0), (0, 0, 0, 0)), (x0, y0))
    im = Image.open(png).convert('RGBA')
    im = grey(fit(im.crop(im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()), x1 - x0, y1 - y0))
    at.alpha_composite(im, (x0, y0))
    at = bleed(at)
    at.convert('RGB').save(os.path.join(OUT, 'tree_leaves.jpg'), quality=86)
    at.getchannel('A').save(os.path.join(OUT, 'tree_leaves_a.jpg'), quality=90)


if __name__ == '__main__':
    if sys.argv[1] == '--leaves':
        leaves_only(sys.argv[2])
    else:
        main(sys.argv[1])
