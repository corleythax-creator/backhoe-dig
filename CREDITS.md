# Credits

Corley's Island, by Corley, built with Claude Code. Below is where everything in the game comes from and its licence. Add a row whenever something from outside the repo comes in.

## Code libraries

| What | Licence | Where |
|---|---|---|
| three.js r186 (and its add-ons, such as the glTF loader) | MIT | https://threejs.org, loaded from jsDelivr |
| marked (renders the docs on `hub.html`) | MIT | https://marked.js.org, loaded from cdnjs |

## Fonts

| Font | Licence | Where |
|---|---|---|
| Saira, Saira Condensed, Barlow Condensed | SIL Open Font License | Google Fonts |

## Sounds

Every sound is cut from CC0 (public domain) field recordings on Freesound by `tools/sounds.py`. The full list of recordings and recordists is in [`sounds/CREDITS.md`](sounds/CREDITS.md).

## 3D models

| Model | Source | Licence |
|---|---|---|
| `models/worker.glb`, the worker on foot | MakeHuman base mesh, skeleton and skins ("makehuman_system_assets", "skins02") built in Blender with MPFB2 by `tools/build_worker.py` | CC0 |
| `models/peds/folk*` (the 32 townsfolk) | MakeHuman base mesh, game_engine skeleton, skins, eyes, eyebrows, hair and clothes from the MakeHuman community's CC0 asset packs (makehuman_system_assets, skins01-03, hair01, eyebrows01, shirts01, pants01, shoes01, suits01-02, suits05, dress01, skirts01, hats01, glasses01; https://static.makehumancommunity.org/assets/assetpacks/index.html), built in Blender with MPFB2 by `tools/peds/build_folk.py` | CC0 |
| `models/people/*` (the townsfolk on High and Ultra: the same 32 rigged and animated) | Human Forge (human-forge repo) from the MakeHuman base mesh and community assets built in Blender with MPFB2; animations Human Forge's own; full list in [models/people/CREDITS.md](models/people/CREDITS.md) | CC0 (see that file) |
| The town's sedans, hatchbacks, wagons and SUVs in `models/cars.glb` (sources in `tools/models/cars_src/`, fitted by `tools/models/cars.js`) | "Kiri '10", "Ace '11", "Sigil '07" and "Urban '10 - Low poly model" by Daniel Zhabotinsky (https://sketchfab.com/DanielZhabotinsky), from Sketchfab via the Objaverse set | CC BY 4.0 |
| The town's vans in `models/cars.glb` (source `tools/models/cars_src/van.glb`) | "2014 Fiat Ducato" by razor24 (https://sketchfab.com/3d-models/2014-fiat-ducato-8a651ad182414bb0a8b6c6d8d5bd7c01), from Sketchfab via the Objaverse set | CC BY 4.0 |
| Every other `models/*.glb` (excavator, dump truck, dozer, loader, semi, pickup, four-wheeler, the town's minivans and pickups) | Built from code for this game by `tools/build_model.js` | The game's own |
| The trees, props, islands and everything else drawn in `js/` | Built from code for this game | The game's own |

## Textures

| What | Source | Licence |
|---|---|---|
| The material library (`textures/*.jpg`), the birch bark, the ground pack (`textures/ground/`) | Generated with OpenAI GPT Image / ChatGPT from the prompts in `docs/IMAGE_PROMPTS.md`, made seamless by `tools/textures.py` and `tools/trees_tex.py`; untouched originals in `art/source/` | The game's own (OpenAI's terms assign the output to the user) |
| Relief and sheen maps (`*_n.jpg`, `*_r.jpg`) | Made from those textures by `tools/pbr.py` | The game's own |
| Photo-scanned siding, plaster and decking (`textures/siding_white`, `siding_brown`, `siding_red`, `siding_grey`, `plaster`, `deck_grey`, each with its own `_n` and `_r`) | [ambientCG](https://ambientcg.com): WoodSiding009, WoodSiding007, WoodSiding005, WoodSiding011, Plaster007, Planks023A | CC0 |
| Photo-scanned leaf trees and bark (`textures/tree_leaves.jpg` and `tree_leaves_a.jpg`: the maple, oak and birch leaf sprays, laid out from single scanned leaves by `tools/trees_scan.py`; `textures/tree_bark.jpg` and `tree_bark_n.jpg`) | [ambientCG](https://ambientcg.com): LeafSet010, LeafSet012, LeafSet008, Bark012 | CC0 |
| Photo-scanned pine foliage and bark (`textures/tree_leaves.jpg`: the spruce branch and the pine needle tuft, laid out from scanned twigs by `tools/trees_scan.py`; `textures/tree_pbark.jpg` and `tree_pbark_n.jpg`) | [Poly Haven](https://polyhaven.com): the twig and bark maps of fir_tree_01 and pine_tree_01 | CC0 |
| The cut ends of logs and stumps (`textures/tree_end.jpg`) | [ambientCG](https://ambientcg.com): TreeEnd003 | CC0 |
| Photo-scanned roof shingles (`textures/roof_grey`, with `_n` and `_r`) | [Poly Haven](https://polyhaven.com/a/grey_roof_01): grey_roof_01, by Rob Tuytel | CC0 |
| Your own textures (uploaded in the map editor) | Whoever uploads them | Theirs; only upload images you have the right to use |

## Services

Vercel (hosting), Supabase (saves sync, live tuning, the screen skin, your own textures), GitHub.
