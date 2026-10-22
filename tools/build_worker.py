# Corley's Island: builds models/worker.glb, the site worker on foot, from MakeHuman's CC0 assets.
# A rigged man (MakeHuman base mesh and its game_engine skeleton, MPFB2 in Blender) in a weathered middle-aged skin with
# stubble, short hair, a T-shirt and jeans, work boots, plus a hi-vis safety vest and a hard hat made here. The vest is
# the shirt without its sleeves, pushed out over it and given thickness; its colours (fluorescent yellow-green, two
# reflective bands round the body and two over the shoulders) are painted into its texture from where each texel sits on
# the body. The hat is a cap-style shell with a front peak and a ridge, bound to the head bone.
#
# Needs Blender 4.2+ with the MPFB2 extension and the "makehuman_system_assets" and "skins02" CC0 asset packs in MPFB's
# user data folder (https://static.makehumancommunity.org/assets/assetpacks/index.html). Run:
#   blender -b --python tools/build_worker.py -- <out.glb>
# then pack it for the game with tools/pack_worker.js (README "Worker model").
# The game drives the bones itself (js/walker.js); the file holds no animation.
import importlib, sys, os, math
import bpy, bmesh
import numpy as np
from mathutils import Vector


def di(p, k):
    for m in list(sys.modules):
        if m.endswith(p):
            return getattr(importlib.import_module(m), k)
    raise ValueError(p)


HumanService = di("mpfb.services.humanservice", "HumanService")
AssetService = di("mpfb.services.assetservice", "AssetService")
ExportService = di("mpfb.services.exportservice", "ExportService")
ObjectService = di("mpfb.services.objectservice", "ObjectService")

OUT = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "/tmp/worker.glb"
# the top of his head stands 5 ft 10 in (WK_H in walker.js)
HEIGHT = 1.78

for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)

# a man in his late thirties, a little more muscle and weight than average
macros = {"gender": 1.0, "age": 0.62, "muscle": 0.62, "weight": 0.58, "proportions": 0.6, "height": 0.45,
          "cupsize": 0.5, "firmness": 0.5, "race": {"asian": 0.0, "caucasian": 1.0, "african": 0.0}}
base = HumanService.create_human(macro_detail_dict=macros)
HumanService.set_character_skin(AssetService.find_asset_absolute_path(
    "jartur69_middleage_slavic_male_with_genitals_and_beard.mhmat", asset_subdir="skins"), base, skin_type="GAMEENGINE")
HumanService.add_builtin_rig(base, "game_engine")
for sub, f, t in [("eyes", "high-poly.mhclo", "Eyes"), ("eyebrows", "eyebrow001.mhclo", "Eyebrows"),
                  ("eyelashes", "eyelashes01.mhclo", "Eyelashes"), ("hair", "short02.mhclo", "Hair"),
                  ("clothes", "male_casualsuit06.mhclo", "Clothes"), ("clothes", "shoes03.mhclo", "Clothes")]:
    HumanService.add_mhclo_asset(AssetService.find_asset_absolute_path(f, asset_subdir=sub), base, asset_type=t,
                                 subdiv_levels=0, material_type="GAMEENGINE")

root = ExportService.create_character_copy(base, name_suffix="_x")
xbase = ObjectService.find_object_of_type_amongst_nearest_relatives(root, "Basemesh")
ExportService.bake_modifiers_remove_helpers(xbase, bake_masks=True, bake_subdiv=False, remove_helpers=True, also_proxy=True)
for o in list(bpy.data.objects):
    if o != root and o.parent != root:
        bpy.data.objects.remove(o)
parts = [o for o in root.children if o.type == 'MESH']
# bake the body's shape (its macro targets are shape keys) into the mesh
for o in parts:
    if o.data.shape_keys:
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.shape_key_remove(all=True, apply_mix=True)
arm = root
bone = {b.name: b for b in arm.data.bones}


def world_verts(o):
    return np.array([(o.matrix_world @ v.co)[:] for v in o.data.vertices])


def apply_mods(o):
    bpy.context.view_layer.objects.active = o
    for m in list(o.modifiers):
        if m.type != 'ARMATURE':
            bpy.ops.object.modifier_apply(modifier=m.name)


def part(key):
    for o in parts:
        if key in o.name.lower():
            return o
    raise KeyError(key)


body = xbase
P = world_verts(body)
top = P[:, 2].max()
print("HEIGHT", top)


def gw(o, names):
    """per vertex: summed weight of the named vertex groups"""
    idx = {o.vertex_groups[n].index for n in names if n in o.vertex_groups}
    w = np.zeros(len(o.data.vertices))
    for v in o.data.vertices:
        for g in v.groups:
            if g.group in idx:
                w[v.index] += g.weight
    return w


def set_group(o, vids, name, weight=1.0):
    g = o.vertex_groups.get(name) or o.vertex_groups.new(name=name)
    g.add(list(map(int, vids)), weight, 'REPLACE')


def new_mat(name, img=None, color=(1, 1, 1, 1), rough=0.6, metal=0.0, emit=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bs = m.node_tree.nodes["Principled BSDF"]
    bs.inputs["Base Color"].default_value = color
    bs.inputs["Roughness"].default_value = rough
    bs.inputs["Metallic"].default_value = metal
    if img:
        t = m.node_tree.nodes.new("ShaderNodeTexImage")
        t.image = img
        m.node_tree.links.new(t.outputs["Color"], bs.inputs["Base Color"])
    return m


# ---------- the hi-vis vest: the shirt above the belt, without sleeves ----------
suit = part("casualsuit")
apply_mods(suit)
vest = suit.copy()
vest.data = suit.data.copy()
vest.name = "vest"
bpy.context.collection.objects.link(vest)
pel = (arm.matrix_world @ bone["pelvis"].head_local).z
sh = (arm.matrix_world @ bone["upperarm_l"].head_local)
print("PELVIS", pel, "SHOULDER", sh)
# the shirt and jeans are one mesh: cut it straight across above the jeans' waistband, straight down at the armholes,
# and in a V at the front of the neck
hem = pel + 0.06
xa = abs(sh.x) - 0.035
zv = sh.z - 0.15
bm = bmesh.new()
bm.from_mesh(vest.data)


def cut(co, no, front=None):
    g = bm.verts[:] + bm.edges[:] + bm.faces[:]
    if front is not None:
        fs = [f for f in bm.faces if f.calc_center_median().y < 0.0 and (f.calc_center_median().x > 0) == front]
        g = list({v for f in fs for v in f.verts}) + list({e for f in fs for e in f.edges}) + fs
    bmesh.ops.bisect_plane(bm, geom=g, plane_co=co, plane_no=no, clear_outer=True)


cut((0, 0, hem), (0, 0, -1))
cut((xa, 0, 0), (1, 0, 0))
cut((-xa, 0, 0), (-1, 0, 0))
# split down the middle first, so each side's V cut stays on its own side
bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, 0), plane_no=(1, 0, 0))
for sgn in (1, -1):
    n = Vector((-0.2 * sgn, 0, 0.075)).normalized()
    cut((0, 0, zv), n, front=sgn > 0)
# keep the biggest piece only (stray bits of collar or waistband)
bm.verts.ensure_lookup_table()
seen, best = set(), []
for v in bm.verts:
    if v in seen:
        continue
    comp, st = [], [v]
    seen.add(v)
    while st:
        a = st.pop()
        comp.append(a)
        for e in a.link_edges:
            b = e.other_vert(a)
            if b not in seen:
                seen.add(b)
                st.append(b)
    if len(comp) > len(best):
        best = comp
keep = set(best)
bmesh.ops.delete(bm, geom=[v for v in bm.verts if v not in keep], context='VERTS')
bm.normal_update()
# out over the shirt, loose like a vest
for v in bm.verts:
    v.co += v.normal * 0.013
bm.to_mesh(vest.data)
bm.free()
vest.data.materials.clear()
sol = vest.modifiers.new("thick", 'SOLIDIFY')
sol.thickness = 0.004
sol.offset = 1
bpy.context.view_layer.objects.active = vest
bpy.ops.object.modifier_move_to_index(modifier="thick", index=0)
bpy.ops.object.modifier_apply(modifier="thick")
# fresh UVs, then paint the texture from where each texel sits on the body
bpy.ops.object.select_all(action='DESELECT')
vest.select_set(True)
bpy.context.view_layer.objects.active = vest
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.02)
bpy.ops.object.mode_set(mode='OBJECT')

N = 1024
img = np.zeros((N, N, 3))
fill = np.zeros((N, N), bool)
me = vest.data
me.calc_loop_triangles()
uvl = me.uv_layers.active.data
VW = world_verts(vest)
cx = 0.0
zb1, zb2 = pel + 0.12, pel + 0.27       # the two bands round the body
xs = abs(sh.x) * 0.55                    # the shoulder bands, front and back
rng = np.random.default_rng(3)
noise = rng.normal(0, 1, (N, N))
for t in me.loop_triangles:
    uv = np.array([uvl[l].uv[:] for l in t.loops]) * (N - 1)
    wp = VW[list(t.vertices)]
    nz = t.normal
    x0, y0 = np.floor(uv.min(0)).astype(int) - 1
    x1, y1 = np.ceil(uv.max(0)).astype(int) + 1
    x0, y0 = max(x0, 0), max(y0, 0)
    x1, y1 = min(x1, N - 1), min(y1, N - 1)
    xx, yy = np.meshgrid(np.arange(x0, x1 + 1), np.arange(y0, y1 + 1))
    a, b, c = uv
    d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
    if abs(d) < 1e-9:
        continue
    l1 = ((b[1] - c[1]) * (xx - c[0]) + (c[0] - b[0]) * (yy - c[1])) / d
    l2 = ((c[1] - a[1]) * (xx - c[0]) + (a[0] - c[0]) * (yy - c[1])) / d
    l3 = 1 - l1 - l2
    m = (l1 > -0.04) & (l2 > -0.04) & (l3 > -0.04)
    if not m.any():
        continue
    p = l1[..., None] * wp[0] + l2[..., None] * wp[1] + l3[..., None] * wp[2]
    X, Y, Z = p[..., 0], p[..., 1], p[..., 2]
    band = (np.abs(Z - zb1) < 0.025) | (np.abs(Z - zb2) < 0.025) | ((np.abs(np.abs(X) - xs) < 0.025) & (Z > zb2 - 0.02))
    zip_ = (np.abs(X - cx) < 0.006) & (Y < 0)
    col = np.empty(p.shape)
    col[:] = (0.80, 0.93, 0.12)
    col[band] = (0.88, 0.89, 0.87)
    col[zip_] = (0.18, 0.19, 0.18)
    # a day's grime: darker low down and at the front
    g = np.clip((zb1 + 0.05 - Z) * 1.5, 0, 0.1)
    col *= (1 - g)[..., None]
    img[yy[m], xx[m]] = col[m]
    fill[yy[m], xx[m]] = True
# the knit and wear
img *= (1 + 0.035 * noise)[..., None]
# grow the painted texels out past the UV islands' edges, so filtering never reaches the unpainted black
for _ in range(6):
    acc, cnt = np.zeros_like(img), np.zeros((N, N))
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        acc += np.roll(np.roll(img * fill[..., None], dy, 0), dx, 1)
        cnt += np.roll(np.roll(fill, dy, 0), dx, 1)
    grow = ~fill & (cnt > 0)
    img[grow] = acc[grow] / cnt[grow][:, None]
    fill |= grow
img = np.clip(img, 0, 1)
im = bpy.data.images.new("vest_diffuse", N, N)
px = np.ones((N, N, 4))
px[..., :3] = img ** 2.2
im.pixels.foreach_set(px.astype(np.float32).ravel())
im.filepath_raw = "/tmp/vest_diffuse.png"
im.file_format = 'PNG'
im.save()
vest.data.materials.append(new_mat("vest", im, rough=0.85))

# ---------- the hard hat, on the head bone ----------
hw = gw(body, ["head"])
H = P[hw > 0.9]
hx = (H[:, 0].max() - H[:, 0].min()) / 2
hy = (H[:, 1].max() - H[:, 1].min()) / 2
hc = Vector(((H[:, 0].max() + H[:, 0].min()) / 2, (H[:, 1].max() + H[:, 1].min()) / 2, H[:, 2].max()))
print("HEAD", hx, hy, hc)
bm = bmesh.new()
R, S = 40, 14
ax, ay, az = hx + 0.022, hy + 0.024, 0.12      # shell half-width, half-length, height above its rim
rim_z = hc.z + 0.045 - az
rings = []
for i in range(S + 1):
    ph = (i / S) * math.pi / 2           # 0 at the top, pi/2 at the rim
    ring = []
    for j in range(R):
        th = j / R * 2 * math.pi            # 0 at the front (-y)
        sx, sy = math.sin(th), -math.cos(th)
        rr = math.sin(ph)
        x, y = ax * rr * sx, ay * rr * sy
        z = rim_z + az * math.cos(ph)
        # the ridge along the crown, front to back
        z += 0.007 * math.exp(-(x / 0.014) ** 2) * math.cos(ph) ** 0.5
        ring.append(bm.verts.new((hc.x + x, hc.y + y, z)))
    rings.append(ring)
# the brim: a narrow lip all round and the peak out front
for k, (out, dz) in enumerate([(0.012, -0.004), (0.016, -0.008)]):
    ring = []
    for j in range(R):
        th = j / R * 2 * math.pi
        sx, sy = math.sin(th), -math.cos(th)
        front = max(0.0, math.cos(th)) ** 2.5
        o = out + 0.045 * front * (k + 1) / 2
        x, y = (ax + o) * sx, (ay + o) * sy
        ring.append(bm.verts.new((hc.x + x, hc.y + y, rim_z + dz - 0.012 * front * k)))
    rings.append(ring)
top_v = bm.verts.new((hc.x, hc.y, rim_z + az + 0.007))
for j in range(R):
    bm.faces.new((top_v, rings[1][j], rings[1][(j + 1) % R]))
for i in range(1, len(rings) - 1):
    for j in range(R):
        a, b = rings[i][j], rings[i][(j + 1) % R]
        c, d = rings[i + 1][(j + 1) % R], rings[i + 1][j]
        bm.faces.new((a, d, c, b))
bmesh.ops.delete(bm, geom=[v for v in rings[0]], context='VERTS')
bm.normal_update()
hat_me = bpy.data.meshes.new("hat")
bm.to_mesh(hat_me)
bm.free()
hat = bpy.data.objects.new("hat", hat_me)
bpy.context.collection.objects.link(hat)
for f in hat_me.polygons:
    f.use_smooth = True
s2 = hat.modifiers.new("thick", 'SOLIDIFY')
s2.thickness = 0.004
s2.offset = -1
bpy.context.view_layer.objects.active = hat
bpy.ops.object.modifier_apply(modifier="thick")
hat_me.materials.append(new_mat("hat", color=(0.85, 0.55, 0.02, 1), rough=0.32))
hat.parent = arm
set_group(hat, range(len(hat_me.vertices)), "head")
am = hat.modifiers.new("arm", 'ARMATURE')
am.object = arm

# hair the hat covers goes; what shows under the rim stays
hair = part("short02")
apply_mods(hair)
HP = world_verts(hair)
bm = bmesh.new()
bm.from_mesh(hair.data)
bm.verts.ensure_lookup_table()
bmesh.ops.delete(bm, geom=[bm.verts[i] for i in np.nonzero(HP[:, 2] > rim_z + 0.01)[0]], context='VERTS')
bm.to_mesh(hair.data)
bm.free()

# the boots: the black boots in a worn brown leather
boot = part("shoes03")
for m in boot.data.materials:
    if m and m.use_nodes:
        for n in m.node_tree.nodes:
            if n.type == 'BSDF_PRINCIPLED':
                n.inputs["Roughness"].default_value = 0.7

# stand him 5 ft 10 in to the top of his head, feet at 0
s = HEIGHT / top
arm.scale = (arm.scale[0] * s, arm.scale[1] * s, arm.scale[2] * s)
print("SCALE", s)

bpy.ops.object.select_all(action='DESELECT')
arm.select_set(True)
for o in arm.children:
    o.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.export_scene.gltf(filepath=OUT, use_selection=True, export_format='GLB', export_skins=True,
                          export_animations=False, export_morph=False, export_apply=False,
                          export_image_format='AUTO', export_yup=True)
print("WROTE", OUT)
