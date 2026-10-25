# Image prompts for ChatGPT (textures, graphics, art)

Paste prompts into ChatGPT's image maker. Each one has an id, the file name to save it as, and the idea it serves (ids from `docs/IDEAS.md`).
Nothing here is built into the game yet; this is the library to generate from and store. Keep what you like in `art/source/<id>.png`
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

**G02 Dirt, wet** -> `ground/dirt_wet.jpg`. Needs: W01, D02, Q15 wet-surface darkening
> [STYLE][TEXTURE] The same red clay but soaked: dark chocolate-red, smooth glossy-looking surface, tiny water beads, a few shallow standing-water films, and fine smooth sticky texture.

**G03 Grass, summer** -> `ground/grass.jpg`. Needs: K01, K10
> [STYLE][TEXTURE] Mown lawn grass seen from above: tight short blades in many directions, mid-green with yellow-green and a few dry straw blades, tiny clover leaves scattered. Blade-level detail.

**G04 Grass, long and weedy** -> `ground/grass_long.jpg`. Needs: K08, S10
> [STYLE][TEXTURE] Unmown field grass seen from above: long blades lying in swirls, golden-green with seed heads, dandelion leaves and a few white clover flowers.

**G05 Grass, autumn** -> `ground/grass_fall.jpg`. Needs: W04, Q15 richer autumn
> [STYLE][TEXTURE] Lawn grass in autumn from above: dry khaki and straw-gold blades mixed with green, scattered fallen oak and maple leaves in red, orange and brown, a few acorns.

**G06 Rock layer** -> `ground/rock.jpg`. Needs: D03, S03, X03
> [STYLE][TEXTURE] Grey-tan sandstone bedrock from above: flat fractured slabs with crisp joint lines, layered strata, lichen specks, little chips and grit in the cracks.

**G07 Gravel road** -> `ground/gravel_road.jpg`. Needs: rim road, M06
> [STYLE][TEXTURE] Compacted crushed-limestone gravel road: grey-beige angular stones of mixed size, dust in the gaps, two faint darker tyre-track lines running vertically through the middle third only if they still tile.

**G08 Sand, beach** -> `ground/sand_beach.jpg`. Needs: S16, H19
> [STYLE][TEXTURE] Pale warm beach sand from above: fine grains, soft ripple lines, a few shell fragments, tiny dark pebbles, a little driftwood splinter.

**G09 Wet sand at the waterline** -> `ground/sand_wet.jpg`. Needs: S16, W10
> [STYLE][TEXTURE] Wet dark-tan sand as the tide leaves it: smooth glossy surface, fine ripples, tiny air-bubble holes, a few small pebbles.

**G10 Mud, rutted** -> `ground/mud_ruts.jpg`. Needs: D02, mud.js
> [STYLE][TEXTURE] Churned brown mud with overlapping tyre and track ruts, glossy brown water pooled in the ruts, clods and smears, sticky texture.

**G11 Cracked dry mud** -> `ground/mud_cracked.jpg`. Needs: soakMax, D12
> [STYLE][TEXTURE] Sun-dried pale clay mud broken into curled polygon plates with deep cracks, light tan on top, darker in the cracks.

**G12 Snow** -> `ground/snow.jpg`. Needs: W04, R07
> [STYLE][TEXTURE] Fresh snow from above: soft sparkling blue-white surface, gentle wind ripples, tiny ice crystals, a few grass tips poking out.

**G13 Machine grime overlay** -> `ground/grime.jpg`. Needs: Q04, X11 (matches the existing grime layer)
> [STYLE][TEXTURE] A grey-scale grime and dirt-streak mask: soft vertical drips, speckles and smudges, mid-grey base, no hard edges.

**G14 Macro variation** -> `ground/macro.jpg`. Needs: ground on High/Ultra
> [STYLE][TEXTURE] A very soft low-frequency grey cloud map of large blotches, no fine detail, mid-grey average, tiling; it only brightens and darkens big patches of ground.

## P: Materials and surfaces (machines, buildings, props)

**P01 Painted yellow steel with wear** -> `materials/yellowsteel_pbr.jpg`. Needs: Q15 machine PBR
> [STYLE][TEXTURE] Safety-yellow painted construction-machine steel, orange-peel paint grain, edge wear showing grey metal, light dust, tiny scratches, a few rivets.

**P02 Rubber track pad / rubber** -> `materials/rubber.jpg`
> [STYLE][TEXTURE] Black rubber with a worn cross-hatch tread and fine dust, matte.

**P03 Diamond plate** -> `materials/diamond_pbr.jpg`
> [STYLE][TEXTURE] Raised diamond-pattern steel tread plate, bright scuffed steel with dark dirt in the grooves.

**P04 Rusty corrugated metal** -> `materials/corrugated_rust.jpg`. Needs: S01, H10
> [STYLE][TEXTURE] Old corrugated roofing sheet, vertical ribs, faded blue-grey paint peeling to orange rust, bolt heads.

**P05 Weathered wood planks, porch** -> `materials/planks_porch.jpg`. Needs: H01, S05, S21
> [STYLE][TEXTURE] Grey-brown weathered horizontal deck boards with tight gaps, nail heads, knots and sun-bleached grain.

**P06 Painted white clapboard** -> `materials/clapboard_white.jpg`. Needs: I02 farmhouse
> [STYLE][TEXTURE] White-painted horizontal lap siding, slight dirt streaks, clean shadow-free lines.

**P07 Cedar shingle roof** -> `materials/shingle_cedar.jpg`. Needs: H01, S22
> [STYLE][TEXTURE] Weathered cedar shake roof shingles in staggered rows, silver-brown with moss in a few lower edges.

**P08 Red barn board** -> `materials/barn_red.jpg`. Needs: H10, I10
> [STYLE][TEXTURE] Old red barn vertical board-and-batten siding, flaking paint over grey wood.

**P09 Concrete, poured and stained** -> `materials/concrete_pbr.jpg`. Needs: J07, J12
> [STYLE][TEXTURE] Poured concrete slab, pale grey, small pinholes, trowel swirls, hairline cracks and faint stains.

**P10 Asphalt, bridge road** -> `materials/asphalt_pbr.jpg`. Needs: B01
> [STYLE][TEXTURE] Worn dark asphalt with aggregate showing, sealed crack lines and fine grit; no lane markings.

**P11 Bridge truss steel** -> `materials/truss_steel.jpg`. Needs: B01, B10
> [STYLE][TEXTURE] Dull grey-green painted structural steel with bolt-head rows and light rust streaks.

**P12 Pipe: PVC, ductile iron** -> `materials/pipe_pvc.jpg`, `materials/pipe_iron.jpg`. Needs: J04
> [STYLE][TEXTURE] (a) Smooth white PVC pipe surface with a faint printed-stripe feel but no text; (b) rough dark-grey cast ductile iron with a red-oxide coat. Two separate 1:1 squares.

**P13 Water, lake surface (tiling)** -> `materials/water_lake.jpg`. Needs: Q13
> [STYLE][TEXTURE] Calm lake water from above, deep teal blue, small soft ripple rings and long swell lines, bright thin highlights on ripple tops, no foam.

**P14 Shore foam strip** -> `materials/foam_strip.png`. Needs: Q11, Q14. Transparent PNG
> [STYLE] A horizontal tileable strip (4:1), broken white foam lace and bubbles on a transparent background, soft edges, tiling left to right.

**P15 Leaf atlas, autumn** -> `materials/leaves_fall.png`. Needs: W04, Q15. Transparent PNG
> [STYLE] A 4x4 sheet of 16 separate autumn leaves (oak, maple, birch, aspen) in reds, oranges, golds and browns, each flat top-down on a transparent background, even spacing, no overlap, no shadows.

## F: Effects and sprites (transparent PNGs)

**F01 Smoke puffs** -> `fx/smoke.png`. Needs: Q01
> [STYLE] A 4x4 sheet of 16 soft diesel smoke puffs of different shapes in grey-black on a transparent background, soft-edged, each in its own equal cell, no ground, no glow.

**F02 Dust puffs** -> `fx/dust.png`. Needs: Q03, D07
> [STYLE] A 4x4 sheet of 16 tan-brown dust puffs on transparent, soft edges, varied sizes, equal cells.

**F03 Rain drops and ring splashes** -> `fx/rain.png`. Needs: W01, W09
> [STYLE] A 4x2 sheet on transparent: top row four thin angled rain streaks, bottom row four expanding water-ring splashes seen from above, white-blue.

**F04 Sparks** -> `fx/sparks.png`. Needs: Q05, U04
> [STYLE] A 4x2 sheet of bright orange-yellow spark bursts and streaks on transparent, hot white centres.

**F05 Snow and fireflies** -> `fx/specks.png`. Needs: W04, W11
> [STYLE] A 4x2 sheet on transparent: top row soft white snowflakes, bottom row warm yellow-green glowing fireflies with soft halos.

**F06 Cloud sprites** -> `fx/clouds.png`. Needs: W02, W06
> [STYLE] A 3x2 sheet of six puffy realistic cumulus clouds, soft white with light grey undersides, on transparent, no sky.

## E: Sky, water and environment

**E01 Skybox panorama, noon** -> `sky/noon.jpg`. Needs: Q15 HDR sky
> [STYLE] A seamless 2:1 equirectangular sky panorama, noon, clear blue gradient to pale horizon haze, a few thin cirrus streaks, no sun disc, no ground, left and right edges match.

**E02 Skybox, sunset over the lake** -> `sky/sunset.jpg`. Needs: W02
> [STYLE] A seamless 2:1 equirectangular sky panorama at sunset: gold and orange glow at one side, violet and navy overhead, streaks of pink cloud, no ground, edges match.

**E03 Skybox, night** -> `sky/night.jpg`. Needs: W02
> [STYLE] A seamless 2:1 equirectangular night sky: deep navy, thin Milky Way band, a few hundred stars, no moon, no ground, edges match.

**E04 Skybox, fog morning** -> `sky/fog.jpg`. Needs: W06
> [STYLE] A seamless 2:1 equirectangular misty dawn sky: soft grey-pink gradient, no features, edges match.

**E05 Distant mountain ridgeline** -> `sky/mountains.png`. Needs: B04, T01, T13
> [STYLE] A seamless horizontally tiling strip (6:1) of layered blue-grey pine mountain ridges fading into haze, transparent above the top ridge, realistic, three depth layers.

**E06 Far-shore town lights** -> `sky/town_night.png`. Needs: S08, T10
> [STYLE] A tileable 8:1 strip of a far lakeshore at night: small clusters of warm yellow window lights and a few white street lights, on transparent.

**E07 Skyline** -> `sky/skyline.png`. Needs: T13, T12
> [STYLE] A tileable 8:1 hazy blue-grey city skyline of simple blocky towers in silhouette with a few lit windows, transparent above.

## U: Interface icons (flat, readable at phone size)

Add: "Clean modern game-UI icon style with realistic detail and soft shading, a single bold subject centred on a transparent background, readable at 64 px, no text."
Do these in batches ("a 6x4 sheet of 24 icons, equal cells, in this order: ..."), then crop.

**U01 Machine icons** -> `ui/machines.png`. Needs: M01-M23
> [STYLE] A 6x4 sheet, equal cells, in this order: excavator, dump truck, wheel loader, skid steer, bulldozer, backhoe loader, mini excavator, motor grader, roller, water truck, articulated hauler, concrete mixer, crane truck, side-by-side, johnboat, kayak, pontoon boat, floatplane, tractor, telehandler, zero-turn mower, pickup truck, lowboy trailer, golf cart.

**U02 Tool and attachment icons** -> `ui/tools.png`. Needs: X01-X05, X12
> [STYLE] A 4x3 sheet in this order: bucket, thumb, hydraulic hammer, ditching bucket, auger, tiltrotator, quick coupler, pallet forks, grapple, angle broom, box blade, ripper.

**U03 Utility marks** -> `ui/utility_marks.png`. Needs: J02, U01
> [STYLE] A 6x1 sheet of flat spray-paint style survey marks and flags on transparent: yellow gas, red power, blue water, orange telecom, green sewer, white dig-line; no words.

**U04 Weather and time icons** -> `ui/weather.png`. Needs: W01-W06, R03
> [STYLE] A 4x2 sheet: sun, cloud, rain, thunderstorm, fog, snow, moon, wind.

**U05 Badges** -> `ui/badges.png`. Needs: Y01
> [STYLE] A 4x3 sheet of 12 round achievement badges, each a different construction subject (first trench, yardage, safety, perfect grade, pipe layer, pond, lighthouse, regatta, fish, garden, mower, bridge), in bright metal-rimmed enamel style, no text.

**U06 Produce, pantry and finds** -> `ui/items.png`. Needs: H04, H08, H18, D04, H11
> [STYLE] A 6x4 sheet of 24 small items: tomato, okra, pepper, egg, bass, bream, shell, sea glass, driftwood, old bottle, horseshoe, arrowhead, time capsule, coffee mug, s'more, ice cream, trowel, trimmer line, gas can, seed packet, apple, peach, pumpkin, jar.

## M: The lakeside town and marina (signs, storefronts, decals and surfaces)

The town and marina are drawn in code today (`js/mainland.js`, `js/marina.js`): the signs are lettered by the game, the walls,
boats and awnings are flat colours. These replace them piece by piece. Use the exact wording given, so the pictures match what the
game says; ask ChatGPT to "check every letter" and redo any sign with a misspelling. Sign art is front-on, filling the frame, with
no wall, pole or shadow round it. Save to `art/source/<id>.png`; the file name after the arrow is where the game will look.

Add for every sign: "Flat front-on view, the sign fills the whole image edge to edge, crisp legible lettering, real materials (painted
wood, gold leaf, enamel, weathering), even light, no background, no perspective, no mock-up."

**M01 Marina sign** -> `town/sign_marina.png` (4.9:1, about 1536x312)
> [STYLE] A carved and painted wooden sign for a lake marina, navy blue board with a raised gold-leaf border and a small anchor at each end. Large serif capitals "LAKESIDE MARINA", and under it in smaller lettering "Harbor Master · Bait & Tackle · Ice". Lightly sun-faded paint, fine wood grain showing through.

**M02 Fuel dock sign** -> `town/sign_fuel.png` (3.4:1)
> [STYLE] A weathered enamel marina fuel sign, red with white lettering: "FUEL DOCK" large, under it "Gas · Diesel · Ice · Pump-out". A thin white pinstripe border, a few rust freckles at the screw holes.

**M03 Dockside Grill sign** -> `town/sign_grill.png` (5.3:1)
> [STYLE] A cream-painted board-and-batten sign with dark red hand-lettered style capitals "DOCKSIDE GRILL", a small crossed fish-and-fork emblem, and under it "Burgers · Fish Tacos · Cold Drinks". Rustic lakeside restaurant, real paint on wood.

**M04 Grill menu chalkboard** -> `town/menu_grill.png` (2:3 portrait)
> [STYLE] A real chalkboard menu in a wooden frame for a lakeside grill: "TODAY" at the top, then Walleye Tacos $14, Lake Burger $12, Fried Pickles $7, Shore Lunch $16, Lemonade $4, Root Beer Float $5, drawn in white and coloured chalk with a small sketch of a fish.

**M05 Ice cream stand sign** -> `town/sign_scoops.png` (3.7:1)
> [STYLE] A cheerful vintage ice cream stand sign, white board with pink lettering "SCOOPS" in a rounded retro script and "Ice Cream · Shakes" beneath, a little cone drawing at one end, pink and white candy stripes along the bottom edge.

**M06 Shop signs, four sheets** -> `town/shop_signs_a.png` ... `_d.png` (each 1536x1024: 2 columns by 4 rows, every sign 8:1)
> [STYLE] A sheet of eight separate small-town storefront signs laid out in a neat grid of 2 columns and 4 rows on plain black, each sign a long 8:1 board filling its cell, front-on: [the eight names below]. Mix of styles as on a real old main street: gold leaf on dark green or black glass, painted wood with a border, enamel, carved serif. Each sign shows its name large and its line under it smaller.

Sheet a: Lakeside Bakery (Bread · Pies · Coffee), Harbor Books (New & Used), Pine & Anchor (Cafe), Ridge Outfitters (Camp · Fish · Hike), Hometown Hardware (Since 1948), Main St. Diner (Breakfast All Day), Lakeside Pharmacy (Rx · Gifts), Post Office (U.S. Mail).
Sheet b: First Lake Bank (Est. 1912), Barber Shop (Walk-ins Welcome), Wildflower (Florist), Mountain Coffee (Roasted Here), Lakeside Pizza (Slices · Pies), Antiques (& Oddities), Tackle & Trail (Bait · Licenses), The Sweet Shop (Fudge · Candy).
Sheet c: Lake Realty (Homes · Cabins · Land), Village Deli (Sandwiches), Gallery on Main (Local Art), Toy Chest (Toys · Games), Laundromat (Open 7 Days), Copper Kettle (Pub & Grill), Bike & Paddle (Rentals · Repairs), Lakeview Hotel (Rooms).
Sheet d: Corner Market (Groceries), Quilt Barn (Fabric · Yarn), Hair Studio (Cuts · Color), Thrift & Treasure (Second Hand), Town Library (Books · Story Time), Town Hall (Lakeside), Ice House (Ice · Firewood), Lakeside Theater (Movies Fri · Sat).
(The order is the game's `MAIN_SHOPS` list; keep it, the game cuts the sheets in that order.)

**M07 Shop window interiors** -> `town/windows.png` (2048x1024: a 4x2 grid, each 2:1)
> [STYLE] Eight photos of shop interiors seen straight through a shop's display window from the sidewalk, each a 2:1 cell in a 4 by 2 grid: a bakery counter with bread and pies, a bookshop's shelves and a reading chair, hardware aisles with tools on pegboard, a diner counter with stools, a florist's buckets of flowers, an outdoor outfitter with kayaks and jackets, a coffee shop with an espresso machine, a toy shop. Warm interior lighting, slight reflection of the street on the glass, no people, no readable brand names.

**M08 Upstairs windows** -> `town/upper_windows.png` (1024x1024: a 4x4 grid)
> [STYLE] Sixteen different upstairs apartment windows on an old brick main street, front-on, each cell one double-hung window opening (glass only, no frame): half-drawn blinds, lace curtains, a plant on the sill, a cat, dark glass, a lamp glowing, a reflection of sky. Realistic photo, even light.

**M09 Painted lap siding** -> `materials/siding_lap.jpg`. Needs: the Harbor House [TEXTURE]
> [STYLE][TEXTURE] Painted wooden lap (clapboard) siding seen straight on, horizontal boards about 4 inches exposed, soft grey-blue paint slightly chalky and weathered, faint wood grain, tiny nail heads, a few hairline paint cracks. Ask again in white and in sage green.

**M10 Board and batten, barn red** -> `materials/board_batten.jpg`. Needs: the Dockside Grill [TEXTURE]
> [STYLE][TEXTURE] Vertical board-and-batten siding painted deep barn red, battens every 2 feet, sun-faded and slightly peeling at the bottom edge, wood grain showing.

**M11 Dock decking, grey weathered** -> `materials/dock_deck.jpg`. Needs: the pier and slips [TEXTURE]
> [STYLE][TEXTURE] Top-down view of a weathered timber dock: 2x6 boards running left to right with 1/4 inch gaps showing dark water below, silver-grey sun-bleached cedar with darker wet patches near the gaps, galvanized nail heads in pairs, a little bird lime and scuffing. The pattern repeats every 4 boards across, seamless.

**M12 Breakwater stone** -> `materials/riprap.jpg`. Needs: the breakwater [TEXTURE]
> [STYLE][TEXTURE] Close view of a rough grey granite boulder's surface for a lake breakwater: speckled grey and pink granite, lichen spots, a dark wet band, a few green algae streaks. Seamless; this goes on each boulder.

**M13 Standing-seam metal roof** -> `materials/roof_seam.jpg` [TEXTURE]
> [STYLE][TEXTURE] Standing-seam steel roof seen straight on, charcoal grey, seams every 16 inches, faint weathering streaks and a little pollen in the seams.

**M14 Awning canvas** -> `materials/awning_stripes.jpg` [TEXTURE]
> [STYLE][TEXTURE] Woven outdoor awning canvas with wide vertical stripes, alternating forest green and cream, the fabric weave visible up close, slightly sun-faded. Ask again in red and white, navy and white, and mustard and white.

**M15 Boat hulls and names** -> `town/boat_names.png` (transparent PNG, 2048x1024: a grid of 12)
> [STYLE] Twelve boat transom names as clean vinyl lettering on transparent background, each centred in its own cell with a hailing port under it "LAKESIDE": Reel Time, Knot On Call, Seas the Day, Lake Effect, Miss Corley, Dock Holiday, Aqua Therapy, Sunset Serenade, Fishful Thinking, Wet Willie, Second Wind, Liquid Asset. Mix of script and block styles in navy, black, red and gold.

**M16 Gelcoat hull** -> `materials/gelcoat.jpg` [TEXTURE]
> [STYLE][TEXTURE] Glossy white fibreglass boat hull gelcoat, close, very slight orange-peel texture, faint grey scuffs, a thin yellowish waterline stain along the bottom fifth. Seamless left to right.

**M17 Flags** -> `town/flags.png` (transparent PNG, 1536x1024)
> [STYLE] A sheet of flat flags on transparent background, each in its own cell, slightly rippled cloth: the US flag, a navy marina burgee with a gold anchor, a red-and-white "diver down" flag, and nautical signal flags A to F.

**M18 Life ring** -> `town/life_ring.png` (transparent PNG, square)
> [STYLE] Top view of an orange-and-white life ring with grab rope, the words "LAKESIDE MARINA" printed round it in black, on transparent background.

**M19 Marina notices** -> `town/notices.png` (1536x1024, a 3x2 grid)
> [STYLE] Six weathered notice signs for a lake marina, each front-on in its cell: "NO WAKE" (white with orange diamond), "SLOW 5 MPH", "NO SWIMMING OFF DOCKS", "LIFE JACKETS SAVE LIVES", "PUBLIC BOAT RAMP", "FISH CLEANING STATION". Real enamel and aluminium road-sign look, a little sun-faded.

**M20 Harbor House concept** -> `concept/harbor_house.png`
> [STYLE] [concept sheet] A two-storey New England style marina office and bait shop: grey-blue clapboard, white trim, navy shutters, a cedar-shingle roof with a white cupola and fish weathervane, a deep porch with rocking chairs facing the docks, an ice chest and bait cooler by the door.

**M21 Dockside Grill concept** -> `concept/dockside_grill.png`
> [STYLE] [concept sheet] A red board-and-batten lakeside grill with roll-up glass garage doors, a plank deck over the beach with tables, striped umbrellas and string lights at dusk.

## X: Things to place (the v243 catalogue: lights, road gear, site gear, garden, yard and play)

The things in the map editor's Things drawer and the block bar's What list (`PROPS` in `js/props.js`) are drawn in flat vertex
colours today. These are the surfaces, faces and glows a texturing pass would give them, grouped so one material serves many
things. Some materials are already in the library, so don't make them again: concrete, planks, plywood, corrugated, fabric,
granite, flagstone, shingles, mulch, sand, tree bark, yellow steel, rust plate, galvanised grating. Seamless tiles get
`[STYLE][TEXTURE]` (and the PBR block after them for Ultra); faces and decals are front-on, filling the frame, with no pole, wall or
shadow round them; transparent ones say so. Signs with words: use the exact wording and ask ChatGPT to "check every letter".
Save each to `art/source/<id>.png`; the file name after the arrow is where the game will look (`textures/things/`).

### Seamless materials (tile 1 m / 3 ft unless the prompt says otherwise)

**X01 Traffic-orange plastic** -> `things/plastic_orange.jpg`. Cones, drums, barricade rails, windsock
> [STYLE][TEXTURE] Moulded high-visibility orange HDPE plastic, faint mould texture, light scuffs, road grime in a few streaks, satin sheen.

**X02 Reflective sheeting stripes** -> `things/reflective_stripe.jpg`. Barricade rails, traffic drum bands. Tile 2 ft wide
> [STYLE][TEXTURE] Retroreflective road-work sheeting: diagonal orange and white stripes at 45°, each stripe 6 in wide, fine micro-prism honeycomb grain in the white, light dust. Tiles left to right and top to bottom with the stripes meeting.

**X03 Galvanised steel pole** -> `things/galvanised.jpg`. Street lights, floodlights, scaffold, flag pole, hoop pole
> [STYLE][TEXTURE] Hot-dip galvanised steel: dull silver-grey spangle crystals, faint white zinc bloom, a few dark weather streaks running vertically.

**X04 Black powder coat** -> `things/powdercoat_black.jpg`. Lamp posts, lantern hooks, path lights, grill cart, string-light wire poles' hardware
> [STYLE][TEXTURE] Satin black powder-coated cast metal, fine orange-peel texture, tiny chips showing grey metal, light dust.

**X05 Cast aluminium light housing** -> `things/alu_housing.jpg`. Street light head, floodlight bodies
> [STYLE][TEXTURE] Grey die-cast aluminium with fine cooling-fin grooves running one way, matte, light grime in the grooves.

**X06 Precast concrete barrier** -> `things/concrete_precast.jpg`. Jersey barriers, culvert pipes, hydrant pad
> [STYLE][TEXTURE] Precast highway-barrier concrete: smooth pale grey with formwork pinholes, faint horizontal form lines, tyre-black scuffs low down, rust drip stains.

**X07 Fresh lumber, face** -> `things/lumber_face.jpg`. Lumber stack, pallets, job-site dunnage
> [STYLE][TEXTURE] Stacked fresh-cut kiln-dried pine 2x6 boards seen side-on: pale yellow wood with grain lines and knots, thin dark gaps between boards, a faint grade-stamp shape with no readable letters.

**X08 Lumber end grain** -> `things/lumber_end.jpg`. Lumber stack ends, firewood ends
> [STYLE][TEXTURE] A wall of sawn board and log ends: pale growth rings, saw marks, a few cracks and darker heartwood, tightly packed.

**X09 Sandbag weave** -> `things/sandbag.jpg`. Sandbag wall
> [STYLE][TEXTURE] Woven polypropylene sandbag fabric, tan, tight basket weave with loose fibres and sand dust, stretched over lumpy fill.

**X10 Silt fence geotextile** -> `things/silt_fabric.jpg`. Silt fence
> [STYLE][TEXTURE] Black woven geotextile silt-fence fabric, fine grid weave, mud splashes on the lower third, a few small tears.

**X11 Tyre rubber, tread and sidewall** -> `things/tyre.jpg`. Tire stacks, wheels on the arrow board, generator and wheelbarrow
> [STYLE][TEXTURE] Black tyre rubber: a band of chunky worn tread across the top half, sidewall with fine radial ribs below, grey dust, no lettering.

**X12 Shipping container steel** -> `things/container_red.jpg`. Shipping container. Tile 2 m
> [STYLE][TEXTURE] Corrugated shipping-container side panel, trapezoid vertical ribs, faded oxide-red marine paint, rust blooms at the dents, white chalk scuffs.

**X13 Pressure-treated wood** -> `things/wood_treated.jpg`. Raised bed, sandbox, swing set, woodpile rack, coop legs
> [STYLE][TEXTURE] Pressure-treated pine boards, greenish-brown with incising slits and grain, slightly weathered, nail heads.

**X14 White-painted wood** -> `things/wood_white.jpg`. Garden arbor, gazebo, Adirondack chair, picket fence
> [STYLE][TEXTURE] Glossy white exterior paint over wood, grain showing faintly through, a few brushed edges and small chips.

**X15 Cedar boards** -> `things/wood_cedar.jpg`. Flower planter, birdhouse, little free library, beehive stand
> [STYLE][TEXTURE] Rough-sawn western red cedar boards, warm red-brown with honey streaks, fine fibrous saw texture.

**X16 Round hay bale wrap** -> `things/hay_round.jpg`. Round hay bale. Tile 1.5 m
> [STYLE][TEXTURE] The rolled outer surface of a round hay bale: dry golden-green hay strands wound in one direction, net-wrap twine faintly across it, seed heads and darker stems.

**X17 Straw bale** -> `things/straw_square.jpg`. Straw bales, scarecrow
> [STYLE][TEXTURE] Cut face of a square straw bale: pale gold straw stalks packed lengthwise, a few clipped ends, dust, one orange baling twine crossing.

**X18 Fieldstone** -> `things/fieldstone.jpg`. Fire pit ring, wishing well
> [STYLE][TEXTURE] A dry-laid fieldstone wall of rounded grey, tan and rust stones of mixed sizes with dark gaps and a little moss.

**X19 Tent nylon** -> `things/tent_nylon.jpg`. Camping tent
> [STYLE][TEXTURE] Forest-green ripstop nylon, small square ripstop grid, soft sheen, a few creases.

**X20 Striped canvas** -> `things/canvas_stripe.jpg`. Hammock, patio umbrella (make a second in blue and white)
> [STYLE][TEXTURE] Heavy cotton canvas in red and cream stripes 3 in wide, visible weave, slightly faded.

**X21 Trampoline mat and pad** -> `things/trampoline.jpg`. Trampoline
> [STYLE][TEXTURE] Top half: black woven polypropylene jumping mat with a fine grid; bottom half: blue vinyl safety pad with stitched seams. Seamless left to right.

**X22 Boxwood foliage** -> `things/foliage_box.jpg`. Hedges, shrubs, arbor greenery
> [STYLE][TEXTURE] A clipped boxwood hedge face: dense small oval leaves, dark and light greens, a few sunlit tips and dark gaps, no sky.

**X23 Flower bed blooms** -> `things/blooms.jpg`. Flower beds, planters, arbor roses
> [STYLE][TEXTURE] Top-down cottage flower bed: petunias, marigolds, zinnias and salvia in red, yellow, purple, pink and white among green leaves, dark mulch peeking through.

**X24 Pumpkin skin** -> `things/pumpkin.jpg`. Jack-o'-lanterns. Tile 30 cm
> [STYLE][TEXTURE] Close-up pumpkin rind: deep orange with paler vertical rib lines, waxy sheen, small speckles and a few soil marks.

**X25 Chicken wire** -> `things/chicken_wire.png`. Coop run, garden fencing. Transparent PNG, tile 30 cm
> [STYLE] Seamless galvanised hexagonal chicken-wire mesh on a fully transparent background, thin twisted wires, even spacing, flat front-on.

**X26 Net mesh** -> `things/net_mesh.png`. Soccer goal, basketball net, trampoline enclosure. Transparent PNG, tile 30 cm
> [STYLE] Seamless white knotted sports netting in a 4 in square mesh on a fully transparent background, flat front-on.

### Faces, signs and decals (not tiling)

**X40 Stop sign face** -> `things/sign_stop.png`. Transparent PNG, 1:1
> [STYLE] A real US octagonal STOP sign face, front-on: retroreflective red with a white border and the word "STOP" in white highway lettering, slight weathering, transparent outside the octagon. Check every letter.

**X41 Speed limit face** -> `things/sign_speed.jpg`. 3:4 portrait
> [STYLE] A US regulatory speed sign face, front-on: white with a thin black border, "SPEED" over "LIMIT" over a large "15" in black highway lettering, light grime. Check every letter.

**X42 Road-work sign face** -> `things/sign_work.png`. Transparent PNG, 1:1 diamond
> [STYLE] An orange diamond road-work sign face, front-on: black border, "ROAD WORK AHEAD" in three lines of black highway lettering, transparent outside the diamond. Check every letter.

**X43 Arrow board panel** -> `things/arrowboard_off.jpg`, `things/arrowboard_on.jpg`. 2:1
> [STYLE] The black matrix panel of a trailer arrow board, front-on: a grid of round amber lamp lenses forming a right-pointing arrow. (a) lamps off, dull amber glass; (b) the arrow lamps lit bright amber with a soft glow, the other lenses dark. Two images, same framing.

**X44 American flag** -> `things/flag_us.jpg`. 19:10
> [STYLE] A US flag, cloth texture, flat front-on and filling the frame, 13 red and white stripes and 50 white stars on blue in correct rows, gentle fabric weave, no wrinkles or shadows.

**X45 Windsock fabric** -> `things/windsock.jpg`. 4:1
> [STYLE] Unrolled airfield windsock fabric, flat: five bands of fluorescent orange and white nylon, stitched seams, slightly faded.

**X46 Container doors** -> `things/container_doors.jpg`. 1:1
> [STYLE] The door end of a 20 ft shipping container, front-on: two oxide-red corrugated doors, four vertical locking bars with cam handles, hinges, rust streaks, a blank grey data plate with no readable text.

**X47 Fuel tank placard** -> `things/tank_diesel.png`. Transparent PNG, 2:1
> [STYLE] A white rectangular decal reading "DIESEL FUEL" over "NO SMOKING" in red block letters, front-on, slightly worn, transparent outside it. Check every letter.

**X48 Generator side** -> `things/genset_side.jpg`. 2:1
> [STYLE] The side of a yellow portable job-site generator, front-on: louvred black vents, a grey control panel with outlets, hour meter and breakers, no brand name.

**X49 Job box front** -> `things/jobbox_front.jpg`. 2:1
> [STYLE] The front of a blue steel job-site gang box, front-on: ribbed lid edge, a hasp and padlock, stamped steel corners, scratches, no brand name.

**X50 Little free library** -> `things/bookbox_front.jpg`. 1:1
> [STYLE] The glass front of a red-painted little free library box, front-on: two shelves of colourful books behind the glass door, a small white sign above reading "LITTLE FREE LIBRARY" and below it "Take a book · Share a book". Check every letter.

**X51 Jack-o'-lantern faces** -> `things/jack_faces.png`. Transparent PNG, 4:1
> [STYLE] Four carved pumpkin faces side by side (friendly grin, toothy, surprised, spooky), each a front-on view of the carved openings glowing warm orange from a candle inside, transparent around each pumpkin.

**X52 Basketball backboard** -> `things/backboard.jpg`. 7:4
> [STYLE] A white acrylic basketball backboard, front-on: red-orange border and shooting square, light scuffs, no logo.

**X53 Cornhole top** -> `things/cornhole_top.jpg`. 1:2 portrait
> [STYLE] A cornhole board top, front-on from above: natural birch plywood with a navy stripe down the left side and a round 6 in hole a third of the way down, light bag scuffs, no logo.

**X54 Mailbox side** -> `things/mailbox.jpg`. 2:1
> [STYLE] The side of a black steel rural mailbox, front-on: domed top, a red flag folded down, a strip of small brass house-number stickers reading "1 2 7", light rust at the bottom edge.

### Light glows (transparent PNG, for the lamps' halos and the pools on the ground)

**X60 Lamp halo** -> `things/glow_halo.png`. 1:1
> [STYLE] A single soft round light halo on a fully transparent background: bright white centre fading smoothly to nothing, faint 6-point star flare, no hard edges, centred.

**X61 Street light pool** -> `things/pool_round.png`. 1:1, black background (used as brightness)
> [STYLE] A top-down pool of light cast on the ground by a street lamp: soft bright white middle fading to black at the edges, slightly uneven like a real LED street light pattern, on pure black.

**X62 Floodlight throw** -> `things/pool_flood.png`. 1:2 portrait, black background
> [STYLE] A top-down floodlight beam pattern on the ground: a long soft white oval brightest near the bottom (nearest the lamp) and fading forward to black, faint lens banding, on pure black.

**X63 Flame sheet** -> `things/flame_sheet.png`. Transparent PNG, 4x2
> [STYLE] A 4x2 sheet of eight frames of a small campfire flame on a transparent background, orange-yellow with white-hot cores and soft edges, each frame in its own equal cell, for animation.

**X64 String-light bulb** -> `things/bulb_glow.png`. Transparent PNG, 1:1
> [STYLE] One glowing warm-white Edison string-light bulb seen front-on: glass globe with a visible filament, bright glow and soft halo, black socket at the top, transparent background.

### Concept sheets (reference for the detailed models)

Add the S section's concept line: "Three-quarter view on a plain light grey background, realistic 3D game-model render style, front, side and back views of the same object on one sheet."

**X80 Lights** -> `concept/things_lights.png`
> [STYLE] [concept sheet] A set of outdoor lights: cobra-head LED street light on a 25 ft pole, black acorn lamp post, twin floodlights on a pole, ground spotlight, black path light bollard, Edison string lights between two wood poles, shepherd's-hook lantern. Show each lit at night as a second row.

**X81 Road and traffic** -> `concept/things_road.png`
> [STYLE] [concept sheet] Type III barricade, concrete Jersey barrier, orange traffic drum, trailer arrow board, stop sign, speed limit sign, red fire hydrant, rural mailbox, windsock.

**X82 Site gear** -> `concept/things_site.png`
> [STYLE] [concept sheet] Stacked concrete culvert pipes, banded lumber bundle on dunnage, sandbag wall, blue job box, yellow portable generator, 20 ft shipping container, scaffold tower with planks, silt fence, tyre stack, wheelbarrow, diesel tank on a stand.

**X83 Farm and garden** -> `concept/things_garden.png`
> [STYLE] [concept sheet] Round hay bale, stacked straw bales, cedar planter of flowers, raised vegetable bed, stone bird bath, birdhouse on a post, white rose arbor, boxwood shrub and hedge, flower bed, jack-o'-lanterns, scarecrow, garden gnome, two beehives, stone wishing well, little free library, red chicken coop with a run.

**X84 Yard and play** -> `concept/things_yard.png`
> [STYLE] [concept sheet] Stone fire pit, stainless gas grill, Adirondack chair, hammock on a stand, patio table with umbrella, white octagonal gazebo, firewood rack, flag pole, dog house, dome camping tent, wooden swing set, trampoline with net, sandbox with toys, portable basketball hoop, backyard soccer goal, cornhole board.

## S: Scenery concept sheets (reference art, not textures; use as guides when building)

Add: "Three-quarter view on a plain light grey background, realistic 3D game-model render style, front, side and back views of the same object on one sheet."

**S01 Job trailer, porta-john, fuel tank, pipe rack** -> `concept/site_props.png`. Needs: S01, S02
> [STYLE] [concept sheet] A construction site prop set: office trailer, porta-john, skid fuel tank, PVC pipe rack, traffic cones, barricade, caution tape stand, job sign, light tower.

**S02 Lighthouse** -> `concept/lighthouse.png`. Needs: S22, I12
> [STYLE] [concept sheet] A small white lighthouse with a red lantern room and stair, on a rocky point.

**S03 Marina and boardwalk** -> `concept/marina.png`. Needs: S18, S21
> [STYLE] [concept sheet] A small lake marina: floating slips, breakwater, fuel dock, bait shop, ice-cream window, cafe, with boats at the slips.

**S04 Farmhouse on Family Island** -> `concept/farmhouse.png`. Needs: I02
> [STYLE] [concept sheet] A big white farmhouse with a deep porch, green shutters, a dock and a lawn.

**S05 Your cabin** -> `concept/cabin.png`. Needs: H01, S11, I13
> [STYLE] [concept sheet] A small timber lake cabin with porch swing, woodstove chimney, rain barrel and fire pit. Also show it in four build stages: footings, frame, roof, finished.

**S06 Lake boats** -> `concept/boats.png`. Needs: M21, M22, S19, S20
> [STYLE] [concept sheet] Runabout, pontoon, fishing boat, johnboat, sailboat, kayak, paddleboard, tug and barge.

**S07 Animals** -> `concept/animals.png`. Needs: S09, S23, H05, H06
> [STYLE] [concept sheet] Deer, goose, eagle, heron, turtle, otter, a friendly dog, a hen and rooster.

**S08 Mountain town main street** -> `concept/town.png`. Needs: T01-T05
> [STYLE] [concept sheet] A small mountain town main street: hardware store, diner, gas station, equipment dealer, feed store, with sidewalks and street lamps.

**S09 Trees by season** -> `concept/trees.png`. Needs: W04, Q15
> [STYLE] [concept sheet] One oak, one maple and one pine each in summer, autumn and winter.

## How to store them

1. Save each full-size result as `art/source/<id>.png`; add a line to `art/README.md` saying which chat prompt made it (so a redo matches).
2. `python3 tools/make_tiers.py art/source/G01.png textures/ground/dirt` writes the four tiers.
3. Nothing loads from `art/source/`; only the tier folders are used by the game, so the phone never downloads the big files.
