# Map editor: how it works

The map editor (☰ menu → Map editor, or G) lets the player reshape the mesa, paint it, lay out roads and place, move and remove trees, boulders and machines. This note is for whoever works on it next: what it stores, how an edit reaches the screen, and what to watch out for. The player-facing description is in the README and on the in-game help card.

First version shipped as v60, roads as v63.

## What the player can do

| Tool | What it does |
| --- | --- |
| Look | Drag to move the view; two fingers pinch to zoom and twist to turn. Mouse: right button turns, wheel zooms. Keys: WASD or arrows pan, Q E turn, R F zoom |
| Raise, Lower, Flatten, Smooth | Reshape the ground under a soft round brush with a 5 to 40 ft radius, strength 1 to 10. Flatten levels to the height where the stroke starts |
| Dirt, Grass | Paint the ground toward worked dirt or back to grass (Grass also paints over the built-in dirt yards) |
| Select | Pick a tree, boulder or machine; drag to move it; its card turns, resizes, copies or deletes it (machines move and turn only) |
| Add | Place a pine, leafy tree or boulder; keep holding to drag it into place |
| Query | Read a spot's height, slope, surface, whether it can be driven, your edits there and what stands on it, in feet |
| Roads | Pick a road and drag its points; tap it between points to add one; New road lays one point by point. Its card sets width, grass up the middle, grading and the picked point's height, and deletes points or the road |

Undo and Redo hold 30 steps. Number keys 1 to 0 pick the first ten tools, Delete removes the selected asset or road point, Enter finishes a new road, G or Esc closes the editor.

## Where the code is

| File | Editor parts |
| --- | --- |
| `js/editor.js` | Everything the player touches: open and close, tools, camera, picking, brush, assets, roads, undo, the info cards, save, copy and load |
| `js/materials.js` | The material library `MAT_LIST` (append only: a material's saved id is its index + 1), the ground shader's material uniforms `matU`, and `matTexUpdate`, which builds the texture array of the materials the map uses |
| `js/terrain.js` | The edit layers `ED_H`, `ED_P` and `ED_M`, `paintAt` and `matTint` (a vertex's colour under the materials), `mapEncode` and `mapDecode`, loading `bhd_map` at startup, `baseHeight` (= `groundHeight` + `ED_H`), `yardAt` (+ `ED_P`), the road list `ROADS` and `roadsBuild`, `wallBuild` (ground too steep to drive), `digBase` (a dig-grid vertex's undug colour) |
| `js/scenery.js` | `groundColor`, the 0.5 m mesa mesh `midPatch` and `midUpdate`, `buildSkirts`, `tuftsRefresh`, and the assets: `assets`, `defaultAssets`, `assetsBuild` |
| `js/shadowproxy.js` | `shpTreesRefresh`: tree shadows re-read the instance matrices after assets change |
| `js/controls.js` | `edOn`; the game's keyboard and orbit-drag handlers return early while it is true |
| `js/main.js` | `frame()` hands the whole frame to `editorFrame()` while the editor is open, so the game stands still |
| `index.html`, `css/game.css` | The `#editor` overlay; `body.editing` hides the game HUD but keeps toasts |

## Coordinates and units

World units are metres: x east, z south (north is −z, the top of the site map), y up. Height 0 is the mesa top. Everything shown to the player is in feet; `FT` (in `js/blocks.js`) is 0.3048, so feet = metres / `FT`.

The mesa is a rounded square centred at (0, 30), about 90 m (295 ft) across (`EDGE` 45, `MZ` 30). The dig grid (`S` = 64 m at 0.16 m cells, centred on the origin) holds the trench and is the only ground that can be dug. The rest of the mesa is drawn by a 0.5 m mesh (`MID`, x −58 to 58, z −32 to 92) and everything beyond by a 2 m mesh.

## What a map stores

These layers sit on top of the generated mesa. Nothing about the generated mesa itself changes.

- `ED_H`: a height offset in metres, and `ED_P`: paint from −1 (grass) to +1 (dirt). Both are 0.5 m grids over the `MID` area (`ED_X0` −58, `ED_Z0` −32, 233 × 249 cells), read with `edSample` (bilinear). The outer 3 cells are kept at 0 so edited ground always meets the coarse outer mesh.
- `ED_M`: the material painted on each of the same cells (`Uint8Array`, 0 natural ground, else an id into `MAT_LIST`), read nearest-cell with `paintAt`. Ground vertices blend toward the materials' mean colours (`matTint`, crisp over about 0.25 m) and carry how much is covered in the `matA` attribute. Painted Mud inside the dig grid is also saturated ground: `digBase` keeps its cover in `mudBase` (`matCovOf`), where tracks and tyres rut deep and puddles stand in the ruts (`stampRut` in `js/dirt.js`, `waterTick` in `js/water.js`). Outside the dig grid the same happens on mud tiles (`js/mud.js`): an 8 m tile of 2 in ground is made where a rut first starts, the 0.5 m mesh gets a hole there (`midHoles`), and `edRefresh` calls `mudEdRefresh` so tiles take new heights and paint while keeping their ruts; on Medium and High graphics with WebGL2 the ground shader looks each pixel's id up in `matU.tMatId` (one texel per cell, flagged `needsUpdate` when painting) and draws that material's texture from the array. Dug or dumped ground drops the cover.
- `assets`: the trees and boulders, `{t: 'pine' | 'leafy' | 'rock', x, z, yaw, s: size, c: tint index}`. With no saved map, `defaultAssets()` makes the same layout every time (a seeded shuffle; it used to be random per load).
- `ROADS`: `{w: width in metres, mid: 1 for grass up the middle, pts: [[x, z], ...]}`. A road is graded when every point has a third number, its height; the ground is then cut and filled to the road over a 2.5 m bank. Otherwise the road follows the ground.

### Saved text

A map is saved on the device as `localStorage.bhd_map` and copied out by Map file → Copy map. It is JSON:

```
{
  "game": "backhoe-dig", "v": 1,
  "h": {"r": [i0, j0, w, h], "d": "<base64 Int16, centimetres>"},   // only the box holding height edits
  "p": {"r": [i0, j0, w, h], "d": "<base64 Int8, hundredths>"},     // only the box holding paint
  "m": {"r": [i0, j0, w, h], "d": "<base64 Uint8, material ids>"},  // only the box holding materials
  "assets": [["pine", x, z, yaw, size, tint], ...],
  "roads": [[width, grassStrip, [[x, z, height?], ...]], ...]
}
```

Each part is optional; a map with only a few edits is a few KB. `assets` and `roads` are written once the player has changed them, and then replace the defaults entirely. `mapDecode` validates everything (sizes, ranges, types) and throws on anything that is not a map. Load a map by saving its text to `bhd_map` and reloading; `terrain.js` reads it before any ground is built, so every mesh, the dig grid's original grade (`H0`), the site save and the steep-ground grid start from the edited ground.

## How an edit reaches the screen

The editor never rebuilds the world. It changes a layer, then brings everything built from the ground up to date over the area that changed (`edRefresh(rect, full)`):

1. Dig grid: each vertex's original grade `H0` becomes the new `baseHeight`, and `H` moves by the same amount, so dug holes and dumped piles keep their depth. A vertex that was undug stays exactly equal to `H0`, which keeps the site save (`js/save.js`, which stores `H − H0`) from saving it. Then the colours (`digBase`), tufts, tall grass (`lawnTerrain`), the mesh (`updateTerrain`) and blocks.
2. The 0.5 m mesa mesh: heights, colours and dirt texture amount (`midUpdate`, rows only).
3. The steep-ground grid that stops machines (`wallBuild`), grass tufts (`tuftsRefresh`), and trees and boulders standing in the area (`assetsBuild`, `shpTreesRefresh`).
4. On a full refresh (the end of a stroke, drag or road change), the skirts that hide seams between the meshes, if the area touches a seam.
5. When the editor closes after any change: the site map's background is redrawn.

While the brush is held or a road point is dragged, the layer changes every frame but the refresh runs at most every 110 ms; the stroke's end does a full refresh. A refresh under a 15 ft brush measured about 35 ms in headless Chromium, most of it in the dig grid's colours, which is why the brush radius is capped at 40 ft.

## Undo

`ed.undo` and `ed.redo` hold up to 30 entries. Applying an entry swaps the stored state with the current one, so the same entry undoes and redoes.

- Brush strokes store only the changed box of `ED_H`, `ED_P` and `ED_M` (copied from a snapshot taken when the stroke starts).
- Asset changes store the whole asset list as JSON (a few hundred entries).
- Road changes store the whole road list as JSON and the area to refresh.

## Things to know before changing it

- Anything new that is built from the ground (a mesh, a placement, a lookup grid) must either be rebuilt in `edRefresh` or read `baseHeight` live; otherwise it will not follow edits.
- Changing the generated mesa (`groundHeight`, hills, scarp) moves the ground under every saved map, since maps store offsets, not absolute heights. Saved `ED_H` keeps its meaning (raise this spot by so much) but may land differently.
- three.js r128 sizes an `InstancedMesh`'s colour buffer from the live `count` the first time `setColorAt` runs. The asset meshes start at count 0, so `scenery.js` allocates `instanceColor` at full capacity up front; without that every tree draws black.
- Point handles use `PointsMaterial` with `sizeAttenuation: false`, whose size is in device pixels, so it is multiplied by the pixel ratio each time the dots are drawn.
- The editor reads raw key codes (`keys[...]`), not the player's bindings from the Keys panel, so its camera keys never change. G opens it only if no game action is bound to G.
- The truck's road grip (`roadAmt`), the mower's and machines' steep-ground stops (`wallAt`), and the maps all read the live road list and layers, so they follow edits with no extra work.
- Machine positions moved in the editor are kept by the site save (`bhd_rigs`), not the map.

## Limits and ideas for next

- A map lives on one device (and one origin: the claude.ai version and the Vercel site have separate storage). Copy map / Load a map moves it as text.
- There is no way yet to make a map the shipped default for everyone. The simplest route: a `data/map.js` that sets the map text, read by `terrain.js` before `bhd_map`.
- Only the dig grid around the trench can be dug. Sculpting works anywhere in the `MID` area, but the bucket only digs in the dig grid.
- The scarp, the hills and the stockpiles are part of the generated mesa. They can be sculpted over or flattened, not deleted.
- A graded road's banks are too steep to drive. Laying or widening a graded road across another road can block the one it crosses.
- The Family Island, its roads (`ISLAND_ROADS`), buildings, trees and the bridges are fixed for now: the editor layers cover only the `MID` area, and the island's trees are not editor assets. The editor camera can pan over to look at it.
- The machines' start spots (used by Reset), the trench, the gas main and the tall-grass patch are fixed.
- Ideas: multi-select and move for assets, a road "follow the ground but smooth it" mode, a slope-limited flatten for building ramps, a shipped default map, and dig-grid placement anywhere on the mesa.
