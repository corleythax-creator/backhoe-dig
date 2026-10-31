"""Makes the paved streets' brick and cobblestone surfaces from CC0 photo scans (ambientCG), with the height map the
relief shader marches through (mainland.js, ST_SURF).

Usage: python3 tools/street_tex.py [ID ...]     (no ids: every surface in SCANS below)
For each surface it downloads the scan's 1K-JPG set (https://ambientcg.com/get?file=<scan>_1K-JPG.zip) into a scratch
folder (CC0_CACHE, default /tmp/cc0) and writes, at 1024 px:
  textures/street_<id>.jpg     the colour map with half its ambient occlusion baked in (Low and Medium draw only this)
  textures/street_<id>_n.jpg   its NormalGL map (three.js reads it in the street's own frame)
  textures/street_<id>_m.jpg   packed: R ambient occlusion, G roughness, B height (stretched to the full 0 to 1, 1 on top)
then prints the colour map's mean colour for ST_SURF. Turned so the image's rows run across the street (u across,
v along). Credit a new scan in CREDITS.md.
"""
import io, os, re, sys, subprocess, zipfile
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEX = os.path.join(ROOT, 'textures')
CACHE = os.environ.get('CC0_CACHE', '/tmp/cc0')
SIZE = 1024
# surface id: ambientCG scan (its real tile size is ST_SURF's ft, from the scan's page)
SCANS = {'brick': 'PavingStones092', 'cobble': 'PavingStones119', 'fan': 'PavingStones151', 'oldbrick': 'PavingStones129'}
MAPS = ('Color', 'NormalGL', 'Roughness', 'AmbientOcclusion', 'Displacement')


def fetch(scan):
    os.makedirs(CACHE, exist_ok=True)
    z = os.path.join(CACHE, scan + '_1K-JPG.zip')
    if not os.path.exists(z):
        subprocess.run(['curl', '-sSLf', '-o', z, f'https://ambientcg.com/get?file={scan}_1K-JPG.zip'], check=True)
    out = {}
    with zipfile.ZipFile(z) as f:
        for n in f.namelist():
            m = re.fullmatch(re.escape(scan) + r'_1K-JPG_(' + '|'.join(MAPS) + r')\.jpg', os.path.basename(n))
            if m:
                out[m.group(1)] = Image.open(io.BytesIO(f.read(n))).convert('RGB' if m.group(1) in ('Color', 'NormalGL') else 'L')
    missing = set(MAPS) - set(out)
    if missing:
        sys.exit(f'{scan}: no {", ".join(sorted(missing))} map in the download')
    return {k: v.resize((SIZE, SIZE), Image.LANCZOS) for k, v in out.items()}


def make(sid):
    scan = SCANS[sid]
    m = fetch(scan)
    ao = np.asarray(m['AmbientOcclusion'], dtype=np.float64) / 255
    col = np.asarray(m['Color'], dtype=np.float64) * (0.5 + 0.5 * ao)[..., None]
    Image.fromarray(np.clip(col, 0, 255).astype(np.uint8)).save(os.path.join(TEX, f'street_{sid}.jpg'), quality=86, optimize=True)
    m['NormalGL'].save(os.path.join(TEX, f'street_{sid}_n.jpg'), quality=88, optimize=True)
    h = np.asarray(m['Displacement'], dtype=np.float64)
    lo, hi = np.percentile(h, 0.5), np.percentile(h, 99.5)
    h = np.clip((h - lo) / max(1e-6, hi - lo), 0, 1) * 255
    packed = np.stack([ao * 255, np.asarray(m['Roughness'], dtype=np.float64), h], axis=-1)
    Image.fromarray(np.clip(packed, 0, 255).astype(np.uint8)).save(os.path.join(TEX, f'street_{sid}_m.jpg'), quality=90, optimize=True)
    c = col.mean(axis=(0, 1)) / 255
    print(f'{sid:8s} <- {scan:16s} c:[{c[0]:.3f},{c[1]:.3f},{c[2]:.3f}]')


if __name__ == '__main__':
    for sid in sys.argv[1:] or SCANS:
        make(sid)
