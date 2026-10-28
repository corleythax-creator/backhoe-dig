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
| `models/peds/` (the townsfolk's bodies and their 32-character atlas) and `models/cars/*.glb` (the town's traffic) | From cruise-brandon, the owner's other game: bodies made in Blender from GPT Image character sheets (its `tools/peds/`), cars made from GPT Image reference sheets (its `tools/vehicles/`) | The game's own |
| Every other `models/*.glb` (excavator, dump truck, dozer, loader, semi, pickup, four-wheeler) | Built from code for this game by `tools/build_model.js` | The game's own |
| The trees, props, islands and everything else drawn in `js/` | Built from code for this game | The game's own |

## Textures

| What | Source | Licence |
|---|---|---|
| The material library (`textures/*.jpg`), the tree bark and leaves, the ground pack (`textures/ground/`) | Generated with OpenAI GPT Image / ChatGPT from the prompts in `docs/IMAGE_PROMPTS.md`, made seamless by `tools/textures.py` and `tools/trees_tex.py`; untouched originals in `art/source/` | The game's own (OpenAI's terms assign the output to the user) |
| Relief and sheen maps (`*_n.jpg`, `*_r.jpg`) | Made from those textures by `tools/pbr.py` | The game's own |
| Photo-scanned siding, plaster and decking (`textures/siding_white`, `siding_brown`, `siding_red`, `siding_grey`, `plaster`, `deck_grey`, each with its own `_n` and `_r`) | [ambientCG](https://ambientcg.com): WoodSiding009, WoodSiding007, WoodSiding005, WoodSiding011, Plaster007, Planks023A | CC0 |
| Photo-scanned roof shingles (`textures/roof_grey`, with `_n` and `_r`) | [Poly Haven](https://polyhaven.com/a/grey_roof_01): grey_roof_01, by Rob Tuytel | CC0 |
| Your own textures (uploaded in the map editor) | Whoever uploads them | Theirs; only upload images you have the right to use |

## Services

Vercel (hosting), Supabase (saves sync, live tuning, the screen skin, your own textures), GitHub.
