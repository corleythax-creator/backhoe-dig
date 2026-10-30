# Corley's Island: builds the townsfolk from MakeHuman's CC0 assets, one person per character of tools/peds/folk_cast.py.
# Each is made with MPFB2 in Blender (body from its macros, skin, eyes, eyebrows, hair, clothes, glasses), given the
# game_engine skeleton, posed standing with the arms down by the sides (the game swings the limbs about fixed joints, see
# TF_GLSL in js/townfolk.js), baked to plain meshes, cut down to two triangle budgets (hi for High and Ultra, lo below)
# and written out raw for tools/peds/pack_folk.py: per piece the corners' positions, normals, UVs and limb weights, and
# its texture; per person the joint heights and height.
#
# Needs Blender 4.2+ with the MPFB2 extension and the CC0 asset packs makehuman_system_assets, skins01-03, hair01,
# eyebrows01, shirts01, pants01, shoes01, suits01-02, suits05, dress01, skirts01, hats01, glasses01 unpacked into MPFB's
# user data folder (https://static.makehumancommunity.org/assets/assetpacks/index.html). Run:
#   blender -b --python tools/peds/build_folk.py -- OUT_DIR [id ...]
# then python3 tools/peds/pack_folk.py OUT_DIR models/peds (README "Townsfolk").
import importlib, sys, os, json, math
import bpy
import numpy as np
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree
import bmesh

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from folk_cast import CAST, macro_age

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else "/tmp/folk"
ONLY = set(argv[1:])
os.makedirs(OUT, exist_ok=True)
# triangles per person: hi (High and Ultra graphics), lo (below)
BUDGET = {"hi": 7000, "lo": 2600}
# heights for the characters (peds.json): the top of the head
PEDS = json.load(open(os.path.join(os.path.dirname(__file__), "..", "..", "models", "peds", "peds.json")))
HEIGHT = {c["id"]: c["h"] for c in PEDS["chars"]}


def di(p, k):
    for m in list(sys.modules):
        if m.endswith(p):
            return getattr(importlib.import_module(m), k)
    raise ValueError(p)


HS = di("mpfb.services.humanservice", "HumanService")
AS = di("mpfb.services.assetservice", "AssetService")
ES = di("mpfb.services.exportservice", "ExportService")
OS_ = di("mpfb.services.objectservice", "ObjectService")

# the limbs the game moves (TF_GLSL): 0 body and head, 1/2 thighs, 3/4 upper arms, 5/6 shins and feet, 7/8 forearms and
# hands; odd numbers the person's left (+x)
def part_of(bone):
    side = 0 if bone.endswith("_l") else 1 if bone.endswith("_r") else -1
    if side < 0:
        return 0
    b = bone[:-2]
    if b == "thigh":
        return 1 + side
    if b == "upperarm":
        return 3 + side
    if b in ("calf", "foot", "ball"):
        return 5 + side
    if b in ("lowerarm", "hand") or any(b.startswith(f) for f in ("thumb", "index", "middle", "ring", "pinky")):
        return 7 + side
    return 0


def tex_of(mat):
    """the colour texture of a material (its path), and its flat colour"""
    col = (0.8, 0.8, 0.8)
    if not mat or not mat.use_nodes:
        return None, col
    imgs = []

    def walk(nt):
        for n in nt.nodes:
            if n.type == "TEX_IMAGE" and n.image:
                imgs.append((n.name + " " + n.label + " " + n.image.name).lower() + "|" + bpy.path.abspath(n.image.filepath))
            elif n.type == "GROUP" and n.node_tree:
                walk(n.node_tree)
            elif n.type == "BSDF_PRINCIPLED":
                c = n.inputs["Base Color"].default_value
                nonlocal col
                col = (c[0], c[1], c[2])
    walk(mat.node_tree)
    bad = ("normal", "bump", "rough", "spec", "_ao", "ambient", "disp", "transmap", "metal", "litsphere", "_nm", "_n.")
    good = [i for i in imgs if "diffuse" in i.split("|")[0]] or [i for i in imgs if not any(b in i for b in bad)]
    return (good[0].split("|", 1)[1] if good else None), col


def clear():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.images, bpy.data.armatures):
        for b in list(coll):
            if b.users == 0:
                coll.remove(b)


def aim(arm, name, target):
    """turn a pose bone about its head so it points along target (armature space)"""
    pb = arm.pose.bones[name]
    bpy.context.view_layer.update()
    m = pb.matrix.copy()
    head = m.translation.copy()
    cur = (pb.tail - pb.head).normalized()
    q = cur.rotation_difference(Vector(target).normalized())
    pb.matrix = Matrix.Translation(head) @ q.to_matrix().to_4x4() @ Matrix.Translation(-head) @ m
    bpy.context.view_layer.update()


# which garments go over which: tops over trousers and skirts; the faces of an inner garment that an outer one covers
# are cut away (they poke through once both are cut down)
INNER = ("pants", "shorts", "skirt", "trousers")
OUTER = ("shirt", "t-shirt", "polo", "sweater", "top", "suit", "dress")


def hide_covered(parts, clothes, reach=0.04):
    kind = lambda o: "in" if any(k in o.name.lower() for k in INNER) else "out" if any(k in o.name.lower() for k in OUTER) else None
    dg = bpy.context.evaluated_depsgraph_get()
    tree = {o.name: BVHTree.FromObject(o, dg) for o in parts}
    # the skin under any garment, then trousers and skirts under tops
    body = [o for o in parts if "." not in o.name]
    jobs = [(o, [tree[c.name] for c in parts if any(w in c.name for w in clothes)], 0.025) for o in body]
    jobs += [(o, [tree[c.name] for c in parts if kind(c) == "out"], reach) for o in parts if kind(o) == "in"]
    for o, trees, reach in jobs:
        if not trees:
            continue
        bm = bmesh.new()
        bm.from_mesh(o.data)
        bm.normal_update()
        cov = set()
        for v in bm.verts:
            for t in trees:
                # either way along the normal: the waistband of trousers often sits outside the shirt's hem
                if t.ray_cast(v.co, v.normal, reach)[0] is not None or t.ray_cast(v.co, -v.normal, reach)[0] is not None:
                    cov.add(v)
                    break
        gone = [f for f in bm.faces if all(v in cov for v in f.verts)]
        bmesh.ops.delete(bm, geom=gone, context="FACES")
        bm.to_mesh(o.data)
        bm.free()
        print("COVERED", o.name, len(gone), flush=True)


def build(c):
    clear()
    race = {"caucasian": 0.0, "african": 0.0, "asian": 0.0}
    race[c["race"]] = 1.0
    macros = {"gender": float(c["g"]), "age": macro_age(c["age"]), "muscle": c["m"], "weight": c["w"], "proportions": 0.5,
              "height": 0.5, "cupsize": 0.5, "firmness": 0.5, "race": race}
    base = HS.create_human(macro_detail_dict=macros)
    skin = AS.find_asset_absolute_path(c["skin"] + ".mhmat", asset_subdir="skins")
    HS.set_character_skin(skin, base, skin_type="GAMEENGINE")
    HS.add_builtin_rig(base, "game_engine")
    add = [("eyes", "low-poly.mhclo", "Eyes"), ("eyebrows", c["brows"] + ".mhclo", "Eyebrows"), ("hair", c["hair"][0] + ".mhclo", "Hair")]
    add += [("clothes", w[0] + ".mhclo", "Clothes") for w in c["wear"]]
    if c.get("glasses"):
        add.append(("clothes", c["glasses"] + ".mhclo", "Clothes"))
    for sub, f, t in add:
        p = AS.find_asset_absolute_path(f, asset_subdir=sub)
        if not p:
            raise FileNotFoundError(sub + "/" + f)
        HS.add_mhclo_asset(p, base, asset_type=t, subdiv_levels=0, material_type="GAMEENGINE")
    root = ES.create_character_copy(base, name_suffix="_x")
    xbase = OS_.find_object_of_type_amongst_nearest_relatives(root, "Basemesh")
    ES.bake_modifiers_remove_helpers(xbase, bake_masks=True, bake_subdiv=False, remove_helpers=True, also_proxy=True)
    for o in list(bpy.data.objects):
        if o != root and o.parent != root:
            bpy.data.objects.remove(o)
    arm = root
    bones = {b.name for b in arm.data.bones}
    parts = [o for o in root.children if o.type == "MESH"]
    for o in parts:
        if o.data.shape_keys:
            bpy.context.view_layer.objects.active = o
            bpy.ops.object.shape_key_remove(all=True, apply_mix=True)
    # standing easy: the arms hanging straight a little out from the sides (the game bends the elbows itself)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="POSE")
    for s in (1, -1):
        side = "l" if s > 0 else "r"
        aim(arm, "upperarm_" + side, (s * math.sin(math.radians(7)), 0.02, -1))
        aim(arm, "lowerarm_" + side, (s * math.sin(math.radians(6)), 0.02, -1))
    bpy.context.view_layer.update()
    J = {}
    for k, b in (("hip", "thigh_l"), ("knee", "calf_l"), ("shoulder", "upperarm_l"), ("elbow", "lowerarm_l")):
        J[k] = (arm.matrix_world @ arm.pose.bones[b].head).z
    bpy.ops.object.mode_set(mode="OBJECT")
    # bake the pose into the meshes, keeping the vertex groups for the limb weights
    for o in parts:
        bpy.context.view_layer.objects.active = o
        for m in list(o.modifiers):
            bpy.ops.object.modifier_apply(modifier=m.name)
    hide_covered(parts, [w[0] for w in c["wear"]])
    body = [o for o in parts if o.name.lower().startswith("human") and "." not in o.name.split("_x")[0][5:]]
    top = max((o.matrix_world @ v.co).z for o in (body or parts) for v in o.data.vertices)
    k = HEIGHT.get(c["id"], top) / top
    meta = {"id": c["id"], "height": HEIGHT.get(c["id"], top), "joint": {a: round(v * k, 4) for a, v in J.items()}, "pieces": [], "tris": {}}
    tot = sum(len(o.data.polygons) * 2 for o in parts)
    for lod, budget in BUDGET.items():
        arrays = {}
        n_tri = 0
        for pi, o in enumerate(parts):
            d = o.copy()
            d.data = o.data.copy()
            bpy.context.collection.objects.link(d)
            small = len(o.data.polygons) < 300
            if not small:
                r = min(1.0, budget / tot)
                dm = d.modifiers.new("dec", "DECIMATE")
                dm.ratio = r
                dm.use_collapse_triangulate = True
                bpy.context.view_layer.objects.active = d
                bpy.ops.object.modifier_apply(modifier="dec")
            me = d.data
            me.calc_loop_triangles()
            nt = len(me.loop_triangles)
            if nt == 0:
                bpy.data.objects.remove(d)
                continue
            n_tri += nt
            mw = d.matrix_world
            V = np.array([(mw @ v.co)[:] for v in me.vertices]) * k
            # limb weights per vertex
            # (only the skeleton's own groups: MakeHuman's helper groups, body, Left, Mid... cover everything)
            gi = {g.index: part_of(g.name) for g in d.vertex_groups if g.name in bones}
            W = np.zeros((len(me.vertices), 9))
            for v in me.vertices:
                for g in v.groups:
                    if g.group in gi:
                        W[v.index, gi[g.group]] += g.weight
            W[W.sum(1) == 0, 0] = 1
            loops = np.array([t.loops[:] for t in me.loop_triangles]).ravel()
            verts = np.array([t.vertices[:] for t in me.loop_triangles]).ravel()
            N = np.array([n.vector[:] for n in me.corner_normals]) if hasattr(me, "corner_normals") else np.array([l.normal[:] for l in me.loops])
            uvl = me.uv_layers.active.data if me.uv_layers.active else None
            UV = np.array([uvl[i].uv[:] for i in loops]) if uvl else np.zeros((len(loops), 2))
            mat = d.material_slots[0].material if d.material_slots else None
            tex, col = tex_of(mat)
            name = o.name.replace("_x", "").replace("Human.", "").replace("Human", "body")
            # y up and the front to +z, as the game wants: (x, z, -y)
            P = V[verts][:, [0, 2, 1]] * np.array([1, 1, -1])
            NN = N[loops][:, [0, 2, 1]] * np.array([1, 1, -1])
            arrays[f"p{pi}"] = P.astype(np.float32)
            arrays[f"n{pi}"] = NN.astype(np.float32)
            arrays[f"uv{pi}"] = UV.astype(np.float32)
            arrays[f"w{pi}"] = W[verts].astype(np.float32)
            if lod == "hi":
                meta["pieces"].append({"i": pi, "name": name, "tex": tex, "col": col})
            bpy.data.objects.remove(d)
        np.savez_compressed(os.path.join(OUT, f"{c['id']}_{lod}.npz"), **arrays)
        meta["tris"][lod] = n_tri
    json.dump(meta, open(os.path.join(OUT, c["id"] + ".json"), "w"), indent=1)
    print("BUILT", c["id"], meta["tris"], meta["joint"], flush=True)


for c in CAST:
    if ONLY and c["id"] not in ONLY:
        continue
    try:
        build(c)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("FAILED", c["id"], e, flush=True)
