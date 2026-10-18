// Corley's Island build-time tracking, read as data by build.html and the master dashboard. Add a version entry when one ships.
window.EFFORT = {
 "project": "Corley's Island",
 "updated": "2026-10-18T01:03:05Z",
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
   "dh": 621,
   "act": 12.5,
   "versions": 84
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
  }
 ]
};
