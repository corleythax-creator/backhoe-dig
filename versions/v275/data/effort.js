// Corley's Island build-time tracking, read as data by build.html and the master dashboard. Add a version entry when one ships.
window.EFFORT = {
 "project": "Corley's Island",
 "updated": "2026-10-31T01:19:00Z",
 "rateUsd": 100,
 "method": {
  "dh": "Developer hours without AI: what one experienced three.js developer would need to build each version's features by hand, judged feature by feature.",
  "act": "Active AI hours: half-hour blocks (Central) holding a published version, the same rule as Cruise Brandon's Changes by Day.",
  "turnaround": "Minutes from the ask in chat to that version going live.",
  "tris": "Triangles in the scene, counted by building the scene headlessly. Versions 1 to 5 were not counted."
 },
 "days": [
  {
   "d": "2026-10-16",
   "dh": 125,
   "act": 0.5,
   "versions": 7
  },
  {
   "d": "2026-10-17",
   "dh": 717,
   "act": 16,
   "versions": 101
  },
  {
   "d": "2026-10-18",
   "dh": 279.5,
   "act": 6,
   "versions": 41
  },
  {
   "d": "2026-10-19",
   "dh": 161.7,
   "act": 6.5,
   "versions": 25
  },
  {
   "d": "2026-10-20",
   "dh": 77,
   "act": 3.5,
   "versions": 9
  },
  {
   "d": "2026-10-21",
   "dh": 80.5,
   "act": 4,
   "versions": 12
  },
  {
   "d": "2026-10-22",
   "dh": 115.75,
   "act": 4,
   "versions": 11
  },
  {
   "d": "2026-10-23",
   "dh": 108.5,
   "act": 2.5,
   "versions": 8
  },
  {
   "d": "2026-10-24",
   "dh": 32.75,
   "act": 4,
   "versions": 10
  },
  {
   "d": "2026-10-25",
   "dh": 148.25,
   "act": 8,
   "versions": 27
  },
  {
   "d": "2026-10-27",
   "dh": 54,
   "act": 3.5,
   "versions": 7
  },
  {
   "d": "2026-10-28",
   "dh": 14.5,
   "act": 1,
   "versions": 2
  },
  {
   "d": "2026-10-29",
   "dh": 55.25,
   "act": 3.5,
   "versions": 9
  },
  {
   "d": "2026-10-30",
   "dh": 26.25,
   "act": 2,
   "versions": 6
  }
 ],
 "extra": [
  {
   "what": "GitHub repo, Vercel site, master dashboard entry and this build-time page",
   "dh": 6,
   "d": "2026-10-17"
  }
 ],
 "versions": [
  {
   "v": 1,
   "asked": "2026-10-16T23:32:00-05:00",
   "live": "2026-10-16T23:39:23-05:00",
   "dh": 60,
   "tris": null,
   "chars": null,
   "what": "First playable: excavator with joysticks, diggable heightmap ground, bucket fill, trench work order, buried gas main, cab and chase cameras."
  },
  {
   "v": 2,
   "asked": "2026-10-16T23:41:00-05:00",
   "live": "2026-10-16T23:43:42-05:00",
   "dh": 16,
   "tris": null,
   "chars": null,
   "what": "Double the triangles: tracks with sprockets, bent boom, rams that follow the joints, curved bucket, two-tier pines."
  },
  {
   "v": 3,
   "asked": "2026-10-16T23:45:00-05:00",
   "live": "2026-10-16T23:46:43-05:00",
   "dh": 12,
   "tris": null,
   "chars": null,
   "what": "Double again: finer dig grid with partial updates, rounder parts, raised panels on the arm."
  },
  {
   "v": 4,
   "asked": "2026-10-16T23:47:00-05:00",
   "live": "2026-10-16T23:47:40-05:00",
   "dh": 1,
   "tris": null,
   "chars": null,
   "what": "FPS meter and triangle counter."
  },
  {
   "v": 5,
   "asked": "2026-10-16T23:48:00-05:00",
   "live": "2026-10-16T23:49:23-05:00",
   "dh": 8,
   "tris": null,
   "chars": null,
   "what": "Speed: merged the machine into a few meshes, batched dirt bits, auto resolution."
  },
  {
   "v": 6,
   "asked": "2026-10-16T23:51:00-05:00",
   "live": "2026-10-16T23:51:56-05:00",
   "dh": 12,
   "tris": 185652,
   "chars": null,
   "what": "Quality: sky dome, distant mountains, 3,600 grass tufts, sharper soft shadows, clumpy dirt color."
  },
  {
   "v": 7,
   "asked": "2026-10-16T23:54:00-05:00",
   "live": "2026-10-16T23:57:15-05:00",
   "dh": 16,
   "tris": 360984,
   "chars": 46403,
   "what": "Rams on brackets, bucket linkage, 14 live hydraulic hoses; double triangles again."
  },
  {
   "v": 8,
   "asked": "2026-10-16T23:57:00-05:00",
   "live": "2026-10-17T00:00:16-05:00",
   "dh": 14,
   "tris": 183020,
   "chars": 50264,
   "what": "Ground split into a fine dig zone and a coarse outer ring; excavator detail doubled."
  },
  {
   "v": 9,
   "asked": "2026-10-17T00:02:00-05:00",
   "live": "2026-10-17T00:05:08-05:00",
   "dh": 10,
   "tris": 183020,
   "chars": 52664,
   "what": "Textures: grass, dirt and grime from OpenAI image gen, blended in a custom ground shader."
  },
  {
   "v": 10,
   "asked": "2026-10-17T00:06:00-05:00",
   "live": "2026-10-17T00:07:41-05:00",
   "dh": 10,
   "tris": 183020,
   "chars": 60945,
   "what": "30-second speed test with a camera tour and results screen."
  },
  {
   "v": 11,
   "asked": "2026-10-17T00:08:00-05:00",
   "live": "2026-10-17T00:12:20-05:00",
   "dh": 28,
   "tris": 190256,
   "chars": 70006,
   "what": "Imperial units; drivable dump truck with tipping bed, loading and hauling."
  },
  {
   "v": 12,
   "asked": "2026-10-17T00:13:00-05:00",
   "live": "2026-10-17T00:15:48-05:00",
   "dh": 12,
   "tris": 325780,
   "chars": 73487,
   "what": "WASD driving, map doubled, new pine and broadleaf trees."
  },
  {
   "v": 13,
   "asked": "2026-10-17T00:16:00-05:00",
   "live": "2026-10-17T00:18:59-05:00",
   "dh": 16,
   "tris": 438556,
   "chars": 76513,
   "what": "Grassy mesa with cliffs, meadows, animated lake and a mountain range."
  },
  {
   "v": 14,
   "asked": "2026-10-17T00:19:00-05:00",
   "live": "2026-10-17T00:21:55-05:00",
   "dh": 12,
   "tris": 448916,
   "chars": 83870,
   "what": "Minimap and big map (M); mountains pushed far into the haze."
  },
  {
   "v": 15,
   "asked": "2026-10-17T00:22:00-05:00",
   "live": "2026-10-17T00:23:37-05:00",
   "dh": 4,
   "tris": 438916,
   "chars": 84699,
   "what": "Cliff edge pulled in to overlook the lake; rock on the dig grid."
  },
  {
   "v": 16,
   "asked": "2026-10-17T00:24:00-05:00",
   "live": "2026-10-17T00:25:17-05:00",
   "dh": 3,
   "tris": 471316,
   "chars": 84739,
   "what": "Mesa doubled behind the site, edge a little closer."
  },
  {
   "v": 17,
   "asked": "2026-10-17T00:27:00-05:00",
   "live": "2026-10-17T00:29:16-05:00",
   "dh": 12,
   "tris": 490576,
   "chars": 87789,
   "what": "Speed test v2 with truck clones; truck detail x4."
  },
  {
   "v": 18,
   "asked": "2026-10-17T00:36:00-05:00",
   "live": "2026-10-17T00:52:00-05:00",
   "dh": 6,
   "tris": 490576,
   "chars": 89963,
   "what": "Compact HUD: small status card (tap to fold), map and menu top right, smaller sticks with the mode switch between them."
  },
  {
   "v": 19,
   "asked": "2026-10-17T01:00:00-05:00",
   "live": "2026-10-17T01:39:00-05:00",
   "dh": 3,
   "tris": 490576,
   "chars": 92332,
   "what": "UI size option in the menu (1x, 1.5x, 2x); the HUD reflows to fit at the larger sizes."
  },
  {
   "v": 20,
   "asked": "2026-10-17T01:41:00-05:00",
   "live": "2026-10-17T01:54:00-05:00",
   "dh": 4,
   "tris": 490576,
   "chars": 93566,
   "what": "One keyboard layout for every machine: WASD/arrows = left stick, IJKL = right stick; 1/2/3 or Tab switch machine, Shift for fine moves, keys ease in and out, captions show the keys."
  },
  {
   "v": 21,
   "asked": "2026-10-17T01:55:00-05:00",
   "live": "2026-10-17T01:58:00-05:00",
   "dh": 4,
   "tris": 490576,
   "chars": 95623,
   "what": "Game controller support: sticks match the on-screen sticks, triggers are gas and reverse, LB/RB switch machine, Y cab view, View map, Menu help; a line strike rumbles."
  },
  {
   "v": 22,
   "asked": "2026-10-17T01:59:00-05:00",
   "live": "2026-10-17T02:12:00-05:00",
   "dh": 10,
   "tris": 490576,
   "chars": 99643,
   "what": "Soil layers: topsoil, red clay, sand bedding around the gas main, rock below; each digs at its own speed, holds its own slope and swells when dug; spoil keeps its colour; the HUD names the soil at the teeth."
  },
  {
   "v": 23,
   "asked": "2026-10-17T02:14:00-05:00",
   "live": "2026-10-17T02:22:00-05:00",
   "dh": 6,
   "tris": 490576,
   "chars": 102646,
   "what": "Cave-ins: walls cut deeper than about 4 ft, or with spoil within 2 ft of the edge, cave in after a warning trickle; shake, rumble and a cave-in count on the finish."
  },
  {
   "v": 24,
   "asked": "2026-10-17T02:22:00-05:00",
   "live": "2026-10-17T02:31:00-05:00",
   "dh": 8,
   "tris": 490576,
   "chars": 107065,
   "what": "Trench box: hook it with the bucket (T, controller X or the Hook box button), swing it into the trench and set it; walls between its panels cannot slump or cave in. Shown on the maps."
  },
  {
   "v": 25,
   "asked": "2026-10-17T02:03:00-05:00",
   "live": "2026-10-17T02:17:00-05:00",
   "dh": 8,
   "tris": 490600,
   "chars": 103749,
   "what": "Dump truck driving realism: weight-based acceleration and braking, grades pull on it, opposite stick brakes then shifts D/R at a stop, governed 20 mph (6 in reverse or bed up), rear tandem off-tracks in turns, tires scrub wide at speed, sprung body squats, dives, leans and sags under load, wheels follow the ground, brake and reverse lights, mph and gear on the HUD, see-through cab glass."
  },
  {
   "v": 26,
   "asked": "2026-10-17T02:19:00-05:00",
   "live": "2026-10-17T02:38:00-05:00",
   "dh": 5,
   "tris": 491144,
   "chars": 112960,
   "what": "Dirt road around the mesa rim: graded loop with wheel ruts, a grassy crown and a berm on the cliff side, on the map and legend; packed road rolls and grips better than grass; the berm scrapes instead of stopping the truck dead; the truck starts parked on the road."
  },
  {
   "v": 27,
   "asked": "2026-10-17T02:50:00-05:00",
   "live": "2026-10-17T02:49:00-05:00",
   "dh": 3,
   "tris": 491144,
   "chars": 115189,
   "what": "Code split into files so sessions can work in parallel: css/game.css and eleven js/ scripts (core, terrain, scenery, excavator, truck, trench box, controls, effects, maps, speed test, main loop). No change to play."
  },
  {
   "v": 28,
   "asked": "2026-10-17T02:52:00-05:00",
   "live": "2026-10-17T03:01:00-05:00",
   "dh": 2,
   "tris": 731144,
   "chars": 115415,
   "what": "Dig ground 4x finer: a point every 6 in instead of 1 ft (80,000 to 320,000 triangles), so trench walls, edges and spoil piles hold their shape; settling, cave-in and spoil reaches keep the same distances in feet."
  },
  {
   "v": 29,
   "asked": "2026-10-17T03:04:00-05:00",
   "live": "2026-10-17T03:10:00-05:00",
   "dh": 8,
   "tris": 764740,
   "chars": 122399,
   "what": "Chunkier loose dirt: instanced clods on spoil piles, trench floors and cave-ins (and where falling dirt lands), four times the flying dirt, a lumpy bucket load and truck heap with clods on it, and a Dirt detail setting (1x, 2x, 4x) in the menu."
  },
  {
   "v": 30,
   "asked": "2026-10-17T03:16:00-05:00",
   "live": "2026-10-17T03:23:00-05:00",
   "dh": 7,
   "tris": 753381,
   "chars": 128181,
   "what": "Trench shading: dug and dumped dirt darkens by how much ground rises around it; fresh cuts and spoil look damp and dry lighter over a few minutes. Soil-matched chunks: sod with grass from the first bite, crumbs, blocky clay lumps and sharp rock pieces, no clods from sand; loads remember what they hold."
  },
  {
   "v": 31,
   "asked": "2026-10-17T03:27:00-05:00",
   "live": "2026-10-17T03:42:00-05:00",
   "dh": 6,
   "tris": 753381,
   "chars": 133818,
   "what": "Engine sound and a backup beeper: synthesized six-cylinder diesels for the truck (revs climb through five gears and drop on each upshift) and the excavator (revs with hydraulic demand, lugs in hard soil); the truck beeps in reverse; volume falls off with distance; Sound on/off in the menu and on N. Fix: the rim berm now keeps both truck axles on the mesa, so a head-on hit no longer leaves it stuck nose-down over the cliff."
  },
  {
   "v": 32,
   "asked": "2026-10-17T03:27:00-05:00",
   "live": "2026-10-17T03:46:00-05:00",
   "dh": 12,
   "tris": 747000,
   "chars": 136279,
   "what": "Clods roll down pile faces (big ones farthest); tracks and tyres rut loose fill and crush clods; dust when dumping, digging dry topsoil, driving on dirt and in cave-ins; the bucket gets dirty, tracks and tyres muddy, and clay sticks in the bucket and truck bed; a heaped bucket dribbles when swung fast; Dirt detail 16x. Fixed textures sometimes not loading since the file split."
  },
  {
   "v": 33,
   "asked": "2026-10-17T03:25:00-05:00",
   "live": "2026-10-17T03:48:00-05:00",
   "dh": 8,
   "tris": 747000,
   "chars": 146028,
   "what": "Concrete blocks: 1×1, 2×2 and 3×3 ft cubes set from the bucket. A placement outline shows where one lands; they snap to a 1 ft grid, stack, and drop when dug under or lifted. Tracks and tires roll over a 1 ft block, taller ones stop the excavator and truck. Blocks button with size, Lift and Place in the HUD; B, Space, V, X on the keyboard; A and the D-pad on a controller; shown on the maps."
  },
  {
   "v": 34,
   "asked": "2026-10-17T03:25:00-05:00",
   "live": "2026-10-17T03:47:00-05:00",
   "dh": 10,
   "tris": 719332,
   "chars": 150481,
   "what": "Lighting pass: linear lighting with filmic tone mapping; a warm afternoon sun about 40 degrees up as the key light with a dim cool sky fill, so shade reads blue-grey; a sun disc and glow in the sky; Fresnel sky reflections on cab glass, chrome, mirror, paint and the lake; the excavator and truck catch their own shadows; ground darkens under both machines; grass tufts shade dark at the root; hazier mountain shadow sides."
  },
  {
   "v": 35,
   "asked": "2026-10-17T03:28:00-05:00",
   "live": "2026-10-17T03:55:00-05:00",
   "dh": 6,
   "tris": 757236,
   "chars": 165601,
   "what": "Dump truck detail, twice the triangles (37,600 to 75,500): a polished fuel tank with domed ends, straps and brackets, filler neck and green diesel cap, vent, gauge sender, drain and fuel lines; DEF tank; battery box lid; driveline with shafts, U-joints and tandem diffs; leaf springs, shocks and steering linkage; grille surround, fog lights, tow hooks, plates, mud flaps; wipers, beacon, antenna, hood mirrors and a cab interior; exhaust clamps and flex pipe; hoist and air lines; rear under-ride bar and hitch; bed sills, hinge pins, marker lights, ladder, tarp roller and tailgate hardware; wheels with two tread rows, rim lips, hand holes and hub domes."
  },
  {
   "v": 36,
   "asked": "2026-10-17T03:57:00-05:00",
   "live": "2026-10-17T04:02:00-05:00",
   "dh": 1,
   "tris": 757440,
   "chars": 166271,
   "what": "See-through dump truck cab: the solid cab block becomes a shell of roof, floor, walls and pillars with real window openings, so the seats, dash and steering wheel show through the glass from outside."
  },
  {
   "v": 37,
   "asked": "2026-10-17T04:02:00-05:00",
   "live": "2026-10-17T04:07:00-05:00",
   "dh": 0.5,
   "tris": 757440,
   "chars": 166289,
   "what": "Clearer excavator cab glass: thinner tint and softer sky reflections so the seat and controls read from outside at chase-camera angles, and the glass no longer hides see-through things behind it."
  },
  {
   "v": 38,
   "asked": "2026-10-17T03:45:00-05:00",
   "live": "2026-10-17T04:15:00-05:00",
   "dh": 8,
   "tris": 757440,
   "chars": 188408,
   "what": "Sound panel (on/off, Master, Engines, Backup alarm, Effects sliders) and rebuilt sound: diesel loops rendered from cylinder firings with exhaust crack, knock and pipe resonance, tuned to carry on phone speakers; turbo, tires and gravel, air brakes, bed hydraulics, tailgate, pump whine, relief valve, bucket scrape, track clank and pouring dirt; stereo, distance and a cliff echo."
  },
  {
   "v": 39,
   "asked": "2026-10-17T03:50:00-05:00",
   "live": "2026-10-17T04:15:00-05:00",
   "dh": 14,
   "tris": 821848,
   "chars": 212572,
   "what": "Tall grass and a zero-turn mower: a 52 by 39 ft patch of knee-high grass north of the trench that sways in the wind and bends away from the machines, and a red zero-turn with a 52 in deck, lap bars, swivel casters and a roll bar. Mow mode puts a lap bar on each stick (both up drives straight, opposite spins in place). Cutting leaves stubble with light and dark stripes by pass direction and throws clippings out the chute; Lawn row with percent mowed and time; a rendered V-twin with blade whine and grass chop in the sound mixer; seat view; patch and mower on the maps."
  },
  {
   "v": 40,
   "asked": "2026-10-17T04:05:00-05:00",
   "live": "2026-10-17T04:25:00-05:00",
   "dh": 5,
   "tris": 822372,
   "chars": 212849,
   "what": "Real-scale machines from CAT 320 and tri-axle dump truck specs. Excavator: 18.7 ft boom and 9.5 ft stick (was 13.8 and 8.5) with rams and hoses refitted, 7.2 ft track gauge, 24 in shoes, 10.8 ft of track on the ground, and a longer deck and counterweight for a 9 ft tail swing; reach along the ground 34 ft, dig depth 17 ft, top height 35 ft. Truck: 16 ft dump body (was 14 ft) hung farther past the tandem, frame and rear lighting moved back, capacity 12 yd³."
  },
  {
   "v": 41,
   "asked": "2026-10-17T04:17:00-05:00",
   "live": "2026-10-17T04:23:00-05:00",
   "dh": 3,
   "tris": 991332,
   "chars": 215752,
   "what": "Grass grows back: a mowed patch stays stubble for about 45 seconds, then rises back to full height over about four minutes while its stripes fade into the tall-grass colour; the Lawn percent drops as it grows, and a lawn left long enough becomes a fresh job. Four times the grass triangles (55,300 to 220,800): clumps every 8 in instead of 10, eight tapered blades per clump that arch and twist with their own shades of green, two seed stalks with straw heads, and drifts of grass gone to seed."
  },
  {
   "v": 42,
   "asked": "2026-10-17T04:16:00-05:00",
   "live": "2026-10-17T04:28:00-05:00",
   "dh": 1.5,
   "tris": 991332,
   "chars": 218242,
   "what": "The mowed lawn stays mowed: how long ago each patch was cut and its stripe, the mowing time and where the mower was left are saved in the browser and come back on reload, so grass keeps growing back from where it was (it grows while the game runs, not while it is closed). Reset restores the ground but no longer regrows mowed grass."
  },
  {
   "v": 43,
   "asked": "2026-10-17T03:52:00-05:00",
   "live": "2026-10-17T04:31:00-05:00",
   "dh": 17,
   "tris": 772000,
   "chars": 230763,
   "what": "Real shadows in the trench (a 1 ft shadow-only copy of the dug area); cut-face detail by layer (roots, mottles and pebbles, sand streaks, rock cracks, tooth grooves); groundwater below 6 ft that seeps, levels and makes mud, with a pump; a pouring stream from the bucket and tailgate, and higher drops spread wider; load thuds, clods rattling, cave-in rumble and a seeping trickle in the sound mix."
  },
  {
   "v": 44,
   "asked": "2026-10-17T09:54:00-05:00",
   "live": "2026-10-17T09:54:00-05:00",
   "dh": 1.5,
   "tris": 772000,
   "chars": 231857,
   "what": "Fix: the screen flashed black on phones. Auto resolution and window resizes resized the canvas right after a frame was drawn, blanking it; they now apply just before drawing, and resolution waits 30 s before stepping back up. A graphics reset from low memory now says so and is counted in the speed test."
  },
  {
   "v": 45,
   "asked": "2026-10-17T10:04:00-05:00",
   "live": "2026-10-17T10:04:00-05:00",
   "dh": 2,
   "tris": 772000,
   "chars": 232330,
   "what": "Phone speed: phones are held back by pixels, not triangles, so they now render at most 1.5x (44% fewer pixels than 2x) with 1024 shadow maps and the lighter PCF filter. Computers keep 2x and soft 2048 shadows. The speed test notes phone settings."
  },
  {
   "v": 46,
   "asked": "2026-10-17T10:06:00-05:00",
   "live": "2026-10-17T10:06:00-05:00",
   "dh": 0.5,
   "tris": 772000,
   "chars": 233098,
   "what": "The game shows its version (from the build log) at the bottom of the menu and on the How to play card."
  },
  {
   "v": 47,
   "asked": "2026-10-17T10:00:00-05:00",
   "live": "2026-10-17T10:12:00-05:00",
   "dh": 4,
   "tris": 991332,
   "chars": 237196,
   "what": "Grass realism: mowing stripes depend on where you look from (each pass lays the grass the way the mower drove, light looking along it and dark looking against it, so the stripes swap as you walk round, softer from overhead); wind comes in gusts that roll across the tall grass, bending it over and showing its paler side; looking toward the sun the blades glow where light comes through them; and deep in the clumps the grass is dark where the grass around stands taller, so tall grass beside stubble casts a soft shade. Lawn saves keep each cell's mowing direction."
  },
  {
   "v": 48,
   "asked": "2026-10-17T10:15:00-05:00",
   "live": "2026-10-17T10:19:00-05:00",
   "dh": 0.5,
   "tris": 991332,
   "chars": 237584,
   "what": "Start digging is back in reach on phones: the button moved from the bottom of the long help card to just under the title and stays pinned there while the instructions scroll beneath it; tapping the dark area around the card starts the game too."
  },
  {
   "v": 49,
   "asked": "2026-10-17T10:08:00-05:00",
   "live": "2026-10-17T10:30:00-05:00",
   "dh": 2,
   "tris": 991332,
   "chars": 240944,
   "what": "Speed test diagnosis: before the load levels, the test measures the plain scene with one feature switched off at a time (shadows, filmic lighting, ground detail, grass, see-through glass, water and dust, full resolution) and then everything at once, and the results show how many frames each one costs this device and which costs the most."
  },
  {
   "v": 50,
   "asked": "2026-10-17T10:22:00-05:00",
   "live": "2026-10-17T10:30:00-05:00",
   "dh": 0.5,
   "tris": 991332,
   "chars": 241101,
   "what": "Fix: the game could not start for anyone with a lawn saved before v47. Loading the old save called a helper that is only defined by a later script, which stopped the setup before the Start digging button was wired up, so tapping it did nothing. The load no longer needs it, and a save that cannot be read is now dropped instead of stopping the game."
  },
  {
   "v": 51,
   "asked": "2026-10-17T10:40:00-05:00",
   "live": "2026-10-17T10:55:00-05:00",
   "dh": 2.5,
   "tris": 991332,
   "chars": 245439,
   "what": "Cheaper shadows, from the iPhone speed test diagnosis (shadows cost the most, about 16 FPS): the machines' 100 still parts now cast through 23 merged shadow-only meshes, and trees cast only near the shadow area instead of all 230 round the mesa. The shadow pass drops from 137 draws and 283k triangles to 60 draws and 94k, with a pixel-identical shadow map. The speed test measures Normal twice (start and end) and compares against their average, so warm-up and heat do not inflate the gains."
  },
  {
   "v": 52,
   "asked": "2026-10-17T11:05:00-05:00",
   "live": "2026-10-17T11:25:00-05:00",
   "dh": 1.5,
   "tris": 991332,
   "chars": 248519,
   "what": "Graphics setting in the menu: Low, Medium or High, remembered separately on each device. Low (phones; the default on an iPhone) renders at up to 1.5x with 1024 shadows, plain lighting at a matched brightness and flat ground without the dirt and grass textures, the three costs the iPhone speed test found. Medium (laptops; the default on Intel graphics) keeps the textures and filmic lighting with 2048 shadows at 1.5x. High (desktop PCs) is everything at 2x with soft shadows. Picking one also sets Dirt detail (1x, 2x, 4x), which can still be changed on its own. The speed test reports the level."
  },
  {
   "v": 53,
   "asked": "2026-10-17T11:28:00-05:00",
   "live": "2026-10-17T11:40:00-05:00",
   "dh": 1.5,
   "tris": 991332,
   "chars": 251080,
   "what": "Lighter tall grass, the top cost left on the iPhone: the lawn patch is skipped whenever it is out of view (on every Graphics level), and on Low (beyond 20 ft) and Medium (beyond 50 ft) a distant patch draws every other clump each way at twice the width, 55k triangles instead of 221k, matched to the full lawn's mowing and growth. Mowing always shows the full lawn."
  },
  {
   "v": 54,
   "asked": "2026-10-17T11:14:00-05:00",
   "live": "2026-10-17T11:37:00-05:00",
   "dh": 14,
   "tris": 1152420,
   "chars": 257693,
   "what": "Mesa plan A: the mesa is 1.5 times as wide (about 295 ft across instead of 197) and grows south, so the trench, gas main, tall grass and the cliff dump spot stay put. The top rolls gently and has Lookout Knoll (18 ft) and West Rise (10 ft). A rocky 24 ft scarp across the middle drops to the Lower Bench, a dirt yard with three stockpiles, reached by a 16 ft wide ramp cut diagonally down the scarp at about 11%; the truck can dump there. The ring road becomes a network: the top loop, the ramp, a loop round the bench and a track up the knoll, plus a dirt laydown pad by the dig. The excavator, truck and mower stop against the scarp face, the ramp banks and the stockpiles. The rest of the mesa gets its own finer ground mesh, and grass tufts (15,000) and trees spread over it, off the roads and yards."
  },
  {
   "v": 55,
   "asked": "2026-10-17T11:25:00-05:00",
   "live": "2026-10-17T11:50:00-05:00",
   "dh": 12,
   "tris": 1152798,
   "chars": 268484,
   "what": "Walk mode: a low-poly site worker (hard hat, hi-vis vest) with a walk and jog cycle and a jump. The left stick walks the way the camera faces, the right stick looks; Jump clears about 3.5 ft, so 1, 2 and 3 ft blocks and stacks can be climbed. Blocks and machines are solid, trench walls need a jump, and cab view is first person. On foot, Place sets a block just in front of him and Lift takes the one in front. Walk button and key 5, a Jump button, a dot on the maps."
  },
  {
   "v": 56,
   "asked": "2026-10-17T11:52:00-05:00",
   "live": "2026-10-17T12:02:00-05:00",
   "dh": 2,
   "tris": 1152810,
   "chars": 270576,
   "what": "Start card picker: four screenshot tiles (Excavator, Dump truck, Mower, On foot) at the top of the start card; tap one to start in that mode. It shows on every visit and from How to play, with the current mode outlined; tapping outside keeps the current mode."
  },
  {
   "v": 57,
   "asked": "2026-10-17T11:56:00-05:00",
   "live": "2026-10-17T12:08:00-05:00",
   "dh": 4,
   "tris": 1152810,
   "chars": 276749,
   "what": "The whole site is saved in the browser: the dug and dumped ground with its dirt colours, ruts and groundwater, the excavator's spot, pose, bucket load and strikes, the dump truck's spot, load and yards hauled, the trench box, the blocks, the worker on foot and the job timer all come back on reload. The ground saves every 4 seconds while it changes and the machines every 2 seconds while they move, both when the page is hidden; Reset starts fresh ground."
  },
  {
   "v": 58,
   "asked": "2026-10-17T12:04:00-05:00",
   "live": "2026-10-17T12:14:00-05:00",
   "dh": 1,
   "tris": 1152810,
   "chars": 277321,
   "what": "Renamed the game Corley's Island. The start card drops the work order and folds the controls list behind a Controls button, so it fits a phone screen; on a phone held sideways the four tiles sit in one row."
  },
  {
   "v": 59,
   "asked": "2026-10-17T11:52:00-05:00",
   "live": "2026-10-17T12:20:00-05:00",
   "dh": 7,
   "tris": 1152810,
   "chars": 290436,
   "what": "Jump clears about 6 ft. Get in and out of machines on foot: walk up to the excavator, dump truck or mower and press F (Get in button, controller B) to drive it; press again to climb out beside it; the site save remembers when you are in one. Keys panel in the menu: every keyboard action with what it does in each mode, two keys each, rebind any of them, saved per device, Defaults to reset; captions and tips show your keys. Place block is E in every mode."
  },
  {
   "v": 60,
   "asked": "2026-10-17T11:45:00-05:00",
   "live": "2026-10-17T12:19:00-05:00",
   "dh": 17,
   "tris": 1154238,
   "chars": 326903,
   "what": "Map editor (menu, or G), the first version: the game pauses and an overhead camera takes over (drag, pinch and twist on a phone; right mouse button, wheel and WASD/Q E/R F on a computer). Raise, Lower, Flatten and Smooth reshape the ground under a round brush (5 to 40 ft, strength 1 to 10) and Dirt and Grass paint it; the dig grid, ground mesh, steep-ground stops, grass, tall grass and trees all follow, and dug holes keep their depth. Trees are now saved assets in a fixed default layout, joined by boulders: Select moves, turns, resizes, copies and deletes them and moves the machines, Add places new ones, and Query reads any spot's height, slope, surface, driveability and edits in feet. Undo and Redo (30 steps). The map saves on the device as you edit, and Map file copies it out as a few KB of text, loads a copied map or starts over."
  },
  {
   "v": 61,
   "asked": "2026-10-17T11:55:00-05:00",
   "live": "2026-10-17T12:24:00-05:00",
   "dh": 1,
   "tris": 1154250,
   "chars": 328599,
   "what": "Auto update, for the Home Screen app that never reloads on its own: the game re-reads its build log when it comes back to the front, when it is restored from the back-forward cache and every 10 minutes. A newer version reloads straight away when the game comes back from the background or nothing is under way yet (the site and lawn are saved on the way out, so nothing is lost); one that lands while you are playing waits behind a yellow 'Version N is out · tap to update' button instead of reloading mid-move."
  },
  {
   "v": 62,
   "asked": "2026-10-17T12:17:00-05:00",
   "live": "2026-10-17T12:32:00-05:00",
   "dh": 1.5,
   "tris": 1154250,
   "chars": 329628,
   "what": "Sprint on foot: hold Shift (controller left stick click) to run about 12 mph, with a quicker, wider stride and a forward lean. Keys can now do one job on foot and another in a machine, so Shift stays Fine control in the machines."
  },
  {
   "v": 63,
   "asked": "2026-10-17T12:24:00-05:00",
   "live": "2026-10-17T12:34:00-05:00",
   "dh": 8,
   "tris": 1154238,
   "chars": 342689,
   "what": "Road editing in the map editor (Roads tool): every road point shows as a dot; tap a road to pick it, drag its dots to move them, tap the picked road between dots to add a point, or tap New road and lay one point by point. The road's card sets the width (6 to 26 ft), grass up the middle, and grading: a graded road is cut and filled to a height at each point, like the ramp, with a Point height slider for the picked dot; otherwise it follows the ground. Delete point and Delete road, all with Undo. The ground, colours, steep-ground stops and grass follow each change, and the roads save with the map."
  },
  {
   "v": 64,
   "asked": "2026-10-17T12:29:00-05:00",
   "live": "2026-10-17T12:38:00-05:00",
   "dh": 1,
   "tris": 1154238,
   "chars": 343655,
   "what": "Touch Sprint button next to Jump in Walk mode: tap to sprint, and it switches itself off once you stop, on a second tap or when you leave Walk mode."
  },
  {
   "v": 65,
   "asked": "2026-10-17T12:45:00-05:00",
   "live": "2026-10-17T12:56:00-05:00",
   "dh": 1,
   "tris": 1154238,
   "chars": 343994,
   "what": "The name Corley's Island everywhere: the map editor's wrong-map message, the versions page, the build log and the notes (the web address and the map file id stay backhoe-dig so links and saved maps keep working). Plus an idea board of 172 scored ideas for the dig site and island life."
  },
  {
   "v": 66,
   "asked": "2026-10-17T12:20:00-05:00",
   "live": "2026-10-17T13:15:00-05:00",
   "dh": 24,
   "tris": 1154238,
   "chars": 357054,
   "what": "Material library: 31 seamless textures made with OpenAI GPT Image (ground covers, concrete and paving, steel, brick and stone, wood and more), shown as swatches in the map editor's new Paint tool and laid on the ground with a round or square brush, with Undo, Query and saving in the map. Medium and High graphics draw the textures (only the ones the map uses); Low keeps their plain colours. Digging cuts through painted ground and grass stays off it. Concrete blocks and boulders wear the concrete and bedrock textures."
  },
  {
   "v": 67,
   "asked": "2026-10-17T12:16:00-05:00",
   "live": "2026-10-17T13:22:00-05:00",
   "dh": 5,
   "tris": 1154238,
   "chars": 365873,
   "what": "Sync devices (☰, on the Vercel site): get an 8-character code on one device and type it on the other, and from then on both play the same site: the dig, the machines, the lawn and map-editor changes, kept in Supabase. A device pulls a newer save when it opens or comes back into view and pushes its changes every 15 seconds and when it is hidden; if both changed, the first save to reach the server wins. The site also answers at corleys-island.vercel.app, and the rest of the code and notes now say Corley's Island."
  },
  {
   "v": 68,
   "asked": "2026-10-17T16:05:00-05:00",
   "live": "2026-10-17T16:38:39-05:00",
   "dh": 12,
   "tris": 1154238,
   "chars": 370460,
   "what": "Mud ruts and puddles: the excavator's tracks and the truck's tyres sink up to 9 in into mud and squeeze it out into ragged berms along both edges, so driving back and forth churns the ground. Ground painted Mud in the map editor is saturated: ruts and dips there fill with puddles that reflect the sky. Mud bogs the machines and coats them. Phones (Low graphics) draw the puddles more simply; the mud and water themselves are the same on every device."
  },
  {
   "v": 69,
   "asked": "2026-10-17T16:45:00-05:00",
   "live": "2026-10-17T17:17:36-05:00",
   "dh": 20,
   "tris": 1154238,
   "chars": 387762,
   "what": "Mud anywhere on the mesa: Mud painted with the map editor now ruts and fills with puddles outside the dig zone too, on fine ground tiles made only where a machine first churns it (saved and synced with the site). Getting stuck: pushing on in deep mud digs the tracks or tires in until they spin and throw mud; rock it free by going forward, then back, then forward again. Phones (Low graphics) throw fewer blobs and draw puddles more simply; the mud behaves the same on every device. How wet the ground is now comes from one place, ready for soil and rain to drive it later."
  },
  {
   "v": 70,
   "asked": "2026-10-17T17:55:00-05:00",
   "live": "2026-10-17T18:14:35-05:00",
   "dh": 3,
   "tris": 1154238,
   "chars": 389546,
   "what": "Mower keys: on a keyboard W and S (or the arrows) now drive the zero-turn straight and A and D turn it, instead of working only the left lap bar so it spun on its own. The number pad works the lap bars: 8 and 2 both forward or back, 4 and 6 spin in place, 7 and 1 the left bar, 9 and 3 the right bar, all changeable in the Keys panel. Touch and controller sticks still work one lap bar each."
  },
  {
   "v": 71,
   "asked": "2026-10-17T18:12:00-05:00",
   "live": "2026-10-17T18:22:23-05:00",
   "dh": 1,
   "tris": 1154238,
   "chars": 389790,
   "what": "Fix: a puddle in a rut on a slope could spread over the untouched ground below it and cover the dig area with a flat slab of water. Water now only stands where the ground is dug or rutted below grade, and slabs already in saved sites drain away on load."
  },
  {
   "v": 72,
   "asked": "2026-10-17T18:16:00-05:00",
   "live": "2026-10-17T18:40:00-05:00",
   "dh": 4,
   "tris": 1154238,
   "chars": 391968,
   "what": "Ground texture pack: new seamless grass, dirt and machine grime, each at 512, 1024 and 2048 px and loaded by the Graphics setting (Low, Medium, High), plus a soft macro map that breaks up the repeat across the lawns and yards. The neutral textures take the island's own colours; the grime is brightened so the machines keep their paint."
  },
  {
   "v": 73,
   "asked": "2026-10-17T17:45:00-05:00",
   "live": "2026-10-17T18:32:34-05:00",
   "dh": 16,
   "tris": 1154238,
   "chars": 406502,
   "what": "Rain: showers roll through now and then (or set Weather to Rain or Dry in the menu). Rain soaks the soil by what is there: dug dirt, dirt yards, clay and topsoil turn to mud first, dirt roads and grass get soft, sand and gravel drain, rock and paving stay hard, and low ground soaks fastest. The soaked ground ruts, holds puddles and bogs machines down like painted mud, and rain fills holes and ruts. When it stops the soil dries over several minutes (sand fast, clay slow), the puddles drain and wet spoil dries, and it keeps drying while the game is closed. The sky greys over, rain streaks fall (fewer on phones), the ground takes a wet sheen and there is a rain hiss. Wet ground and weather sync between devices."
  },
  {
   "v": 74,
   "asked": "2026-10-17T17:40:00-05:00",
   "live": "2026-10-17T18:39:46-05:00",
   "dh": 26,
   "tris": 1282998,
   "chars": 429826,
   "what": "The Family Island: a dark green steel truss bridge (about 340 ft) runs from the Lower Bench south across the water to a new, larger mesa about 525 ft across. On it: the family house with a stone base, a steep roof, a chimney and a wraparound porch with rocking chairs; a picnic pavilion with two tables; a fire pit with log benches; a flagpole and a bench looking back at Corley's; a roundabout with a big tree in the middle; groves of pines and autumn trees. The excavator, truck, mower and the worker can all cross and drive around it, and the railings keep them on the deck. The roads west and east stop at barriers where Dexter's and Jessica's bridges will go, and the mainland bridge runs about 335 ft south to a barrier, with bare piers and a crane beyond. The site map now shows both islands."
  },
  {
   "v": 75,
   "asked": "2026-10-17T18:44:00-05:00",
   "live": "2026-10-17T18:49:07-05:00",
   "dh": 0.5,
   "tris": 1282998,
   "chars": 429953,
   "what": "The Keys line in How to play now gives the mower's own keys: W and S drive it straight, A and D turn it, and the number pad works the lap bars (8 and 2 both, 4 and 6 spin in place, 7 and 1 the left bar, 9 and 3 the right bar), instead of saying IJKL is the right stick in every mode."
  },
  {
   "v": 76,
   "asked": "2026-10-17T18:40:00-05:00",
   "live": "2026-10-17T18:57:34-05:00",
   "dh": 6,
   "tris": 1286910,
   "chars": 433848,
   "what": "Chess and checkers at the Family Island's picnic pavilion: a chess board set up to start on the west table and a checkers board on the east one. Walk up to a table and Get in (F on a keyboard) becomes Play chess or Play checkers: the island saves and switches to Mesa Chess or Mesa Checkers at full quality, and their Corley's Island link brings you straight back on foot beside the table, with no start card. The Mesa pages load ahead as you walk up to the pavilion. In the claude.ai version the game opens in a new tab."
  },
  {
   "v": 77,
   "asked": "2026-10-17T18:50:00-05:00",
   "live": "2026-10-17T19:01:40-05:00",
   "dh": 25,
   "tris": 1353588,
   "chars": 456944,
   "what": "Jessica's Island: from the Family Island's roundabout the east road leads to a red covered footbridge (about 305 ft, on foot only) that climbs 10 ft to a forest mesa the size of Corley's. Lantern-lit gravel paths wind through pines and autumn trees to a stone and timber cottage with a mossy roof, flower boxes and smoke curling from the chimney, past a fenced herb garden to a bench at the cliff edge. Inside is her library: shelves of books to the ceiling on three walls, a rolling ladder on a brass rail, a cushioned window seat with pillows, a plaid blanket and a sleeping cat, two armchairs on a rug by a crackling fire, a reading lamp and a side table with a teacup. Walk in and the roof lifts off so the camera looks down into the room; Cab view walks it at eye level. The library is only drawn when you are near, so phones pay for it only there."
  },
  {
   "v": 78,
   "asked": "2026-10-17T18:45:00-05:00",
   "live": "2026-10-17T19:09:50-05:00",
   "dh": 5,
   "tris": 1353588,
   "chars": 461650,
   "what": "First-person look: in cab view, drag the scene to turn your head, on foot or in any machine. On foot the body turns with it and you can look nearly straight up or down; in the excavator, truck and mower you can turn about 150 degrees each way in the seat and look up at the boom or down at the bucket. On a PC a click on the scene takes the mouse for mouse look (Esc frees it). Zoom up to 4x with the mouse wheel, a two-finger pinch or by holding Z; R (controller: right stick click) turns your head back to straight ahead. A small aim dot shows on foot."
  },
  {
   "v": 79,
   "asked": "2026-10-17T18:35:00-05:00",
   "live": "2026-10-17T19:17:21-05:00",
   "dh": 10,
   "tris": 1587618,
   "chars": 473001,
   "what": "Field grass: the mesa's grass is now curved, arching clumps instead of straight spikes, in four kinds: meadow grass, seed-head grass in drifts and along the roads and yards, low broadleaf weeds, and wildflowers in drifts of yellow, white or purple. It grows in patches and little clusters with thinner ground between, lush and green on the flats and dry and straw coloured up the slopes and hilltops, and it sways in the same wind gusts as the tall grass. It is drawn in squares that are skipped when out of view and thins out with distance by the Graphics setting (fewer clumps on Low), so phones draw less."
  },
  {
   "v": 80,
   "asked": "2026-10-17T18:40:00-05:00",
   "live": "2026-10-17T19:22:20-05:00",
   "dh": 10,
   "tris": 1586492,
   "chars": 479052,
   "what": "Better ruts: mud ruts are rounded with the tread printed in the bottom (grousers under the tracks, chevrons under the tyres), the squeezed mud forms wide lumpy berms instead of spikes, and soft mud slumps so no face is steeper than about 40 degrees. Rut bottoms show darker and wetter and the crests lighter, wet mud gives small glints instead of a grey sheen, and puddles are muddy brown. In the map editor, painting over ruts smooths them back to the painted ground (dry, puddles gone), except painting Mud, or Dirt on ground that is already soaked."
  },
  {
   "v": 81,
   "asked": "2026-10-17T19:05:00-05:00",
   "live": "2026-10-17T19:25:39-05:00",
   "dh": 19,
   "tris": 1619680,
   "chars": 490671,
   "what": "Dexter's Island: from the Family Island's roundabout the west road crosses a wide yellow steel haul bridge (about 305 ft, rated for the machines, with a steel portal at each end) to a flat gravel yard the size of Corley's. On it: Dexter's blue-grey equipment shed with three roll-up doors and a light over each, an office trailer on blocks, a diesel tank with its pump, stacked concrete pipe and Jersey barriers, two light towers, a cone course and dirt piles to climb, and his machines parked in the yard: a skid steer, a small dozer, a wheel loader and a red semi with an empty lowboy trailer. Drive the excavator, the truck or the mower over, or walk; the shed, the machines and everything else are solid. The parked machines are models for now. All four islands and their bridges are in."
  },
  {
   "v": 82,
   "asked": "2026-10-17T19:12:00-05:00",
   "live": "2026-10-17T19:33:31-05:00",
   "dh": 3,
   "tris": 1620039,
   "chars": 492757,
   "what": "Turn sensitivity: a Turn slider just above the left stick sets how fast left and right turn, from 25% to 200%: the excavator swing and tracks, the truck steering, the mower spin and looking round on foot, from the sticks, keys or a controller. On a computer the slider is always out; on a phone it is a small Turn chip that opens the slider when tapped. Each device remembers its own."
  },
  {
   "v": 83,
   "asked": "2026-10-17T18:55:00-05:00",
   "live": "2026-10-17T19:33:35-05:00",
   "dh": 6,
   "tris": 1620718,
   "chars": 497536,
   "what": "Teleport from the site map: open it with M (or tap the minimap), tap a spot, and choose On foot, Excavator, Dump truck or Mower. The machine you pick comes with you and you arrive in its seat, set down at the nearest open spot (on land, not too steep, clear of buildings, blocks and the other machines, turned if that fits better); On foot leaves the machine you were in where it is. A crosshair marks the spot, tapping the lake says so, and a message tells how far you went. On a phone held sideways the map now sits beside its buttons and legend."
  },
  {
   "v": 84,
   "asked": "2026-10-17T19:34:00-05:00",
   "live": "2026-10-17T19:39:10-05:00",
   "dh": 0.5,
   "tris": 1620195,
   "chars": 497848,
   "what": "Turning starts gentler: the Turn slider now starts at 60% instead of 100%. It is saved only once you move it, so devices that opened v82 without touching it start at 60% too, and a setting you chose is kept."
  },
  {
   "v": 85,
   "asked": "2026-10-17T19:25:00-05:00",
   "live": "2026-10-17T19:39:28-05:00",
   "dh": 8,
   "tris": 1620977,
   "chars": 502641,
   "what": "Field grass that reacts: tracks and tyres lay the grass flat the way they drove, the mower's wheels nearly flat and your boots partway, leaving pale trampled tracks that stay down for a minute and spring back over about two and a half minutes. The grass and the tall grass lean out of the worker's way as well as the machines'. In the rain the grass darkens and droops, heavier where the ground is soaked, and stands back up as it dries. Mud ruts outside the dig zone now clear the grass from them, and it comes back when the ruts are smoothed or the site is reset."
  },
  {
   "v": 86,
   "asked": "2026-10-17T19:30:00-05:00",
   "live": "2026-10-17T19:43:39-05:00",
   "dh": 14,
   "tris": 1620777,
   "chars": 514611,
   "what": "Dexter's skid steer is drivable. Tap Skid (or press 6), walk up to it in his yard and tap Get in, or teleport into it from the site map. The left stick drives it, turns it and spins it in place; the right stick lowers and raises the arms (up lowers, like the excavator's boom) and curls or dumps the bucket, which stays level as the arms go up. Drive it over the bridges to the dig site and it scoops dirt with the bucket down on the ground and dumps it in a pile, over the cliff or into the dump truck's bed. It has its own diesel sound, ruts soft ground and lays the grass down, bumps into buildings, blocks and the other machines, shows its load, speed and bucket depth on the status card, follows the turn sensitivity slider, and is saved and synced with the site. Reset parks it back in Dexter's yard."
  },
  {
   "v": 87,
   "asked": "2026-10-17T18:55:00-05:00",
   "live": "2026-10-17T19:44:31-05:00",
   "dh": 10,
   "tris": 1620449,
   "chars": 527659,
   "what": "Graphics panel: the Graphics button in the menu opens Low, Medium and High with every setting under them to play with, and the frame rate, triangles, draw calls, resolution and textures in memory shown live. Screen: resolution (0.5x to 3x), auto resolution, a 30 or 60 fps frame cap, field of view. Light: shadows off or 512 to 4096, soft shadow edges, filmic lighting, brightness, haze distance. Textures: texture size 512, 1024 or 2048, ground texture, extra detail (cut faces, painted materials, machine grime), ground variation, sharpness at an angle. Grass: how many blades and how far, lawn detail distance. Effects: Dirt detail, puddle water, raindrops. A change makes it Custom, marked in the panel and kept on that device; picking a preset clears it. Also: Low now shows the grass and dirt texture on the ground (512 px), sharpness at an angle is 4x, 8x and 16x by preset, and the large-scale ground variation is High only, so phones never download it."
  },
  {
   "v": 88,
   "asked": "2026-10-17T19:42:00-05:00",
   "live": "2026-10-17T19:48:43-05:00",
   "dh": 4,
   "tris": 1621225,
   "chars": 531664,
   "what": "The mower cuts the field grass too, anywhere on the mesa: the clumps under the deck drop to stubble and throw clippings, flowers and seed heads included, then grow back on the tall grass's timing (about a minute before they start, about four more to full height). The mowed field grass saves and syncs with the rest of the mowing."
  },
  {
   "v": 89,
   "asked": "2026-10-17T19:46:00-05:00",
   "live": "2026-10-17T19:54:17-05:00",
   "dh": 2,
   "tris": 1620800,
   "chars": 534353,
   "what": "Frame rate graph in the Graphics panel: the last 10 seconds of frames per second as bars, newest on the right, each as wide as its frame took and green, yellow or red like the fps counter, with dashed lines at 30 and 60. Under it the average, the 1% low (the stutters you feel) and the slowest frame in milliseconds. It updates four times a second while the panel is open, so a setting's cost shows within a second or two."
  },
  {
   "v": 90,
   "asked": "2026-10-17T19:50:00-05:00",
   "live": "2026-10-17T20:02:08-05:00",
   "dh": 1,
   "tris": 1620842,
   "chars": 534416,
   "what": "Turn sensitivity for each machine: the Turn slider now keeps its own setting for Dig, Drive, Truck, Mow, Skid and Walk, and shows the one for the mode you are in. The mower starts at 60%, everything else at 100%."
  },
  {
   "v": 91,
   "asked": "2026-10-17T19:15:00-05:00",
   "live": "2026-10-17T20:03:05-05:00",
   "dh": 7,
   "tris": 1620713,
   "chars": 537619,
   "what": "Map editor: Paint has Hard edge and Soft edge. Soft edge fades the material out into the ground over the outer part of the brush, with a Softness slider (10 to 100%) and a second ring showing where the fade starts; Natural ground fades paint back out the same way, soft-edged Mud is partly soaked at its fade, and maps keep the soft edges (older maps load as before). The editor's controls move to the top left to leave the screen for the ground: a slim title bar with Undo, Redo, Map file and Done, the tools in a two-wide strip down the left, and the tool's options, Map file and info cards in a scrolling column beside them with a tighter material library. Tap the picked tool again to fold its options away."
  },
  {
   "v": 92,
   "asked": "2026-10-17T19:57:00-05:00",
   "live": "2026-10-17T20:03:53-05:00",
   "dh": 3,
   "tris": 1621586,
   "chars": 541220,
   "what": "GPU memory in the Graphics panel: an estimate of the memory the game has on the graphics card, split into textures, geometry, the screen and depth buffers (mostly the shadow map), updated live as settings change. Browsers do not report the real figure, so the game counts what it asks the GPU to hold as it is made, resized or freed. Texture size and shadow size are the big levers: 4096 shadows alone take about 128 MB."
  },
  {
   "v": 93,
   "asked": "2026-10-17T19:13:00-05:00",
   "live": "2026-10-17T20:06:56-05:00",
   "dh": 8,
   "tris": 1620641,
   "chars": 559422,
   "what": "Stats: ☰ then Stats (or O) shows everything you've done: grass mowed and tall grass cut in sq ft, lawns finished and the best lawn time, how much of the patch you've ever mowed, distance walked, sprinted and driven in each machine, jumps, dirt dug, buckets dumped, dirt hauled off and moved by the skid steer, line strikes, cave-ins, blocks placed, time in each machine and top speeds. Only time spent moving counts. Saved on the device and synced with the site. Lawn heatmap: times each spot has been cut, how far the grass has grown back, or the way it was last mowed, drawn north up in the Stats panel with the mower on it, and over the lawn itself as flat tiles (U, or the panel's switch; press U again to change what it shows), with a key on screen that you tap to switch."
  },
  {
   "v": 94,
   "asked": "2026-10-17T19:30:00-05:00",
   "live": "2026-10-17T20:08:48-05:00",
   "dh": 6,
   "tris": 1621301,
   "chars": 567489,
   "what": "Puddle splashes: the truck's tyres, the excavator's and skid steer's tracks, the mower's wheels and your boots throw muddy spray out to both sides and ahead when they go through standing water, bigger the faster and deeper, with rings spreading across the water, a few lumps of mud and a slosh. Jumping into a puddle splashes all round. Only drawn, so the puddles stay the same on every device; Low graphics throws 250 drops, Medium 600, High 1200, and the custom Graphics panel has a Puddle splash row."
  },
  {
   "v": 95,
   "asked": "2026-10-17T20:10:00-05:00",
   "live": "2026-10-17T20:19:07-05:00",
   "dh": 3,
   "tris": 1620066,
   "chars": 573253,
   "what": "Trails on the big map: where you've walked and driven, in 13 ft squares coloured from a faint purple where you passed once to bright yellow where you go all the time. The map's Trails row shows all of it, or just on foot, the excavator, the truck, the mower or the skid steer, with a key giving the busiest spot. The Stats panel opens the map with trails on. Teleports don't draw a line. Saved and synced with the stats, kept small, and cleared with them."
  },
  {
   "v": 96,
   "asked": "2026-10-17T20:05:00-05:00",
   "live": "2026-10-17T20:30:00-05:00",
   "dh": 3,
   "tris": 1621024,
   "chars": 576182,
   "what": "Map editor: Hard edge paint is a truly sharp line now. The ground shader draws painted materials per pixel instead of blending them across the ground mesh, so a hard edge turns over in about a pixel wherever it falls (square corners round off by about 3 in), while Soft edge paint keeps its fade; on the rare device without WebGL2 paint looks as before. The brush goes down to 1 ft, which lays a line of single paint cells (about 1.6 ft, the finest the paint grid holds)."
  },
  {
   "v": 97,
   "asked": "2026-10-17T19:45:00-05:00",
   "live": "2026-10-17T20:33:16-05:00",
   "dh": 12,
   "tris": 1620620,
   "chars": 584708,
   "what": "Blocks of any size and material: the block bar sets how wide, long and tall a block is, 1 to 10 ft each (V steps through cubes, Turn or Q swaps wide and long), and a material picker offers plain concrete or any of the 31 library materials, textured evenly at any size (Y steps through them). On foot in first person the block goes where the dot in the middle of the screen points: the mouse wheel (or Reach, or [ and ]) pushes it out and pulls it back up to 80 ft, aiming at the side of a block sets the new one against it, a click places and a right click lifts while the mouse is taken, and Lift picks up the block the dot is on. Saves keep each block's size and material; older saves load as before."
  },
  {
   "v": 98,
   "asked": "2026-10-17T20:30:00-05:00",
   "live": "2026-10-17T20:40:09-05:00",
   "dh": 1,
   "tris": 1620851,
   "chars": 585279,
   "what": "Map editor: paint laid with the square brush keeps sharp corners. Its cells are drawn whole, each a crisp square, while round-brush paint keeps its smooth outline and soft-edged paint its fade. Square paint laid before this version still has slightly rounded corners until it is painted again."
  },
  {
   "v": 99,
   "asked": "2026-10-17T20:15:00-05:00",
   "live": "2026-10-17T20:41:22-05:00",
   "dh": 8,
   "tris": 1620473,
   "chars": 588178,
   "what": "Mud dries out: painted Mud now starts soaked and dries over about 20 minutes like other soil, firming up as it goes, and rain soaks it again. It shows each stage: dark and wet with puddles in its ruts, then matte damp mud, then pale mud starting to crack, then dry cracked mud (two new textures made with OpenAI GPT Image; Low graphics shifts the colour the same way without the textures). The editor's Query tool tells you how wet a spot is. Sites saved earlier keep their painted Mud soaked to start."
  },
  {
   "v": 100,
   "asked": "2026-10-17T20:50:00-05:00",
   "live": "2026-10-17T21:05:00-05:00",
   "dh": 4,
   "tris": 1620584,
   "chars": 591664,
   "what": "Paint can keep the dug shape: a new Dug ground choice in the editor's Paint panel. Level dug ground (as before, now also for deep holes and heaps) takes dug and dumped ground back to grade under the brush so the material shows on it; Keep dug shape recolours it where it is, so ruts, holes and heaps stay, painted and saved with the site. Digging afterwards still cuts through the paint."
  },
  {
   "v": 101,
   "asked": "2026-10-17T21:00:00-05:00",
   "live": "2026-10-17T21:09:33-05:00",
   "dh": 1,
   "tris": 1621287,
   "chars": 592422,
   "what": "Left click places blocks: with Blocks on, a left click on the scene sets a block in Dig or Walk mode, in either view (a drag still turns the camera). Also fixes clicks doing nothing once the mouse is taken for mouse look in first person."
  },
  {
   "v": 102,
   "asked": "2026-10-17T21:00:00-05:00",
   "live": "2026-10-17T21:17:00-05:00",
   "dh": 3,
   "tris": 1621607,
   "chars": 594435,
   "what": "A tidier Blocks panel and finer blocks: the controls are now one box of rows (material, wide, long, tall, reach) with Turn, Lift and Place along the bottom. Blocks can be as thin as 1 inch (steps of 1 in up to a foot, then larger), and the \"too close to the edge\" limit is gone. A new Snap row (or the \\ key) picks Grid (as before), Grid + blocks (faces line up flush with nearby blocks, even off-grid ones) or Free (exactly where you aim)."
  },
  {
   "v": 103,
   "asked": "2026-10-17T21:18:00-05:00",
   "live": "2026-10-17T21:23:00-05:00",
   "dh": 1,
   "tris": 1620566,
   "chars": 595041,
   "what": "Block snapping you can set: a new Blocks only mode locks a block flush to nearby blocks and otherwise goes exactly where you aim, without falling back to the grid (the Snap row now cycles Grid, Grid + blocks, Blocks only and Free). A new Grid row sets the grid's cell from 1 in up to 1 ft, so blocks can line up in finer steps."
  },
  {
   "v": 104,
   "asked": "2026-10-17T21:24:00-05:00",
   "live": "2026-10-17T21:28:00-05:00",
   "dh": 1,
   "tris": 1620562,
   "chars": 595399,
   "what": "Block snap settings are remembered: the snap mode (Grid, Grid + blocks, Blocks only or Free) and the grid size you pick in the Blocks panel come back when you return to the game. Each device keeps its own."
  },
  {
   "v": 105,
   "asked": "2026-10-17T20:50:00-05:00",
   "live": "2026-10-17T21:33:23-05:00",
   "dh": 7,
   "tris": 1620872,
   "chars": 604634,
   "what": "Dug dirt and ruts dry and crack: dug or dumped ground and ruts that got soaked (rain, puddles, wet spoil) remember it, and as they dry they turn pale and matte, then crack like dried mud (the crack pattern on Medium and High; Low pales them), until they are dug again or rained on; mud tiles past the dig zone too. The big map has a Soil wetness row: All shades the soil from dry to soaked, Damp+, Wet+ and Soaked show only ground at least that wet, standing water shows bright blue, and Show on the ground too tints the ground itself."
  },
  {
   "v": 106,
   "asked": "2026-10-17T21:40:00-05:00",
   "live": "2026-10-17T22:12:00-05:00",
   "dh": 12,
   "tris": 1620505,
   "chars": 608819,
   "what": "A new screen layout with bars on three sides. The top bar has the menu (now at the top left), the job gauges side by side (tap for more or less) and the Pump, Hook box, Blocks and Cab view buttons, with a hazard stripe along its foot; on a phone held upright the gauges get a row of their own. The left bar has a button per machine with an icon, the one you drive lit. The bottom bar has the Turn setting, what each stick does under that stick, and the frame rate. The minimap and Blocks panel stay at the top right, the sticks in the thumb zones, with Get in over the left stick and Sprint and Jump over the right."
  },
  {
   "v": 107,
   "asked": "2026-10-17T22:26:00-05:00",
   "live": "2026-10-17T22:47:31-05:00",
   "dh": 5,
   "tris": 1619620,
   "chars": 610875,
   "what": "Polished steel, a shiny material for painting the ground and for blocks (Steel group): it catches a tight sun glint and mirrors the sky, strongly at low angles and plainly face-on as metal does, with its brushed grain running through the reflection; mud dulls it. Any library material can now carry a shine."
  },
  {
   "v": 108,
   "asked": "2026-10-17T23:08:00-05:00",
   "live": "2026-10-17T23:44:03-05:00",
   "dh": 18,
   "tris": 1620366,
   "chars": 647939,
   "what": "Screen editor (menu, Edit the screen): tap any part of the screen to hide it, rename it, resize or drag it, recolour it, change its background and corners or give it any CSS, aimed at just that part, everything styled like it or every button in its bar, for every screen or for phones or big screens only; a Theme tab for the shared colours and fonts; undo and redo. Edits save on the device, and Publish (owner key) makes the look live for every device through Supabase, earlier looks kept for rollback. A claude.ai screen editor shows a copy of the screen at phone, tablet or computer size and publishes through the owner's Supabase connector."
  },
  {
   "v": 109,
   "asked": "2026-10-17T23:55:00-05:00",
   "live": "2026-10-18T00:10:50-05:00",
   "dh": 10,
   "tris": 1620929,
   "chars": 656283,
   "what": "Screen editor: a Groups tab with one-move sliders (button corners and text size, gauge name and number sizes, panel corners) and ready-made groups to edit like one part (every button, the bars, the gauges and their parts, the sticks, captions, minimap, panels); Pick more (or Shift) picks several parts at once; a Layout tab docks the top bar, the bottom bar, the machine buttons and the minimap on other sides and swaps the sticks, with its own layout on phones and big screens."
  },
  {
   "v": 110,
   "asked": "2026-10-18T00:37:00-05:00",
   "live": "2026-10-18T00:53:38-05:00",
   "dh": 14,
   "tris": 1620572,
   "chars": 670466,
   "what": "Map editor Paint panel: upload a picture, made into a seamless tile in the browser, named and sized, published with the owner key; joins the material library on every device for painting and blocks"
  },
  {
   "v": 111,
   "asked": "2026-10-18T00:37:00-05:00",
   "live": "2026-10-18T00:56:15-05:00",
   "dh": 14,
   "tris": 1620007,
   "chars": 690961,
   "what": "Screen editor gets a Tuning tab (every speed, rate, capacity, jump, regrowth, rain and drying number, in mph, ft and minutes, published live to every device) and a Words tab (rewrite the start card, tips and stick captions; key names follow each player's keys)"
  },
  {
   "v": 112,
   "asked": "2026-10-18T01:05:00-05:00",
   "live": "2026-10-18T01:05:29-05:00",
   "dh": 3,
   "tris": 1621042,
   "chars": 693177,
   "what": "Tuning tab grows to 56 numbers: truck grip, braking, bed rates and load weight, bucket pour and spill, gravity, camera speed, reach, mowing height, rain strength, puddle drain, mud sink, drag and sticking, dig speed per soil, dirt fluff and cave-ins"
  },
  {
   "v": 113,
   "asked": "2026-10-18T00:37:00-05:00",
   "live": "2026-10-18T01:06:02-05:00",
   "dh": 16,
   "tris": 1620572,
   "chars": 703241,
   "what": "Map editor Add tool: a catalogue of low-poly houses, shed, garage, fences, gates, light towers, cones, barrels, pallets, porta-potty, signs, benches, picnic table and dumpster; placed, moved, turned, resized and copied like trees, saved with the map, instanced, solid ones block machines and the worker"
  },
  {
   "v": 114,
   "asked": "2026-10-18T16:00:00-05:00",
   "live": "2026-10-18T16:49:55-05:00",
   "dh": 8,
   "tris": 1619989,
   "chars": 709263,
   "what": "Gravel, brick, cobble, concrete and 24 other painted materials show real bumps and wet glints on High graphics, with the new Wet gravel and Ground look sliders in the Tuning tab."
  },
  {
   "v": 115,
   "asked": "2026-10-18T20:15:00-05:00",
   "live": "2026-10-18T20:22:06-05:00",
   "dh": 7,
   "tris": 1620340,
   "chars": 709406,
   "what": "The lake rises to 24 ft under Corley's top; every island's cliffs become a rocky bank and a sand beach, the bench and the Family, Dexter's and Jessica's islands sit 16 to 26 ft above the water (Plan C, release 1)"
  },
  {
   "v": 116,
   "asked": "2026-10-18T18:54:00-05:00",
   "live": "2026-10-18T20:25:07-05:00",
   "dh": 9,
   "tris": 1621415,
   "chars": 718171,
   "what": "Slopes: every soil holds its own angle, piles too (their make-up read from their colour: dry sand 32°, topsoil 36°, lumpy clay 42°); damp soil stands steeper, soaked faces a foot or more tall slump, so piles and trench walls can let go after rain; a growing pile slides in small avalanches to just under its angle. Sticky clay: moist clay clings in the excavator and skid steer buckets and the truck bed and takes up room until shaken out (rock the curl fast or slam the dump stop; bump the bed into its top stop), falling as big lumps."
  },
  {
   "v": 117,
   "asked": "2026-10-18T20:03:00-05:00",
   "live": "2026-10-18T20:29:49-05:00",
   "dh": 9,
   "tris": 1667774,
   "chars": 719977,
   "what": "Corley's Island grows to about 525 ft across with open north lawns, a tree line along the new rim and a spoil yard where the truck dumps; Lookout Knoll and West Rise are cut down, so nothing is over 30 ft above the lake (Plan C, release 2)"
  },
  {
   "v": 118,
   "asked": "2026-10-18T19:45:00-05:00",
   "live": "2026-10-18T20:31:19-05:00",
   "dh": 4.5,
   "tris": 1668774,
   "chars": 728533,
   "what": "Rain splashes where it lands: little crowns of spray on the ground and spreading rings on puddles and the lake. Drops are now slanted streaks of many lengths that lean in the wind and catch the sun, with a fainter far layer and a veil of rain in the haze. New: Rain splashes in Graphics, Wind in the rain on the Tuning tab."
  },
  {
   "v": 119,
   "asked": "2026-10-18T20:00:00-05:00",
   "live": "2026-10-18T20:51:25-05:00",
   "dh": 14,
   "tris": 2010403,
   "chars": 740639,
   "what": "The lakeside town to the south and the field and woods to the north, each reached by a temporary timber trestle and rock causeway, with the crane waiting on a barge to build steel spans (Plan C, release 3)"
  },
  {
   "v": 120,
   "asked": "2026-10-18T20:46:00-05:00",
   "live": "2026-10-18T20:57:10-05:00",
   "dh": 0.5,
   "tris": 1912702,
   "chars": 740639,
   "what": "The mainland draws about 97,000 fewer triangles (coarser far ground, more pines in the woods) for the same look"
  },
  {
   "v": 121,
   "asked": "2026-10-18T20:45:00-05:00",
   "live": "2026-10-18T21:07:16-05:00",
   "dh": 7,
   "tris": 1913595,
   "chars": 750767,
   "what": "Rain stays off whatever is under a roof: cabs, porches, the pavilion, sheds, bridges, placed buildings and blocks, and splashes on the roofs instead. Drops bead and run down the excavator and truck windscreens; the new Wipers button (Space) sweeps them off."
  },
  {
   "v": 122,
   "asked": "2026-10-18T20:14:00-05:00",
   "live": "2026-10-18T21:10:06-05:00",
   "dh": 5,
   "tris": 1914406,
   "chars": 755860,
   "what": "Working wet clay packs into the excavator undercarriage (most while turning): packed tracks drag and turn slower and show clay lumps on the track frames; it drops off in clumps as you drive, faster on firm ground and when the tracks are rocked back and forth, and slowly as it dries."
  },
  {
   "v": 123,
   "asked": "2026-10-18T20:31:00-05:00",
   "live": "2026-10-18T21:12:38-05:00",
   "dh": 10,
   "tris": 1918984,
   "chars": 769989,
   "what": "A lattice-boom crawler crane on a barge with steel pipe piles and plate girders drives a pile and sets a girder for each span, turning both temporary trestles to steel a span at a time (B10)"
  },
  {
   "v": 124,
   "asked": "2026-10-18T20:45:00-05:00",
   "live": "2026-10-18T21:21:55-05:00",
   "dh": 10,
   "tris": 1917760,
   "chars": 783962,
   "what": "The site map shows the whole world now, both mainland shores as well as the islands, drawn from the real ground with every tree; drag, pinch or scroll to zoom, jump to a place, read how far a spot is, with a new side panel for teleport, layers and the key."
  },
  {
   "v": 125,
   "asked": "2026-10-18T21:05:00-05:00",
   "live": "2026-10-18T21:26:36-05:00",
   "dh": 10,
   "tris": 1918519,
   "chars": 784358,
   "what": "The dig grid now sits on 105 ft dig tiles and can move: groundwork for digging anywhere, with no change in play"
  },
  {
   "v": 126,
   "asked": "2026-10-18T21:06:00-05:00",
   "live": "2026-10-18T21:31:58-05:00",
   "dh": 1.5,
   "tris": 1920321,
   "chars": 784746,
   "what": "Trails on the site map now record everywhere you go, the woods, the hayfield and the lakeside town as well as the islands; trails already walked are kept."
  },
  {
   "v": 127,
   "asked": "2026-10-18T21:28:00-05:00",
   "live": "2026-10-18T21:35:48-05:00",
   "dh": 8,
   "tris": 1919332,
   "chars": 789494,
   "what": "Each dig tile's ground (holes, spoil, puddles, mud, wetness) can be lifted out and put back seamlessly, and mud ruts carry into a tile: groundwork for digging anywhere, with no change in play"
  },
  {
   "v": 128,
   "asked": "2026-10-18T21:30:00-05:00",
   "live": "2026-10-18T21:43:17-05:00",
   "dh": 1.5,
   "tris": 1919441,
   "chars": 789860,
   "what": "Top bar: job gauges hidden, the machine rail moved into a Controls dropdown beside Blocks, and a Chase / Cab camera toggle"
  },
  {
   "v": 129,
   "asked": "2026-10-18T20:40:00-05:00",
   "live": "2026-10-18T21:45:51-05:00",
   "dh": 16,
   "tris": 1919145,
   "chars": 815284,
   "what": "The map editor is rebuilt around bars across the top, left and bottom: grouped tools with icons, a drawer with the library and an On the map list of every thing by kind, and picking several things at once to move, turn, size, colour, copy or delete together."
  },
  {
   "v": 130,
   "asked": "2026-10-18T21:30:00-05:00",
   "live": "2026-10-18T21:46:47-05:00",
   "dh": 1,
   "tris": 1918954,
   "chars": 815573,
   "what": "Three new mud settings in the screen editor's Tuning tab: how wet ground must be before it ruts, how fast ruts cut in, and how high mud piles up beside them."
  },
  {
   "v": 131,
   "asked": "2026-10-18T21:44:00-05:00",
   "live": "2026-10-18T21:50:12-05:00",
   "dh": 2,
   "tris": 1919017,
   "chars": 820471,
   "what": "Machine dropdown renamed Drive; a Controls button opens a panel listing every keyboard key (the player's own), mouse, touch and controller input"
  },
  {
   "v": 132,
   "asked": "2026-10-18T21:45:00-05:00",
   "live": "2026-10-18T21:56:29-05:00",
   "dh": 0.5,
   "tris": 1918697,
   "chars": 820447,
   "what": "The Turn slider moved from the bottom bar into the Controls panel, showing the machine it sets"
  },
  {
   "v": 133,
   "asked": "2026-10-18T21:50:00-05:00",
   "live": "2026-10-18T21:57:33-05:00",
   "dh": 0.5,
   "tris": 1918628,
   "chars": 820447,
   "what": "The map editor now scrolls and zooms out over the whole map, the mainland, woods and town included."
  },
  {
   "v": 134,
   "asked": "2026-10-18T21:20:00-05:00",
   "live": "2026-10-18T21:57:51-05:00",
   "dh": 16,
   "tris": 1919945,
   "chars": 840124,
   "what": "Rain runs downhill: rills on spoil piles and ruts fill the trench and wash loose dirt down as silt, and water streams down wet bare slopes like the ramp. Machines, the worker, buildings and trees darken and shine in the rain and dry after; water drips off roof edges. Cloud rolls in before a shower, curtains of rain hang over the lake, and hard showers bring lightning and thunder that arrives late with distance."
  },
  {
   "v": 135,
   "asked": "2026-10-18T21:37:00-05:00",
   "live": "2026-10-18T22:01:55-05:00",
   "dh": 10,
   "tris": 1919122,
   "chars": 850762,
   "what": "The dig site follows the excavator and skid steer anywhere on Corley's mesa; holes left behind stay, drawn in less detail, and save with the site"
  },
  {
   "v": 136,
   "asked": "2026-10-18T22:05:00-05:00",
   "live": "2026-10-18T22:20:36-05:00",
   "dh": 3,
   "tris": 1919012,
   "chars": 852995,
   "what": "Dug tiles save three times smaller, and a site too big for the browser saves in a compact form or warns instead of failing silently"
  },
  {
   "v": 137,
   "asked": "2026-10-18T22:05:00-05:00",
   "live": "2026-10-18T22:22:02-05:00",
   "dh": 5,
   "tris": 1919296,
   "chars": 857153,
   "what": "Running water turns milky tan where it carries dirt into pools and clears as the silt settles. A Stats button at the top right opens the stats: what the weather, ground and water are doing right now, showers, lightning, wiper sweeps, runoff, pumped and seeped water, dirt washed off and settled as silt, and steps walked."
  },
  {
   "v": 138,
   "asked": "2026-10-18T21:35:00-05:00",
   "live": "2026-10-18T22:22:07-05:00",
   "dh": 14,
   "tris": 2968735,
   "chars": 864906,
   "what": "The trees are redesigned: five species (spruce, red pine, oak, sugar maple and birch) with photo bark and real leaf and needle cards from OpenAI textures, full branches up close and lighter models far off, swaying in the breeze; Graphics has a new Tree detail distance and Tuning a Trees sway"
  },
  {
   "v": 139,
   "asked": "2026-10-18T21:43:00-05:00",
   "live": "2026-10-18T22:24:18-05:00",
   "dh": 5,
   "tris": 2968517,
   "chars": 875501,
   "what": "Add in the map editor places things One at a time, by Stamp, along a Line (fence runs end to end, cone lines at a spacing) or with a Scatter brush that plants woods and boulders at a spacing and density, or erases them."
  },
  {
   "v": 140,
   "asked": "2026-10-18T22:21:00-05:00",
   "live": "2026-10-18T22:31:19-05:00",
   "dh": 7,
   "tris": 2968231,
   "chars": 881960,
   "what": "Dig on the Family Island, Dexter's and Jessica's too; buildings and bridge ends can't be dug under, and trees fall when their roots are dug out"
  },
  {
   "v": 141,
   "asked": "2026-10-18T22:05:00-05:00",
   "live": "2026-10-18T22:42:28-05:00",
   "dh": 6,
   "tris": 2969059,
   "chars": 895453,
   "what": "The map editor's exact edits: type a thing's spot in feet, Snap to a 1 to 10 ft grid (15° turns, fence ends meet, things face a road at its edge), a ring to turn and size the selection, arrow-key nudges, Line up, Space evenly, Face one way, Row, and Copy and Paste at the pointer."
  },
  {
   "v": 142,
   "asked": "2026-10-18T22:20:00-05:00",
   "live": "2026-10-18T22:49:12-05:00",
   "dh": 2.5,
   "tris": 2968590,
   "chars": 896360,
   "what": "Shadows now fall on ruts, mud and the lawn too, and reach farther: a Shadow distance setting, 72/105/148 ft by tier"
  },
  {
   "v": 143,
   "asked": "2026-10-18T22:48:00-05:00",
   "live": "2026-10-18T22:53:49-05:00",
   "dh": 3,
   "tris": 2968661,
   "chars": 900682,
   "what": "The map editor can hide things while you edit, to get at what is behind them, and lock things (saved with the map) so they can't be picked, moved or deleted by accident; On the map has an eye and a lock on each row and kind, and a Locked filter."
  },
  {
   "v": 144,
   "asked": "2026-10-18T22:00:00-05:00",
   "live": "2026-10-18T23:06:05-05:00",
   "dh": 5,
   "tris": 2967738,
   "chars": 918042,
   "what": "Dig site test (☰ → Dig site test, or ?digtest=low to run it hands off): digs across tile edges at every dig site, drives from the mesa to Dexter's, checks every hole and the saves and shows FPS for each part; GitHub runs its checks on every change. Fixed ground dug on the dig grid's edge going back to undug when the grid moved over it."
  },
  {
   "v": 145,
   "asked": "2026-10-18T22:50:00-05:00",
   "live": "2026-10-18T23:08:09-05:00",
   "dh": 3,
   "tris": 2968751,
   "chars": 929026,
   "what": "Stats page counts every tree by species (ages from real forestry growth curves, trunks, shade, wood, carbon, life stages) with a Tree guide of age by height; the map editor shows each tree's age and a species age summary."
  },
  {
   "v": 146,
   "asked": "2026-10-18T23:00:00-05:00",
   "live": "2026-10-18T23:13:40-05:00",
   "dh": 5,
   "tris": 2967890,
   "chars": 940667,
   "what": "The map editor keeps several named maps on the device, downloads a map as a file and opens one, shows what a map holds, starts over one layer at a time (shape, paint, things or roads), and its History list names each step and jumps back to any of them."
  },
  {
   "v": 147,
   "asked": "2026-10-18T23:20:00-05:00",
   "live": "2026-10-18T23:19:36-05:00",
   "dh": 3,
   "tris": 2968865,
   "chars": 946888,
   "what": "The map editor's Inspect group can measure: tap points for a length, slope and area, in feet and acres; and the machines can be sent back to where they start."
  },
  {
   "v": 148,
   "asked": "2026-10-18T22:56:00-05:00",
   "live": "2026-10-18T23:21:50-05:00",
   "dh": 1,
   "tris": 2967805,
   "chars": 947950,
   "what": "The dig grid now moves when the machine is 39 ft from its edge (was 33 ft), so the bucket can't dig right at the edge and leave a wall that slumps in once the grid moves; found by the dig site test on the phone. The test runs the slumping in its headless checks too."
  },
  {
   "v": 149,
   "asked": "2026-10-18T23:10:00-05:00",
   "live": "2026-10-18T23:47:21-05:00",
   "dh": 9,
   "tris": 2968008,
   "chars": 973696,
   "what": "Day and night: the sun and moon move where they really are over the lake for the date and time, with shadows to match; golden hour, dusk, stars, Milky Way, moon phases, shooting stars; lamps, light towers, lanterns and windows light at dusk; headlights; fireflies, crickets and frogs; ☰ Time slider, Stop/Run, Now"
  },
  {
   "v": 150,
   "asked": "2026-10-19T09:20:00-05:00",
   "live": "2026-10-19T09:39:32-05:00",
   "dh": 10,
   "tris": 2968361,
   "chars": 986680,
   "what": "Plant trees on foot (7, or Plant) in five species; each grows on its real height-for-age curve through sapling, young and full-grown models as ☰ Time's new Date slider runs up to 100 years ahead"
  },
  {
   "v": 151,
   "asked": "2026-10-19T09:15:00-05:00",
   "live": "2026-10-19T09:46:18-05:00",
   "dh": 3,
   "tris": 2968327,
   "chars": 989797,
   "what": "The dig grid moves about 10 times faster, so following the machine no longer stutters: each tile's untouched ground is worked out once and kept, and the tiles round the grid are worked out a little each frame before the grid gets there."
  },
  {
   "v": 152,
   "asked": "2026-10-19T09:40:00-05:00",
   "live": "2026-10-19T09:51:22-05:00",
   "dh": 7,
   "tris": 2968389,
   "chars": 995526,
   "what": "The island's own trees grow with ☰ Time's Date; planted trees count in Stats and show on the site map; the map editor's Things gets a Plant tool (species, years ago, dig up, undo)"
  },
  {
   "v": 153,
   "asked": "2026-10-19T09:52:00-05:00",
   "live": "2026-10-19T10:09:42-05:00",
   "dh": 6,
   "tris": 2967407,
   "chars": 999409,
   "what": "On foot you can go almost anywhere: down the rocky banks to every beach, wade into the lake and swim once it's deep (Sprint swims harder), and jump over a bridge railing to dive in."
  },
  {
   "v": 154,
   "asked": "2026-10-19T10:12:00-05:00",
   "live": "2026-10-19T10:39:37-05:00",
   "dh": 10,
   "tris": 2977243,
   "chars": 1012831,
   "what": "A wooden dock with a boat at every island: get in and drive it across the lake, run it up on any beach to leave it on the sand, and reverse to push off."
  },
  {
   "v": 155,
   "asked": "2026-10-19T10:45:00-05:00",
   "live": "2026-10-19T11:06:18-05:00",
   "dh": 5,
   "tris": 3003564,
   "chars": 1015929,
   "what": "Dig anywhere on Corley's right out to the water: drive the excavator down the bank onto the beach and dig in the sand. In the excavator a big Drive / Dig switch over the right stick (or Enter) flips between moving and digging."
  },
  {
   "v": 156,
   "asked": "2026-10-19T10:50:00-05:00",
   "live": "2026-10-19T11:11:01-05:00",
   "dh": 5,
   "tris": 3008544,
   "chars": 1018704,
   "what": "A boat at the town marina too, and every bridge now has room for a boat underneath (at least 8 ft between the piers), with piers, pile bents and the crane barge solid to boats."
  },
  {
   "v": 157,
   "asked": "2026-10-19T10:30:00-05:00",
   "live": "2026-10-19T11:18:55-05:00",
   "dh": 14,
   "tris": 3029551,
   "chars": 1036209,
   "what": "Dexter's Island has a dirt bike track (a tabletop jump, whoops and banked turns) with his dirt bike on the start line: walk up and Get in to ride it."
  },
  {
   "v": 158,
   "asked": "2026-10-19T11:35:00-05:00",
   "live": "2026-10-19T11:51:16-05:00",
   "dh": 2,
   "tris": 3031283,
   "chars": 1039153,
   "what": "Map editor shows exactly where you are looking and Copy view gives a code to paste to Claude, who opens headless shots at that exact camera"
  },
  {
   "v": 159,
   "asked": "2026-10-19T11:35:00-05:00",
   "live": "2026-10-19T11:54:57-05:00",
   "dh": 9,
   "tris": 3032960,
   "chars": 1056925,
   "what": "Boats sound real (an outboard that revs with the throttle, hull slap, water rushing by), leave a spreading V wake that rocks other boats, and the lake has company: fishing boats, sailboats and a tug pushing a spoil barge that give way to you and blow the horn at the docks."
  },
  {
   "v": 160,
   "asked": "2026-10-19T14:15:00-05:00",
   "live": "2026-10-19T15:05:00-05:00",
   "dh": 14,
   "tris": 3032407,
   "chars": 1075321,
   "what": "Dexter's dozer, wheel loader and semi are drivable: the dozer's blade shaves and shoves dirt, the loader scoops and loads the dump truck, and the semi tows its lowboy trailer."
  },
  {
   "v": 161,
   "asked": "2026-10-19T14:15:00-05:00",
   "live": "2026-10-19T15:07:32-05:00",
   "dh": 0.2,
   "tris": 3033562,
   "chars": 1075302,
   "what": "The help now says all of Dexter's machines drive, and the idea board marks the wheel loader done and the dozer mostly done."
  },
  {
   "v": 162,
   "asked": "2026-10-19T15:40:00-05:00",
   "live": "2026-10-19T16:17:41-05:00",
   "dh": 5,
   "tris": 3033349,
   "chars": 1079809,
   "what": "Dexter's dozer has a working ripper that breaks up hard clay and rock so the blade and excavator dig it easily; the blade now struggles in unripped hard ground; fixed a crash while riding the dirt bike or a heavy machine."
  },
  {
   "v": 163,
   "asked": "2026-10-19T16:30:00-05:00",
   "live": "2026-10-19T16:35:42-05:00",
   "dh": 1.5,
   "tris": 3033008,
   "chars": 1080294,
   "what": "The dozer's ripper leaves furrow lines: a groove down the middle with broken, lumpy ground heaved up along both sides."
  },
  {
   "v": 164,
   "asked": "2026-10-19T16:20:00-05:00",
   "live": "2026-10-19T16:55:54-05:00",
   "dh": 7,
   "tris": 3033010,
   "chars": 1088062,
   "what": "Play in VR on a Meta Quest: sit in the cab and look round for real, walk the island on foot, Touch controllers drive every machine, a dashboard panel in front of you."
  },
  {
   "v": 165,
   "asked": "2026-10-19T19:25:00-05:00",
   "live": "2026-10-19T20:29:21-05:00",
   "dh": 10,
   "tris": 3033464,
   "chars": 1100118,
   "what": "New Ultra graphics level for strong PCs: soft contact shade where things meet the ground, a glow round bright light and a camera-like colour grade, all tunable on the Tuning tab (Screen effects); three.js moved up from r128 to r147"
  },
  {
   "v": 166,
   "asked": "2026-10-19T20:30:00-05:00",
   "live": "2026-10-19T21:12:39-05:00",
   "dh": 18,
   "tris": 3061639,
   "chars": 1107353,
   "what": "The excavator becomes a detailed 3D model loaded from a file: steel track shoes round a toothed sprocket and idler, rollers, louvred hood, handrails, shaped boom, stick and bucket with real teeth, and a full cab inside (seat, joysticks, travel levers, pedals, display, roof window); the cab view sits back in the seat so the cab frames the view. Graphics > Machine models switches it (Simple on Low)"
  },
  {
   "v": 167,
   "asked": "2026-10-19T21:05:00-05:00",
   "live": "2026-10-19T21:29:18-05:00",
   "dh": 10,
   "tris": 3061943,
   "chars": 1110499,
   "what": "Complete UI redesign: no more black bars; floating pro-sim glass HUD, grouped menu, new type and panels"
  },
  {
   "v": 168,
   "asked": "2026-10-19T21:20:00-05:00",
   "live": "2026-10-19T21:39:23-05:00",
   "dh": 1,
   "tris": 3062727,
   "chars": 1112112,
   "what": "Things picked in the map editor are shaded orange, so you can see what is selected."
  },
  {
   "v": 169,
   "asked": "2026-10-19T21:20:00-05:00",
   "live": "2026-10-19T21:42:16-05:00",
   "dh": 10,
   "tris": 3267550,
   "chars": 1118080,
   "what": "Leafy shrubs in greens, olive, gold and rust now grow round the edges of every tree, so woods read as thickets (Graphics > Undergrowth; fewer on Low). On High and Ultra the natural dirt and grass get relief that catches the sun, tunable on the Tuning tab (Ground look)"
  },
  {
   "v": 170,
   "asked": "2026-10-19T21:25:00-05:00",
   "live": "2026-10-19T22:00:15-05:00",
   "dh": 7,
   "tris": 3280397,
   "chars": 1127621,
   "what": "Paint the tall grass you mow anywhere in the map editor (Tall grass and No tall grass in Paint), up to about 8,300 sq ft."
  },
  {
   "v": 171,
   "asked": "2026-10-19T21:20:00-05:00",
   "live": "2026-10-19T22:01:48-05:00",
   "dh": 4,
   "tris": 3280365,
   "chars": 1130463,
   "what": "Leaves and undergrowth get soft see-through edges instead of hard cut-outs, glow where the sun shines through them, and sway downwind with the weather's gusts (harder in a storm); shrubs now move from the ground up. Tunable on the Tuning tab (Trees: sway, sunlight through the leaves)"
  },
  {
   "v": 172,
   "asked": "2026-10-19T22:00:00-05:00",
   "live": "2026-10-19T22:12:19-05:00",
   "dh": 2,
   "tris": 3279286,
   "chars": 1131786,
   "what": "VR turns smoothly on foot (tunable, or snap steps at 0) and holds a steady 72 Hz when you look round: foveated edges, a lighter eye buffer, the dash panel and rain cover drawn only when needed."
  },
  {
   "v": 173,
   "asked": "2026-10-19T22:40:00-05:00",
   "live": "2026-10-19T22:46:20-05:00",
   "dh": 0.5,
   "tris": 3280371,
   "chars": 1132129,
   "what": "Playing VR through a PC (Quest Link, Air Link, Virtual Desktop, SteamVR) keeps your Graphics setting, no foveation, full-size eye buffer; the Quest browser keeps Low."
  },
  {
   "v": 174,
   "asked": "2026-10-19T22:58:00-05:00",
   "live": "2026-10-19T22:53:10-05:00",
   "dh": 0.5,
   "tris": 3279782,
   "chars": 1133191,
   "what": "Graphics panel gets an In VR level (Low, Medium, High) used inside the Meta Quest browser; Low unless picked."
  },
  {
   "v": 175,
   "asked": "2026-10-20T16:46:00-05:00",
   "live": "2026-10-20T17:12:08-05:00",
   "dh": 5,
   "tris": 3281694,
   "chars": 1143196,
   "what": "Each lawn keeps its own mowed share; a small lawn gauge while you are on one; lawns labelled and listed on the site map"
  },
  {
   "v": 176,
   "asked": "2026-10-19T22:10:00-05:00",
   "live": "2026-10-20T17:20:05-05:00",
   "dh": 9,
   "tris": 4367473,
   "chars": 1151938,
   "what": "Mowed grass grows back while the game is closed; clover, thistle, plantain and sedge grow by area; Graphics has a Grass quality setting."
  },
  {
   "v": 177,
   "asked": "2026-10-20T16:30:00-05:00",
   "live": "2026-10-20T17:27:04-05:00",
   "dh": 10,
   "tris": 4379694,
   "chars": 1161381,
   "what": "VR looks better: a sharp dashboard in the headset, work gloves that grab the excavator's joysticks (which now move with the sticks), a Quest graphics level made for the headset, sharper PC VR on High and Ultra, and a comfort vignette while you drive or turn."
  },
  {
   "v": 178,
   "asked": "2026-10-20T17:05:00-05:00",
   "live": "2026-10-20T17:33:32-05:00",
   "dh": 2,
   "tris": 4441233,
   "chars": 1161385,
   "what": "Leaf trees and bushes use a loose photo leaf spray with sky showing between the leaves instead of a solid clump, with more cards per clump so crowns stay full"
  },
  {
   "v": 179,
   "asked": "2026-10-20T20:02:00-05:00",
   "live": "2026-10-20T20:28:24-05:00",
   "dh": 2,
   "tris": 4443187,
   "chars": 1161663,
   "what": "Oaks and birches get their own photo leaf sprays (lobed oak leaves with acorns, small birch leaves on drooping twigs); maples and the undergrowth keep the maple spray"
  },
  {
   "v": 180,
   "asked": "2026-10-20T20:05:00-05:00",
   "live": "2026-10-20T21:06:15-05:00",
   "dh": 14,
   "tris": 4439892,
   "chars": 1158210,
   "what": "Every sound is now a real recording: diesel engines that rev, hydraulic whine, track clatter, the bucket biting, a real backup alarm, air brakes, outboards and thunder; plus wind, birds, crickets, frogs, lake waves, gulls, rain and footsteps, and a Nature slider"
  },
  {
   "v": 181,
   "asked": "2026-10-20T21:20:00-05:00",
   "live": "2026-10-20T21:35:48-05:00",
   "dh": 9,
   "tris": 4432637,
   "chars": 1167046,
   "what": "Dexter's blue pickup and red four-wheeler: get in and drive them anywhere, with real engine sounds, sliding in hard turns, and their speed, acceleration, braking, steering and grip in the Tuning tab"
  },
  {
   "v": 182,
   "asked": "2026-10-20T21:35:00-05:00",
   "live": "2026-10-20T22:03:51-05:00",
   "dh": 16,
   "tris": 4468895,
   "chars": 1171967,
   "what": "The excavator and dump truck on physically based materials (worn painted steel, bare steel and rubber that reflect the sky) with a new rounded cab, hood, fenders, dump body and tailgate on the truck"
  },
  {
   "v": 183,
   "asked": "2026-10-20T22:05:00-05:00",
   "live": "2026-10-20T22:47:46-05:00",
   "dh": 10,
   "tris": 4642001,
   "chars": 1179289,
   "what": "One of every machine on Corley's Island and on Dexter's: a second dozer, loader, semi, pickup and four-wheeler on Corley's east lawn, and twins of the excavator, dump truck, mower, skid steer and dirt bike, with every machine moved back to its home island"
  },
  {
   "v": 184,
   "asked": "2026-10-20T22:35:00-05:00",
   "live": "2026-10-21T01:16:13-05:00",
   "dh": 12,
   "tris": 4629798,
   "chars": 1181228,
   "what": "The game now runs on the latest three.js (r186, up from r147): same look on every graphics level, with newer WebGL and VR (WebXR) support underneath, and a fix for a black blot Ultra could show on folded parts."
  },
  {
   "v": 185,
   "asked": "2026-10-20T22:35:00-05:00",
   "live": "2026-10-21T18:21:05-05:00",
   "dh": 6,
   "tris": 4636659,
   "chars": 1185772,
   "what": "Every machine on physically based materials: the mower, skid steer, dirt bike, boats, dozers, loaders, semis, pickups and four-wheelers get worn paint, bare steel, rubber, chrome and glass that reflect the sky"
  },
  {
   "v": 186,
   "asked": "2026-10-20T22:50:00-05:00",
   "live": "2026-10-21T18:31:40-05:00",
   "dh": 12,
   "tris": 4758955,
   "chars": 1187049,
   "what": "Detailed models for the pickups and four-wheelers: real wheel arches, tinted glass, chrome grille, alloy wheels and a lined bed on the pickup; knobby tyres, tube frame, shocks, racks and sculpted fenders on the four-wheeler"
  },
  {
   "v": 187,
   "asked": "2026-10-21T18:25:00-05:00",
   "live": "2026-10-21T19:00:35-05:00",
   "dh": 6,
   "tris": 4794106,
   "chars": 1187049,
   "what": "The detailed dump truck is rebuilt: a rounded hood with framed intakes, a cab with rounded corners, rubber window gaskets and roof clearance lights, and a dump body with a boxed top rail, side braces and a gusseted cab protector."
  },
  {
   "v": 188,
   "asked": "2026-10-21T18:35:00-05:00",
   "live": "2026-10-21T19:17:56-05:00",
   "dh": 20,
   "tris": 5070010,
   "chars": 1190306,
   "what": "Detailed models for the dozers, wheel loaders and semis: tracks with real shoes, rollers and a raised sprocket, a curved blade and ripper on working rams; deep-lug tyres, Z-bar arms and a curved bucket on the loader; a long-hood red semi with chrome grille, stacks and tanks pulling a lowboy with an oak plank deck"
  },
  {
   "v": 189,
   "asked": "2026-10-21T18:30:00-05:00",
   "live": "2026-10-21T19:21:42-05:00",
   "dh": 10,
   "tris": 5117385,
   "chars": 1195296,
   "what": "The worker on foot is now a realistic rigged man (MakeHuman CC0): real skin and face with stubble, T-shirt, jeans, work boots, a hi-vis vest with reflective bands and a hard hat, posed by the same walk, run, jump, swim and ride moves"
  },
  {
   "v": 190,
   "asked": "2026-10-21T19:15:00-05:00",
   "live": "2026-10-21T19:32:08-05:00",
   "dh": 1,
   "tris": 5000626,
   "chars": 1195296,
   "what": "A plain-text CHANGELOG.md on GitHub listing every version, newest first and grouped by day, rebuilt by each release"
  },
  {
   "v": 191,
   "asked": "2026-10-21T19:40:00-05:00",
   "live": "2026-10-21T19:41:45-05:00",
   "dh": 4,
   "tris": 5118248,
   "chars": 1195296,
   "what": "A hub page (hub.html) with everything about the game in one place: the version, the roadmap, a design doc, the changelog, the ideas and the credits, with links to the game, the build log and the editors"
  },
  {
   "v": 192,
   "asked": "2026-10-21T19:55:00-05:00",
   "live": "2026-10-21T20:10:22-05:00",
   "dh": 1,
   "tris": 4876416,
   "chars": 1195296,
   "what": "The hub page is now one template shared by all of Corley's games (only its settings differ), with a Roadmap count of items done"
  },
  {
   "v": 193,
   "asked": "2026-10-21T20:15:00-05:00",
   "live": "2026-10-21T20:16:44-05:00",
   "dh": 0.5,
   "tris": 5029939,
   "chars": 1195296,
   "what": "The hub's documents with code in them fit a phone screen instead of scrolling the page sideways"
  },
  {
   "v": 194,
   "asked": "2026-10-21T20:25:00-05:00",
   "live": "2026-10-21T20:33:46-05:00",
   "dh": 2,
   "tris": 5124128,
   "chars": 1195296,
   "what": "The idea board audited against the game: 26 ideas built moved to a new Completed section, 51 marked part built with how far along"
  },
  {
   "v": 195,
   "asked": "2026-10-21T21:40:00-05:00",
   "live": "2026-10-21T22:28:37-05:00",
   "dh": 6,
   "tris": 5162523,
   "chars": 1197434,
   "what": "Ten fixes to what's there: Space no longer flips the wipers on foot; a second finger can't freeze a held stick and keys can't stick after Cmd on a Mac; switching to Walk with no room to climb out keeps you in the machine; an idle device no longer makes the other one reload through sync; a map edit is saved even if you leave within a second; water, puddles, soaking and settling heaps run the same on a slow phone as on a PC; puddles no longer fill and dry twice along mud-tile seams; less stutter from the mud loop; lighter clouds on Low; faster loading with no console spam from the machine models; and the dig site test's Lower Bench cut moved off the bridge end so it passes"
  },
  {
   "v": 196,
   "asked": "2026-10-22T20:50:00-05:00",
   "live": "2026-10-22T16:24:25-05:00",
   "dh": 11,
   "tris": 5162261,
   "chars": 1213205,
   "what": "Take out the string trimmer on foot (9) to weed-eat where the mower can't reach, and bump out more line (0) as it wears; footsteps now squelch through mud and knock hollow on the bridge decks and docks."
  },
  {
   "v": 197,
   "asked": "2026-10-22T20:50:00-05:00",
   "live": "2026-10-22T16:45:26-05:00",
   "dh": 12,
   "tris": 4637679,
   "chars": 1232370,
   "what": "Bucket angle matters: teeth into the cut fill the bucket, dragging it flat only skims. Quick coupler: set the bucket down (.) and pick up a thumb to carry blocks, a hammer to break rock, or an auger to bore holes."
  },
  {
   "v": 198,
   "asked": "2026-10-22T20:50:00-05:00",
   "live": "2026-10-22T17:05:34-05:00",
   "dh": 20,
   "tris": 5201322,
   "chars": 1251284,
   "what": "Corley's backhoe is here at the end of his machine row: drive it on four wheels, scoop with the loader, then swing the seat round (Drive / Dig), drop the outriggers and dig with the hoe."
  },
  {
   "v": 199,
   "asked": "2026-10-22T20:50:00-05:00",
   "live": "2026-10-22T17:13:40-05:00",
   "dh": 14,
   "tris": 5239637,
   "chars": 1282302,
   "what": "Drive a pickup to the new Lakeside General Store in town for mulch, tools and groceries; carry them (T on foot) into the bed, where they slide if you brake hard, and spread the mulch at home."
  },
  {
   "v": 200,
   "asked": "2026-10-22T20:50:00-05:00",
   "live": "2026-10-22T17:23:57-05:00",
   "dh": 14,
   "tris": 5234189,
   "chars": 1292836,
   "what": "Ultra graphics: shade coloured by the real sky, soft sun shadows that sharpen where things touch the ground, rain beading and running on the machines, and soaked ground that mirrors the sky."
  },
  {
   "v": 201,
   "asked": "2026-10-22T17:35:00-05:00",
   "live": "2026-10-22T18:18:28-05:00",
   "dh": 5,
   "tris": 5235947,
   "chars": 1297029,
   "what": "Ultra and High graphics: dug trench walls show real relief (bucket-tooth grooves, cracks, pebbles and roots catch the light), Ultra's sky reflections in paint and glass are four times as sharp, and rain beads and runs down the cab windows, seen from inside the cab too."
  },
  {
   "v": 202,
   "asked": "2026-10-22T18:50:00-05:00",
   "live": "2026-10-22T20:13:45-05:00",
   "dh": 34,
   "tris": 5246817,
   "chars": 1346586,
   "what": "Jessica's library gets a tuxedo cat by the fire who watches you and purrs when you pet her, and a far cozier room (wingback chairs, a writing desk, a globe, fairy lights, curtains, a painting, firelight); Dexter's pickup tows a new equipment trailer and his new mini excavator rides on it; machines log engine hours, burn fuel you buy at the pumps and earn pay, with a day's log in Stats; work lights on the boom and amber beacons; rain drums on porch roofs; a free Orbit camera; and Ultra steps down to High on a PC that can't hold it."
  },
  {
   "v": 203,
   "asked": "2026-10-22T20:15:00-05:00",
   "live": "2026-10-22T20:21:56-05:00",
   "dh": 0.5,
   "tris": 5238854,
   "chars": 1347233,
   "what": "Fuel burn is off: machines never run dry, no low-fuel warnings or fill-ups, and Stats drops the fuel rows (hour meters and pay still run)"
  },
  {
   "v": 204,
   "asked": "2026-10-22T20:20:00-05:00",
   "live": "2026-10-22T20:48:05-05:00",
   "dh": 0.75,
   "tris": 5239409,
   "chars": 1347871,
   "what": "In VR, the stripes that flickered on machines as you walked up to them are gone: the headset sees depth more finely."
  },
  {
   "v": 205,
   "asked": "2026-10-22T20:55:00-05:00",
   "live": "2026-10-22T21:07:15-05:00",
   "dh": 2,
   "tris": 5234294,
   "chars": 1350035,
   "what": "The start card now has an island row: pick Corley's, Dexter's or Jessica's Island, then a machine or On foot, and you start there (the machine comes with you)."
  },
  {
   "v": 206,
   "asked": "2026-10-22T21:15:00-05:00",
   "live": "2026-10-22T22:10:08-05:00",
   "dh": 2.5,
   "tris": 5240022,
   "chars": 1354352,
   "what": "The start card shows every machine you can ride, with new pictures: the excavator, dump truck, mower and On foot up top, and a More machines grid with the skid steer, backhoe, mini excavator, dozer, wheel loader, semi, pickup, four-wheeler, dirt bike and boat. Each starts you in the one on the island you picked."
  },
  {
   "v": 207,
   "asked": "2026-10-23T08:40:00-05:00",
   "live": "2026-10-23T10:41:55-05:00",
   "dh": 96,
   "tris": 4698371,
   "chars": 1368792,
   "what": "Detailed models for the most-seen things that were still simple shapes, on Medium graphics and up: the zero-turn mower, skid steer with working lift and tilt rams, dirt bike with a sliding fork, the runabouts at every dock, Dexter's mini excavator and tag trailer, the trench box, the quick coupler with its thumb, hammer and auger, the lake's fishing boats, sailboats, tug and spoil barge, Dexter's cones, light towers, Jersey barriers, diesel tank, office trailer, track bales and tyres, and the street and bridge lamps, park benches, pavilion picnic tables and round hay bales; cones, light towers, benches and picnic tables placed in the map editor get them too, and the start card shows the new machines. Phones on Low keep the simple shapes"
  },
  {
   "v": 208,
   "asked": "2026-10-23T20:51:00-05:00",
   "live": "2026-10-23T20:56:49-05:00",
   "dh": 2,
   "tris": 3979275,
   "chars": 1369927,
   "what": "Trees out of view are no longer drawn (their shadows stay): about a third fewer triangles looking ahead, more when turned away"
  },
  {
   "v": 209,
   "asked": "2026-10-23T20:51:00-05:00",
   "live": "2026-10-23T21:06:26-05:00",
   "dh": 2.5,
   "tris": 4087127,
   "chars": 1371274,
   "what": "The dig grid's ground is drawn as 16 blocks, so the parts behind you or off to the side are no longer drawn (up to about 200,000 fewer triangles)"
  },
  {
   "v": 210,
   "asked": "2026-10-23T20:51:00-05:00",
   "live": "2026-10-23T21:25:06-05:00",
   "dh": 3,
   "tris": 5209019,
   "chars": 1372675,
   "what": "The detailed machines, Dexter's machines, the twins and the attachments cast their shadows from merged parts: the shadow pass drops from about 440 draws to about 140, same shadows"
  },
  {
   "v": 211,
   "asked": "2026-10-23T20:51:00-05:00",
   "live": "2026-10-23T21:37:35-05:00",
   "dh": 1.5,
   "tris": 5398137,
   "chars": 1373378,
   "what": "In the rain the overhead cover map (what keeps rain off under roofs) is drawn every third frame instead of every frame, and its once-a-second read-back no longer stalls the frame where the device allows"
  },
  {
   "v": 212,
   "asked": "2026-10-23T20:51:00-05:00",
   "live": "2026-10-23T21:45:14-05:00",
   "dh": 1.5,
   "tris": 4994297,
   "chars": 1374725,
   "what": "The excavator's hoses are rebuilt only when they move, and Dexter's parked machines are checked in turns once they have settled: about 1 ms less game work every frame"
  },
  {
   "v": 213,
   "asked": "2026-10-23T20:50:00-05:00",
   "live": "2026-10-23T21:49:35-05:00",
   "dh": 1.5,
   "tris": 4856994,
   "chars": 1374939,
   "what": "The excavator digs again when it was picked with a mode button or VR's next-machine button instead of climbed into: the dig area now follows it wherever it drives."
  },
  {
   "v": 214,
   "asked": "2026-10-23T20:51:00-05:00",
   "live": "2026-10-23T22:00:54-05:00",
   "dh": 0.5,
   "tris": 4078114,
   "chars": 1374956,
   "what": "Low graphics draws the simpler lawn unless you are standing on it or mowing (234,000 to 58,000 triangles near the lawn); Lawn full detail gets an 'On it only' choice"
  },
  {
   "v": 215,
   "asked": "2026-10-24T10:45:00-05:00",
   "live": "2026-10-24T10:59:17-05:00",
   "dh": 2,
   "tris": 5156634,
   "chars": 1377172,
   "what": "Xbox controllers over Bluetooth work seamlessly: the pad you press is the one used, unmapped pads read right, Android's echo keys dropped, B can't back out of the game, and a dropped connection says so"
  },
  {
   "v": 216,
   "asked": "2026-10-24T10:45:00-05:00",
   "live": "2026-10-24T11:05:10-05:00",
   "dh": 1.5,
   "tris": 5372395,
   "chars": 1378461,
   "what": "The menu now fits on screen at every UI size (it scrolls instead of running off the bottom), and a big orange VR button sits on the top bar and the start card, one press into the headset."
  },
  {
   "v": 217,
   "asked": "2026-10-24T10:50:00-05:00",
   "live": "2026-10-24T11:14:47-05:00",
   "dh": 5,
   "tris": 4567645,
   "chars": 1396872,
   "what": "Backhoe load test (☰ or ?bhtest): from the cab it checks every hoe control, digs and dumps six buckets into the dump truck, and reports pass times, cubic yards an hour and cab FPS"
  },
  {
   "v": 218,
   "asked": "2026-10-24T12:29:00-05:00",
   "live": "2026-10-24T12:38:33-05:00",
   "dh": 3,
   "tris": 4133189,
   "chars": 1400797,
   "what": "The backhoe's hoe fills over the stroke, not at a touch: teeth speed, cut thickness and leading teeth set how fast; flat or heel-first only skims. A heaped bucket swung fast spills, quick dumps scatter and can miss the bed, moist clay pours slow, the pump's flow is shared between functions and a full bucket slows the boom"
  },
  {
   "v": 219,
   "asked": "2026-10-24T12:40:00-05:00",
   "live": "2026-10-24T13:32:08-05:00",
   "dh": 4,
   "tris": 4085990,
   "chars": 1406380,
   "what": "Load test for the excavator as well as the backhoe (☰ or ?extest); at each dump the camera comes out behind the truck to watch the bucket pour until it is empty"
  },
  {
   "v": 220,
   "asked": "2026-10-24T13:59:00-05:00",
   "live": "2026-10-24T14:25:29-05:00",
   "dh": 3,
   "tris": 5007724,
   "chars": 1407541,
   "what": "The excavator's bucket fills over the stroke like the backhoe's (about 3 s in loam), and every dig number for both (fill time, teeth speed, cut thickness, deepest bite) is on the Tuning tab"
  },
  {
   "v": 221,
   "asked": "2026-10-24T14:35:00-05:00",
   "live": "2026-10-24T14:40:48-05:00",
   "dh": 1.5,
   "tris": 5410460,
   "chars": 1408336,
   "what": "Xbox pad and Quest controllers buzz while any machine digs (backhoe, skid steer, dozer, loader, auger), harder in rock; Controller strength setting in Tuning"
  },
  {
   "v": 222,
   "asked": "2026-10-24T13:43:00-05:00",
   "live": "2026-10-24T16:14:42-05:00",
   "dh": 5,
   "tris": 5450822,
   "chars": 1415028,
   "what": "The first dig and dump no longer freeze: their effects are drawn once while the game loads, so the browser builds their shaders then; the load tests now time every frame and list any freeze with what caused it"
  },
  {
   "v": 223,
   "asked": "2026-10-24T16:35:00-05:00",
   "live": "2026-10-24T16:42:01-05:00",
   "dh": 0.75,
   "tris": 5099498,
   "chars": 1415374,
   "what": "Controllers also buzz when a bucket, blade or bed dumps dirt (heavier pours harder) and while the mower or string trimmer cuts grass"
  },
  {
   "v": 224,
   "asked": "2026-10-24T15:43:00-05:00",
   "live": "2026-10-24T16:59:48-05:00",
   "dh": 7,
   "tris": 5364657,
   "chars": 1424715,
   "what": "The dirt in the excavator and backhoe buckets is a lumpy mound that heaps over the rim and spills when overfull, a bucket gauge shows how full (bar and %), and VR no longer flashes when the sky reflections update"
  },
  {
   "v": 225,
   "asked": "2026-10-25T09:05:00-05:00",
   "live": "2026-10-25T09:18:26-05:00",
   "dh": 1.5,
   "tris": 4283916,
   "chars": 1424395,
   "what": "The start card shows every machine as a small icon in one grid; Jessica's Island offers only the mower, four-wheeler, dirt bike, boat and on foot"
  },
  {
   "v": 226,
   "asked": "2026-10-25T09:40:00-05:00",
   "live": "2026-10-25T10:27:41-05:00",
   "dh": 5,
   "tris": 5446195,
   "chars": 1431118,
   "what": "Jessica's golf cart by the arch on her path, and a go-kart on Corley's, Dexter's and Jessica's islands; both on the start card, with their own Tuning"
  },
  {
   "v": 227,
   "asked": "2026-10-25T09:57:00-05:00",
   "live": "2026-10-25T11:14:03-05:00",
   "dh": 6,
   "tris": 4418557,
   "chars": 1438431,
   "what": "Mouse look in every view (click the scene, Esc frees it), a chase camera that eases round behind turning machines and drifts back behind them on the move, Messages setting (Few by default: only warnings and answers to what you did, tips on All only) with a small strip at the bottom, no on-screen sticks on mouse and keyboard (Sticks: Auto/On/Off), minimap sizes Off to XL, flatter squarer buttons"
  },
  {
   "v": 228,
   "asked": "2026-10-25T11:20:00-05:00",
   "live": "2026-10-25T11:35:37-05:00",
   "dh": 5,
   "tris": 5447769,
   "chars": 1456927,
   "what": "Island tour test (menu, or ?tourtest=low|medium|high|ultra): plays a run through the touch stick from Dexter's on foot to the four-wheeler, to the dock, into Dexter's boat and right round the lake past the town, marina, crane barge, bridges and hayfield, with the game running as in play, and reports per leg frame rate, 1% low, worst frame, stutters, main-thread time, triangles and draw calls, plus long tasks, freezes with their causes, memory and script errors; tourRun() checks the route headless"
  },
  {
   "v": 229,
   "asked": "2026-10-25T11:36:00-05:00",
   "live": "2026-10-25T11:47:39-05:00",
   "dh": 0.5,
   "tris": 5449016,
   "chars": 1457963,
   "what": "A Tests row on the start card (Island tour, Speed, Dig site, Backhoe load, Excavator load): each test is one tap from loading the game"
  },
  {
   "v": 230,
   "asked": "2026-10-25T11:18:00-05:00",
   "live": "2026-10-25T11:59:24-05:00",
   "dh": 2,
   "tris": 5418010,
   "chars": 1462866,
   "what": "Island tour test, first person (menu, start card, or ?tourfp): the same run seen through the player's eyes, the head looking round like a person's, mostly the way ahead with glances at machines, boats, bridges, the crane barge, houses and the town, from a fixed seed so runs compare"
  },
  {
   "v": 231,
   "asked": "2026-10-25T11:15:00-05:00",
   "live": "2026-10-25T12:28:51-05:00",
   "dh": 6,
   "tris": 5457172,
   "chars": 1471763,
   "what": "The lake looks real: wind ripples, sky reflections that grow at a slant, sun glitter, clear shallows over the sand, deep water dark teal, foam lapping the beaches and rain rings when it rains (Graphics: Lake water)."
  },
  {
   "v": 232,
   "asked": "2026-10-25T11:34:00-05:00",
   "live": "2026-10-25T13:15:35-05:00",
   "dh": 12,
   "tris": 5457266,
   "chars": 1506447,
   "what": "Every first-person ride shows its controls (dashboards, wheels that turn, the four-wheeler's handlebars, the boat's helm, see-through windscreens and cab glass); the island tour test's head moves smoothly like a person's, the route walks through town from the marina, and the results add the graphics card's time and headroom, a verdict that knows when the screen caps the frame rate, per-leg system costs, a map of the slowest spots, the scripts in slow frames, camera/ground/boat/sound checks, rain, night, 2-lap heat and leak checks, an every-graphics-level sweep, comparison with the last run and a shared results board; shaders and textures are got ready behind the start card"
  },
  {
   "v": 233,
   "asked": "2026-10-25T11:48:00-05:00",
   "live": "2026-10-25T13:51:32-05:00",
   "dh": 23,
   "tris": 5462158,
   "chars": 1545293,
   "what": "Corley's bridge is now a riveted forest-green 1931 truss on granite piers with acorn lamps, the mainland bridge a cable-stayed span from a 140 ft pylon, Jessica's footbridge a New England covered bridge with a cedar shake roof, and the trestles and the crane's steel spans are rebuilt in creosoted timber and riveted girders, all in weathered real materials that darken in the rain."
  },
  {
   "v": 234,
   "asked": "2026-10-25T13:50:00-05:00",
   "live": "2026-10-25T14:07:41-05:00",
   "dh": 1.5,
   "tris": 5465557,
   "chars": 1546106,
   "what": "The lake is murkier, a lake's green that hides the bed within a few feet, and boat wakes are lacy white foam lit like the water, greying at dusk."
  },
  {
   "v": 235,
   "asked": "2026-10-25T13:29:00-05:00",
   "live": "2026-10-25T14:15:38-05:00",
   "dh": 3,
   "tris": 5459243,
   "chars": 1548795,
   "what": "Every material's shader is built in the background whenever new ones appear (the detailed machines load later), so first sight of Dexter's yard, town or a machine no longer stalls for seconds on Windows; the island tour test waits for the game to be ready and reports that time on its own, leaves out time with the window hidden, allows a blip in the sound, and its boat backs out of the marina and steers round boats in its way"
  },
  {
   "v": 236,
   "asked": "2026-10-25T13:58:00-05:00",
   "live": "2026-10-25T14:23:42-05:00",
   "dh": 5,
   "tris": 5462376,
   "chars": 1552090,
   "what": "Dexter's haul bridge is now an old riveted railroad truss repainted safety yellow over its black, chipped through in places, with laced members, steel road plate between heavy timber wheel guards, old concrete piers with timber fender piles, and work lights on the portals, still 26 ft clear for a raised boom."
  },
  {
   "v": 237,
   "asked": "2026-10-25T14:20:00-05:00",
   "live": "2026-10-25T14:41:21-05:00",
   "dh": 1.5,
   "tris": 5456607,
   "chars": 1553599,
   "what": "The rain cover's top-down pass and the sun's shadow pass draw each place a player gets to once behind the start card (Dexter's, the Family Island, Jessica's, the marina, town, Corley's, the hayfield), so their own depth shaders are built before you arrive and the last half-second hitch on reaching Dexter's goes"
  },
  {
   "v": 238,
   "asked": "2026-10-25T13:35:00-05:00",
   "live": "2026-10-25T14:48:31-05:00",
   "dh": 14,
   "tris": 5599465,
   "chars": 1597223,
   "what": "A full marina (pier to a fuel dock, finger piers of bobbing boats, breakwater and lighthouse, Harbor House, grill, ice cream stand, ramp, boat rack) and real storefronts with signs, awnings and street trees on Main Street"
  },
  {
   "v": 239,
   "asked": "2026-10-25T15:05:00-05:00",
   "live": "2026-10-25T15:11:46-05:00",
   "dh": 1,
   "tris": 5605015,
   "chars": 1597442,
   "what": "Map editor: zooming all the way out now shows the whole map instead of plain sky, and the bucket gauge no longer sits over the editor. Added a test that deletes half the trees and stops at the Map card."
  },
  {
   "v": 240,
   "asked": "2026-10-25T15:20:00-05:00",
   "live": "2026-10-25T16:01:49-05:00",
   "dh": 7,
   "tris": 5617683,
   "chars": 1606447,
   "what": "Main Street and the cross street paved with curbs, gutters, sidewalks, curb ramps, a four-way stop, crosswalks, storm drains and manholes; the screen no longer freezes after the start card's warm-up"
  },
  {
   "v": 241,
   "asked": "2026-10-25T16:10:00-05:00",
   "live": "2026-10-25T16:15:43-05:00",
   "dh": 1.5,
   "tris": 5624533,
   "chars": 1607532,
   "what": "Feet and wheels stand on the town's sidewalks, curbs and asphalt instead of sinking in; a curb is a step up on foot"
  },
  {
   "v": 242,
   "asked": "2026-10-25T16:05:00-05:00",
   "live": "2026-10-25T16:27:35-05:00",
   "dh": 10,
   "tris": 5767486,
   "chars": 1624463,
   "what": "A freight line runs along the foot of the north mountains across the lake: Cruise Brandon's CN and CPKC freights (and now and then Amtrak's City of New Orleans) come out of one tunnel every few minutes, cross on a rock causeway and go into the other, blowing the horn, headlights on at night."
  },
  {
   "v": 243,
   "asked": "2026-10-25T16:04:00-05:00",
   "live": "2026-10-25T16:50:02-05:00",
   "dh": 18,
   "tris": 5641908,
   "chars": 1663218,
   "what": "About 60 new things to place, in the map editor or on foot from the Blocks bar's What list: street lights, lamp posts, floodlights, spotlights, path and string lights and lantern hooks that glow after dark in any colour, plus road gear, site gear, garden, yard and play things (and jack-o'-lanterns)."
  },
  {
   "v": 244,
   "asked": "2026-10-25T16:55:00-05:00",
   "live": "2026-10-25T17:03:59-05:00",
   "dh": 2,
   "tris": 5632241,
   "chars": 1665680,
   "what": "The distant train shows on the maps: the line across the north, each train as a dark bar with a red dot at its locomotive (blue for Amtrak), and a train badge on the minimap's edge pointing the way to it."
  },
  {
   "v": 245,
   "asked": "2026-10-25T16:20:00-05:00",
   "live": "2026-10-25T17:14:34-05:00",
   "dh": 5,
   "tris": 5624387,
   "chars": 1671054,
   "what": "Porches, steps, slabs, decks, lots, walks, curbs, the cottage floor and the editor's pallets, gazebo and sandbox are now stood on at their real height; edges up to a step step up, higher ones are walls"
  },
  {
   "v": 246,
   "asked": "2026-10-25T16:20:00-05:00",
   "live": "2026-10-25T17:24:43-05:00",
   "dh": 10,
   "tris": 5629992,
   "chars": 1698619,
   "what": "People walk the town's sidewalks, cross at the crosswalks, window-shop and go in and out of the General Store; cars drive into town, keep right, take turns at the four-way stop, wait for you and park at the store or the marina, where the driver walks in and comes back out. Graphics setting Townsfolk sets how many."
  },
  {
   "v": 247,
   "asked": "2026-10-25T17:10:00-05:00",
   "live": "2026-10-25T17:33:04-05:00",
   "dh": 3,
   "tris": 5731501,
   "chars": 1701526,
   "what": "The start card opens on a map of the islands, drawn live with your machines on it; tap Corley's, Dexter's or Jessica's Island and it shows the machines you can take there, with ‹ Map to go back."
  },
  {
   "v": 248,
   "asked": "2026-10-25T17:25:00-05:00",
   "live": "2026-10-25T17:39:43-05:00",
   "dh": 0.75,
   "tris": 5631520,
   "chars": 1702332,
   "what": "The controller stops rumbling: the motors are reset once the last pulse is over or the game loses focus, and dirt trickling off by itself (clay shed from the tracks, a heaped bucket's overflow) no longer buzzes it"
  },
  {
   "v": 249,
   "asked": "2026-10-25T17:45:00-05:00",
   "live": "2026-10-25T18:08:49-05:00",
   "dh": 1.5,
   "tris": 5599961,
   "chars": 1702656,
   "what": "The excavator's bucket is drawn 20% bigger each way, the size of a 20-ton machine's 1 cu yd bucket, so the dirt it shows matches what it holds; a heaped load crowns higher over the rim"
  },
  {
   "v": 250,
   "asked": "2026-10-25T18:21:00-05:00",
   "live": "2026-10-25T18:33:39-05:00",
   "dh": 1,
   "tris": 5627416,
   "chars": 1702859,
   "what": "The Family Island has its own button on the start map: tap it to start there on foot or in the nearest of any machine."
  },
  {
   "v": 251,
   "asked": "2026-10-25T18:33:00-05:00",
   "live": "2026-10-25T18:50:07-05:00",
   "dh": 1.5,
   "tris": 5633851,
   "chars": 1703027,
   "what": "The start map now reaches the lakeside town on the mainland, with its own button to start there; the place labels are smaller and flatter."
  },
  {
   "v": 252,
   "asked": "2026-10-27T19:00:00-05:00",
   "live": "2026-10-27T19:24:58-05:00",
   "dh": 5,
   "tris": 6231714,
   "chars": 1708202,
   "what": "Tall grass gone to seed and leafy bushes fill the rough ground of Corley's mesa, thickest toward the rim; they sway, flatten under tracks, mow down and go when dug. Graphics has a new Wild growth setting."
  },
  {
   "v": 253,
   "asked": "2026-10-27T19:30:00-05:00",
   "live": "2026-10-27T19:43:09-05:00",
   "dh": 3,
   "tris": 6180169,
   "chars": 1709759,
   "what": "The Family Island house, pavilion and flagpole, Jessica's cottage and Dexter's shed and trailer now wear real materials: wood board walls, shingle and cedar-shake roofs, stone bases and chimneys, plank porches, flagstone steps, corrugated steel and concrete, at their real size and darkening in the rain (Medium graphics and up; Low keeps plain colours)."
  },
  {
   "v": 254,
   "asked": "2026-10-27T19:55:00-05:00",
   "live": "2026-10-27T20:15:27-05:00",
   "dh": 2,
   "tris": 6251584,
   "chars": 1710242,
   "what": "The Family Island house is now a cream clapboard farmhouse, Jessica's cottage has real plaster walls and Dexter's office trailer white siding, all from photo-scanned textures with their own relief and sheen (Medium graphics and up)."
  },
  {
   "v": 255,
   "asked": "2026-10-27T20:20:00-05:00",
   "live": "2026-10-27T20:33:14-05:00",
   "dh": 2,
   "tris": 6174749,
   "chars": 1709971,
   "what": "The marina's Harbor House has weathered grey lap siding, the Dockside Grill red board-and-batten, and the pier, its fingers, the gangway and the decks real grey dock planks; the farmhouse has a real shingle roof. All photo-scanned, with their own relief and sheen (Medium graphics and up)."
  },
  {
   "v": 256,
   "asked": "2026-10-27T20:20:00-05:00",
   "live": "2026-10-27T21:26:01-05:00",
   "dh": 12,
   "tris": 6353012,
   "chars": 1711489,
   "what": "The town's traffic is all new detailed cars — sedans, hatchbacks, wagons, SUVs, minivans, pickups and vans with real wheels and tyres, glass you can see the seats through, lamps and mirrors, each in its own glossy colour — and Main Street's shops have brick, plaster and siding walls with the street trees and lamps no longer poking through the awnings."
  },
  {
   "v": 257,
   "asked": "2026-10-27T21:35:00-05:00",
   "live": "2026-10-27T22:19:39-05:00",
   "dh": 16,
   "tris": 6398308,
   "chars": 1742199,
   "what": "Every shop in town now has a glass storefront onto a furnished, lit room — cafés with tables, stores with stocked shelves, salons, offices, the laundromat — with staff working and customers browsing, queueing and sitting inside; the upper windows show rooms that light up at night; the General Store's glass front looks onto its aisles and checkouts; and the new Lakeside Brewing Co. has a taproom of tanks and a bar plus a big lawn beer garden of picnic tables under string lights, with a fire pit, cornhole and a food truck."
  },
  {
   "v": 258,
   "asked": "2026-10-27T22:45:00-05:00",
   "live": "2026-10-27T23:13:46-05:00",
   "dh": 14,
   "tris": 6811405,
   "chars": 1760628,
   "what": "The town now has neighbourhoods: streets of about forty colonials, capes and ranches with porches, glass windows onto lit rooms, driveways with cars in them and more parked at the curb, mailboxes, fences and yard trees — and woods that thicken around the edges so the town fades into the country."
  },
  {
   "v": 259,
   "asked": "2026-10-28T20:25:00-05:00",
   "live": "2026-10-28T21:59:52-05:00",
   "dh": 14,
   "tris": 6885602,
   "chars": 1776791,
   "what": "Walk into every shop, the General Store, the brewery and every house: doors open as you come up, furnished rooms (houses get a living room, kitchen and bedroom), and the camera stays in the room with you."
  },
  {
   "v": 260,
   "asked": "2026-10-28T22:20:00-05:00",
   "live": "2026-10-28T22:10:20-05:00",
   "dh": 0.5,
   "tris": 6889000,
   "chars": 1777689,
   "what": "The island tour test can be stopped: tap its banner and your game comes back (a graphics sweep ends too)."
  },
  {
   "v": 261,
   "asked": "2026-10-29T17:29:00-05:00",
   "live": "2026-10-29T18:21:00-05:00",
   "dh": 5,
   "tris": 7009793,
   "chars": 1769145,
   "what": "Faster loading, and a new start screen: a big map of the islands and town, tap where you want to start. No more machine tiles or test buttons on it (tests are in ☰ Tools)."
  },
  {
   "v": 262,
   "asked": "2026-10-29T18:05:00-05:00",
   "live": "2026-10-29T18:23:43-05:00",
   "dh": 3,
   "tris": 6904852,
   "chars": 1778162,
   "what": "Townsfolk page: every pedestrian in 3D against a height chart, switch characters out of town (published live), photo prompts to rebuild them photoreal"
  },
  {
   "v": 263,
   "asked": "2026-10-29T19:15:00-05:00",
   "live": "2026-10-29T19:19:22-05:00",
   "dh": 0.25,
   "tris": 6893246,
   "chars": 1769800,
   "what": "Floating bucket and lawn percentage gauges switched off for now"
  },
  {
   "v": 264,
   "asked": "2026-10-29T19:02:00-05:00",
   "live": "2026-10-29T19:38:04-05:00",
   "dh": 2,
   "tris": 5523752,
   "chars": 1772338,
   "what": "The start map shows the moment the game opens (a finished picture, no blank patches), and a tap counts straight away: you start there as soon as the world has loaded."
  },
  {
   "v": 265,
   "asked": "2026-10-29T18:35:00-05:00",
   "live": "2026-10-29T19:47:27-05:00",
   "dh": 14,
   "tris": 5518819,
   "chars": 1773293,
   "what": "Townsfolk rebuilt as real people: 32 MakeHuman characters with their own bodies, skins, hair and clothes, walking about their own joints"
  },
  {
   "v": 266,
   "asked": "2026-10-29T19:15:00-05:00",
   "live": "2026-10-29T20:01:03-05:00",
   "dh": 10,
   "tris": 5516374,
   "chars": 1786559,
   "what": "The map editor lays paved streets with curbs, sidewalks and a centre line (New street, or Paved on a road's card), lines them with street lights, lamp posts, trees, benches, hydrants or planters at any spacing, and places things and roads anywhere, the mainland's town included; every street and thing stays editable."
  },
  {
   "v": 267,
   "asked": "2026-10-29T20:05:00-05:00",
   "live": "2026-10-29T21:43:26-05:00",
   "dh": 10,
   "tris": 5517152,
   "chars": 1794156,
   "what": "Three times the people and cars in town; every car has a driver at the wheel who gets out when it parks; cars pass through, loop the neighbourhoods and stop for people at four new mid-block crosswalks"
  },
  {
   "v": 268,
   "asked": "2026-10-29T22:05:00-05:00",
   "live": "2026-10-29T22:25:59-05:00",
   "dh": 5,
   "tris": 5524008,
   "chars": 1794364,
   "what": "The town's sedans, hatchbacks, wagons, SUVs and vans are now detailed photo-textured models (free CC-BY cars), still in every paint colour with turning wheels"
  },
  {
   "v": 269,
   "asked": "2026-10-29T20:40:00-05:00",
   "live": "2026-10-29T23:04:10-05:00",
   "dh": 6,
   "tris": 5525963,
   "chars": 1797564,
   "what": "On High and Ultra graphics the townsfolk are the same 32 people rebuilt in Human Forge with a real skeleton and animation: they walk with a true stride at their own pace, stand easy or talk with their hands at counters, sit properly in chairs and benches and hold the wheel when driving; Low and Medium keep the light ones for phones."
  },
  {
   "v": 270,
   "asked": "2026-10-30T17:50:00-05:00",
   "live": "2026-10-30T18:21:04-05:00",
   "dh": 0.5,
   "tris": 5524949,
   "chars": 1797564,
   "what": "Townsfolk (High and Ultra) run on Human Forge's newer people runtime (1.1): same people and animations, clearer load errors."
  },
  {
   "v": 271,
   "asked": "2026-10-30T17:45:00-05:00",
   "live": "2026-10-30T19:17:02-05:00",
   "dh": 18,
   "tris": 5817513,
   "chars": 1838868,
   "what": "Harbor Square, the town's new centre on the waterfront at the foot of Main Street: a seawall promenade with steps down to the beach, café tables and a flagpole, and a town green with a fountain, a bandstand with a band under festoon lights, market stalls, shade trees and the brick Town Hall, whose clock keeps the game's time. Behind the town the ground climbs into wooded foothills: Overlook Road switchbacks up and the Lookout Trail climbs the face to the Lakeside Overlook, 160 ft above town, looking back over the town and the islands. The map has no more straight edges: the town's shore runs on into the mountains, and the field and woods end in beaches."
  },
  {
   "v": 272,
   "asked": "2026-10-30T19:15:00-05:00",
   "live": "2026-10-30T19:33:00-05:00",
   "dh": 1,
   "tris": 5821684,
   "chars": 1840215,
   "what": "The start map: tap once to zoom in twice as close round that spot, tap again to start there on foot; Whole map backs out."
  },
  {
   "v": 273,
   "asked": "2026-10-30T19:45:00-05:00",
   "live": "2026-10-30T19:43:29-05:00",
   "dh": 0.5,
   "tris": 5818587,
   "chars": 1840367,
   "what": "You can walk onto the foothills and Overlook Road now (on foot you were stopped at the back of town), and the start map shows them, with Harbor Square and the Foothills named."
  },
  {
   "v": 274,
   "asked": "2026-10-31T19:40:00-05:00",
   "live": "2026-10-30T19:47:55-05:00",
   "dh": 0.25,
   "tris": 5821761,
   "chars": 1840368,
   "what": "Auto weather rains far less: showers every 15 to 35 minutes instead of 5 to 12, a bit shorter, and the first one waits 15 minutes"
  },
  {
   "v": 275,
   "asked": "2026-10-30T19:55:00-05:00",
   "live": "2026-10-30T20:19:38-05:00",
   "dh": 6,
   "tris": 5803878,
   "chars": 1853134,
   "what": "A pistol in the worker's hand on foot: Fire (G, the Fire button or a click) shoots the townsfolk, who drop or run"
  }
 ]
};
