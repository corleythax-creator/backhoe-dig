# Image prompts for ChatGPT (textures, graphics, art)

Paste prompts into ChatGPT's image maker. Each one has an id, the file name to save it as, and the idea it serves (ids from `docs/IDEAS.md`).
Each prompt says under it whether the game already has it (In game, with the file; Drawn by the game, made in code; Close match; Needs an upgrade; Not in the game yet), and an Upgrade line (poor or passable) when what the game has today looks cheap, checked Oct 27, 2026 (v251). This is the library to generate from and store. Keep what you like in `art/source/<id>.png`
(full size, untouched) and let `tools/make_tiers.py` cut the phone sizes.

## How the quality tiers work

The game's Graphics setting has Low / Medium / High today, and **Ultra** is the planned PC tier (idea Q15: PBR ground and machines,
wet-surface darkening, rain droplets, richer autumn). One source image feeds every tier, so you only generate each thing once, at its best:

| Tier | Texture size | JPEG quality | Who gets it |
|---|---|---|---|
| Ultra | 2048 px (4096 for the ground trio if the source allows) | 90 | PC |
| High | 1024 px | 85 | PC / good tablets |
| Medium | 512 px | 80 | most phones |
| Low | 256 px for props, 512 px for ground | 72 | phone on Low graphics |

Run `python3 tools/make_tiers.py art/source/G01.png textures/ground/dirt` to write `ultra/ high/ med/ low/` versions (add `--small` for props, `--png` for sprites; it keeps the file
name, uses high-quality resizing, and makes sure the edges still wrap). Do not ask ChatGPT for a "low quality" picture: it makes smeary
detail that looks worse than a clean downscale.

ChatGPT's largest square is about 1024-1536 px, so for Ultra ask for the **detail-rich 1024 square, then upscale 2x or 4x** with any
upscaler (the tool does a clean Lanczos 2x; a real AI upscaler is better when you have one). Ultra wants fine grain, so the prompts below
ask for it.

## Master style block (paste at the start of every prompt)

> STYLE: game-ready asset for a modern, photorealistic construction simulation game set on a lake in the mountains; true-to-life
> materials, accurate real-world scale and colour, crisp high-resolution detail, the look of a AAA PBR game. Flat, even, shadowless
> lighting (no baked shadows, no sun glare, no vignette), so the game can light it. No text, logos, watermarks, borders or people
> unless asked. Natural, realistic colours: red clay, sun-bleached grass, lake blue, safety yellow.

## Master texture block (add for every seamless texture)

> TEXTURE: perfectly seamless tiling, top-down orthographic view, filling the whole square edge to edge, no perspective, no
> single focal object, no visible repeat pattern or obvious large features, even lighting across the whole tile, 1:1 square. Ultra
> detail at pixel level: fine grain, tiny pebbles, hairline cracks. Real-world scale: the tile covers about 1 metre (3 ft).

## Master PBR block (for the Ultra tier: ask for these after the colour map, in the same chat so it matches)

> Now, using the exact same texture, give me: (1) the HEIGHT map as a black-and-white image, white = highest, grey midtones, same
> framing and seamless; (2) the ROUGHNESS map as black-and-white, white = rough and dry, darker = smooth or wet. Same framing, same
> seams, no other changes. (The normal map is made from the height map by tools/make_tiers.py --normal.)

---

## G: Ground and terrain (Ultra PBR sets; replaces `textures/ground/*`)

**G01 Dirt, dry red clay** -> `ground/dirt.jpg`. Needs: the dig site, Q15
> [STYLE][TEXTURE] Dry packed red-brown clay soil with tiny pebbles, fine hairline cracks, a few crumbs and faint tyre-scuff grain; rust-orange with small darker patches.
In game: `textures/ground/*/dirt.jpg`, the ground pack

**G02 Dirt, wet** -> `ground/dirt_wet.jpg`. Needs: W01, D02, Q15 wet-surface darkening
> [STYLE][TEXTURE] The same red clay but soaked: dark chocolate-red, smooth glossy-looking surface, tiny water beads, a few shallow standing-water films, and fine smooth sticky texture.
Drawn by the game: wet ground darkens and shines in the ground shader as it soaks; no separate image

**G03 Grass, summer** -> `ground/grass.jpg`. Needs: K01, K10
> [STYLE][TEXTURE] Mown lawn grass seen from above: tight short blades in many directions, mid-green with yellow-green and a few dry straw blades, tiny clover leaves scattered. Blade-level detail.
In game: `textures/ground/*/grass.jpg`, and the Lawn sod material `textures/grass2.jpg` (ambientCG Grass006 since v279)

**G04 Grass, long and weedy** -> `ground/grass_long.jpg`. Needs: K08, S10
> [STYLE][TEXTURE] Unmown field grass seen from above: long blades lying in swirls, golden-green with seed heads, dandelion leaves and a few white clover flowers.
Not in the game yet: still to make.

**G05 Grass, autumn** -> `ground/grass_fall.jpg`. Needs: W04, Q15 richer autumn
> [STYLE][TEXTURE] Lawn grass in autumn from above: dry khaki and straw-gold blades mixed with green, scattered fallen oak and maple leaves in red, orange and brown, a few acorns.
Not in the game yet: still to make.

**G06 Rock layer** -> `ground/rock.jpg`. Needs: D03, S03, X03
> [STYLE][TEXTURE] Grey-tan sandstone bedrock from above: flat fractured slabs with crisp joint lines, layered strata, lichen specks, little chips and grit in the cracks.
In game: `textures/granite.jpg` (Bedrock), photo-scanned (ambientCG Rock023) since v276

**G07 Gravel road** -> `ground/gravel_road.jpg`. Needs: rim road, M06
> [STYLE][TEXTURE] Compacted crushed-limestone gravel road: grey-beige angular stones of mixed size, dust in the gaps, two faint darker tyre-track lines running vertically through the middle third only if they still tile.
In game: `textures/gravel.jpg` (Crushed gravel), photo-scanned (ambientCG Gravel041) since v276

**G08 Sand, beach** -> `ground/sand_beach.jpg`. Needs: S16, H19
> [STYLE][TEXTURE] Pale warm beach sand from above: fine grains, soft ripple lines, a few shell fragments, tiny dark pebbles, a little driftwood splinter.
In game: `textures/sand.jpg`, photo-scanned (ambientCG Ground080) since v276

**G09 Wet sand at the waterline** -> `ground/sand_wet.jpg`. Needs: S16, W10
> [STYLE][TEXTURE] Wet dark-tan sand as the tide leaves it: smooth glossy surface, fine ripples, tiny air-bubble holes, a few small pebbles.
Close match: `textures/gravel_wet.jpg` is wet gravel; no wet sand yet

**G10 Mud, rutted** -> `ground/mud_ruts.jpg`. Needs: D02, mud.js
> [STYLE][TEXTURE] Churned brown mud with overlapping tyre and track ruts, glossy brown water pooled in the ruts, clods and smears, sticky texture.
In game: `textures/mud.jpg`, photo-scanned (Poly Haven muddy_tracks)

**G11 Cracked dry mud** -> `ground/mud_cracked.jpg`. Needs: soakMax, D12
> [STYLE][TEXTURE] Sun-dried pale clay mud broken into curled polygon plates with deep cracks, light tan on top, darker in the cracks.
In game: `textures/mud_cracked.jpg` (Poly Haven mud_cracked_dry_03), and `textures/mud_drying.jpg` (brown_mud_dry) on the way there, both photo-scanned

**G12 Snow** -> `ground/snow.jpg`. Needs: W04, R07
> [STYLE][TEXTURE] Fresh snow from above: soft sparkling blue-white surface, gentle wind ripples, tiny ice crystals, a few grass tips poking out.
Not in the game yet: still to make.

**G13 Machine grime overlay** -> `ground/grime.jpg`. Needs: Q04, X11 (matches the existing grime layer)
> [STYLE][TEXTURE] A grey-scale grime and dirt-streak mask: soft vertical drips, speckles and smudges, mid-grey base, no hard edges.
In game: `textures/ground/*/grime.jpg`

**G14 Macro variation** -> `ground/macro.jpg`. Needs: ground on High/Ultra
> [STYLE][TEXTURE] A very soft low-frequency grey cloud map of large blotches, no fine detail, mid-grey average, tiling; it only brightens and darkens big patches of ground.
In game: `textures/ground/macro.jpg`

## P: Materials and surfaces (machines, buildings, props)

**P01 Painted yellow steel with wear** -> `materials/yellowsteel_pbr.jpg`. Needs: Q15 machine PBR
> [STYLE][TEXTURE] Safety-yellow painted construction-machine steel, orange-peel paint grain, edge wear showing grey metal, light dust, tiny scratches, a few rivets.
In game: `textures/yellowsteel.jpg`, and `textures/mach_paint.jpg` on the machines, both from the ambientCG scan PaintedMetal001

**P02 Rubber track pad / rubber** -> `materials/rubber.jpg`
> [STYLE][TEXTURE] Black rubber with a worn cross-hatch tread and fine dust, matte.
In game: `textures/mach_rubber.jpg` (the tracks and tyres), from the ambientCG scan Rubber004

**P03 Diamond plate** -> `materials/diamond_pbr.jpg`
> [STYLE][TEXTURE] Raised diamond-pattern steel tread plate, bright scuffed steel with dark dirt in the grooves.
In game: `textures/diamond.jpg`, photo-scanned (ambientCG DiamondPlate009) since v276

**P04 Rusty corrugated metal** -> `materials/corrugated_rust.jpg`. Needs: S01, H10
> [STYLE][TEXTURE] Old corrugated roofing sheet, vertical ribs, faded blue-grey paint peeling to orange rust, bolt heads.
In game: `textures/corrugated.jpg`, photo-scanned (ambientCG CorrugatedSteel009) since v276

**P05 Weathered wood planks, porch** -> `materials/planks_porch.jpg`. Needs: H01, S05, S21
> [STYLE][TEXTURE] Grey-brown weathered horizontal deck boards with tight gaps, nail heads, knots and sun-bleached grain.
In game: `textures/planks.jpg` (Deck planks), photo-scanned (ambientCG Planks029S) since v276

**P06 Painted white clapboard** -> `materials/clapboard_white.jpg`. Needs: I02 farmhouse
> [STYLE][TEXTURE] White-painted horizontal lap siding, slight dirt streaks, clean shadow-free lines.
Not in the game yet: still to make.
Upgrade: passable. Since v254 the family house wears a photo-scanned cream clapboard (`textures/siding_white.jpg`, ambientCG); the editor's cottages are still plain.

**P07 Cedar shingle roof** -> `materials/shingle_cedar.jpg`. Needs: H01, S22
> [STYLE][TEXTURE] Weathered cedar shake roof shingles in staggered rows, silver-brown with moss in a few lower edges.
Close match: `textures/shingles.jpg` is roof shingles (Poly Haven grey_roof_01 since v279); no cedar shakes yet
Upgrade: passable. The covered bridge has cedar shakes drawn by the game; since v255 the farmhouse has photo-scanned grey shingles (`textures/roof_grey.jpg`, Poly Haven).

**P08 Red barn board** -> `materials/barn_red.jpg`. Needs: H10, I10
> [STYLE][TEXTURE] Old red barn vertical board-and-batten siding, flaking paint over grey wood.
Not in the game yet: still to make.
Upgrade: passable. The covered bridge has barn-red boards drawn by the game; a photo-scanned red board siding (`textures/siding_red.jpg`) is in the game, ready for the barns.

**P09 Concrete, poured and stained** -> `materials/concrete_pbr.jpg`. Needs: J07, J12
> [STYLE][TEXTURE] Poured concrete slab, pale grey, small pinholes, trowel swirls, hairline cracks and faint stains.
In game: `textures/concrete.jpg`, `textures/concrete_old.jpg`, photo-scanned (ambientCG Concrete034, Concrete036) since v276

**P10 Asphalt, bridge road** -> `materials/asphalt_pbr.jpg`. Needs: B01
> [STYLE][TEXTURE] Worn dark asphalt with aggregate showing, sealed crack lines and fine grit; no lane markings.
In game: `textures/asphalt.jpg`, photo-scanned (ambientCG Asphalt033) since v276

**P11 Bridge truss steel** -> `materials/truss_steel.jpg`. Needs: B01, B10
> [STYLE][TEXTURE] Dull grey-green painted structural steel with bolt-head rows and light rust streaks.
Drawn by the game: the truss paint, rivets and rust are drawn by the bridge kit (bridges.js)
Upgrade: passable. The bridges have truss paint and rivets drawn by the game; a photo texture would look truer up close.

**P12 Pipe: PVC, ductile iron** -> `materials/pipe_pvc.jpg`, `materials/pipe_iron.jpg`. Needs: J04
> [STYLE][TEXTURE] (a) Smooth white PVC pipe surface with a faint printed-stripe feel but no text; (b) rough dark-grey cast ductile iron with a red-oxide coat. Two separate 1:1 squares.
Not in the game yet: still to make.

**P13 Water, lake surface (tiling)** -> `materials/water_lake.jpg`. Needs: Q13
> [STYLE][TEXTURE] Calm lake water from above, deep teal blue, small soft ripple rings and long swell lines, bright thin highlights on ripple tops, no foam.
Drawn by the game: the lake shader (ripples, reflections, glitter, shallows)

**P14 Shore foam strip** -> `materials/foam_strip.png`. Needs: Q11, Q14. Transparent PNG
> [STYLE] A horizontal tileable strip (4:1), broken white foam lace and bubbles on a transparent background, soft edges, tiling left to right.
Drawn by the game: shore foam is drawn by the lake shader

**P15 Leaf atlas, autumn** -> `materials/leaves_fall.png`. Needs: W04, Q15. Transparent PNG
> [STYLE] A 4x4 sheet of 16 separate autumn leaves (oak, maple, birch, aspen) in reds, oranges, golds and browns, each flat top-down on a transparent background, even spacing, no overlap, no shadows.
Close match: `textures/tree_leaves.jpg` and `tree_leaves_a.jpg` are summer leaves; no autumn atlas yet
Upgrade: passable. The trees only have summer leaves.

## F: Effects and sprites (transparent PNGs)

**F01 Smoke puffs** -> `fx/smoke.png`. Needs: Q01
> [STYLE] A 4x4 sheet of 16 soft diesel smoke puffs of different shapes in grey-black on a transparent background, soft-edged, each in its own equal cell, no ground, no glow.
Close match: the game draws its own chimney smoke puffs; no smoke sprite sheet yet
Upgrade: passable. Chimney smoke is a few soft puffs drawn by the game; machines have no exhaust smoke yet.

**F02 Dust puffs** -> `fx/dust.png`. Needs: Q03, D07
> [STYLE] A 4x4 sheet of 16 tan-brown dust puffs on transparent, soft edges, varied sizes, equal cells.
Drawn by the game: dust is drawn as soft points by the game

**F03 Rain drops and ring splashes** -> `fx/rain.png`. Needs: W01, W09
> [STYLE] A 4x2 sheet on transparent: top row four thin angled rain streaks, bottom row four expanding water-ring splashes seen from above, white-blue.
Drawn by the game: rain drops, splashes and rings are drawn by the game

**F04 Sparks** -> `fx/sparks.png`. Needs: Q05, U04
> [STYLE] A 4x2 sheet of bright orange-yellow spark bursts and streaks on transparent, hot white centres.
Not in the game yet: still to make.

**F05 Snow and fireflies** -> `fx/specks.png`. Needs: W04, W11
> [STYLE] A 4x2 sheet on transparent: top row soft white snowflakes, bottom row warm yellow-green glowing fireflies with soft halos.
Close match: fireflies are drawn by the game; no snow yet

**F06 Cloud sprites** -> `fx/clouds.png`. Needs: W02, W06
> [STYLE] A 3x2 sheet of six puffy realistic cumulus clouds, soft white with light grey undersides, on transparent, no sky.
Drawn by the game: the sky draws its own clouds

## E: Sky, water and environment

**E01 Skybox panorama, noon** -> `sky/noon.jpg`. Needs: Q15 HDR sky
> [STYLE] A seamless 2:1 equirectangular sky panorama, noon, clear blue gradient to pale horizon haze, a few thin cirrus streaks, no sun disc, no ground, left and right edges match.
Drawn by the game: the sky is drawn live through the day

**E02 Skybox, sunset over the lake** -> `sky/sunset.jpg`. Needs: W02
> [STYLE] A seamless 2:1 equirectangular sky panorama at sunset: gold and orange glow at one side, violet and navy overhead, streaks of pink cloud, no ground, edges match.
Drawn by the game: the sunset is drawn live by the sky

**E03 Skybox, night** -> `sky/night.jpg`. Needs: W02
> [STYLE] A seamless 2:1 equirectangular night sky: deep navy, thin Milky Way band, a few hundred stars, no moon, no ground, edges match.
Drawn by the game: the night sky is drawn live

**E04 Skybox, fog morning** -> `sky/fog.jpg`. Needs: W06
> [STYLE] A seamless 2:1 equirectangular misty dawn sky: soft grey-pink gradient, no features, edges match.
Not in the game yet: still to make.

**E05 Distant mountain ridgeline** -> `sky/mountains.png`. Needs: B04, T01, T13
> [STYLE] A seamless horizontally tiling strip (6:1) of layered blue-grey pine mountain ridges fading into haze, transparent above the top ridge, realistic, three depth layers.
Drawn by the game: the north mountains are built as 3D ground

**E06 Far-shore town lights** -> `sky/town_night.png`. Needs: S08, T10
> [STYLE] A tileable 8:1 strip of a far lakeshore at night: small clusters of warm yellow window lights and a few white street lights, on transparent.
Not in the game yet: still to make.

**E07 Skyline** -> `sky/skyline.png`. Needs: T13, T12
> [STYLE] A tileable 8:1 hazy blue-grey city skyline of simple blocky towers in silhouette with a few lit windows, transparent above.
Not in the game yet: still to make.

## U: Interface icons (flat, readable at phone size)

Add: "Clean modern game-UI icon style with realistic detail and soft shading, a single bold subject centred on a transparent background, readable at 64 px, no text."
Do these in batches ("a 6x4 sheet of 24 icons, equal cells, in this order: ..."), then crop.

**U01 Machine icons** -> `ui/machines.png`. Needs: M01-M23
> [STYLE] A 6x4 sheet, equal cells, in this order: excavator, dump truck, wheel loader, skid steer, bulldozer, backhoe loader, mini excavator, motor grader, roller, water truck, articulated hauler, concrete mixer, crane truck, side-by-side, johnboat, kayak, pontoon boat, floatplane, tractor, telehandler, zero-turn mower, pickup truck, lowboy trailer, golf cart.
Not in the game yet: still to make.

**U02 Tool and attachment icons** -> `ui/tools.png`. Needs: X01-X05, X12
> [STYLE] A 4x3 sheet in this order: bucket, thumb, hydraulic hammer, ditching bucket, auger, tiltrotator, quick coupler, pallet forks, grapple, angle broom, box blade, ripper.
Not in the game yet: still to make.

**U03 Utility marks** -> `ui/utility_marks.png`. Needs: J02, U01
> [STYLE] A 6x1 sheet of flat spray-paint style survey marks and flags on transparent: yellow gas, red power, blue water, orange telecom, green sewer, white dig-line; no words.
Not in the game yet: still to make.

**U04 Weather and time icons** -> `ui/weather.png`. Needs: W01-W06, R03
> [STYLE] A 4x2 sheet: sun, cloud, rain, thunderstorm, fog, snow, moon, wind.
Not in the game yet: still to make.

**U05 Badges** -> `ui/badges.png`. Needs: Y01
> [STYLE] A 4x3 sheet of 12 round achievement badges, each a different construction subject (first trench, yardage, safety, perfect grade, pipe layer, pond, lighthouse, regatta, fish, garden, mower, bridge), in bright metal-rimmed enamel style, no text.
Not in the game yet: still to make.

**U06 Produce, pantry and finds** -> `ui/items.png`. Needs: H04, H08, H18, D04, H11
> [STYLE] A 6x4 sheet of 24 small items: tomato, okra, pepper, egg, bass, bream, shell, sea glass, driftwood, old bottle, horseshoe, arrowhead, time capsule, coffee mug, s'more, ice cream, trowel, trimmer line, gas can, seed packet, apple, peach, pumpkin, jar.
Not in the game yet: still to make.

## M: The lakeside town and marina (signs, storefronts, decals and surfaces)

The town and marina are drawn in code today (`js/mainland.js`, `js/marina.js`): the signs are lettered by the game, the walls,
boats and awnings are flat colours. These replace them piece by piece. Use the exact wording given, so the pictures match what the
game says; ask ChatGPT to "check every letter" and redo any sign with a misspelling. Sign art is front-on, filling the frame, with
no wall, pole or shadow round it. Save to `art/source/<id>.png`; the file name after the arrow is where the game will look.

Add for every sign: "Flat front-on view, the sign fills the whole image edge to edge, crisp legible lettering, real materials (painted
wood, gold leaf, enamel, weathering), even light, no background, no perspective, no mock-up."

**M01 Marina sign** -> `town/sign_marina.png` (4.9:1, about 1536x312)
> [STYLE] A carved and painted wooden sign for a lake marina, navy blue board with a raised gold-leaf border and a small anchor at each end. Large serif capitals "LAKESIDE MARINA", and under it in smaller lettering "Harbor Master · Bait & Tackle · Ice". Lightly sun-faded paint, fine wood grain showing through.
Drawn by the game: the marina sign is painted by the game
Upgrade: passable. Drawn by the game as a painted wood board (grain, bevelled moulding, shadowed lettering, `famSignPaint`); a painted picture would still read richer.

**M02 Fuel dock sign** -> `town/sign_fuel.png` (3.4:1)
> [STYLE] A weathered enamel marina fuel sign, red with white lettering: "FUEL DOCK" large, under it "Gas · Diesel · Ice · Pump-out". A thin white pinstripe border, a few rust freckles at the screw holes.
Drawn by the game: the fuel dock sign is painted by the game
Upgrade: passable. Drawn by the game as a painted wood board (grain, bevelled moulding, shadowed lettering, `famSignPaint`); a painted picture would still read richer.

**M03 Dockside Grill sign** -> `town/sign_grill.png` (5.3:1)
> [STYLE] A cream-painted board-and-batten sign with dark red hand-lettered style capitals "DOCKSIDE GRILL", a small crossed fish-and-fork emblem, and under it "Burgers · Fish Tacos · Cold Drinks". Rustic lakeside restaurant, real paint on wood.
Not in the game yet: still to make.

**M04 Grill menu chalkboard** -> `town/menu_grill.png` (2:3 portrait)
> [STYLE] A real chalkboard menu in a wooden frame for a lakeside grill: "TODAY" at the top, then Walleye Tacos $14, Lake Burger $12, Fried Pickles $7, Shore Lunch $16, Lemonade $4, Root Beer Float $5, drawn in white and coloured chalk with a small sketch of a fish.
Not in the game yet: still to make.

**M05 Ice cream stand sign** -> `town/sign_scoops.png` (3.7:1)
> [STYLE] A cheerful vintage ice cream stand sign, white board with pink lettering "SCOOPS" in a rounded retro script and "Ice Cream · Shakes" beneath, a little cone drawing at one end, pink and white candy stripes along the bottom edge.
Not in the game yet: still to make.

**M06 Shop signs, four sheets** -> `town/shop_signs_a.png` ... `_d.png` (each 1536x1024: 2 columns by 4 rows, every sign 8:1)
> [STYLE] A sheet of eight separate small-town storefront signs laid out in a neat grid of 2 columns and 4 rows on plain black, each sign a long 8:1 board filling its cell, front-on: [the eight names below]. Mix of styles as on a real old main street: gold leaf on dark green or black glass, painted wood with a border, enamel, carved serif. Each sign shows its name large and its line under it smaller.
Drawn by the game: the storefront signs are painted by the game
Upgrade: passable. Drawn by the game as painted wood boards with gilt serif or shadowed block lettering (`famSignPaint`, 2048 px atlas); hand-lettered pictures would still read richer.

Sheet a: Lakeside Bakery (Bread · Pies · Coffee), Harbor Books (New & Used), Pine & Anchor (Cafe), Ridge Outfitters (Camp · Fish · Hike), Hometown Hardware (Since 1948), Main St. Diner (Breakfast All Day), Lakeside Pharmacy (Rx · Gifts), Post Office (U.S. Mail).
Sheet b: First Lake Bank (Est. 1912), Barber Shop (Walk-ins Welcome), Wildflower (Florist), Mountain Coffee (Roasted Here), Lakeside Pizza (Slices · Pies), Antiques (& Oddities), Tackle & Trail (Bait · Licenses), The Sweet Shop (Fudge · Candy).
Sheet c: Lake Realty (Homes · Cabins · Land), Village Deli (Sandwiches), Gallery on Main (Local Art), Toy Chest (Toys · Games), Laundromat (Open 7 Days), Copper Kettle (Pub & Grill), Bike & Paddle (Rentals · Repairs), Lakeview Hotel (Rooms).
Sheet d: Corner Market (Groceries), Quilt Barn (Fabric · Yarn), Hair Studio (Cuts · Color), Thrift & Treasure (Second Hand), Town Library (Books · Story Time), Town Hall (Lakeside), Ice House (Ice · Firewood), Lakeside Theater (Movies Fri · Sat).
(The order is the game's `MAIN_SHOPS` list; keep it, the game cuts the sheets in that order.)

**M07 Shop window interiors** -> `town/windows.png` (2048x1024: a 4x2 grid, each 2:1)
> [STYLE] Eight photos of shop interiors seen straight through a shop's display window from the sidewalk, each a 2:1 cell in a 4 by 2 grid: a bakery counter with bread and pies, a bookshop's shelves and a reading chair, hardware aisles with tools on pegboard, a diner counter with stools, a florist's buckets of flowers, an outdoor outfitter with kayaks and jackets, a coffee shop with an espresso machine, a toy shop. Warm interior lighting, slight reflection of the street on the glass, no people, no readable brand names.
Not in the game yet: still to make.

**M08 Upstairs windows** -> `town/upper_windows.png` (1024x1024: a 4x4 grid)
> [STYLE] Sixteen different upstairs apartment windows on an old brick main street, front-on, each cell one double-hung window opening (glass only, no frame): half-drawn blinds, lace curtains, a plant on the sill, a cat, dark glass, a lamp glowing, a reflection of sky. Realistic photo, even light.
Not in the game yet: still to make.

**M09 Painted lap siding** -> `materials/siding_lap.jpg`. Needs: the Harbor House [TEXTURE]
> [STYLE][TEXTURE] Painted wooden lap (clapboard) siding seen straight on, horizontal boards about 4 inches exposed, soft grey-blue paint slightly chalky and weathered, faint wood grain, tiny nail heads, a few hairline paint cracks. Ask again in white and in sage green.
Not in the game yet: still to make.
Upgrade: passable. Since v255 the Harbor House wears a photo-scanned weathered grey lap siding (`textures/siding_grey.jpg`); a painted blue-grey version would match its old colour.

**M10 Board and batten, barn red** -> `materials/board_batten.jpg`. Needs: the Dockside Grill [TEXTURE]
> [STYLE][TEXTURE] Vertical board-and-batten siding painted deep barn red, battens every 2 feet, sun-faded and slightly peeling at the bottom edge, wood grain showing.
Not in the game yet: still to make.
Upgrade: passable. Since v255 the Dockside Grill wears photo-scanned red boards run upright (`textures/siding_red.jpg`) between its battens.

**M11 Dock decking, grey weathered** -> `materials/dock_deck.jpg`. Needs: the pier and slips [TEXTURE]
> [STYLE][TEXTURE] Top-down view of a weathered timber dock: 2x6 boards running left to right with 1/4 inch gaps showing dark water below, silver-grey sun-bleached cedar with darker wet patches near the gaps, galvanized nail heads in pairs, a little bird lime and scuffing. The pattern repeats every 4 boards across, seamless.
In game: `textures/deck_grey.jpg` (photo-scanned, ambientCG Planks023A) on the marina pier, fingers, gangway and decks since v255

**M12 Breakwater stone** -> `materials/riprap.jpg`. Needs: the breakwater [TEXTURE]
> [STYLE][TEXTURE] Close view of a rough grey granite boulder's surface for a lake breakwater: speckled grey and pink granite, lichen spots, a dark wet band, a few green algae streaks. Seamless; this goes on each boulder.
In game: `textures/rock_bw.jpg` (photo-scanned granite, ambientCG Granite005B) on every breakwater boulder, in six shades, since v280

**M13 Standing-seam metal roof** -> `materials/roof_seam.jpg` [TEXTURE]
> [STYLE][TEXTURE] Standing-seam steel roof seen straight on, charcoal grey, seams every 16 inches, faint weathering streaks and a little pollen in the seams.
In game: `textures/roof_seam.jpg` (Poly Haven box_profile_metal_sheet, made grey and tinted) on the Dockside Grill (charcoal) and the bandstand (green) since v280

**M14 Awning canvas** -> `materials/awning_stripes.jpg` [TEXTURE]
> [STYLE][TEXTURE] Woven outdoor awning canvas with wide vertical stripes, alternating forest green and cream, the fabric weave visible up close, slightly sun-faded. Ask again in red and white, navy and white, and mustard and white.
Close match: `textures/canvas.jpg` (Poly Haven rough_linen, made grey) gives every awning stripe a woven canvas in its own colour since v280; the stripes are still drawn by the game

**M15 Boat hulls and names** -> `town/boat_names.png` (transparent PNG, 2048x1024: a grid of 12)
> [STYLE] Twelve boat transom names as clean vinyl lettering on transparent background, each centred in its own cell with a hailing port under it "LAKESIDE": Reel Time, Knot On Call, Seas the Day, Lake Effect, Miss Corley, Dock Holiday, Aqua Therapy, Sunset Serenade, Fishful Thinking, Wet Willie, Second Wind, Liquid Asset. Mix of script and block styles in navy, black, red and gold.
Drawn by the game: the five runabouts carry their names (Miss Corley, Seas the Day, Reel Time, Dock Holiday, Lake Effect) in vinyl lettering along both sides aft (`btName`, boats.js), and the marina's slip boats theirs over the hailing port LAKESIDE (`marName`, marina.js; the pontoons go without)

**M16 Gelcoat hull** -> `materials/gelcoat.jpg` [TEXTURE]
> [STYLE][TEXTURE] Glossy white fibreglass boat hull gelcoat, close, very slight orange-peel texture, faint grey scuffs, a thin yellowish waterline stain along the bottom fifth. Seamless left to right.
In game: `textures/gelcoat.jpg` (ambientCG Plastic013B, made neutral): every boat's hull is glossy gelcoat in its own colour with the scan's fine scuffs in its sheen; no waterline stain yet

**M17 Flags** -> `town/flags.png` (transparent PNG, 1536x1024)
> [STYLE] A sheet of flat flags on transparent background, each in its own cell, slightly rippled cloth: the US flag, a navy marina burgee with a gold anchor, a red-and-white "diver down" flag, and nautical signal flags A to F.
Not in the game yet: still to make.

**M18 Life ring** -> `town/life_ring.png` (transparent PNG, square)
> [STYLE] Top view of an orange-and-white life ring with grab rope, the words "LAKESIDE MARINA" printed round it in black, on transparent background.
Not in the game yet: still to make.

**M19 Marina notices** -> `town/notices.png` (1536x1024, a 3x2 grid)
> [STYLE] Six weathered notice signs for a lake marina, each front-on in its cell: "NO WAKE" (white with orange diamond), "SLOW 5 MPH", "NO SWIMMING OFF DOCKS", "LIFE JACKETS SAVE LIVES", "PUBLIC BOAT RAMP", "FISH CLEANING STATION". Real enamel and aluminium road-sign look, a little sun-faded.
Not in the game yet: still to make.

**M20 Harbor House concept** -> `concept/harbor_house.png`
> [STYLE] [concept sheet] A two-storey New England style marina office and bait shop: grey-blue clapboard, white trim, navy shutters, a cedar-shingle roof with a white cupola and fish weathervane, a deep porch with rocking chairs facing the docks, an ice chest and bait cooler by the door.
Reference art: a guide for building, not a game file.

**M21 Dockside Grill concept** -> `concept/dockside_grill.png`
> [STYLE] [concept sheet] A red board-and-batten lakeside grill with roll-up glass garage doors, a plank deck over the beach with tables, striped umbrellas and string lights at dusk.
Reference art: a guide for building, not a game file.

## S: Scenery concept sheets (reference art, not textures; use as guides when building)

Add: "Three-quarter view on a plain light grey background, realistic 3D game-model render style, front, side and back views of the same object on one sheet."

**S01 Job trailer, porta-john, fuel tank, pipe rack** -> `concept/site_props.png`. Needs: S01, S02
> [STYLE] [concept sheet] A construction site prop set: office trailer, porta-john, skid fuel tank, PVC pipe rack, traffic cones, barricade, caution tape stand, job sign, light tower.
Reference art: a guide for building, not a game file.
Upgrade: poor. The job trailer, porta-john, fuel tank and site props are simple flat-shaded shapes.

**S02 Lighthouse** -> `concept/lighthouse.png`. Needs: S22, I12
> [STYLE] [concept sheet] A small white lighthouse with a red lantern room and stair, on a rocky point.
Reference art: a guide for building, not a game file.
Upgrade: passable. The marina lighthouse is simple shapes with plain colours.

**S03 Marina and boardwalk** -> `concept/marina.png`. Needs: S18, S21
> [STYLE] [concept sheet] A small lake marina: floating slips, breakwater, fuel dock, bait shop, ice-cream window, cafe, with boats at the slips.
Reference art: a guide for building, not a game file.
Upgrade: passable. The marina is built, partly textured; good for checking its look.

**S04 Farmhouse on Family Island** -> `concept/farmhouse.png`. Needs: I02
> [STYLE] [concept sheet] A big white farmhouse with a deep porch, green shutters, a dock and a lawn.
Reference art: a guide for building, not a game file.
Upgrade: passable. The family house is simple boxes, but since v253 wears the library's wood, shingles, stone, planks and flagstone.

**S05 Your cabin** -> `concept/cabin.png`. Needs: H01, S11, I13
> [STYLE] [concept sheet] A small timber lake cabin with porch swing, woodstove chimney, rain barrel and fire pit. Also show it in four build stages: footings, frame, roof, finished.
Reference art: a guide for building, not a game file.

**S06 Lake boats** -> `concept/boats.png`. Needs: M21, M22, S19, S20
> [STYLE] [concept sheet] Runabout, pontoon, fishing boat, johnboat, sailboat, kayak, paddleboard, tug and barge.
Reference art: a guide for building, not a game file.
Upgrade: poor. The runabouts at the docks and the lake boats are simple flat-shaded shapes.

**S07 Animals** -> `concept/animals.png`. Needs: S09, S23, H05, H06
> [STYLE] [concept sheet] Deer, goose, eagle, heron, turtle, otter, a friendly dog, a hen and rooster.
Reference art: a guide for building, not a game file.

**S08 Mountain town main street** -> `concept/town.png`. Needs: T01-T05
> [STYLE] [concept sheet] A small mountain town main street: hardware store, diner, gas station, equipment dealer, feed store, with sidewalks and street lamps.
Reference art: a guide for building, not a game file.
Upgrade: passable. The town is built and partly textured; good for checking its look.

**S09 Trees by season** -> `concept/trees.png`. Needs: W04, Q15
> [STYLE] [concept sheet] One oak, one maple and one pine each in summer, autumn and winter.
Reference art: a guide for building, not a game file.
Upgrade: passable. The trees are textured but have no autumn or winter look.

## R: Upgrades (things in the game that look cheap today)

Reference sheets to rebuild the flat-shaded models as real ones, the way the town's cars were made from image sheets. Each one ends with the sheet rule below.

Add: "Three-quarter view on a plain light grey background, photorealistic 3D game-model render style with true-to-life materials, front, side and back views of each object on one sheet, each object labelled by nothing but its position, even spacing, real-world proportions."

**R01 Family Island pavilion, fire pit and flagpole** -> `concept/fam_pavilion.png`. Needs: I02, H07
> [STYLE] [concept sheet] An open timber picnic pavilion with a green standing-seam metal roof on heavy posts, two long picnic tables under it, a stone fire ring with log benches, and a tall white flagpole with a US flag.
Needs an upgrade: passable. The pavilion, fire pit and flagpole are simple shapes; since v253 the pavilion has a broom-finish slab, timber and a cedar-shake roof.

**R02 Jessica's stone and timber cottage** -> `concept/jes_cottage.png`. Needs: L08, H25
> [STYLE] [concept sheet] A small storybook cottage of grey fieldstone walls and dark stained timber beams, steep cedar-shake roof, a stone chimney, deep-set windows with green trim, a heavy plank door and a lantern; also a cutaway of the library inside: shelves to the ceiling, a rolling ladder, a window seat and two armchairs by the fire.
Needs an upgrade: passable. The cottage is simple shapes; since v253 its base and chimney are cobblestone and its framing timber, the walls still plain plaster.

**R03 Dexter's equipment shed and office trailer** -> `concept/dex_yard.png`. Needs: L07, S01
> [STYLE] [concept sheet] A tall steel equipment shed with a big roll-up door and corrugated siding, a white office trailer on blocks with wooden steps, a skid fuel tank in a steel bund, and a parts rack, all working-yard worn.
Needs an upgrade: passable. Dexter's shed and trailer are simple boxes; since v253 the shed is corrugated steel on a concrete slab, the trailer on block piers.

**R04 Placeable things A: construction** -> `concept/props_build.png`. Needs: S01, S02, B20
> [STYLE] [concept sheet] A set of construction site props: water-filled barricade, concrete Jersey barrier, orange traffic drum, trailer arrow board, portable generator, steel job box, 20 ft shipping container, scaffold tower, stack of concrete culvert pipes, lumber stack, sandbag wall, silt fence, stack of old tyres, wheelbarrow, roll-off dumpster, porta-john.
Needs an upgrade: passable. With Machine models on Detailed, the Jersey barrier, generator, steel drum and tyre stack are photo-scanned models (Poly Haven, `models/scans.glb`); the rest are flat-shaded shapes.

**R05 Placeable things B: home and garden** -> `concept/props_home.png`. Needs: H13, K06
> [STYLE] [concept sheet] A set of backyard props: wooden picnic table, park bench, Adirondack chair, rope hammock on a stand, patio table with umbrella, kettle grill, small gazebo, garden arbor, stone bird bath, birdhouse on a post, stone wishing well, little free library box, chicken coop, two beehives, dog house, raised garden bed, flower planter.
Needs an upgrade: poor. These are flat-shaded shapes in the map editor's Add list and the Blocks bar.

**R06 Placeable things C: lights and signs** -> `concept/props_lights.png`. Needs: S13, X06
> [STYLE] [concept sheet] A set of outdoor lights and street furniture: cobra-head street light, black acorn lamp post, flood light on a pole, ground spotlight, garden path light, café string lights, lantern on a shepherd's hook, stop sign, speed limit sign, red fire hydrant, rural mailbox on a post, windsock on a mast, flag pole.
Needs an upgrade: passable. With Machine models on Detailed, the lamp post and fire hydrant (and the new trash can and utility box) are photo-scanned models (Poly Haven, `models/scans.glb`); the rest are flat-shaded shapes.

**R07 Placeable things D: play and farm** -> `concept/props_play.png`. Needs: I08, K15
> [STYLE] [concept sheet] A set of yard and farm props: wooden swing set, round trampoline, square sandbox, basketball hoop on a pole, soccer goal, pair of cornhole boards, dome camping tent, round hay bale, stacked square straw bales, scarecrow, garden gnome, firewood stack, steel fire pit, carved jack-o'-lantern.
Needs an upgrade: poor. These are flat-shaded shapes in the map editor's Add list and the Blocks bar.

**R08 Placeable buildings: house, shed, garage** -> `concept/props_buildings.png`. Needs: H01, H10
> [STYLE] [concept sheet] Three small buildings: a one-storey lake house with lap siding, a porch and a shingle roof; a wooden garden shed with a double door; a two-car detached garage with a roll-up door.
Needs an upgrade: poor. The editor's house, shed and garage are simple flat-colour boxes.

**R09 Golf cart and go-kart** -> `concept/carts.png`. Needs: I22
> [STYLE] [concept sheet] A two-seat electric golf cart with a white canopy and a rear bag rack, and a small petrol go-kart with a bare tube frame, bucket seat and fat slicks.
Needs an upgrade: poor. These two have no detailed model; they are always simple flat-shaded shapes.

**R10 Runabout boat at the docks** -> `concept/runabout.png`. Needs: M21, S19
> [STYLE] [concept sheet] An 18 ft centre-console aluminium-and-fibreglass runabout with an outboard motor, a T-top, cushions, a cooler seat and cleats, white gelcoat with a navy stripe.
Needs an upgrade: poor. The boats you drive are simple flat-shaded shapes.

## How to store them

1. Save each full-size result as `art/source/<id>.png`; add a line to `art/README.md` saying which chat prompt made it (so a redo matches).
2. `python3 tools/make_tiers.py art/source/G01.png textures/ground/dirt` writes the four tiers.
3. Nothing loads from `art/source/`; only the tier folders are used by the game, so the phone never downloads the big files.
