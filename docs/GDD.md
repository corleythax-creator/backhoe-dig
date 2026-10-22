# Corley's Island: game design document

*Draft, Oct 22 2026 (v190). Lines marked **Owner to decide** are open questions; answer them and this becomes the plan.*

## The pitch

A true-to-life construction sim on a set of islands in a mountain lake. You run real machines (excavator, dump truck, dozer, loader, skid steer and more) to dig, haul, grade and build, then take a mower, a dirt bike, a boat or a four-wheeler round your own island when the work is done. It plays in a browser on a phone or a PC with no install, and the save follows you between them.

## Who it's for

- **Main player:** Corley, on his phone and his PC. The game is built to his taste first.
- **Also:** his family (Jessica and Dexter have islands of their own; idea I28 is to play together live), and anyone who likes heavy-equipment sims (*Construction Simulator*, *Farming Simulator*, *Expert Digger*).

## What it should feel like

- **Real.** Machines move as their hydraulics allow, dirt piles up, slumps and caves in, mud ruts and bogs you down, rain soaks the ground and it dries pale and cracked. When there is a choice between real and easy, pick real, then make the controls kind.
- **Calm.** No timer forcing you along; a day runs in 48 minutes with a real sun and moon over Lake Ouachita, Arkansas. Work, then mow, ride, take a boat out or plant a tree.
- **Yours.** The owner reshapes the world himself: the map editor (ground, paint, roads, trees, assets), the screen editor (the HUD's look) and the Tuning tab (every number the game feels by).

## Look and feel targets

- Modern, photorealistic: true-to-life PBR materials, lighting and detail, the look of a AAA construction sim. The Ultra graphics tier (idea Q15) is where it lands; Low, Medium and High scale down for phones.
- Above 30 FPS on Corley's phone on Low. Drawing cost goes behind the Graphics setting; behaviour (dirt, water, mud) is the same on every device.
- Imperial units everywhere on screen; large, readable HUD text.
- Sounds cut from real field recordings.

## Core loop

1. **Pick a job:** today, the trench on Corley's mesa: dig 3 ft deep, expose the gas main without hitting it.
2. **Do it with the right machines:** dig, load the dump truck, haul the spoil, set the trench box, grade.
3. **See the result:** stats count dirt moved, grass mowed, time in each machine; every hole is kept and saved.
4. **Free time:** mow, plant trees that grow over real days, ride, boat, visit the family islands, play chess at the pavilion.

**Owner to decide:** what pulls you back tomorrow? Today the loop ends at step 4. The ideas that close it are work orders (J01), pay and the day's log (J15, 40% done), bidding a job (J24), production targets (J44) and an operator certification ladder (Y13). Pick one: **money** (earn, buy machines and land), **mastery** (certifications, scored jobs) or **the island itself** (build it up job by job).

## The world

| Place | What's there |
|---|---|
| Corley's Island | The mesa top (Lookout Knoll, West Rise), the trench site and gas main, a ramp down a 24 ft scarp to the Lower Bench dirt yard |
| Family Island | The family house, picnic pavilion with chess and checkers tables (open the Mesa games), fire pit, the steel truss bridge |
| Dexter's Island | His yard: shed, office trailer, light towers, a cone course, a dirt bike track, his machines, the yellow haul bridge |
| Jessica's Island | Forest paths and lanterns, herb garden, cliff bench, the cottage with its library, the red covered footbridge |
| The mainland | A field, woods, the town's shops, marina and boardwalk; a crane barge building the temporary trestles |

## Machines and ways to get around

Excavator (with trench box), dump truck, dozers, wheel loaders, semis, skid steer, zero-turn mower, dirt bike, pickups, four-wheelers, boats, and the worker on foot (walk, run, jump, swim, plant trees, ride).

## Systems in place

Diggable ground with soil layers, slumping and cave-ins · loose dirt, ruts and mud · rain, groundwater, puddles, runoff and drying · day and night with the real sun, moon and stars · storms with lightning · a map editor and a screen editor · live tuning · blocks to build with · tree planting and growth · stats · four graphics tiers · rebindable keys · saves synced between devices · VR (WebXR) underneath.

## Out of scope (for now)

Multiplayer beyond the family (I28), app stores, paid content, combat.

## Where the rest lives

- What's coming next: `docs/ROADMAP.md`
- Every idea, scored: `docs/IDEAS.md` and the idea board
- What changed: `CHANGELOG.md`
- How the code works: `README.md`
- Who made the sounds, models and textures: `CREDITS.md`
