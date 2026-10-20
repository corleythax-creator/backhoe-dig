"""Makes the relief (normal) and sheen (roughness) maps of the material library from each material's own texture.

Usage: python3 tools/pbr.py [ID ...]     (no ids: every material in PBR below)
For textures/<id>.jpg it writes textures/<id>_n.jpg (a tangent-space normal map, x east and y south on the ground, as
the ground shader in js/materials.js reads it) and textures/<id>_r.jpg (roughness, the shader reads 255 minus it as
the sheen). Height is the texture's own brightness, lightly blurred and stretched, so light stones, bricks and bars
stand up and dark joints, fines and holes sit low; the wrap-around differences keep the tile seamless. Per material:
  blur  Gaussian blur radius in pixels (removes the jpeg grain)
  k     how steep the relief is (slope per unit of height); the game's Material relief tuning scales it live
  lo hi roughness at the highest and the lowest points (lower is glossier); rain and the tuning scale the sheen
A material uses them when its entry in MAT_LIST has pbr:1 (Material relief setting, High graphics). Editing a number
here and running this again is the way to retune a material's look; it never touches the colour texture.
"""
import os, sys
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEX = os.path.join(ROOT, 'textures')
# id: (blur, k, roughness at the highest points, roughness at the lowest)
PBR = {
    'gravel': (0.8, 6, .55, .90), 'gravel_wet': (0.8, 6, .30, .75), 'riverrock': (1.0, 6, .35, .80),
    'sand': (0.8, 3, .80, .95), 'dirt2': (1.0, 4, .80, .95), 'clay': (1.2, 3.5, .70, .90), 'mulch': (1.0, 5, .85, .95),
    'granite': (0.8, 4, .30, .70),
    'tree_bark': (0.8, 7, .75, .95), 'tree_birch': (0.8, 4, .55, .85),
    'concrete': (1.0, 2, .60, .80), 'concrete_broom': (1.0, 3, .60, .80), 'concrete_old': (1.0, 3, .65, .85),
    'aggregate': (0.8, 5, .40, .80), 'pavers': (1.0, 4, .55, .80), 'cmu': (1.0, 4, .60, .85), 'asphalt': (0.8, 4, .70, .90),
    'diamond': (1.0, 6, .30, .55), 'rustplate': (1.0, 5, .40, .70), 'corrugated': (1.2, 6, .35, .55),
    'grating': (0.6, 8, .35, .60), 'rebar': (0.6, 8, .35, .60),
    'brick': (1.0, 5, .55, .85), 'brick_old': (1.0, 5, .60, .90), 'herringbone': (1.0, 5, .55, .85),
    'cobble': (0.9, 6, .50, .80), 'flagstone': (1.0, 5, .50, .80),
    'plywood': (1.0, 2, .55, .75), 'planks': (1.0, 3, .50, .75), 'shingles': (1.0, 5, .60, .85)}


def make(mid):
    blur, k, lo, hi = PBR[mid]
    im = Image.open(os.path.join(TEX, mid + '.jpg')).convert('L')
    h = np.asarray(im.filter(ImageFilter.GaussianBlur(blur)), dtype=np.float64) / 255
    a, b = np.percentile(h, 2), np.percentile(h, 98)
    h = np.clip((h - a) / max(b - a, 1e-6), 0, 1)
    dx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * 0.5
    dz = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * 0.5
    n = np.dstack([-dx * k, -dz * k, np.ones_like(h)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    Image.fromarray(np.uint8(np.clip((n * 0.5 + 0.5) * 255, 0, 255))).save(os.path.join(TEX, mid + '_n.jpg'), quality=86, optimize=True)
    r = hi - (hi - lo) * h
    Image.fromarray(np.uint8(np.clip(r, 0, 1) * 255)).save(os.path.join(TEX, mid + '_r.jpg'), quality=86, optimize=True)
    print(f"{mid:16s} relief {k:<4} roughness {lo:.2f}-{hi:.2f} (mean {r.mean():.2f})")


# the natural ground's relief (High graphics): textures/ground/dirt_n.jpg and grass_n.jpg at 1024 px, from the High
# ground pack's colour textures (no sheen map; the ground has its own wet look). Run: python3 tools/pbr.py ground
GROUND = {'dirt': (1.2, 4, .80, .95), 'grass': (1.0, 3, .80, .95)}


def make_ground():
    for n, v in GROUND.items():
        mid = 'ground/high/' + n
        PBR[mid] = v
        make(mid)
        Image.open(os.path.join(TEX, mid + '_n.jpg')).resize((1024, 1024), Image.LANCZOS).save(os.path.join(TEX, 'ground', n + '_n.jpg'), quality=86, optimize=True)
        os.remove(os.path.join(TEX, mid + '_n.jpg'))
        os.remove(os.path.join(TEX, mid + '_r.jpg'))


if __name__ == '__main__':
    if sys.argv[1:] == ['ground']:
        make_ground()
    else:
        for mid in (sys.argv[1:] or PBR):
            make(mid)
