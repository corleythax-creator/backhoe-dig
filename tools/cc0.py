"""Swaps material library textures for CC0 photo scans from ambientCG or Poly Haven, with the scan's own relief and sheen maps.

Usage: python3 tools/cc0.py [ID ...]     (no ids: every material in SCANS below)
For each library id it downloads the scan's 1K-JPG set (https://ambientcg.com/get?file=<scan>_1K-JPG.zip) into a
scratch folder (CC0_CACHE, default /tmp/cc0), and writes, at the library's 512 px:
  textures/<id>.jpg     the scan's colour map
  textures/<id>_n.jpg   its NormalDX map (green points down the image, south on the ground, as tools/pbr.py makes them)
  textures/<id>_r.jpg   its roughness map
then puts the texture's mean colour (and the scan's real tile size in feet, when given) into the id's MAT_LIST entry in
js/materials.js, and its 96 px swatch into textures/thumbs.jpg. Credit a new scan in CREDITS.md. Per material:
  scan  the ambientCG asset id, or ph:<id> for a Poly Haven texture (its 1k diff, nor_dx and rough maps)
  ft    feet the tile covers in the game (None keeps the entry's own)
  then optional extras: 'T' to transpose it (corner to corner), so stripes across the scan run down it; a number to
        scale its colour to that mean brightness (0-1), for a scan shot darker or lighter than the real thing
A scan's maps replace tools/pbr.py's for that id: don't run pbr.py on these ids (it would remake them from the colour).
"""
import io, os, re, sys, subprocess, zipfile
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEX, JS = os.path.join(ROOT, 'textures'), os.path.join(ROOT, 'js', 'materials.js')
CACHE = os.environ.get('CC0_CACHE', '/tmp/cc0')
SIZE, THUMB = 512, 96
# library id: (ambientCG scan or ph:<Poly Haven id>, feet per tile or None[, 'T' to transpose])
SCANS = {
    'gravel': ('Gravel041', 4), 'riverrock': ('Rocks022', 2.5), 'sand': ('Ground080', 8), 'dirt2': ('Ground048', 4.6),
    'clay': ('Ground066', 6), 'mulch': ('Ground082S', 4), 'granite': ('Rock023', 8),
    'concrete': ('Concrete034', 3.6), 'concrete_old': ('Concrete036', 8), 'aggregate': ('Concrete025', 4),
    'pavers': ('PavingStones099', 6.6), 'asphalt': ('Asphalt033', 8.2),
    'cobble': ('PavingStones070', 3.8), 'herringbone': ('PavingStones118', 5.7), 'flagstone': ('Bricks075A', 6.6),
    'brick': ('Bricks085', 7.9), 'brick_old': ('Bricks097', 6),
    'planks': ('Planks029S', 7.9), 'diamond': ('DiamondPlate009', 3), 'corrugated': ('CorrugatedSteel009', None, 'T'),
    'concrete_broom': ('ph:brushed_concrete_04', 6.6, 0.64), 'plywood': ('ph:plywood', 1.64, 0.66), 'rustplate': ('ph:rust_coarse_01', 7.2),
    'cmu': ('ph:concrete_block_wall', 5.33, 0.5), 'shingles': ('ph:grey_roof_01', 26),
    'grass2': ('Grass006', 4), 'grating': ('MetalWalkway004', 3), 'fabric': ('Fabric039', 2, 0.15)}
PH = {'Color': 'diff', 'NormalDX': 'nor_dx', 'Roughness': 'rough'}


def fetch_ph(scan):
    """a Poly Haven texture's 1k jpg maps (downloaded once into CACHE), as fetch gives them"""
    os.makedirs(CACHE, exist_ok=True)
    out = {}
    for key, part in PH.items():
        f = os.path.join(CACHE, f'{scan}_{part}_1k.jpg')
        if not os.path.exists(f):
            subprocess.run(['curl', '-sSLf', '-o', f, f'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/{scan}/{scan}_{part}_1k.jpg'], check=True)
        out[key] = Image.open(f).convert('L' if key == 'Roughness' else 'RGB')
    return out


def fetch(scan):
    """the scan's 1K-JPG zip (downloaded once into CACHE); returns {map name: image} for Color, NormalDX, Roughness"""
    if scan.startswith('ph:'):
        return fetch_ph(scan[3:])
    os.makedirs(CACHE, exist_ok=True)
    z = os.path.join(CACHE, scan + '_1K-JPG.zip')
    if not os.path.exists(z):
        subprocess.run(['curl', '-sSLf', '-o', z, f'https://ambientcg.com/get?file={scan}_1K-JPG.zip'], check=True)
    out = {}
    with zipfile.ZipFile(z) as f:
        for n in f.namelist():
            m = re.fullmatch(re.escape(scan) + r'_1K-JPG_(Color|NormalDX|Roughness|Opacity)\.jpg', os.path.basename(n))
            if m:
                out[m.group(1)] = Image.open(io.BytesIO(f.read(n))).convert('RGB' if m.group(1) in ('Color', 'NormalDX') else 'L')
    missing = {'Color', 'NormalDX', 'Roughness'} - set(out)
    if missing:
        sys.exit(f'{scan}: no {", ".join(sorted(missing))} map in the download')
    return out


def make(mid, js):
    scan, ft, *extra = SCANS[mid]
    maps = fetch(scan)
    lift = next((e for e in extra if not isinstance(e, str)), None)
    if lift:
        a = np.asarray(maps['Color'], dtype=np.float64)
        maps['Color'] = Image.fromarray(np.uint8(np.clip(a * (lift * 255 / a.mean()), 0, 255)))
    if 'Opacity' in maps:
        # an open grate or mesh: its holes show deep shadow (the ground has no see-through), flat and rough
        o = np.asarray(maps.pop('Opacity'), dtype=np.float64)[..., None] / 255
        mix = lambda k, under: Image.fromarray(np.uint8(np.squeeze(np.asarray(maps[k], dtype=np.float64) * (o if maps[k].mode == 'RGB' else o[..., 0]) + np.array(under) * (1 - (o if maps[k].mode == 'RGB' else o[..., 0])))))
        maps = {'Color': mix('Color', [22, 20, 18]), 'NormalDX': mix('NormalDX', [128, 128, 255]), 'Roughness': mix('Roughness', 240)}
    if 'T' in extra:
        # a transpose swaps the normal's east and south parts too
        maps = {k: v.transpose(Image.TRANSPOSE) for k, v in maps.items()}
        r, g, b = maps['NormalDX'].split()
        maps['NormalDX'] = Image.merge('RGB', (g, r, b))
    for key, suf in (('Color', ''), ('NormalDX', '_n'), ('Roughness', '_r')):
        maps[key].resize((SIZE, SIZE), Image.LANCZOS).save(os.path.join(TEX, mid + suf + '.jpg'), quality=86, optimize=True)
    im = Image.open(os.path.join(TEX, mid + '.jpg'))
    c = np.asarray(im, dtype=np.float64).mean(axis=(0, 1)) / 255
    def entry(m):
        s = re.sub(r'c:\[[^\]]*\]', 'c:[' + ','.join(f'{v:.3f}' for v in c) + ']', m.group(0))
        return re.sub(r'ft:[\d.]+', f'ft:{ft:g}', s) if ft else s
    js, n = re.subn(r"\{id:'" + mid + r"'[^}]*\}", entry, js)
    if n != 1:
        sys.exit(f'{mid}: not found in MAT_LIST')
    print(f'{mid:14s} <- {scan:16s} c:[{c[0]:.3f},{c[1]:.3f},{c[2]:.3f}]' + (f' ft:{ft:g}' if ft else ''))
    return js, im


def main(ids):
    js = open(JS).read()
    order = re.findall(r"\{id:'(\w+)'", js[js.index('const MAT_LIST'):js.index('];', js.index('const MAT_LIST'))])
    sheet = Image.open(os.path.join(TEX, 'thumbs.jpg')).convert('RGB')
    for mid in ids:
        js, im = make(mid, js)
        sheet.paste(im.resize((THUMB, THUMB), Image.LANCZOS), (order.index(mid) * THUMB, 0))
    sheet.save(os.path.join(TEX, 'thumbs.jpg'), quality=84, optimize=True)
    open(JS, 'w').write(js)


if __name__ == '__main__':
    main(sys.argv[1:] or list(SCANS))
