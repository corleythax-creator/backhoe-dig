# Corley's Island (Backhoe Dig)

A 3D low-poly excavator game in plain HTML, CSS and JavaScript (three.js r128, no build step). Dig a 3 ft trench on a grassy mesa above a mountain lake (about 295 ft across: a high top with Lookout Knoll and West Rise, and a ramp down a 24 ft rocky scarp to the Lower Bench dirt yard), expose the gas main without hitting it, load the dump truck and haul the spoil over the cliff edge. Then mow the patch of tall grass with the zero-turn mower.

- Live: https://backhoe-dig.vercel.app
- Build time: https://backhoe-dig.vercel.app/build.html (reads `data/effort.js`)
- Every version, playable: https://backhoe-dig.vercel.app/versions/
- Claude version: https://claude.ai/artifact/6nxYC5EK3422JouxaZx2DF

## Files

| File | What it is |
| --- | --- |
| `index.html` | Page markup (HUD, sticks, menus, help card) and the script tags, in load order |
| `css/game.css` | All game styles |
| `js/core.js` | Shared helpers, renderer, scene, sky, camera, lights, material maker `M()` |
| `js/terrain.js` | Mesa layout (hills, scarp, Lower Bench), road network and ramp, ground too steep to drive, dig-zone heightmap, soil layers, digging, dumping, slumping, cave-ins |
| `js/scenery.js` | Lake, mountains, grass tufts, mesa and outer ground meshes, gas main, stakes, trees |
| `js/excavator.js` | Excavator model, linkage, rams, hoses |
| `js/truck.js` | Dump truck model and driving; texture hookup |
| `js/trenchbox.js` | Trench box model, hooking, setting, wall mask |
| `js/dirt.js` | Loose dirt: clods, flying dirt, lumpy bucket load and truck heap, the Dirt detail setting |
| `js/water.js` | Groundwater: seeping, levelling pools, mud, the pump |
| `js/dirtsound.js` | Dirt sounds: digging, pouring, thuds, rattles, cave-ins, trickling water |
| `js/blocks.js` | Concrete blocks (1×1, 2×2, 3×3 ft): placing under the bucket, stacking, settling, machine collisions |
| `js/mower.js` | Tall grass patch, zero-turn mower, mowing, clippings, lawn stripes, regrowth and the saved lawn |
| `js/walker.js` | Walk mode: the site worker, walking, jumping, climbing blocks, collisions, getting in and out of machines |
| `js/keys.js` | Key bindings: every keyboard action, its default keys, the player's saved keys and the Keys panel |
| `js/controls.js` | Game state and reset, touch sticks, keyboard, game controller, modes, menu |
| `js/save.js` | Saves the site in the browser and loads it on start: the dug and dumped ground, groundwater, excavator, truck and load, trench box, blocks, worker (the lawn saves itself in `js/mower.js`) |
| `js/effects.js` | Shared per-frame vectors, resize |
| `js/sound.js` | All sound, rendered in the browser: diesel engine loops, turbo, tires, air brakes, hydraulics, relief valve, tracks, bucket scrape, pouring dirt, backup alarm; stereo, distance and cliff echo; the Sound panel (on/off, Master, Engines, Backup alarm, Effects) |
| `js/maps.js` | Minimap and big map |
| `js/gfx.js` | Graphics setting: Low (phones), Medium (laptops), High (desktop PCs), saved per device |
| `js/shadowproxy.js` | Cheaper shadows: merged shadow-only meshes for the machines, near trees only |
| `js/bench.js` | Speed test |
| `js/main.js` | Frame loop |
| `grass.jpg`, `dirt.jpg`, `grime.jpg` | Seamless textures (OpenAI GPT Image, made tileable) |
| `shots/*.jpg` | Start-card tiles: in-game screenshots of the excavator, dump truck, mower and the worker on foot |
| `build.html` | Build-time page: ask-to-live per version, triangles, developer-hour estimate |
| `versions/` | A playable snapshot of every version (`versions/vN/`), the list page, and `list.js`. Made by `tools/versions.py` |
| `data/effort.js` | Build-time data. The master dashboard reads it for hours |

## Controls

Left stick swings and moves the stick; right stick moves the boom and curls the bucket. Drive and Truck modes put the left stick on the tracks or the truck, and the right stick raises the truck bed. Mow mode drives the zero-turn mower: each stick is a lap bar for the wheel on its side (left stick sideways spins it too). Walk mode puts you on foot: left stick walks the way the camera faces, right stick looks around, Jump jumps (onto blocks too). Keyboard: WASD or arrows are the left stick and IJKL the right stick in every mode; 1/2/3/4/5 or Tab switch machine, Shift for fine moves, T hooks the trench box, C cab view, B blocks on/off (E place, V size, X pick up), Space jump and F get in or out of a machine on foot, M map, N sound on/off, H help. Every key can be changed in the Keys panel (☰ menu), which also lists what each key does; the choice is saved per device. Game controllers work too (sticks, triggers for gas, LB/RB machine, X box, Y cab view, A place block or jump in Walk mode, B get in or out, D-pad for blocks).
