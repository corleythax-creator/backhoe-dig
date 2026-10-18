"""Makes the material textures for the map editor from the raw OpenAI GPT Image renders.

Usage: python3 tools/textures.py RAW_DIR
       python3 tools/textures.py --extra RAW_DIR ID...   (textures outside the library, such as the drier stages of mud:
       just textures/<id>.jpg and its mean colour, printed; materials.js and the thumbnails are left alone)
Each RAW_DIR/<id>.png (1024 square) becomes textures/<id>.jpg (512 square, seamless), and all of them go into
textures/thumbs.jpg, one 96 px swatch per material in the order of MAT_LIST in js/materials.js. Writes each texture's
mean colour (sRGB, as the game's shader divides by it) into js/materials.js.
"""
import os, re, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT, SIZE, THUMB = os.path.join(ROOT, 'textures'), 512, 96


def best_period(a, axis):
    """the crop length (80-100% of the image) whose next row or column best matches the first, so the crop tiles"""
    n = a.shape[axis]
    first = np.take(a, 0, axis=axis)
    errs = [(np.abs(np.take(a, k, axis=axis) - first).mean(), k) for k in range(int(n * 0.8), n)]
    return min(errs)[1]


def seam_ratio(a, axis):
    """how far the wrap-around step stands out from the steps inside the image (1 is seamless)"""
    d = np.abs(np.diff(a, axis=axis)).mean()
    return np.abs(np.take(a, 0, axis=axis) - np.take(a, -1, axis=axis)).mean() / max(d, 1e-6)


def seamless(a, band=0.07):
    """hides what is left of the seam on each axis that still shows one: across a band at its edges, fade to the copy
    rolled by half along it. Patterns the crop already lined up are left alone (fading them would ghost the joints)"""
    for axis in (0, 1):
        if seam_ratio(a, axis) < 1.25:
            continue
        n = a.shape[axis]
        r = np.roll(a, n // 2, axis)
        t = np.clip(np.minimum(np.arange(n), np.arange(n)[::-1]) / (n * band), 0, 1)
        t = t * t * (3 - 2 * t)
        m = t[:, None, None] if axis == 0 else t[None, :, None]
        a = a * m + r * (1 - m)
    return a


def make(raw, mid):
    """RAW_DIR/<id>.png to the seamless textures/<id>.jpg; returns the image and its mean colour"""
    a = np.asarray(Image.open(os.path.join(raw, mid + '.png')).convert('RGB'), dtype=np.float64)
    a = a[:best_period(a, 0), :best_period(a, 1)]
    im = Image.fromarray(np.uint8(np.clip(a, 0, 255))).resize((SIZE, SIZE), Image.LANCZOS)
    a = seamless(np.asarray(im, dtype=np.float64))
    im = Image.fromarray(np.uint8(np.clip(np.round(a), 0, 255)))
    im.save(os.path.join(OUT, mid + '.jpg'), quality=86, optimize=True)
    c = np.asarray(im, dtype=np.float64).mean(axis=(0, 1)) / 255
    print(f"{mid:16s} c:[{c[0]:.3f},{c[1]:.3f},{c[2]:.3f}]")
    return im, c


def main(raw):
    js = open(os.path.join(ROOT, 'js', 'materials.js')).read()
    ids = re.findall(r"\{id:'(\w+)'", js)
    os.makedirs(OUT, exist_ok=True)
    means = {}
    sheet = Image.new('RGB', (THUMB * len(ids), THUMB))
    for n, mid in enumerate(ids):
        im, means[mid] = make(raw, mid)
        sheet.paste(im.resize((THUMB, THUMB), Image.LANCZOS), (n * THUMB, 0))
    sheet.save(os.path.join(OUT, 'thumbs.jpg'), quality=84, optimize=True)
    # write the means into js/materials.js
    js = re.sub(r"(\{id:'(\w+)'.*?c:)\[[^\]]*\]", lambda m: m.group(1) + '[' + ','.join(f'{v:.3f}' for v in means[m.group(2)]) + ']', js)
    open(os.path.join(ROOT, 'js', 'materials.js'), 'w').write(js)


if __name__ == '__main__':
    if sys.argv[1] == '--extra':
        os.makedirs(OUT, exist_ok=True)
        for mid in sys.argv[3:]:
            make(sys.argv[2], mid)
    else:
        main(sys.argv[1])
