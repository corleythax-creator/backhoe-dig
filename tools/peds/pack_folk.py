#!/usr/bin/env python3
# Corley's Island: packs the townsfolk that tools/peds/build_folk.py writes from Blender into the game's files:
#   models/peds/folk.json   the characters (peds.json's ids and order), each with its joint heights and where its meshes sit
#   models/peds/folk_hi.bin, folk_lo.bin   every character's mesh at the two budgets, one after another (layout below)
#   models/peds/folk/<id>.webp, folk_lo/<id>.webp   each character's own texture: its skin, eyes, eyebrows, hair and
#                                                   clothes packed into one square (1024 px, 512 px), clothes tinted
# A mesh block: positions Int16 ×3 in mm (padded to 4 bytes), normals Int8 ×4, UVs Uint16 ×2, limbs Uint8 ×4 (two of
# TF_GLSL's parts and how much of the second, 0..255), then the triangles' indices, Uint16 (Uint32 past 65,535 corners).
#   python3 tools/peds/pack_folk.py BUILD_DIR models/peds
import sys, os, json
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from folk_cast import CAST

SRC, DST = sys.argv[1], sys.argv[2]
N = 1024
PAD = 4
# how big a square each kind of piece gets in the texture (px of 1024)
SIZE = [("body", 512), ("suit", 512), ("sweater", 448), ("shirt", 384), ("polo", 384), ("t-shirt", 384), ("top", 384), ("dress", 448),
        ("pants", 384), ("shorts", 320), ("skirt", 384), ("hair", 320), ("bun", 320), ("braid", 320), ("bob", 320), ("long", 320),
        ("ponytail", 320), ("afro", 320), ("short", 320), ("shoes", 256), ("boots", 256), ("flats", 192), ("cap", 192),
        ("glasses", 128), ("eyebrow", 128), ("low-poly", 64)]


def size_of(name):
    n = name.lower()
    for k, s in SIZE:
        if k in n:
            return s
    return 256


def hexrgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], float) / 255


def solid(img):
    """see-through pixels of a texture filled with its mean colour (they are black, and show where a UV seam samples them)"""
    a = np.asarray(img.convert("RGBA")).astype(float)
    op = a[..., 3] > 127
    if op.any() and not op.all():
        a[~op, :3] = a[op, :3].mean(0)
    return Image.fromarray(a.astype(np.uint8), "RGBA")


def tint(img, col):
    """recolour a texture to col, keeping its shading and weave"""
    a = np.asarray(img.convert("RGBA"), float) / 255
    rgb, al = a[..., :3], a[..., 3]
    L = rgb @ np.array([0.299, 0.587, 0.114])
    m = L[al > 0.5].mean() if (al > 0.5).any() else L.mean()
    k = np.clip(L / max(m, 0.04), 0, 1.8)[..., None]
    c = hexrgb(col) ** 2.2
    out = np.clip((c * k) ** (1 / 2.2), 0, 1)
    return Image.fromarray((np.dstack([out, al]) * 255).astype(np.uint8), "RGBA")


def place(sizes):
    """squares into the N×N texture, biggest first, on a 32 px grid: {i: (x, y, s)}"""
    G = 32
    occ = np.zeros((N // G, N // G), bool)
    at = {}
    for i, s in sorted(sizes.items(), key=lambda t: -t[1]):
        while True:
            c = s // G
            spot = None
            for y in range(0, N // G - c + 1):
                for x in range(0, N // G - c + 1):
                    if not occ[y:y + c, x:x + c].any():
                        spot = (x, y)
                        break
                if spot:
                    break
            if spot:
                occ[spot[1]:spot[1] + c, spot[0]:spot[0] + c] = True
                at[i] = (spot[0] * G, spot[1] * G, s)
                break
            s -= G
            if s < G:
                raise RuntimeError("texture full")
    return at


def region(img, s):
    """img fitted into an s×s square with its edges run out PAD px (so filtering does not bleed)"""
    inner = img.convert("RGBA").resize((s - 2 * PAD, s - 2 * PAD), Image.LANCZOS)
    a = np.asarray(inner)
    a = np.pad(a, ((PAD, PAD), (PAD, PAD), (0, 0)), mode="edge")
    return Image.fromarray(a, "RGBA")


def pack_char(c, meta):
    wear = {w[0]: w[1] for w in c["wear"]}
    pieces = meta["pieces"]
    at = place({p["i"]: size_of(p["name"]) for p in pieces})
    atlas = Image.new("RGBA", (N, N), (128, 128, 128, 255))
    for p in pieces:
        x, y, s = at[p["i"]]
        if p["tex"] and os.path.exists(p["tex"]):
            img = Image.open(p["tex"]).convert("RGBA")
        else:
            img = Image.new("RGBA", (16, 16), tuple(int(v * 255) for v in p["col"]) + (255,))
        cut = p["name"] in (c["hair"][0], c["brows"]) or "glasses" in p["name"]
        if not cut:
            img = solid(img)
        col = wear.get(p["name"])
        if p["name"] == c["hair"][0]:
            col = c["hair"][1]
        if col:
            img = tint(img, col)
        if not cut:
            img.putalpha(255)  # only hair, eyebrows and glasses cut out
        atlas.paste(region(img, s), (x, y))
    return atlas, at


def mesh(npz, at):
    P, Nn, UV, Wt = [], [], [], []
    for i in sorted({int(k[1:]) for k in npz.files if k[0] == "p"}):
        x, y, s = at[i]
        uv = np.clip(npz[f"uv{i}"], 0, 1)
        u = (x + PAD + uv[:, 0] * (s - 2 * PAD)) / N
        v = 1 - (y + PAD + (1 - uv[:, 1]) * (s - 2 * PAD)) / N
        P.append(npz[f"p{i}"]); Nn.append(npz[f"n{i}"]); UV.append(np.stack([u, v], 1)); Wt.append(npz[f"w{i}"])
    P, Nn, UV, Wt = map(np.concatenate, (P, Nn, UV, Wt))
    o = np.argsort(-Wt, 1)
    a, b = o[:, 0], o[:, 1]
    wa, wb = Wt[np.arange(len(a)), a], Wt[np.arange(len(a)), b]
    w = np.where(wb > 0.02, wb / np.maximum(wa + wb, 1e-6), 0)
    b = np.where(wb > 0.02, b, a)
    nl = np.linalg.norm(Nn, axis=1, keepdims=True)
    Nn = Nn / np.maximum(nl, 1e-6)
    key = np.column_stack([np.round(P * 1000), np.round(Nn * 127), np.round(UV * 65535), a, b, np.round(w * 255)]).astype(np.int64)
    uniq, inv = np.unique(key, axis=0, return_inverse=True)
    inv = inv.ravel()
    pos = uniq[:, 0:3].astype(np.int16)
    nrm = np.column_stack([uniq[:, 3:6], np.zeros(len(uniq))]).astype(np.int8)
    uvs = uniq[:, 6:8].astype(np.uint16)
    sk = np.column_stack([uniq[:, 8:11], np.zeros(len(uniq))]).astype(np.uint8)
    # drop triangles that collapsed in the welding
    tri = inv.reshape(-1, 3)
    tri = tri[(tri[:, 0] != tri[:, 1]) & (tri[:, 1] != tri[:, 2]) & (tri[:, 0] != tri[:, 2])]
    idx = tri.ravel().astype(np.uint16 if len(uniq) <= 65535 else np.uint32)
    return pos, nrm, uvs, sk, idx


def block(pos, nrm, uvs, sk, idx):
    b = bytearray()
    out = {"nv": len(pos), "ni": len(idx), "u32": idx.dtype == np.uint32}
    for k, arr in (("p", pos), ("n", nrm), ("uv", uvs), ("sk", sk), ("i", idx)):
        while len(b) % 4:
            b.append(0)
        out[k] = len(b)
        b += arr.tobytes()
    while len(b) % 4:
        b.append(0)
    return out, bytes(b)


os.makedirs(os.path.join(DST, "folk"), exist_ok=True)
os.makedirs(os.path.join(DST, "folk_lo"), exist_ok=True)
out = {"v": 1, "chars": []}
bins = {"hi": bytearray(), "lo": bytearray()}
for c in CAST:
    mp = os.path.join(SRC, c["id"] + ".json")
    if not os.path.exists(mp):
        print("missing", c["id"])
        continue
    meta = json.load(open(mp))
    atlas, at = pack_char(c, meta)
    atlas.save(os.path.join(DST, "folk", c["id"] + ".webp"), quality=82, method=4)
    atlas.resize((N // 2, N // 2), Image.LANCZOS).save(os.path.join(DST, "folk_lo", c["id"] + ".webp"), quality=80, method=4)
    rec = {"id": c["id"], "h": meta["height"], "joint": meta["joint"]}
    for lod in ("hi", "lo"):
        info, data = block(*mesh(np.load(os.path.join(SRC, f"{c['id']}_{lod}.npz")), at))
        for k in ("p", "n", "uv", "sk", "i"):
            info[k] += len(bins[lod])
        bins[lod] += data
        info["tris"] = info["ni"] // 3
        rec[lod] = info
    out["chars"].append(rec)
    print(c["id"], rec["hi"]["tris"], rec["lo"]["tris"], rec["hi"]["nv"])
for lod in bins:
    open(os.path.join(DST, f"folk_{lod}.bin"), "wb").write(bins[lod])
json.dump(out, open(os.path.join(DST, "folk.json"), "w"), separators=(",", ":"))
print("hi", len(bins["hi"]), "lo", len(bins["lo"]))
