# Corley's Island idea board

Ids match the idea board artifact (https://claude.ai/artifact/FMrDEa4VsKvPS5Z3ktTrS3). Source: docs/idea-board.html (publish it as the
artifact page with capabilities {mcp: Claude Code Remote send_message}). When the owner sends picks, find them here. None are started
unless the board's `DONE` says so; when one ships, add it to `DONE` (d, n, part, pc) and republish.

Scoring (same rubric as Cruise Brandon's, set for a dig site): realism 1-10 = how much more like a real job site it feels;
fun 1-10; seen every / most / some / rare (1, .85, .65, .45); phone none / low / high (1, .92, .75) = risk to 30 FPS on the
owner's phone; cost 1 = one session, 2 = two or three, 3 = four or more. Priority = round(100 x ((w x R + (1-w) x F)/10) x seen x
phone), w = 0.5 by default. Columns below: R, F, seen, phone, cost, hour guess, needs.

## J: Jobs and work orders

- J01 Work orders: A job card each session (dig to a line and depth, lay pipe, backfill), with pay and a finish check. (R4 F8 every none c2 6h)
- J02 Locate paint and flags: 811 marks sprayed on the grass before a dig: yellow gas, red power, blue water, orange phone, green sewer, with the 18 in tolerance zone either side. (R9 F5 most none c1 3h)
- J03 Pothole by hand: Inside the tolerance zone, hop out in Walk mode and dig with a shovel or a vacuum truck to find the line before the bucket goes in. (R8 F6 some low c2 6h needs J02)
- J04 Lay pipe: Lower sticks of PVC or ductile iron pipe into the trench from the bucket on a chain and push the joints home. (R7 F7 some low c2 8h)
- J05 Backfill and compact: Push the spoil back in lifts and tamp each one; a density check passes or fails the backfill. (R7 F6 some none c2 6h)
- J06 Grade to a laser: A rotating laser on a tripod, a grade rod, and a cut or fill readout in the cab to dig a trench floor flat to the inch. (R8 F6 most none c2 5h)
- J07 Cabin footings: Dig footings to a string line, set forms and pour concrete from a mixer truck. (R6 F7 rare low c3 12h needs J06)
- J08 Septic system: Dig the tank hole and drain-field trenches on a slope. (R6 F5 rare low c2 7h)
- J09 Dig a pond: Dig a farm pond that fills from rain and groundwater over a few minutes. (R6 F8 some low c2 6h)
- J10 Stumps and boulders: Rip stumps out root ball and all, roll and carry boulders off the site. (R7 F7 most low c2 6h)
- J11 Clear a lot: Push over small trees, pile the brush and light a burn pile. (R6 F7 some low c2 7h)
- J12 Dig a basement: A big square hole with benched walls and a ramp to drive out. (R6 F6 rare none c2 5h)
- J13 Culvert under the rim road: Cut the road, set a culvert pipe on bedding, backfill and drive over it. (R7 F6 some low c2 6h needs J04)
- J14 Inspector visit: An inspector walks the trench, checks the slope and the trench box, and signs off or shuts you down. (R7 F5 some low c2 5h)
- J15 Pay and the day's log: Yards moved, fuel burned, hours on the meter and what the day paid. (R4 F6 every none c1 3h)
- J16 Scale tickets: A truck scale on the Lower Bench: weigh in empty and out loaded, and get a printed ticket for every load hauled. (R8 F5 most none c1 3h)
- J17 Fill for Dexter's yard: Haul spoil across the haul bridge to fill a low spot in Dexter's yard; he pays by the load and checks the grade. (R6 F7 some low c2 5h)
- J18 Second ramp down the scarp: Cut and grade a new ramp down the scarp, steep enough to save time but gentle enough for a loaded truck to climb. (R7 F6 some none c2 5h)
- J19 Drainage swale: Cut a shallow ditch so rain runs off the dig instead of pooling; the puddles drain along it into the lake. (R8 F6 most low c2 5h needs W01)
- J20 Block retaining wall: Stack blocks into a wall at the scarp edge and backfill behind it; a check says whether it holds or leans. (R6 F7 some low c2 6h)

## M: New machines

- M01 Backhoe loader: A CAT 420-class backhoe with a loader bucket up front, outriggers and a swivel seat for the hoe. (R7 F9 every low c3 14h)
- M02 Skid steer: Bucket and pallet forks; spins in place, lifts blocks and pipe. (R7 F8 most low c2 8h)
- M03 Wheel loader: Loads the dump truck from a stockpile in two scoops. (R6 F7 some low c2 8h)
- M04 Mini excavator: A 3-ton machine for tight spots next to the gas main. (R7 F7 some low c2 6h)
- M05 Bulldozer: Blade and ripper; push spoil off the cliff and level the Lower Bench. (R7 F8 some low c3 10h)
- M06 Motor grader: Keeps the rim road crowned and the ruts filled. (R6 F6 some low c3 10h)
- M07 Roller and plate compactor: Smooth-drum roller for the road and a walk-behind plate tamper for the trench. (R6 F5 some low c2 6h needs J05)
- M08 Pickup and lowboy trailer: Haul the mini excavator on a trailer, chain it down and unload at the site. (R7 F7 most low c3 10h needs M04)
- M09 Water truck: Sprays the road to keep the dust down. (R7 F5 some low c2 6h)
- M10 Fuel and refuelling: Machines burn diesel; fill up from a fuel tank or the fuel truck. (R7 F5 most none c2 5h)
- M11 Articulated hauler: A 6-wheel-drive dump that climbs the scarp ramp loaded. (R6 F7 some low c2 8h)
- M12 Concrete mixer truck: A drum that turns and a chute you swing. (R6 F6 rare low c2 8h needs J07)
- M13 Crane truck: Sets pipe, the trench box and blocks from up high. (R5 F6 rare low c3 12h)
- M14 Side-by-side: A UTV to zip around the island on foot's behalf. (R5 F8 most low c2 6h)
- M15 Boat on the lake: A johnboat at a dock below the cliffs. (R4 F8 some low c2 8h)
- M16 Wear and breakdowns: Broken teeth, a blown hose spraying oil, a flat on the truck; fix it or call the shop. (R6 F6 some none c2 6h)
- M17 Skid steer grapple and sweeper: A grapple for logs and brush and an angle broom that sweeps dirt off the roads, on a rack in Dexter's shed. (R7 F7 most low c2 6h needs M02)
- M18 Telehandler: A reach forklift that lifts pallets of blocks onto stacks and roofs, with the boom angle and load shown in the cab. (R6 F7 some low c2 8h)
- M19 Tractor with a box blade: A small tractor that drags a box blade to smooth ruts and level the dirt yards and roads. (R7 F6 most low c2 7h)
- M20 Dump cart for the mower: A small cart hitched behind the zero-turn to carry clippings, mulch or a little dirt, and tip it out. (R5 F6 some low c1 4h)
- M21 Drivable boats: A runabout, a pontoon and a small fishing boat you drive on the lake; the waves rock them, and you tie up at a dock and step off. (R6 F9 most low c3 10h)

## X: Excavator and attachments

- X01 Quick coupler: Swap the bucket for other tools from a rack at the site. (R7 F8 most low c3 10h)
- X02 Hydraulic thumb: Grab logs, boulders and pipe. (R7 F8 most low c2 6h needs X01)
- X03 Hydraulic hammer: Break the rock layer, with chips, dust and the loud chatter. (R7 F8 some low c2 6h needs X01)
- X04 Ditching bucket: A wide smooth-lip bucket for slopes and finish grade. (R6 F5 some none c1 3h needs X01)
- X05 Auger: Drill post holes for a fence around the site. (R5 F6 rare low c2 5h needs X01)
- X06 Work lights and beacon: Lights on the boom and cab, an amber beacon on top. (R7 F6 some low c1 3h needs W02)
- X07 Cab monitor: Bucket depth and slope readout, rear camera view. (R7 F5 every none c1 3h)
- X08 Control pattern switch: ISO or SAE (John Deere) pattern, like the selector valve on a real machine. (R6 F4 every none c1 2h)
- X09 Lift mode and overload: A lift chart and a warning when a block or pipe is too heavy at that reach. (R7 F5 some none c1 3h)
- X10 Horn and travel alarm: A horn, a travel alarm and a swing lock. (R5 F4 most none c1 2h)
- X11 Mud-packed tracks: Clay packs into the undercarriage and drops off in clumps. (R6 F4 most low c1 3h)
- X12 Tiltrotator: A bucket that tilts and turns on the stick, for sloped trench walls and tidy corners. (R6 F7 some none c2 5h needs X01)
- X13 Dig-to guide: A string line and a see-through target in the trench; dug ground turns green when it is on grade and red when you go too deep. (R6 F7 every none c1 3h)
- X14 Tipping over: Lift a heavy block far out to the side and the excavator rocks up onto its tracks' edge; too much and it tips. (R8 F7 some none c2 4h)

## D: Dirt and digging

- D01 Sticky clay: Wet red clay sticks in the bucket; shake it out with the curl. (R7 F6 most none c1 3h)
- D02 Mud you get stuck in: After rain the tracks sink and the truck spins; push it out with the bucket. (R7 F8 some low c2 6h needs W01)
- D03 Buried boulders: Rocks you uncover and have to pry out or break. (R7 F7 most low c2 5h)
- D04 Buried finds: Old bottles, a horseshoe, an arrowhead, a time capsule; collect them in a case in the trailer. (R3 F8 some low c1 4h)
- D05 Topsoil stockpile: Strip topsoil to its own pile and spread it back last. (R7 F4 some none c1 3h)
- D06 Better pile slopes: Each soil settles to its own angle, wet or dry, as piles grow. (R7 F5 every none c2 5h)
- D07 Dirt tracked onto the road: Clods drop off the tyres onto the rim road after leaving the dig. (R6 F4 every low c1 3h)
- D08 Bucket angle matters: Teeth pointed in fill fast; dragging flat skims. (R7 F6 every none c1 3h)
- D09 Roots in the cut: Tree roots in the trench wall near the trees that the bucket snaps. (R7 F5 most low c1 4h)
- D10 Frozen ground: A hard crust in winter that needs ripping. (R5 F4 rare none c1 3h needs W04)
- D11 Deeper dig zone: Dig past the rock into a deeper layer, with a bigger dig grid. (R3 F6 some high c2 6h)
- D12 Fill that settles: Fresh spoil is soft and ruts deep; over a few minutes piles settle and firm up, and driven-over fill packs hard. (R7 F4 every none c1 3h)
- D13 Erosion: Rain carves little gullies down spoil piles and washes silt into the puddles and the trench. (R8 F6 some low c2 6h needs W01)
- D14 Dig anywhere: Pick a spot on the site map and the dig grid moves there, so any part of the mesa can be dug, not only the trench area. (R4 F9 most high c3 12h)

## U: Buried utilities

- U01 More buried lines: A water main, a power conduit, fibre and a sewer, each with its own depth and strike. (R7 F7 most low c2 6h needs J02)
- U02 Gas leak after a strike: A hissing plume, everyone back off, call it in and wait for the gas company. (R7 F7 some low c1 4h)
- U03 Water main break: A geyser that floods the trench until you shut the valve. (R6 F9 some low c2 5h needs U01)
- U04 Power line strike: Sparks, a bang and the work lights go out. (R6 F7 rare low c1 4h needs U01)
- U05 Repair a break: Clamp or replace the section you broke; a crew truck shows up. (R7 F6 some low c2 6h)
- U06 Overhead power lines: Poles across the site; the boom must stay 10 ft clear or it beeps. (R8 F5 most low c1 4h)
- U07 Locator wand: Walk the site with a pipe locator that beeps over buried lines. (R7 F6 some none c1 4h)
- U08 Abandoned lines: Old clay tile and rusty pipe nobody marked. (R6 F5 some low c1 3h)
- U09 Gas service to the house: A branch off the gas main runs to the family house; dig the service line and set the meter. (R7 F6 rare low c2 5h)

## W: Weather and time of day

- W01 Rain: Showers that wet the ground, fill the trench and run the cab wipers. (R8 F6 some low c2 6h)
- W02 Day and night: The sun sets over the lake, stars come out, the site goes dark. (R8 F7 every low c2 6h)
- W03 Wind gusts: Dust blows off the piles, grass and trees sway harder. (R6 F4 most none c1 3h)
- W04 Seasons: Fall colour on the broadleaf trees, snow on the mesa in winter. (R6 F6 some high c3 10h)
- W05 Thunderstorm: Lightning stops work; get off the machine and wait it out. (R6 F7 rare low c2 5h needs W01)
- W06 Morning fog: Fog lying on the lake that burns off. (R7 F4 some low c1 3h)
- W07 Hot afternoons: Heat shimmer and the engine temperature climbing on long digs. (R5 F3 some none c1 2h)
- W08 Rainbow after a shower: When the sun comes back after rain, a rainbow arches over the lake. (R6 F5 some none c1 1h needs W01)
- W09 Raindrops on puddles: Rings spread across the puddles while it rains, and the water goes still when it stops. (R8 F4 some low c1 2h needs W01)

## S: Site and scenery

- S01 Job trailer and site stuff: An office trailer, porta-john, fuel tank, pipe rack and job sign. (R8 F4 every low c1 4h)
- S02 Cones and barricades: Cones, barricades and caution tape you can knock over or move. (R7 F5 every low c1 3h)
- S03 Quarry pit: A deep benched rock pit to dig in, from the mesa layout plans. (R6 F7 some low c3 10h)
- S04 Light towers: Diesel light towers for night work. (R7 F5 some low c1 3h needs W02)
- S05 Dock and boat ramp: A dock and a gravel ramp down to the lake. (R6 F5 some low c1 4h)
- S06 Cliff dump pile: The spoil you tip over the edge builds a real pile at the bottom. (R6 F6 most low c1 4h)
- S07 Waterfall and creek: A creek down the scarp into the lake. (R6 F5 every low c2 5h)
- S08 Lights across the lake: Houses on the far shore whose windows light up at night. (R5 F2 every low c1 3h)
- S09 Wildlife: Deer at the treeline, geese on the lake, an eagle over the cliffs. (R6 F4 most low c2 5h)
- S10 Wildflowers and weeds: Clover, dandelions and taller weeds around the site edges. (R6 F3 every high c1 3h)
- S11 Cabin on Lookout Knoll: A cabin that goes up stage by stage as you finish jobs. (R5 F7 every low c3 10h needs J07)
- S12 Dirt jumps: Build dirt ramps and launch the side-by-side or the truck off them. (R3 F8 some low c2 5h)
- S13 Road signs: Signs at the roundabout and bridge ends pointing to Corley's, Dexter's and Jessica's islands and the mainland. (R7 F3 every none c1 2h)
- S14 Bridge lights: Lamps along the three bridges and the covered footbridge that come on at dusk. (R6 F4 every low c1 2h needs W02)
- S15 Windsock and flags: A windsock on the Lower Bench and the flags that stream with the wind gusts, so you can see where the wind is. (R7 F3 every none c1 1h)
- S16 Beaches: Sandy beaches at the foot of the island cliffs that slope gently into the water, with driftwood and a few rocks. (R7 F6 most low c2 6h)
- S17 Docks and cliff stairs: A dock on each island with a stair or lift down the cliff, so you can walk down and tie up a boat. (R7 F6 most low c2 6h)
- S18 Marina: A marina with a breakwater, floating slips, a fuel dock, a bait shop and boats bobbing at their moorings. (R7 F7 some low c2 8h)
- S19 Boats on the lake: Sailboats and fishing boats out on the water, motoring between the marina, the islands and the city. (R7 F4 every low c2 5h)

## L: Crew and people

- L01 Spotter: A ground man who waves the truck back and holds up a fist to stop. (R8 F5 most low c2 6h)
- L02 Crew in the trench: Laborers with shovels and a grade checker with a rod. (R8 F5 most high c2 8h)
- L03 Foreman on the radio: Calls out the next task, praises a clean cut and yells after a strike. (R5 F6 every none c1 4h)
- L04 AI truck driver: A dump truck that pulls up to load, honks when full and hauls it off. (R7 F7 most low c2 6h)
- L05 Lunch break: The crew on the tailgate at noon. (R6 F3 some low c1 3h)
- L06 Two players: One on the excavator, one driving the truck, online. (R5 F9 some low c3 14h)
- L07 Dexter in his yard: Dexter walks his yard, waves as you drive by and asks you to move a pile or park his skid steer back. (R5 F7 most low c2 6h)
- L08 Jessica at home: Jessica reads by the fire in her library or tends her herb garden, and chats when you walk up. (R4 F6 some low c2 5h)

## A: Sound

- A01 Cab radio: A country station and the weather, louder with the door shut. (R5 F6 every none c1 3h)
- A02 Lake and wind sounds: Waves, wind over the cliff, birds and frogs at dusk. (R7 F4 every none c1 2h)
- A03 Track squeal: Idler clatter and squealing tracks as speed picks up. (R6 F3 every none c1 2h)
- A04 Attachment sounds: Hammer chatter, coupler clunks, the thumb clamping. (R7 F5 some none c1 2h needs X01)
- A05 Footsteps by surface: Boots crunch on gravel, swish in grass, squelch in mud and knock on the bridge decks. (R8 F5 every none c1 2h)
- A06 Bridge deck rumble: Machines thunder across the steel truss decks, and the covered footbridge creaks under your boots. (R8 F5 most none c1 2h)
- A07 Rain on the roof: Rain drums on the cab roof inside the machines and on the porch roofs, softer out in the open. (R8 F4 some none c1 1h needs W01)
- A08 Boat sounds: An outboard that revs with the throttle, waves slapping the hull, and gulls round the marina. (R7 F4 most none c1 2h needs M21)

## C: Controls and camera

- C01 Free camera: Orbit, pinch to zoom and look from anywhere. (R5 F6 every none c1 3h)
- C02 Photo mode: Hide the HUD, pick an angle and save a picture. (R2 F6 some none c1 3h)
- C03 Replay: Watch the last minute again from any angle. (R2 F6 some none c2 6h)
- C04 Phone buzz: Vibration for strikes, cave-ins and bucket hits. (R5 F5 every none c1 2h)
- C05 Tilt to steer: Steer the truck by tilting the phone. (R2 F5 most none c1 2h)
- C06 Swap the sticks: Mirror the stick layout for left-handed play. (R1 F3 every none c1 1h)
- C07 First-dig tutorial: A guided first trench with arrows and tips. (R2 F5 rare none c1 4h)
- C08 Fold the bars away: One tap folds the top, left and bottom bars away for a clear view; a tap at the edge brings them back. (R2 F5 every none c1 2h)
- C09 Choose what the bars show: Pick which gauges sit in the top bar and which buttons go on the left rail or the bottom bar, saved per device. (R1 F5 every none c2 5h)
- C10 Machine buttons in the bottom bar: Each machine's own actions as big buttons in the bottom bar: Bed up in the truck, Blades on in the mower, Hook box in the excavator. (R3 F6 every none c1 3h)
- C11 Compass and position: A compass heading in the top bar and where you are in feet from the site stake. (R5 F3 every none c1 1h)
- C12 Minimap zoom and turn: Pinch the minimap to zoom, and pick north-up or heading-up. (R4 F5 every none c1 2h)
- C13 Map pins: Drop a pin on the big map and an arrow in the top bar points you to it with the distance in feet. (R3 F5 most none c1 3h)
- C14 Menus by controller: Move through the menu, panels and the map editor with the controller's D-pad and buttons. (R1 F4 some none c1 3h)

## Q: Graphics and phone speed

- Q01 Exhaust smoke: Black puffs from the stacks when the engine loads up. (R8 F4 every low c1 2h)
- Q02 Tread and track prints: Track and tyre marks in the dirt and flattened grass. (R8 F4 every low c1 3h)
- Q03 Drifting dust: Dust clouds that drift with the wind and settle. (R7 F4 most low c1 3h needs W03)
- Q04 Dirt that builds up: Machines get muddier as you work and wash clean in rain or at a wash spot. (R6 F5 every low c1 3h)
- Q05 Sparks on rock: Teeth scraping rock throw sparks. (R7 F5 some low c1 2h needs D03)
- Q06 Lake reflections: The cliffs and sky mirrored in calm water. (R7 F3 every high c2 5h)
- Q07 Ambient occlusion: Soft dark creases in the trench and under the machines. (R7 F2 every high c2 5h)
- Q08 Exhaust heat haze: Wavy air above the stacks. (R6 F2 every low c1 2h)
- Q09 Phone 60 FPS mode: A lighter preset that holds 60 on the phone. (R2 F4 every none c1 3h)
- Q10 Blob shadows on Low: A soft dark patch under each machine and the worker when shadows are off, so they sit on the ground on a phone. (R6 F2 every none c1 2h)
- Q11 Foam at the shore: White foam where the lake meets the cliff foot and around the bridge piers. (R7 F3 every low c1 2h)
- Q12 Simpler far islands: Islands far away draw with fewer triangles and no small props, to win frames back on the phone. (R2 F3 every none c2 5h)
- Q13 Realistic lake water: Turquoise over the sand in the shallows, deep blue farther out, foam along the shore, sky reflections that change with the angle you look from, and calmer swells near land; still flat-shaded. (R8 F5 every low c2 5h needs S16)
- Q14 Wakes and spray: A boat throws a V wake that spreads and fades, and spray off the bow at speed. (R8 F5 most low c1 3h needs M21)

## E: Map editor

- E01 Bury utilities in the editor: Draw where lines run and how deep. (R5 F6 rare none c1 4h needs U01)
- E02 Paint soil layers: Set the clay, sand and rock depths per spot. (R5 F4 rare none c1 4h)
- E03 Place site props: Cones, trailers, pipe stacks and signs. (R4 F5 rare none c1 3h needs S02)
- E04 Ponds and creeks: Add water in the editor. (R5 F5 rare low c2 5h)
- E05 Share maps by link: Open a friend's map from a link, and a gallery of maps. (R2 F6 rare none c2 6h)
- E06 Blocks in the editor: Lay out block builds from overhead in the map editor, with copy, paste and turn. (R3 F6 some none c1 4h)
- E07 Edit the other islands: Sculpt, paint and place on the Family, Dexter's and Jessica's islands too, not only Corley's. (R3 F7 some none c3 10h)
- E08 Named maps: Keep several maps on the device under names and switch between them. (R2 F5 some none c1 3h)

## Y: Gameplay and challenges

- Y01 Badges: First strike-free trench, 100 yards hauled, a clean cave-in-free week. (R1 F6 every none c1 3h)
- Y02 Timed challenges: Load 10 yards in 3 minutes, dig to grade in 5. (R2 F8 some none c1 4h)
- Y03 Operator skill games: Knock a ball off a cone, ring toss with the teeth, pick up an egg without breaking it. (R2 F8 some low c1 4h)
- Y04 Career: Earn job pay, buy and upgrade machines. (R2 F8 every none c3 10h needs J01 J15)
- Y05 Safety score: Cave-ins, strikes and near misses dock points; a clean day earns them. (R6 F5 every none c1 3h)
- Y06 Leaderboards: Best times on the challenges, online. (R1 F5 some none c2 5h needs Y02)
- Y07 Daily dig: A new site layout and job every day. (R3 F7 most none c2 6h)
- Y08 Kids mode: No strikes or cave-ins, giant toy blocks. (R1 F5 rare none c1 2h)
- Y09 Build to a blueprint: A see-through blueprint (a doghouse, a wall with a gate, a staircase) to fill with blocks, scored on how closely it matches. (R2 F8 some low c2 5h)
- Y10 Share block builds: Copy a block build as text and load it on another device or another spot. (R1 F6 some none c1 3h)
- Y11 Parkour course: A block obstacle course on foot on Dexter's Island, timed from start to finish line. (R1 F7 some none c1 3h)
- Y12 Landmark hunt: Find hidden landmarks across the islands (the cliff bench, the crane, the flagpole) and tick them off. (R2 F6 some none c1 3h)

## H: Cozy home life

- H01 Your cabin on the island: A small home by the lake: porch, kitchen, bed, a woodstove; the place every day starts and ends. (R6 F7 every low c3 10h)
- H02 Morning coffee on the porch: Wake up, sip coffee as the sun comes up over the lake, and look over the day's jobs. (R6 F6 every low c1 4h needs H01)
- H03 Sleep to end the day: Turn in at night; the game saves and the next morning starts fresh. (R5 F5 every none c1 3h needs H01)
- H04 Vegetable garden: Plant tomatoes, okra and peppers, water them, and pick them when they ripen over the days. (R6 F7 most low c2 6h)
- H05 A dog: Rides in the truck with its head out the window, follows you on foot and naps in the shade. (R6 F8 every low c2 6h)
- H06 Chickens: A coop and a run; eggs to collect each morning. (R5 F6 most low c2 5h)
- H07 Porch swing and fire pit: Sit and watch the lake: a rocking chair, a swing and a fire pit at night. (R6 F5 most low c1 3h)
- H08 Fishing off the dock: Cast for bass and bream at dawn and dusk. (R6 F7 some low c2 6h)
- H09 Furnish the cabin: Buy and place furniture, rugs and pictures with what you earn. (R3 F6 some low c2 7h needs H01)
- H10 Barn and workshop: Park and wash the machines, tools on the wall, a radio on the bench. (R7 F5 most low c2 6h)
- H11 Simple cooking: Breakfast from your eggs, supper from the garden. (R4 F5 most none c2 5h needs H04)
- H12 Holidays at home: Pumpkins on the porch in fall, lights on the cabin at Christmas. (R5 F5 rare low c1 4h needs H01)
- H13 Home projects with your machines: Dig your own pond, cut a driveway, terrace a garden with the excavator. (R5 F8 most low c2 6h)
- H14 Chess and checkers table: A low-poly picnic table with a board on it. Sit down and the island saves and switches to Mesa Chess or Checkers at full quality, straight onto the board (the chess page preloads as you walk up); Get out brings you back standing beside the table. On the claude.ai version it opens in a new tab. (R4 F7 some none c1 6h)
- H15 Sit down anywhere: Sit on the porch rockers, the cliff bench or the library window seat; the camera settles and the world carries on. (R5 F5 most none c1 3h)
- H16 Tips from the library: Pull a book off Jessica's shelves to read operating tips and the islands' story. (R3 F4 rare none c1 2h)

## K: Yard work

- K01 String trimmer: Weed-eat along fences, trees, rocks and edges the mower can't reach; the line wears down and you bump it out. (R8 F7 every low c2 6h)
- K02 Edger: Crisp edges along the drive and walk. (R7 F5 most low c1 3h)
- K03 Leaf blower: Blow clippings off the drive and porch, and leaves in fall. (R7 F6 most low c1 4h)
- K04 More mowers: A push mower and a riding mower, with the zero-turn as the upgrade. (R6 F6 most low c2 6h)
- K05 Hedge trimmer: Shrubs that grow shaggy and get shaped back. (R6 F5 some low c1 4h)
- K06 Mulch beds: Haul mulch in the truck and spread it by wheelbarrow. (R6 F5 some low c2 5h)
- K07 Pressure washer: Wash the porch, the drive and muddy machines clean in stripes. (R6 F8 some low c2 5h)
- K08 Weeds that come back: Grass along fences and in cracks grows back a little each day. (R7 F4 every low c1 4h needs K01)
- K09 Mower upkeep: Gas, oil and blade sharpening; dull blades leave a ragged cut. (R7 F4 most none c1 3h)
- K10 Lawn health: Brown patches, fertilizer and a sprinkler; the grass greens up over days. (R6 F4 most low c2 5h)
- K11 Lawn care business: Mow customers' yards in town on a weekly route for pay. (R5 F7 most low c3 10h needs T01)
- K12 Bagger and compost pile: Catch clippings and dump them on a compost pile. (R6 F4 some low c1 3h)
- K13 Family Island lawn: Grass around the family house that grows long and needs the zero-turn, with its own lawn timer. (R7 F7 most low c1 4h)

## B: The bridge and the drive

- B01 The long bridge: A two-lane bridge about a mile long across the lake to the mainland, with rails, lights and joints that thump under the tyres. (R7 F8 every low c3 10h)
- B02 Pickup truck: Your daily driver for town trips, with a bed for mulch, tools and groceries. (R7 F8 every low c2 8h)
- B03 Towing a trailer: Hitch the mower or a machine to a trailer and haul it to a job. (R7 F7 most low c2 7h needs B02)
- B04 The mountain road: Switchbacks climbing from the bridge to the city in the mountains, with overlooks. (R7 F7 most high c3 12h needs B01)
- B05 Traffic on the road: A few cars, a school bus and logging trucks on the bridge and road. (R7 F5 most low c2 6h needs B01)
- B06 The view on the drive: Look back at the island from the bridge while the mountains grow ahead. (R7 F6 every high c2 6h needs B01)
- B07 Swing span: A section of the bridge that swings open for sailboats while you wait. (R5 F6 some low c2 5h needs B01)
- B08 Skip the drive: Fast travel to town once you've driven it. (R1 F4 most none c1 2h needs T01)
- B09 Bridge repair job: Rebuild a washed-out bridge approach with your machines. (R6 F6 rare low c2 6h needs B01)
- B10 The crane builds the bridge: The crane past the barrier swings girders into place, and the mainland bridge grows a span at a time. (R6 F6 every low c2 6h needs B01)

## T: The mountain town

- T01 The city in the mountains: A small town at the end of the road: a main street and a few blocks to drive. (R7 F8 every high c3 14h needs B01)
- T02 Hardware store: Buy trimmer line, gas, seed and tools. (R6 F5 most low c2 5h needs T01)
- T03 Diner: Breakfast or lunch with the regulars at the counter. (R6 F5 most low c2 5h needs T01)
- T04 Equipment dealer and rental yard: Rent a dozer for a big job or buy a new machine. (R6 F7 some low c2 6h needs T01)
- T05 Gas station: Fill the pickup and the gas cans. (R7 F4 most low c1 4h needs T01)
- T06 Customers who hire you: Folks in town who need a ditch, a driveway or a pond dug. (R6 F8 most low c3 10h needs T01 J01)
- T07 Neighbors: People you get to know by name who wave and ask small favors. (R6 F6 most low c2 7h)
- T08 Saturday market: Sell your vegetables and eggs. (R5 F6 some low c2 6h needs H04 T01)
- T09 Feed and landscape store: Feed, fertilizer, and mulch by the yard loaded into your truck by a loader. (R6 F5 some low c2 5h needs T01)
- T10 Town lights at night: The city glowing in the mountains across the lake. (R6 F3 every low c1 2h)
- T11 Town works jobs: A water line dug on Main Street, a sidewalk to tear out. (R7 F7 some low c3 10h needs T01)
- T12 Harbor city: A bigger city on the mainland shore: streets of shops and houses, a waterfront promenade, a public beach and its own marina, reached by the bridge or by boat. (R6 F8 most high c3 14h needs B01)
- T13 City skyline: Downtown towers across the lake, seen from the islands and lit at dusk, ahead of building the city itself. (R6 F4 every low c1 4h)

## R: Days and routine

- R01 Days and the chore list: Days pass, weekdays and weekends, with today's chores on a note on the fridge. (R5 F6 every none c1 4h)
- R02 Money: Earn from jobs, spend on fuel, seed and upgrades. (R4 F6 every none c1 4h)
- R03 Weather forecast: The radio forecast shapes the day: rain means a shop day. (R6 F5 every none c1 3h needs W01)
- R04 Phone texts: Customers and neighbors text you jobs and favors. (R5 F6 every none c1 4h)
- R05 Relaxed mode: No timers and no failing, just the chores. (R2 F6 every none c1 2h)
- R06 Chores by season: Mowing in summer, leaves in fall, plowing snow in winter. (R6 F7 most low c2 6h needs W04)
- R07 Snow plowing: Clear the road and the bridge with a loader in winter. (R6 F7 rare low c2 5h needs W04)
- R08 End-of-day summary: What you did, what you earned, the lawn and the yards dug. (R3 F5 every none c1 2h)
- R09 While you were away: Coming back shows what changed: the grass grew, the mud dried, the puddles soaked away. (R3 F5 every none c1 2h)

## I: Islands and the family

- I01 The island chain: Several small islands across the lake, each its own place to work and live, with the dig mesa as one of them. Only the island you are on is drawn in full; the others are low-poly shapes on the water. (R5 F8 every low c3 14h)
- I02 Family Island in the middle: A central island where the whole family lives: a big white farmhouse, a long shared dock and a lawn, with a dock path to every other island. (R6 F8 every low c3 14h needs I01)
- I03 Ferry and boat crossings: A pontoon ferry runs a loop between the islands; ride it, or take your own boat to any dock. (R6 F8 every low c2 8h needs I01)
- I04 Island map and travel: The big map shows every island and its dock; tap one to sail there, with a short fade on the water while it loads. (R3 F6 every none c2 5h needs I01)
- I05 Each island keeps its own save: The dig, the lawn and what you built stay put on each island, so you can leave a job half done and come back to it. (R4 F5 every none c2 6h needs I01)
- I06 The family: Grandparents, a spouse, kids and cousins with names, who wander the islands, wave, and ask for a hand with small things. (R5 F8 every low c3 10h needs I02)
- I07 Sunday family dinner: A long table on the farmhouse lawn at sunset; bring vegetables from the garden and the day's fish, and everyone comes over by boat. (R5 F7 some low c2 6h needs I02)
- I08 Treehouse and playground: Build the grandkids a treehouse, a swing set and a sandbox on Family Island, using the machines to set the posts and spread the sand. (R4 F8 most low c2 7h needs I02)
- I09 Orchard Island: Apple and peach trees to prune and pick, with crates hauled home by boat. (R6 F6 some low c2 6h needs I01)
- I10 Farm Island: A small farm with a tractor, a hay field to cut and bale, and cows that walk up to the fence. (R7 F8 most low c3 12h needs I01)
- I11 Wild Island: An untouched wooded island with a hiking trail, a fire lookout tower and a campsite. (R6 F6 some low c2 8h needs I01)
- I12 Lighthouse Island: A rocky islet with an old lighthouse to fix up; once restored, its beam sweeps the lake at night. (R6 F6 some low c2 6h needs I01)
- I13 Build a home for family: Clear and grade a lot on an empty island and put up a cabin for a family member, stage by stage, until they move in. (R6 F9 some low c3 12h needs I01)
- I14 Jobs for the family: Family and neighbors ask for work on their islands: a ditch for a water line, a pond, a new driveway, a boat ramp. (R6 F8 most low c2 7h needs I02)
- I15 Barge for the machines: Drive the excavator or truck onto a flat barge, chain it down and push it across to another island's ramp. (R8 F8 some low c2 8h needs I03)
- I16 The beach and swimming: A sandy beach on Family Island with a rope swing off a big oak and a floating raft to swim out to. (R5 F7 some low c2 5h needs I02)
- I17 Campfire night: The family around a fire on the beach under the stars, with s'mores and someone playing guitar. (R5 F6 some low c1 4h needs I02)
- I18 Family photo wall: Snapshots of what you built and the days you spent together fill frames along the farmhouse hall. (R3 F5 some none c1 3h needs I02)
- I19 Greenhouse and flower beds: A greenhouse on Family Island that grows all year, and flower beds the family plants along the walk. (R5 F5 some low c2 5h needs I02)
- I20 Family fishing derby: A contest off the docks one weekend; the biggest bass wins a trophy for the farmhouse mantel. (R4 F7 rare low c1 4h needs H08 I02)
- I21 Holidays together: Fourth of July fireworks over the lake, Thanksgiving at the farmhouse, a lit Christmas tree at the end of the dock. (R5 F7 rare low c2 6h needs I02)
- I22 Golf cart on Family Island: A golf cart to get around Family Island, with a grandkid riding on the back. (R5 F7 most low c2 5h needs I02)
- I23 Mail boat: A little boat stops at every dock each morning with letters, packages and the seed you ordered. (R6 F5 every low c1 4h needs I01)
- I24 Island upgrades: Earn and spend to bring each island a dock, power, a well and a gravel road over time. (R5 F7 most none c2 6h needs I01 R02)
- I25 Visit family online: Play on a family member's island together over the internet, or have them sail over to yours. (R3 F8 some low c3 14h needs I01 L06)
- I26 Lantern paths at dusk: The lanterns along Jessica's paths and the porch lights on the islands glow as the sun goes down. (R6 F4 every low c1 2h needs W02)
- I27 Cone course run: A timed run through Dexter's cone course in the skid steer or truck; knock a cone and it counts against you. (R3 F8 some none c1 3h)
- I28 Family together on the island: Your wife and son join your island live by room code and drive, dig and mow beside you. Level 1 (see each other, each in their own machine) reuses Cruise Brandon's Cloudflare Worker and Durable Object relay (`realtime/`, `web/js/multi.js`, 4 per room); level 2 (shared digging) makes the room's Durable Object the host of the dug ground. Owner's top wish (Oct 18). (R6 F10 every low c3 24h)
