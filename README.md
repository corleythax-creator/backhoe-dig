# Corley's Island

A 3D low-poly excavator game in plain HTML, CSS and JavaScript (three.js r128, no build step). Dig a 3 ft trench on a grassy mesa above a mountain lake (about 295 ft across: a high top with Lookout Knoll and West Rise, and a ramp down a 24 ft rocky scarp to the Lower Bench dirt yard), expose the gas main without hitting it, load the dump truck and haul the spoil over the cliff edge. Then mow the patch of tall grass with the zero-turn mower.

- Live: https://corleys-island.vercel.app (https://backhoe-dig.vercel.app still works)
- Build time: https://corleys-island.vercel.app/build.html (reads `data/effort.js`)
- Every version, playable: https://corleys-island.vercel.app/versions/
- Claude version: https://claude.ai/artifact/6nxYC5EK3422JouxaZx2DF

## Files

| File | What it is |
| --- | --- |
| `index.html` | Page markup (HUD, sticks, menus, help card) and the script tags, in load order |
| `css/game.css` | All game styles |
| `js/core.js` | Shared helpers, renderer, scene, sky, camera, lights, material maker `M()` |
| `js/materials.js` | Material library for the map editor's Paint tool (31 textures: ground covers, concrete and paving, steel, brick and stone, wood and more): ids, names, tile sizes, mean colours, and the texture array the ground shader reads |
| `js/terrain.js` | Mesa layout (hills, scarp, Lower Bench), the map editor's layers and the map save format, road network and ramp, ground too steep to drive, dig-zone heightmap, soil layers, digging, dumping, slumping, cave-ins |
| `js/scenery.js` | Lake, mountains, grass tufts, mesa and outer ground meshes (updated in place by the editor), gas main, stakes, trees and boulders (placed assets) |
| `js/excavator.js` | Excavator model, linkage, rams, hoses |
| `js/truck.js` | Dump truck model and driving; texture hookup |
| `js/trenchbox.js` | Trench box model, hooking, setting, wall mask |
| `js/dirt.js` | Loose dirt: clods, flying dirt, lumpy bucket load and truck heap, ruts (loose fill packs down; mud sinks up to 9 in and heaps berms), the Dirt detail setting |
| `js/mud.js` | Mud outside the dig zone and getting stuck: soak (`soakAt`, painted Mud for now, soil and rain later), 2 in mud tiles made where ruts start (they punch holes in the 0.5 m mesh and save with the site), their puddles, bogging down and rocking free (`bogTick`), flung mud |
| `js/water.js` | Groundwater and puddles: seeping, levelling pools, saturated mud (painted Mud), the puddle surface (drawn finer and with sky reflections on Medium and High), the pump |
| `js/dirtsound.js` | Dirt sounds: digging, pouring, thuds, rattles, cave-ins, trickling water |
| `js/blocks.js` | Concrete blocks (1×1, 2×2, 3×3 ft): placing under the bucket or in front of the worker, lifting, stacking, settling, machine collisions; `surfAt()` (ground or block top) |
| `js/mower.js` | Tall grass patch, zero-turn mower, mowing, clippings, lawn stripes, regrowth and the saved lawn |
| `js/walker.js` | Walk mode: the site worker, walking, jogging, sprinting, jumping (about 6 ft), climbing blocks, collisions, getting in and out of the excavator, truck and mower |
| `js/keys.js` | Key bindings: every keyboard action (`KEY_ACTIONS`), its default keys, where it works (on foot, in a machine or everywhere), the player's saved keys and the Keys panel |
| `js/controls.js` | Game state and reset, touch sticks, keyboard, game controller, modes, menu |
| `js/save.js` | Saves the site in the browser and loads it on start: the dug and dumped ground, groundwater, excavator, truck and load, trench box, blocks, worker (the lawn saves itself in `js/mower.js`) |
| `js/sync.js` | Sync devices: a sync code that keeps the saves in step between phone and computer through Supabase |
| `js/effects.js` | Shared per-frame vectors, resize |
| `js/sound.js` | All sound, rendered in the browser: diesel engine loops, turbo, tires, air brakes, hydraulics, relief valve, tracks, bucket scrape, pouring dirt, backup alarm; stereo, distance and cliff echo; the Sound panel (on/off, Master, Engines, Backup alarm, Effects) |
| `js/maps.js` | Minimap and big map |
| `js/editor.js` | Map editor (☰ menu or G): sculpt and paint the ground, lay out and grade roads, lay materials from the library, place, move, turn, resize, copy, query and delete trees, boulders and machines; undo; save on the device, copy out and load maps |
| `js/gfx.js` | Graphics setting: Low (phones), Medium (laptops), High (desktop PCs), saved per device |
| `js/shadowproxy.js` | Cheaper shadows: merged shadow-only meshes for the machines, near trees only |
| `js/bench.js` | Speed test |
| `js/main.js` | Frame loop |
| `grass.jpg`, `dirt.jpg`, `grime.jpg` | Seamless textures (OpenAI GPT Image, made tileable) |
| `textures/*.jpg` | The material library: one seamless 512 px texture per material (OpenAI GPT Image, made tileable by `tools/textures.py`), and `thumbs.jpg`, the swatches the editor shows |
| `tools/textures.py` | Turns the raw 1024 px renders into the library textures, the swatch sheet and the mean colours in `js/materials.js` |
| `shots/*.jpg` | Start-card tiles: in-game screenshots of the excavator, dump truck, mower and the worker on foot |
| `build.html` | Build-time page: ask-to-live per version, triangles, developer-hour estimate |
| `versions/` | A playable snapshot of every version (`versions/vN/`), the list page, and `list.js`. Made by `tools/versions.py` |
| `data/effort.js` | Build-time data. The master dashboard reads it for hours |
| `tools/versions.py` | Rebuilds `versions/` from `main`'s history after a release |
| `tools/scene-check.js` | Loads the game headless and prints the triangle count, file size and any errors (the numbers a build-log entry needs) |
| `docs/map-editor.md` | How the map editor works: what a map stores, how an edit reaches the screen, gotchas, limits and ideas |
| `docs/mesa-plans.html` | The three mesa layout plans from the 1.5× expansion (Plan A was built, v54). Planning record, not part of the game |
| `gfx_low.png` | A 1.6 MB screenshot added with v52; nothing references it, so it can be deleted |

## Controls

Left stick swings and moves the stick; right stick moves the boom and curls the bucket. Drive and Truck modes put the left stick on the tracks or the truck, and the right stick raises the truck bed. Mow mode drives the zero-turn mower: each stick is a lap bar for the wheel on its side (left stick sideways spins it too). Walk mode puts you on foot: left stick walks the way the camera faces (all the way to jog), right stick looks around, Jump jumps about 6 ft (onto blocks and up stacks), Sprint toggles a run of about 12 mph that switches off when you stop, and Get in (shown next to a machine) climbs into the excavator, truck or mower; Get out climbs back out beside it. Keyboard: WASD or arrows are the left stick and IJKL the right stick in every mode, except the mower, where W/S drive it straight and A/D turn it, and the number pad works the lap bars (8/2 both forward/back, 4/6 spin in place, 7/1 left bar, 9/3 right bar); 1/2/3/4/5 or Tab switch machine, Shift for fine moves, T hooks the trench box, C cab view, B blocks on/off (E place, V size, X pick up), Space jump, Shift sprint and F get in or out of a machine on foot, M map, N sound on/off, H help. Every key can be changed in the Keys panel (☰ menu), which also lists what each key does; the choice is saved per device. G opens the map editor. Game controllers work too (sticks, triggers for gas, LB/RB machine, X box, Y cab view, A place block or jump in Walk mode, X place block on foot, left stick click sprint, B get in or out, D-pad for blocks).

## The site

The mesa is a rounded square about 295 ft across (90 m), with cliffs about 150 ft down to meadows and the lake. The north part is the high top (0 ft): the trench and gas main near the north rim, the tall-grass patch, Lookout Knoll (18 ft) and West Rise (10 ft). A rocky scarp across the middle drops 24 ft to the Lower Bench, a dirt yard with stockpiles. Roads: a loop round the top that passes the cliff dump spot, a 16 ft ramp graded diagonally down the scarp (about 11%), a loop round the bench and a track up the knoll. The truck can dump over the north cliff or in the bench yard.

## Map editor

☰ menu → Map editor, or G. The game pauses and an overhead camera takes over.

- **Look**: drag to move; two fingers pinch to zoom and twist to turn (mouse: right button turns, wheel zooms; keys WASD or arrows, Q E, R F).
- **Raise, Lower, Flatten, Smooth**: reshape the ground under a round brush (5 to 40 ft radius, strength 1 to 10). Dug holes keep their depth.
- **Dirt, Grass**: paint the ground.
- **Select**: pick a tree, boulder or machine, drag it to move it; its card turns, resizes, copies or deletes it.
- **Add**: place pine trees, leafy trees or boulders.
- **Query**: read any spot's height, slope, surface, whether it can be driven and what was edited there, in feet.
- **Roads**: drag a road's points, tap it between points to add one, lay a new road point by point; set width, grass up the middle and grading (cut and filled to a height at each point, like the ramp).
- **Undo / Redo** (30 steps). **Map file**: Copy map (a few KB of text), Load a map, Start over.

Maps save on the device as you edit (`localStorage.bhd_map`). The claude.ai version and the Vercel site keep separate storage, so move a map between them with Copy map. How it works inside, and what to watch out for when changing it: [`docs/map-editor.md`](docs/map-editor.md).

## How it fits together

- **Plain scripts, one global scope.** `index.html` loads three.js r128 from cdnjs, then `data/effort.js`, then `js/*.js` in order. No modules, no build step. Top-level code may only call functions defined in its own file or an earlier one; functions can call anything at run time. Check a new top-level name isn't already taken before adding it (see CLAUDE.md).
- **Units.** World units are metres: x east, z south (north is −z, the top of the map), y up, 0 = the mesa top. Everything the player sees is in feet (`FT` = 0.3048 in `js/blocks.js`).
- **Ground.** `baseHeight(x, z)` in `js/terrain.js` is the one source of the undug ground: the generated mesa (`groundHeight`: rolls, hills, scarp, bench, rim berm, graded roads, cliffs) plus the map editor's height layer. Three meshes draw it (plus 8 m mud tiles at 2 in wherever a machine has rutted mud outside the dig grid, `js/mud.js`): the dig grid (64 m square at 0.16 m around the trench, the only ground that can be dug; `H` is the current height, `H0` the original grade), a 0.5 m mesh over the rest of the mesa and its cliffs (`MID`), and a 2 m mesh out to the lake. Skirts hide the seams. Roads are polylines in `ROADS`, looked up through a 4 m bucket grid (`roadAt`). `WALL` marks ground too steep to drive; the excavator, truck and mower stop against it.
- **Frame loop.** `js/main.js`: input, machines, digging, spills, slumping, terrain updates, HUD, camera, render. The map editor takes the whole frame while it is open.
- **Saved in the browser** (each per device, all keys start `bhd_`):

  | Key | What | File |
  | --- | --- | --- |
  | `bhd_site` | Dug and dumped ground (`H − H0` per changed vertex), dirt colour, mud, groundwater | `js/save.js` |
  | `bhd_rigs` | Excavator, truck and load, trench box, blocks, worker | `js/save.js` |
  | `bhd_lawn` | Mowing and regrowth | `js/mower.js` |
  | `bhd_map` | Map editor edits: heights, paint, assets, roads | `js/terrain.js`, `js/editor.js` |
  | `bhd_keys` | Key bindings | `js/keys.js` |
  | `bhd_gfx`, `bhd_dirt`, `bhd_ui`, `bhd_hudmin`, `bhd_sndcfg` | Graphics, Dirt detail, UI size, folded status card, sound | `js/gfx.js`, `js/dirt.js`, `js/controls.js`, `js/sound.js` |
  | `bhd_sync`, `bhd_sync_t`, `bhd_sync_h` | Sync code, time of the last synced save, hash of what was last sent | `js/sync.js` |
  | `bhd_seen`, `bhd_glresets` | Start card seen, graphics resets counted for the speed test | `js/controls.js`, `js/core.js` |

  **Sync devices** (☰, Vercel site only) carries `bhd_site`, `bhd_rigs`, `bhd_lawn` and `bhd_map` between devices under an 8-character code, through the `island_peek`, `island_get` and `island_put` functions in Supabase (the `island_saves` table, for now in the fuel-model project; `supabase/island_sync.sql` sets it up). Pulls on open and on coming back into view, pushes every 15 s and on hide; the first save to reach the server wins.

  Snapshots in `versions/` prefix their keys (`bhd-vN:`) so playing an old version can't touch the live save.
- **Updates.** The game re-reads `data/effort.js` when it comes back to the front and every 10 minutes; a newer version reloads at once if nothing is under way, otherwise it shows a tap-to-update button (`js/controls.js`).
- **Speed.** The owner's phone is the target: above 30 FPS. The iPhone speed test (☰ → Speed test) showed phones are held back by pixels, shadows, filmic lighting and ground textures more than triangles, which is what the Graphics setting trades. The scene is about 1.15 million triangles.

## Working on it

- **Run it:** any static server from the repo root, for example `python3 -m http.server`, then open `http://localhost:8000`. Opening `index.html` as a file won't load the textures.
- **Check it headless:** `NODE_PATH=$(npm root -g) node tools/scene-check.js` loads the game in headless Chromium and prints the triangle count, file size and any errors. Software rendering is slow (a frame can take a second or two), so for behaviour tests drive the game's own functions from `page.evaluate` (for example `updateTruck(0.05, 0.6, 0, 0)` in a loop, or `editorOpen()` then `edBrush(0.05)`) rather than simulating input frame by frame.
- **Ship a version** (the steps CLAUDE.md asks for):
  1. Merge the latest `main` into your branch and re-test.
  2. Take the next version number after `main`'s last entry in `data/effort.js`; add the entry (asked and live times in Central, developer hours, `tris` and `chars` from `tools/scene-check.js`, a plain description) and add the hours to the day in `days`.
  3. Merge to `main` so the release is a first-parent commit on `main` (a pull request merge or `git merge --no-ff`); `tools/versions.py` finds each version that way. Push: Vercel deploys `main`.
  4. Run `python3 tools/versions.py`, commit `versions/`, push.
  5. Publish the claude.ai artifact from `main`: the page from `<title>` to before `</html>` of `index.html`, with `css/game.css`, every `js/*.js` and `data/effort.js` at the same paths. If the publish is refused because another session published since, read the files it names, confirm `main` already has them, then publish again.
  6. Check the live site serves the new `data/effort.js` and `versions/vN/`.

