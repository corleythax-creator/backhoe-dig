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

> STYLE: game-ready asset for a chunky, flat-shaded low-poly construction game set on a lake in the mountains; clean readable shapes,
> slightly stylised realism, no photographic clutter. Flat, even, shadowless lighting (no baked shadows, no sun glare, no vignette), so
> the game can light it. No text, logos, watermarks, borders or people unless asked. Colours slightly saturated, warm earthy palette
> (red clay, sun-bleached grass, lake blue, safety yellow).

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
> [STYLE] A 3x2 sheet of six puffy low-poly-friendly cumulus clouds, soft white with light grey undersides, on transparent, no sky.

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
> [STYLE] A seamless horizontally tiling strip (6:1) of layered blue-grey pine mountain ridges fading into haze, transparent above the top ridge, slightly stylised, three depth layers.

**E06 Far-shore town lights** -> `sky/town_night.png`. Needs: S08, T10
> [STYLE] A tileable 8:1 strip of a far lakeshore at night: small clusters of warm yellow window lights and a few white street lights, on transparent.

**E07 Skyline** -> `sky/skyline.png`. Needs: T13, T12
> [STYLE] A tileable 8:1 hazy blue-grey city skyline of simple blocky towers in silhouette with a few lit windows, transparent above.

## U: Interface icons (flat, readable at phone size)

Add: "Flat vector style, thick dark outline, a single bold subject centred on a transparent background, readable at 64 px, no text."
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

## S: Scenery concept sheets (reference art, not textures; use as guides when building)

Add: "Three-quarter view on a plain light grey background, low-poly flat-shaded game-model style, front, side and back views of the same object on one sheet."

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
