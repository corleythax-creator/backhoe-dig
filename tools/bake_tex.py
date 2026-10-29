"""Bakes the texture copies the game used to make at load time in the browser (a pixel loop over each picture held up the
start by many seconds): the ground pack's grime lifted to near white (terrain.js loadTex: 230 + (v - 128) x 0.6 per
channel), and grey copies of the ground dirt, the concrete and the granite brightened to a mean (truck.js greyDetail
callers: the dirt heaps, blocks and boulders). Run after changing any of those pictures:  python3 tools/bake_tex.py"""
import os
from PIL import Image, ImageStat
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = os.path.join(ROOT, 'textures')

def grey(src, dst, mean):
    im = Image.open(src).convert('RGB')
    r, g, b = im.split()
    l = Image.merge('RGB', (r, g, b)).convert('L', (0.3, 0.59, 0.11, 0))
    k = mean * 255 / max(1, ImageStat.Stat(l).mean[0])
    l = l.point(lambda v: min(255, int(v * k + 0.5)))
    l.convert('RGB').save(dst, quality=88)

for tier in ('low', 'med', 'high'):
    d = os.path.join(T, 'ground', tier)
    im = Image.open(os.path.join(d, 'grime.jpg')).convert('RGB')
    im.point(lambda v: min(255, max(0, int(230 + (v - 128) * 0.6 + 0.5)))).save(os.path.join(d, 'grime_lift.jpg'), quality=88)
    grey(os.path.join(d, 'dirt.jpg'), os.path.join(d, 'dirt_grey.jpg'), 0.8)
grey(os.path.join(T, 'concrete.jpg'), os.path.join(T, 'concrete_grey.jpg'), 0.85)
grey(os.path.join(T, 'granite.jpg'), os.path.join(T, 'granite_grey.jpg'), 0.8)
print('baked')
