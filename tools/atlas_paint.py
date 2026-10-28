# Atlas painter (docs/atlas): run in a folder holding data.json + tiles.png from tools/atlas_export.js
# (NODE_PATH=$(npm root -g) node tools/play.js --boot 8000 --eval "$(cat tools/atlas_export.js)", then split the result: img -> tiles.png, the rest -> data.json).
# Paints an artist's relief map of Corley's Island from the game's own data (data.json + tiles.png from export.js),
# extended past the play area to the lake shores and the mountains. Output: map.jpg (frame in FRAME, metres).
import json, math, sys, numpy as np, cv2
D = json.load(open('data.json'))
tiles = cv2.cvtColor(cv2.imread('tiles.png'), cv2.COLOR_BGR2RGB).astype(np.float32) / 255
FX0, FX1, FZ0, FZ1, S = -760, 760, -1020, 1480, 1.3          # the frame (m) and pixels per metre
W, H = int((FX1 - FX0) * S), int((FZ1 - FZ0) * S)
rng = np.random.default_rng(7)
WATER = D['WATER']
xs = FX0 + (np.arange(W) + .5) / S; zs = FZ0 + (np.arange(H) + .5) / S
X, Z = np.meshgrid(xs, zs)
PX0, PZ0, GS, NX, NZ = D['X0'], D['Z0'], D['GS'], D['NX'], D['NZ']
PX1, PZ1 = PX0 + NX * GS, PZ0 + NZ * GS
def P(x, z): return int(round((x - FX0) * S)), int(round((z - FZ0) * S))
ss = lambda a, b, x: np.clip((x - a) / (b - a), 0, 1) ** 2 * (3 - 2 * np.clip((x - a) / (b - a), 0, 1))

def noise(scale, seed, ridged=False):
    """value noise at a feature size of `scale` metres, -1..1"""
    r = np.random.default_rng(seed)
    gw, gh = int((FX1 - FX0) / scale) + 3, int((FZ1 - FZ0) / scale) + 3
    g = r.uniform(-1, 1, (gh, gw)).astype(np.float32)
    n = cv2.resize(g, (int(gw * scale * S), int(gh * scale * S)), interpolation=cv2.INTER_CUBIC)[:H, :W]
    return 1 - np.abs(n) * 2 if ridged else n
def fbm(base, seed, oct=5, ridged=False):
    t, a, tot = 0, 1, 0
    for o in range(oct):
        t = t + a * noise(base / 2 ** o, seed + o, ridged); tot += a; a *= .5
    return t / tot

# ---------- heights: the game's inside the play area, the edge carried outward plus hills and mountains outside ----------
hs = np.array(D['hs'], np.float32)
gi = np.clip((X - PX0) / GS - .5, 0, NX - 1).astype(np.float32); gj = np.clip((Z - PZ0) / GS - .5, 0, NZ - 1).astype(np.float32)
h = cv2.remap(hs, gi, gj, cv2.INTER_LINEAR)
inside = (X >= PX0) & (X < PX1) & (Z >= PZ0) & (Z < PZ1)
dout = np.maximum.reduce([PX0 - X, X - PX1, PZ0 - Z, Z - PZ1, np.zeros_like(X)])   # metres outside the play area
# soften the carried-out edge so the lake and the land bands run on naturally
hb = cv2.GaussianBlur(h, (0, 0), 6 * S)
h = np.where(inside, h, hb + (fbm(60, 3) * 1.5 + fbm(160, 5) * 7) * ss(0, 90, dout))
def ridged_mf(base, seed, oct=7):
    tot = np.zeros((H, W), np.float32); wgt = np.ones((H, W), np.float32); amp = 1.0; norm = 0
    for o in range(oct):
        n = noise(base / 2 ** o, seed + o); sig = (1 - np.abs(n)) ** 2 * wgt
        wgt = np.clip(sig * 2, 0, 1); tot += sig * amp; norm += amp; amp *= .5
    return tot / norm
ridge = np.clip(ridged_mf(520, 11) * 1.4, 0, 1) ** .8; rough = fbm(90, 21, 4)
north = ss(-650, -960, Z + fbm(200, 33, 3) * 60); south = ss(880, 1380, Z + fbm(200, 35, 3) * 60) ; sn1 = fbm(180, 31, 3) * 90; side = ss(540 + sn1, 760 + sn1, np.abs(X)) * ss(-500, -200, Z) * ss(1000, 600, Z)
mount = north * (40 + 300 * north) * (.55 + .45 * ridge) + south * (30 + 330 * south) * (.5 + .5 * ridge) + side * 140 * (.5 + .5 * ridge)
h = h + np.where(inside, 0, mount + rough * 8 * np.minimum(1, mount / 20))
# the south summit: a peak due south of town where the Summit Road climbs
h += 170 * (.55 + .45 * ridge) * np.exp(-(((X - 120) / 260) ** 2 + ((Z - 1330) / 200) ** 2)) * ss(860, 1100, Z)
np.save('h.npy', h)

# ---------- colours ----------
gx = np.gradient(h, axis=1) * S; gz = np.gradient(h, axis=0) * S
slope = np.sqrt(gx ** 2 + gz ** 2)
# hillshade, light from the north-west, with some exaggeration
ex = np.where(inside, 2.2, 1.6); nx_, nz_, ny_ = -gx * ex, -gz * ex, np.ones_like(h)
nl = np.sqrt(nx_ ** 2 + ny_ ** 2 + nz_ ** 2); L = np.array([-.62, .74, .1]); L = L / np.linalg.norm(L)
shade = np.clip((nx_ * L[0] + ny_ * L[1] + nz_ * L[2]) / nl, 0, 1)
flat = L[1]
img = np.zeros((H, W, 3), np.float32)
# inside: the game's ground colours
ti = ((X - PX0) * D['PX']).astype(np.float32); tj = ((Z - PZ0) * D['PX']).astype(np.float32)
tcol = cv2.remap(tiles, ti, tj, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
# outside: meadow, forest, rock and snow by height and slope
gm = inside & (h > WATER + 1) & (tcol[..., 1] > tcol[..., 0] + .1) & (tcol.mean(axis=2) > .3); meadow = np.median(tcol[gm], axis=0) * .97; forestc = np.array([.17, .30, .16]); rock = np.array([.52, .50, .47]); snow = np.array([.94, .95, .97]); sand = np.array([.84, .76, .56])
fmask = ss(.25, .45, .55 + fbm(140, 41) * 1.2 + .15 * (h > 20)) * ss(230, 160, h + fbm(40, 71) * 40) * ss(2.2, 1.4, slope) * ss(0, 50 + fbm(90, 43) * 45, dout)
out = meadow * (1 - fmask[..., None]) + forestc * fmask[..., None]
rk = np.clip(ss(1.1, 1.9, slope) * ss(60, 140, h) + ss(170, 260, h + fbm(40, 71) * 40), 0, 1)
out = out * (1 - rk[..., None]) + rock * rk[..., None]
sn = ss(290, 340, h + fbm(50, 61) * 30) * ss(1.9, 1.2, slope)
out = out * (1 - sn[..., None]) + snow * sn[..., None]
beach = ss(WATER + 2.2, WATER + .8, h) * (h > WATER)
out = out * (1 - beach[..., None]) + sand * beach[..., None]
blend = ss(0, 30, dout)[..., None]
land = tcol * (1 - blend) + out * blend
# a little colour noise, like brush strokes
br = fbm(18, 81, 3)[..., None] * .05 + fbm(5, 91, 2)[..., None] * .03
land = land * (1 + br)
lit = .55 + .75 * (shade / flat)
mt = ss(15, 120, h); lit = 1 + (lit - 1) * (1 + .3 * mt); lit = np.where(lit < 1, 1 - (1 - lit) * .75, lit); land = land * np.clip(lit, .48, 1.5)[..., None]
# ---------- water ----------
depth = np.clip(WATER - h, 0, 30)
deep = np.array([.07, .22, .36]); mid = np.array([.12, .38, .50]); shallow = np.array([.36, .62, .62])
t = ss(0, 2.5, depth)[..., None]; t2 = ss(2.5, 7, depth)[..., None]
water = shallow * (1 - t) + mid * t; water = water * (1 - t2) + deep * t2
rip = fbm(9, 101, 3); water = water * (1 + rip[..., None] * .05)
glint = np.clip(fbm(40, 111, 3) * 2 - .6, 0, 1) * .10 * ss(FZ1, FZ0, Z)
water = water + glint[..., None]
wet = h < WATER
foam = (ss(.5, 0, depth) * wet)
water = water * (1 - foam[..., None] * .5) + np.array([.92, .95, .93]) * foam[..., None] * .5
img = np.where(wet[..., None], water, land)
# atmospheric haze on the far mountains (top and bottom of the frame)
haze = (ss(-800, -1020, Z) * .16 + ss(1250, 1480, Z) * .12)[..., None]
img = img * (1 - haze) + np.array([.70, .78, .86]) * haze


# ---------- roads (asphalt in town, gravel on the islands and in the field) and the freight line ----------
canvas = (np.clip(img, 0, 1) * 255).astype(np.uint8).copy()
for r in D['roads']:
    pts = np.array([P(p[0], p[1]) for p in r['pts']], np.int32)
    town = np.mean([p[1] for p in r['pts']]) > 540
    if town:
        cv2.polylines(canvas, [pts], False, (196, 192, 182), max(1, int((r['w'] + 3.5) * S)), cv2.LINE_AA)
        cv2.polylines(canvas, [pts], False, (78, 80, 82), max(1, int(r['w'] * S)), cv2.LINE_AA)
    else:
        cv2.polylines(canvas, [pts], False, (150, 126, 92), max(1, int((r['w'] + .8) * S)), cv2.LINE_AA)
        cv2.polylines(canvas, [pts], False, (190, 164, 122), max(1, int(r['w'] * S)), cv2.LINE_AA)
rail = []
for a in np.linspace(math.radians(188), math.radians(344), 900):
    x, z = 800 * math.cos(a), 800 * math.sin(a)
    i, j = P(x, z)
    if 0 <= i < W and 0 <= j < H: rail.append((x, z, h[j, i]))
seg = []
for x, z, hh in rail + [(0, 0, 999)]:
    if hh < 22: seg.append(P(x, z))
    else:
        if len(seg) > 1:
            a_ = np.array(seg, np.int32)
            cv2.polylines(canvas, [a_], False, (120, 112, 100), int(7 * S), cv2.LINE_AA)
            cv2.polylines(canvas, [a_], False, (64, 54, 46), int(2.6 * S), cv2.LINE_AA)
            for e in (seg[0], seg[-1]): cv2.circle(canvas, e, int(4 * S), (30, 28, 26), -1, cv2.LINE_AA)
        seg = []
img = canvas.astype(np.float32) / 255

# ---------- trees: game trees plus painted canopy in the forests ----------
inside_forest = np.zeros((H, W), bool)
tc = tcol.mean(axis=2); g_ = tcol[..., 1] - tcol[..., 0]
inside_forest = inside & (tc < .30) & (g_ > .08) & (h > WATER + .5)
outside_forest = (~inside) & (fmask > .5) & (h > WATER + 1.5) & (sn < .2) & (rk < .4)
forest = inside_forest | outside_forest
crowns = []
step = 5.5
for zz in np.arange(FZ0, FZ1, step):
    for xx in np.arange(FX0, FX1, step):
        x = xx + rng.uniform(-2, 2); z = zz + rng.uniform(-2, 2)
        i, j = P(x, z)
        if 0 <= i < W and 0 <= j < H and forest[j, i]:
            crowns.append((x, z, rng.uniform(2.2, 3.6) * (1 - .4 * ss(150, 330, h[j, i])), rng.random()))
for x, z, r, k in D['trees']:
    crowns.append((x, z, max(1.8, r * 1.05), k))
crowns.sort(key=lambda c: c[1])
shadow = np.zeros((H, W), np.float32)
for x, z, r, k in crowns:
    i, j = P(x + r * .7, z + r * .8); cv2.circle(shadow, (i, j), max(1, int(r * S)), 1.0, -1, cv2.LINE_AA)
shadow = cv2.GaussianBlur(shadow, (0, 0), 1.2)
img = img * (1 - .45 * np.clip(shadow, 0, 1)[..., None])
greens = [(.16, .30, .14), (.20, .35, .16), (.13, .26, .14), (.24, .38, .18), (.28, .36, .15)]
autumn = [(.52, .40, .16), (.46, .28, .14), (.58, .50, .22)]
canvas = (np.clip(img, 0, 1) * 255).astype(np.uint8).copy()
for x, z, r, k in crowns:
    i, j = P(x, z); rp = max(1, int(r * S))
    if not (0 <= j < H and 0 <= i < W): continue
    hh = h[j, i]
    c = np.array(autumn[int(k * 30) % 3] if (k * 997) % 1 < .05 and hh < 150 else greens[int(k * 50) % 5])
    if hh > 150: c = c * .85 + np.array([.02, .03, .05])
    lit_ = .9 + .25 * shade[j, i] / flat
    cv2.circle(canvas, (i, j), rp, tuple(int(v) for v in np.clip(c * lit_ * 255, 0, 255)), -1, cv2.LINE_AA)
    hl = np.clip(c * lit_ * 1.35 + .03, 0, 1)
    cv2.circle(canvas, (i - max(1, rp // 3), j - max(1, rp // 3)), max(1, int(rp * .55)), tuple(int(v * 255) for v in hl), -1, cv2.LINE_AA)
img = canvas.astype(np.float32) / 255

# relief over the forests outside: a second, stronger hillshade so the ranges read under the trees
hb2 = cv2.GaussianBlur(h, (0, 0), 2.5 * S); g2x = np.gradient(hb2, axis=1) * S * 4; g2z = np.gradient(hb2, axis=0) * S * 4
n2 = np.sqrt(g2x ** 2 + g2z ** 2 + 1); sh2 = np.clip((-g2x * L[0] + L[1] - g2z * L[2]) / n2, 0, 1) / L[1]
rel = np.clip(1 + (sh2 - 1) * .55, .5, 1.35) * ss(5, 40, dout) + (1 - ss(5, 40, dout))
img = img * rel[..., None]
# ---------- causeways and bridges ----------
canvas = (np.clip(img, 0, 1) * 255).astype(np.uint8).copy()
def strip(b, hw, col, off=(0, 0), extra=0):
    ux, uz = b['ux'], b['uz']; px, pz = -uz, ux
    pts = []
    for a, s in ((0, -1), (b['len'], -1), (b['len'], 1), (0, 1)):
        x = b['x0'] + ux * a + px * s * (hw + extra) + off[0]; z = b['z0'] + uz * a + pz * s * (hw + extra) + off[1]
        pts.append(P(x, z))
    cv2.fillPoly(canvas, [np.array(pts, np.int32)], col, cv2.LINE_AA)
for b in D['causeways']:
    strip(b, b['hw'], (118, 112, 102), extra=2.2); strip(b, b['hw'], (170, 158, 136))
for b in D['bridges']:
    strip(b, b['hw'], (20, 40, 55), off=(2.5, 3.5), extra=.3)   # shadow on the water
    deck = (110, 82, 56) if b['temp'] or b['dock'] else (150, 52, 40) if b['foot'] else (196, 198, 196)
    rail = (80, 58, 40) if b['temp'] or b['dock'] else (110, 34, 28) if b['foot'] else (90, 94, 98)
    strip(b, b['hw'], rail, extra=.6); strip(b, b['hw'], deck)
img = canvas.astype(np.float32) / 255

# ---------- buildings: footprints raised into little blocks with roofs and shadows ----------
roofs = [(74, 78, 84), (128, 66, 52), (60, 72, 64), (96, 90, 84), (150, 82, 60), (58, 62, 72), (120, 112, 100)]
walls = [(214, 206, 190), (196, 180, 156), (186, 190, 192), (170, 120, 96), (222, 218, 208)]
canvas = (np.clip(img, 0, 1) * 255).astype(np.uint8).copy()
shadow = np.zeros((H, W), np.float32)
blds = []
for x, z, hx, hz, a, top, col in D['sol']:
    ht = top if (top is not None and 1.5 < top < 30) else 4.0
    if hx * hz < 2.5: continue
    c, s_ = math.cos(a), math.sin(a)
    corners = [(x + c * dx - s_ * dz, z + s_ * dx + c * dz) for dx, dz in ((-hx, -hz), (hx, -hz), (hx, hz), (-hx, hz))]
    blds.append((z, corners, ht, hash((round(x), round(z)))))
    sh = [P(cx + ht * .55, cz + ht * .65) for cx, cz in corners] + [P(cx, cz) for cx, cz in corners]
    cv2.fillPoly(shadow, [cv2.convexHull(np.array(sh, np.int32))], 1.0, cv2.LINE_AA)
shadow = cv2.GaussianBlur(shadow, (0, 0), 1.0)
canvas = (canvas * (1 - .42 * shadow[..., None])).astype(np.uint8)
lift = .32   # how far a roof rises up the page per metre of height (an oblique look)
for z, corners, ht, k in sorted(blds):
    base = [P(cx, cz) for cx, cz in corners]; roof = [P(cx, cz - ht * lift) for cx, cz in corners]
    wc = walls[k % len(walls)]
    for e in range(4):   # walls facing the viewer (south) show
        a1, a2 = e, (e + 1) % 4
        quad = np.array([base[a1], base[a2], roof[a2], roof[a1]], np.int32)
        cv2.fillPoly(canvas, [quad], tuple(int(v * .82) for v in wc), cv2.LINE_AA)
    rc = roofs[k % len(roofs)]
    cv2.fillPoly(canvas, [np.array(roof, np.int32)], rc, cv2.LINE_AA)
    # a ridge line along the longer side and a lit half
    r = np.array(roof, np.float32); m1 = (r[0] + r[3]) / 2; m2 = (r[1] + r[2]) / 2
    if np.linalg.norm(r[1] - r[0]) < np.linalg.norm(r[3] - r[0]): m1 = (r[0] + r[1]) / 2; m2 = (r[3] + r[2]) / 2
    half = np.array([r[0], r[1], m2, m1], np.int32) if np.linalg.norm(r[1] - r[0]) >= np.linalg.norm(r[3] - r[0]) else np.array([r[0], m1, m2, r[3]], np.int32)
    cv2.fillPoly(canvas, [half], tuple(min(255, int(v * 1.25 + 12)) for v in rc), cv2.LINE_AA)
    cv2.line(canvas, tuple(int(v) for v in m1), tuple(int(v) for v in m2), tuple(int(v * .7) for v in rc), 1, cv2.LINE_AA)
    cv2.polylines(canvas, [np.array(roof, np.int32)], True, (40, 36, 34), 1, cv2.LINE_AA)
img = canvas.astype(np.float32) / 255

# ---------- the painterly finish ----------
u8 = (np.clip(img, 0, 1) * 255).astype(np.uint8)
paint = cv2.edgePreservingFilter(u8, flags=1, sigma_s=12, sigma_r=.25)
img = .55 * u8.astype(np.float32) / 255 + .45 * paint.astype(np.float32) / 255
# ink-like edge darkening along strong colour changes
edges = cv2.Canny(cv2.GaussianBlur(u8, (0, 0), 1.2), 50, 120).astype(np.float32) / 255
edges = cv2.GaussianBlur(edges, (0, 0), .7)
img = img * (1 - .12 * edges[..., None])
# paper grain and a soft vignette
grain = rng.normal(0, 1, (H // 2, W // 2)).astype(np.float32); grain = cv2.resize(grain, (W, H)) * .018
img = img * (1 + grain[..., None])
vy, vx = np.ogrid[:H, :W]; vig = ((vx - W / 2) / (W / 2)) ** 2 + ((vy - H / 2) / (H / 2)) ** 2
img = img * (1 - .16 * np.clip(vig - .3, 0, 1))[..., None]
# warm the whole thing slightly, like late sun
img = img * np.array([1.03, 1.0, .96])
out = (np.clip(img, 0, 1) * 255).astype(np.uint8)
cv2.imwrite('map.jpg', cv2.cvtColor(out, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 86])
json.dump({'x0': FX0, 'x1': FX1, 'z0': FZ0, 'z1': FZ1, 'W': W, 'H': H}, open('frame.json', 'w'))
print('done', W, H, len(crowns), len(blds))
