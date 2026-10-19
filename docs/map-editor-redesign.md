# Map editor redesign: analysis and plan

Written at v120 (October 2026). Steps 1, 3 and 4 (the bars, On the map and selecting several) shipped together as v129; the rest is still to do. This covers what the map editor is today from the screen's side and from the side of what it can do, then a plan to rebuild its layout around bars across the top, left and bottom, with a full asset editor (library, list, select, add, remove and more). `docs/map-editor.md` describes how the editor works inside; this file is about where it should go next. Nothing here has been built yet.

## 1. Where it stands

### Layout today

```
┌───────────────────────────────────────────────────────────────┐
│ MAP EDITOR [Undo][Redo][Map file][Done]                       │
│ [Look ][Raise ] ┌─ options card ─────────────┐                │
│ [Lower][Flat  ] │ brush · shape · edge · dug │                │
│ [Smth ][Dirt  ] │ material library (scrolls) │     the        │
│ [Grass][Select] │ hint paragraph             │     ground     │
│ [Add  ][Query ] ├─ Map file card ────────────┤                │
│ [Roads][Paint ] ├─ info / selected card ─────┤                │
│                 └────────────────────────────┘                │
└───────────────────────────────────────────────────────────────┘
```

Everything sits in the top-left third: a title row, a 2 × 6 grid of text buttons, and one scrolling column (`.edside`) that stacks the tool's options, the Map file card and the info or selected card on top of each other. The rest of the screen is ground.

### What works and should be kept

- Edits show at once (the area refresh in `edRefresh`), and the soft-ring brush outline shows where a stroke will land.
- The Query card reads well: height, slope, surface, whether it can be driven, soil wetness, your edits, what stands there, all in feet.
- The material library has real thumbnails, groups by kind, and takes the owner's own textures (upload, seamless tile, publish to every device).
- The road card gives useful numbers (length, points, steepest grade) and the tools to grade a road.
- Undo and Redo, 30 steps, for brushes, assets and roads alike.
- Touch works throughout: pinch, twist, drag. The editor is usable on the phone.
- The save format is tolerant: maps skip parts they don't use, and keep kinds of thing they don't know yet.

### Problems on the screen

1. **One crowded corner.** The options, the Map file card and the selected thing's card all fight for one column. On the phone (844 × 390) the Paint options cover about 60% of the view and show a row and a half of the library before it scrolls; the hint text runs into the swatches.
2. **Twelve flat tools, no groups.** Shaping (Raise, Lower, Flatten, Smooth), painting (Dirt, Grass, Paint), things (Select, Add), Roads and Query all sit side by side as plain words, in an order that doesn't follow them. Dirt and Grass are separate tools even though they are just two more paints.
3. **No icons.** Every tool and option is a text pill, which costs room and is slow to scan.
4. **The Add catalogue is a wall of words.** 17 pills (Pine tree … Dumpster) with no pictures, no groups, no search, and no hint of how big each thing is.
5. **The selected thing's card only lives in Select.** Switch tools and the selection and its card go away. There's no way to change a thing while placing more.
6. **No status line.** The cursor's position and height, the brush size, the zoom and how many things there are, are never shown in one place.
7. **No view controls on the screen.** Zoom, turn, north-up and "back to where I was" exist only as gestures and keys. No compass.
8. **The keys don't follow the rules.** The editor reads raw key codes, not `keys.js`, so the player can't rebind them, tips can't name them with `keyLabel`, and number keys reach only the first ten tools (Roads and Paint have none).
9. **Hints are paragraphs.** Each tool explains itself in a sentence or two that stays on screen all the time.
10. **Map file is a text box.** Copy and paste of a JSON blob; no named maps, no file download or upload, no list.
11. **Done sits next to Map file** in the same style, and closing never asks.

### Problems with what it can do

The asset side is the thinnest part.

| Need | Today |
| --- | --- |
| See every thing on the map | No list. Things are found only by looking around for them |
| Pick several | One at a time. No box select, no select all of a kind |
| Move, turn, size several | No. Each one by hand |
| Exact place | Drag only. No X / Z numbers, no snap to a grid |
| Exact turn | A 1° slider. Add snaps new things to 15°, Select does not |
| Colour | Picked at random when placed (houses, trees), and can't be changed after |
| Copy | Puts one copy alongside. No copy and paste at the cursor, no duplicate along a line, no row of N |
| Fences and cone lines | One section at a time, then Copy over and over |
| Trees by the dozen | One tap per tree. No scatter brush |
| Hide or lock | No. A thing in the way of a brush can't be locked or hidden |
| Remove a kind, or start a kind over | No. Start over clears the whole map |
| Machines | Can be moved and turned in Select, but are not in any list and can't go back to their start spots |
| Roads | Fine to edit, but no list of roads; picking one means finding it |
| Other islands | Their buildings and trees are fixed (idea E07) |

Other gaps from the idea board that land in the editor: named maps (E08), maps by link (E05), blocks in the editor (E06), road profiles and takeoff numbers (E09, E10), ponds (E04), utilities (E01).

## 2. The new layout

Bars across the top, left and bottom, with the ground in the middle staying as big as possible. Each bar has one job:

- **Top bar: the map.** File, undo history, view, Done.
- **Left bar: the tools.** Icon rail by group, with a drawer that opens beside it for the group's library or list.
- **Bottom bar: what you're doing right now.** The tool's options, or the selected things' settings when something is picked, and a thin status strip under it.

### PC (1280 × 720)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ◀ Done │ Map: "Main yard" ▾ │ ↶ ↷ History ▾ │ View: ⌂ N⇡ ⊕ ⊖ │ Grid ▢ │ ? │   top bar 44 px
├────┬───────────────────┬───────────────────────────────────────────────────┤
│ ⛰  │ LIBRARY           │                                                   │
│ 🖌  │ [search……]        │                                                   │
│ 🌲 │ Trees & rocks ▾    │                                                   │
│ 🛣  │ ▣ Pine  ▣ Leafy    │                 the ground                        │
│ 🔍 │ ▣ Boulder          │                                                   │
│    │ Buildings ▾        │                                          ◎ compass│
│ ── │ ▣ House ▣ Shed …   │                                                   │
│ ☰  │ ─────────────      │                                                   │
│ 📋 │ ON THE MAP (214)   │                                                   │
│    │ ▸ Pines 88  👁 🔒   │                                                   │
│    │ ▸ Fences 41 👁 🔒   │                                                   │
├────┴───────────────────┴───────────────────────────────────────────────────┤
│ 3 selected: Fence ×3 │ Turn [——●——] 90° │ Size 100% │ Colour ●●●● │ X 12 ft Z −40 ft │ ⧉ Copy │ ⇶ Row │ 🔒 │ 🗑 │  bottom bar 56 px
│ Cursor 112 ft E, 30 ft S · +3.4 ft · slope 6% · brush 15 ft · zoom 45 ft · 214 things            │  status 22 px
└────────────────────────────────────────────────────────────────────────────┘
```

Left rail 56 px wide (icons with short labels under them). Drawer 260 px, opens with the group, closes with its icon again or a swipe. On a wide screen the drawer can stay open.

### Phone, landscape (844 × 390)

```
┌──────────────────────────────────────────────────────────┐
│ ◀ │ Main yard ▾ │ ↶ ↷ │ ⌂ ⊕ ⊖ │                        ?   │  top 40 px
├───┬──────────────────────────────────────────────────────┤
│ ⛰ │                                                      │
│ 🖌 │                                                      │
│ 🌲│                    the ground                         │
│ 🛣 │                                                      │
│ 🔍│                                                      │
├───┴──────────────────────────────────────────────────────┤
│ Brush ●— 15 ft │ Round ▣ │ Hard ▣ │ Strength 5 │ ⋯          │  bottom 48 px
└──────────────────────────────────────────────────────────┘
```

On the phone the drawer slides over the ground (about 45% of the width) and closes itself when a library item is picked, so the ground comes back for placing. The status strip folds into the bottom bar's ⋯ menu. Rail 48 px. Every bar keeps the game's large readable text (no smaller than 14 px, the HUD's usual 15–18 px for labels).

### Tool groups (the left rail)

| Group | Tools in it (picked in the bottom bar) | Drawer |
| --- | --- | --- |
| ⛰ Shape | Raise, Lower, Flatten, Smooth, and later Ramp (slope-limited flatten, an idea in map-editor.md) | none |
| 🖌 Paint | One library. Worked dirt and Grass become swatches in it beside Natural ground | Material library (today's, moved into the drawer), + Your own texture |
| 🌲 Things | Select, Add, Scatter, Line | Library of things (pictures) and the On the map list |
| 🛣 Roads | Pick, New road, Add point | List of roads (name, kind, length) |
| 🔍 Inspect | Query, Measure (distance, area, and later E10's takeoff numbers) | none |
| 📋 Map (bottom of the rail) | | Named maps, file, start over |

Look stops being a tool: dragging empty ground with the Select tool, or with any tool and two fingers, or the right mouse button, moves the view, as it does now. A ✋ button in the top bar holds Look for one-finger panning on the phone.

### The bottom bar

The bottom bar shows one of two things:

- **Nothing selected:** the active tool's options. The brush tools get Size, Strength, Round/Square, Hard/Soft with Softness, and Level/Keep dug ground. Add gets the picked thing with its size, colour and turn before placing. Roads gets the road card's controls.
- **Something selected (with any tool):** the inspector, as in the PC mockup. One thing shows its name, X and Z in feet, Turn, Size, Colour, Lock, Copy and Delete. Several show the count by kind, with Turn and Size applied to all (each about its own centre, or about the group's centre with "as a group"), plus Align, Row, Lock and Delete. A machine shows Turn, X/Z and "Back to its start spot".

The long hint paragraphs go. Each tool gets a one-line tip in the status strip that comes from `WORDS` and names keys with `keyLabel`, and the help card keeps the long text.

## 3. The asset editor

### Library (adding things)

- A card for each kind with a **picture**: each model drawn once into a small canvas with an offscreen render the first time the drawer opens, then cached (a few ms each, nothing on the phone's frame time once done). The size in feet goes under the name.
- **Groups:** Trees & rocks (pine, leafy, boulder), Buildings (house, shed, garage), Fencing (fence, farm gate), Site gear (light tower, cone, barrel, pallet, porta-potty, sign, dumpster), Yard (bench, picnic table). The group is a new `cat` field in `PROPS`, and trees and boulders join the same table.
- **Search** across names, and a **Recent** row of the last five used.
- **Before placing:** size, colour (house colours, tree tints) and turn are set in the bottom bar, and stick for the next one. "Random" stays as a choice so trees still vary.
- **Ways to place**, in the bottom bar:
  - **One:** tap to place, hold to drag it into place (today's behaviour).
  - **Stamp:** each tap places another. Stays on until switched off.
  - **Line:** drag a line and things are laid along it at their own width (fence sections end to end, gates included) or at a set spacing (cones, barrels, light towers). Each section turns to follow the line.
  - **Scatter:** a brush that drops trees or boulders inside it at a density, with a size range and a minimum spacing. Hold Alt (or the Erase toggle on touch) to take them away under the brush.

### On the map (the list)

- Every placed thing, every machine and every road, grouped by kind with a count: "Pines 88", "Fences 41", "Machines 5", "Roads 7".
- Open a group to see each one: name, distance and direction from the trench (as today's Spot line), size.
- **Tap a row:** select it and fly the camera to it. **Long-press or the checkbox:** add it to the selection. **Tap the group's count:** select all of that kind.
- Per group and per row: 👁 hide (left out of the view while editing, to get at what's behind it; it isn't saved, and the game always draws it) and 🔒 lock (can't be picked on the ground or moved by a brush, saved with the map).
- A filter row: All · Near the view · Selected · Locked.
- Group buttons: Delete all of this kind (with Undo), Put back the default ones (from `defaultAssets()`, only that kind).

### Selecting

- Tap to select. Shift-tap, Ctrl-tap or a long-press to add or take away.
- Drag on empty ground with Select: a **box select** (on the phone, a two-finger tap toggles box mode so one-finger drag can still pan).
- Ctrl+A selects everything in view; Esc clears.
- The selection stays when switching tools (today it's dropped), so a brush can be used around a picked house and it stays picked.
- Picked things get the ring they have now, plus a soft fill under each.

### Changing the selection

- **Move:** drag any picked thing to move them all. Arrow keys nudge 1 ft (Shift 10 ft).
- **Turn and size:** a handle ring on the ground around the selection (drag its knob to turn, its edge to size), and the sliders in the bottom bar for exact numbers.
- **Snap** (top bar, Grid ▢): a 1, 2, 5 or 10 ft grid; turns in 15° steps; snap to a road edge (faces the road); snap to another thing's end (fences meet).
- **Align and space:** line the selection up along its average row, space it evenly, turn it to all face the same way.
- **Copy, cut, paste:** Ctrl+C, Ctrl+X and Ctrl+V; paste lands at the cursor, keeping the selection's shape. Ctrl+D duplicates alongside (today's Copy).
- **Row:** N copies at a spacing, along the thing's width or a chosen direction (a fence run or a row of lights in one step).
- **Delete:** Delete or Backspace, or 🗑. Undo brings it all back as one step.
- **Colour:** swatches in the bottom bar, applied to every picked thing that takes a colour.

### Undo for all of this

Asset undo already stores the whole list as JSON, so bulk changes are one entry each. The 30-step limit stays. The top bar's History ▾ lists the steps by name ("Moved 3 fences", "Painted Concrete", "New road") and jumps back to any of them.

## 4. Map management (📋 drawer)

- **Named maps (E08):** several maps on the device in `bhd_maps` (name → map text), one marked current in `bhd_map` as now, so nothing else changes. New, Rename, Duplicate, Delete, Switch (switching reloads, as Load does).
- **Download and open a file:** save the map as `name.island.json` and open one, beside today's Copy and Load text.
- **This map:** counts of things by kind, roads and their lengths, how much ground is painted or shaped, and its size in KB.
- **Start over:** asks first, and only clears the current map, or one layer of it (shape, paint, things, roads).
- Later: share by link (E05) and a shipped default map (`data/map.js`, from map-editor.md's ideas).

## 5. Keys

All editor keys move into `js/keys.js` as `KEY_ACTIONS` in a new group "Map editor", with an editor-only scope (a new `s:'edit'`, like `walk` and `ride`, so they can share keys with the game's actions), handlers in `KEY_RUN`, and camera movement read with `held(id)`. The player can then rebind them, and tips name them with `keyLabel`. Suggested defaults:

| Key | Does |
| --- | --- |
| G, Esc | Close the editor (Esc first clears a selection) |
| 1 – 5 | Shape, Paint, Things, Roads, Inspect |
| WASD, arrows | Pan (nudge the selection when something is picked) |
| Q, E · R, F | Turn, zoom (as now) |
| [ ] | Brush or turn smaller and bigger |
| Ctrl+Z, Ctrl+Y | Undo, redo |
| Ctrl+C, X, V, D | Copy, cut, paste at the cursor, duplicate |
| Ctrl+A | Select everything in view |
| Delete | Delete the selection or road point |
| Enter | Finish a new road or line |
| H, L | Hide, lock the selection |
| Home | Fly to the selection, or back to the start view |

## 6. The order to build it in

Each step ships on its own as a version and leaves the editor working.

| Step | What | Dev hours |
| --- | --- | --- |
| 1 | **The bars.** New top, left and bottom bars and the drawer; tool groups with icons; options and the selected card move to the bottom bar; Dirt and Grass join the Paint library; status strip; phone layout; Look folded in. No new features yet | 8 |
| 2 | **Keys.** Editor keys into `keys.js` with the `edit` scope; tips through `WORDS` and `keyLabel` | 3 |
| 3 | **On the map list.** The grouped list of things, machines and roads; tap to select and fly there; delete a kind, put back defaults | 5 |
| 4 | **Selecting several.** Shift, long-press and box select; the selection survives tool changes; move, turn, size, colour and delete for many; one undo step each; the inspector for many | 6 |
| 5 | **Library with pictures.** Thumbnails, groups, search, recent; size, colour and turn set before placing | 5 |
| 6 | **Placing in bulk.** Stamp, Line (fences and cones along a drag) and Scatter (trees and boulders) | 6 |
| 7 | **Exact edits.** X/Z numbers, snap grid and angles, the turn and size ring, align and space, copy and paste at the cursor, Row | 6 |
| 8 | **Hide and lock.** Lock saved with the map (an optional seventh entry on each asset, so older maps still load and older code keeps them), hide for the session | 3 |
| 9 | **Maps.** Named maps, file download and open, map stats, layer-by-layer start over, History ▾ | 5 |
| 10 | **Inspect extras.** Measure distance and area; machines back to their start spots | 3 |
| | **Total** | **about 50** |

Later steps from the idea board fit into this layout without moving anything: E06 blocks (a Blocks group in the Things library), E09 and E10 (the road card in the bottom bar and Measure), E04 ponds and E01 utilities (new rail groups), E07 the other islands (the list and the layers widened to cover them).

## 7. Things to keep safe while building

- **Screen skins:** as of v120 the live skin (`island_gui`) styles no editor parts, so the editor's markup can change. New parts get ids; keep `#editor`, `#edUndo`, `#edRedo`, `#edDone` and `#edInfo` so older notes and tests still find them. After changing `index.html`, `css/game.css` or `js/gui.js`, run `python3 tools/gui_editor.py` and republish the screen editor artifact.
- **The phone:** the bars are plain HTML over the canvas and draw nothing in WebGL. Thumbnails render once. The line and scatter tools go through `assetsBuild`, which already handles hundreds of things; bulk moves refresh at most every 110 ms, like strokes.
- **The map format:** new fields are optional and added at the end (`mapDecode` keeps validating everything); a map from before the redesign loads unchanged, and a new map loads in old code (unknown fields ignored).
- **Everything still from `baseHeight`:** new placement tools stand things on `surfAt`, and anything built from the ground is rebuilt in `edRefresh`.
- **Units:** every number shown in feet (`FT`).
- **Docs:** update `docs/map-editor.md`, the README's Map editor section, the in-game help card and `docs/WORKFLOW.md` as each step ships.

## 8. The owner's answers

1. The selected things' settings go in the **bottom bar**.
2. **Icons with a short word** under each in the left bar (and beside the word in the top bar).
3. The drawer **stays open by default** on a computer.
4. Steps 1, 3 and 4 ship **together** as one version.

## 9. What shipped first, and what changed from the plan

- The left bar has Shape, Paint, Things, Roads, Inspect and Map; the top bar Done, Undo, Redo, Look, Closer, Farther, North up, Start view and Panel. The map's name and History ▾ wait for step 9, the grid snap for step 7.
- The Query card and the road card show in the bottom bar too, above the tool's options, and take the selection's place while shown (the selection is kept).
- Box select: a mouse drag on empty ground with Select draws the box (it used to move the view; the middle and right buttons and the keys still do). On touch it's the Box select toggle in the bottom bar, as two-finger taps already move the view.
- On a phone the bottom bar is one row that scrolls sideways, and the status line is hidden, so all six left-bar buttons fit a 390 px tall screen.
- The things to add are grouped words for now; their pictures are step 5.
- Machines can be in a selection and move with it; turn, size, colour, copy and delete leave them out.
