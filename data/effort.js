// Backhoe Dig build-time tracking, read as data by build.html and the master dashboard. Add a version entry when one ships.
window.EFFORT = {
 "project": "Backhoe Dig",
 "updated": "2026-10-17T15:19:00Z",
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
   "dh": 301.5,
   "act": 6.0,
   "versions": 41
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
  }
 ]
};
