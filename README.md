# Backhoe Dig

A 3D low-poly excavator game in plain HTML, CSS and JavaScript (three.js r128, no build step). Dig a 3 ft trench on a grassy mesa above a mountain lake, expose the gas main without hitting it, load the dump truck and haul the spoil over the cliff edge.

- Live: https://backhoe-dig.vercel.app
- Build time: https://backhoe-dig.vercel.app/build.html (reads `data/effort.js`)
- Claude version: https://claude.ai/artifact/6nxYC5EK3422JouxaZx2DF

## Files

| File | What it is |
| --- | --- |
| `index.html` | Page markup (HUD, sticks, menus, help card) and the script tags, in load order |
| `css/game.css` | All game styles |
| `js/core.js` | Shared helpers, renderer, scene, sky, camera, lights, material maker `M()` |
| `js/terrain.js` | Dig-zone heightmap, road, soil layers, digging, dumping, slumping, cave-ins |
| `js/scenery.js` | Lake, mountains, grass tufts, outer ground, gas main, stakes, trees |
| `js/excavator.js` | Excavator model, linkage, rams, hoses |
| `js/truck.js` | Dump truck model and driving; texture hookup |
| `js/trenchbox.js` | Trench box model, hooking, setting, wall mask |
| `js/dirt.js` | Loose dirt: clods, flying dirt, lumpy bucket load and truck heap, the Dirt detail setting |
| `js/blocks.js` | Concrete blocks (1×1, 2×2, 3×3 ft): placing under the bucket, stacking, settling, machine collisions |
| `js/controls.js` | Game state and reset, touch sticks, keyboard, game controller, modes, menu |
| `js/effects.js` | Shared per-frame vectors, resize |
| `js/maps.js` | Minimap and big map |
| `js/bench.js` | Speed test |
| `js/main.js` | Frame loop |
| `grass.jpg`, `dirt.jpg`, `grime.jpg` | Seamless textures (OpenAI GPT Image, made tileable) |
| `build.html` | Build-time page: ask-to-live per version, triangles, developer-hour estimate |
| `data/effort.js` | Build-time data. The master dashboard reads it for hours |

## Controls

Left stick swings and moves the stick; right stick moves the boom and curls the bucket. Drive and Truck modes put the left stick on the tracks or the truck, and the right stick raises the truck bed. Keyboard: WASD or arrows are the left stick and IJKL the right stick in every mode; 1/2/3 or Tab switch machine, Shift for fine moves, T hooks the trench box, B blocks on/off (Space place, V size, X pick up), C cab view, M map, H help. Game controllers work too (sticks, triggers for gas, LB/RB machine, X box, Y cab view, A place block, D-pad for blocks).
