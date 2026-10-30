# Building Corley's Island without burning tokens

The owner's playbook: what to change yourself, when to bring in Claude, and how to ask so it costs the least.

## Where the tokens go

Every step Claude takes (reading a file, running a test, editing) re-reads the whole conversation so far. A step in a
fresh session reads about 30-50k tokens; the same step at the end of a long session reads 400k or more. So the cost of
a feature is roughly **steps × session length**, and the two levers are fewer steps and shorter sessions.

## 1. Change it yourself (no tokens)

| You want to change | Use | Where |
| --- | --- | --- |
| How the screen looks: colours, fonts, sizes, corners, hiding, renaming, moving a part, docking bars, phone vs. computer layouts | Screen editor | ☰ → Edit the screen, or https://claude.ai/artifact/Bj6MjgPkszqEP2PJQqQ29t. Publish with your owner key |
| The ground: sculpt, paint materials (32 of them, plus your own), tall grass to mow, roads, trees, boulders, where machines park | Map editor | ☰ → Map editor (or G) |
| Town layout: paved streets with curbs, sidewalks and a centre line; street lights, lamp posts, street trees, benches, hydrants or planters along them; any thing placed anywhere, the mainland's town included | Map editor → Roads → New street (or Paved on a road's card); Line the street on its card; Things → Add | Each part stays editable: drag a street's dots, change its width, curbs and sidewalks; placed lights and trees are ordinary things to move, turn, size or delete |
| Houses, sheds, fences, gates, lights (street lights, lamp posts, floodlights, spotlights, path and string lights, lanterns, with a light colour), road gear, garden, yard and play things: place, move, turn, resize, copy, delete | On foot: Blocks → the What list (or T), then Place, Lift and Turn as for blocks. Map editor → Things: Add (pick from the drawer; One, Stamp, Line for fence runs and cone lines, Scatter for woods), then Select (several at once, or a whole kind from On the map); exact spots in feet, Snap to a grid, the turn and size ring, Line up, Row, Copy and Paste; Hide (H) and Lock (L) |
| Measure a distance, a slope or an area; send the machines back to where they start | Map editor → Inspect: Measure; Back to start with a machine picked (or every machine from On the map) |
| Keep several maps, back one up as a file, see what a map holds, start one layer over, jump back several steps | Map editor → Map (named maps, Download file and Open a file, This map, Start over by layer); History ▾ in the top bar | Saved with the map, so it syncs |
| Your own textures for painting and blocks | Map editor → Paint → + Your own texture: pick a photo or picture, name it, set its tile size in feet, kind and shine, type the owner key | Reaches every device; Edit this texture changes one later |
| Every machine, thing, tree, texture and sound, sorted by triangles, size, file size or length | Asset Yard | https://claude.ai/artifact/NLPTKgySUp8nYd1goDSBmw (rebuilt by `node tools/asset-yard.js OUT`, page `docs/asset-yard.html`) |
| See every townsperson in 3D and walking, leave some out of town, get photo prompts for faces and new looks (a new person or outfit: add it to `tools/peds/folk_cast.py`, README "Townsfolk") | Townsfolk | https://claude.ai/artifact/DhETVoSgbJpSHezs3keXP2 (page `docs/townsfolk.html`, with `models/peds/` files). Publish to game needs your Supabase connector; else Copy number into the Tuning tab (Town, Townsfolk left out) |
| Which ideas get built next | Idea board | https://claude.ai/artifact/FMrDEa4VsKvPS5Z3ktTrS3, then send Claude the picked ids |
| Graphics, weather, keys, UI size, turn sensitivity | The game's own settings | ☰ |
| How the game feels: top speeds, turn rates, pay for each kind of work, the fuel price and how much fuel the machines burn, swing, boom, stick and bucket rates, bucket and bed sizes, truck grip and braking, jump height and gravity, block reach, mowing height, grass regrowth, how often and how hard it rains, the wind that leans the rain, how much rain runs off and how fast it washes dirt down, how fast mud dries, how deep machines sink and get stuck, dig speed per soil, dirt fluff, cave-ins, groundwater and the pump, the High-graphics ground look (relief depth, sheen, extra sheen in rain, how far the relief reaches, and the bumps in the natural dirt and grass), how much the trees and undergrowth sway and how much sun shines through their leaves, and the Ultra screen effects (contact shade strength and reach, glow strength and threshold, grade contrast, colour strength, vignette) | Screen editor, Tuning tab | ☰ → Edit the screen → Tuning, or the claude.ai screen editor. Publish the tuning with your owner key: every device plays by the same numbers |
| The words: the start card, every Controls entry, the tips that pop up, the stick captions | Screen editor, Words tab | ☰ → Edit the screen → Words, or the claude.ai screen editor. Write `[jump]` for a key, it follows each player's keys. Publish with the look |

If you catch yourself asking Claude for a colour, a label, a size, a position, a speed or the words of a tip, the screen editor does it.

## 2. When you do need Claude

New behaviour, new things in the world, fixes, and anything the editors can't reach.

- **One job per session.** Start a fresh session for each feature (or each batch of small ones). Claude says so once a
  session passes about 300k tokens; that's the moment to start over.
- **Quick questions go in a fresh session too.** "How big is X?" costs a few hundred thousand tokens late in a long
  session, and a few tens of thousands in a new one.
- **Batch the small stuff.** Ten one-line tweaks in one message cost a little more than one tweak; ten messages cost ten
  times as much. Keep a list, then send it.
- **Ask for the release in the same message.** Sessions release on their own when done (CLAUDE.md), so one message can
  take a feature from idea to live.
- **Pick the model for the job.** Small fixes, text, defaults and releases: a smaller model (`/model`, e.g. Sonnet).
  New systems, the ground, digging, physics: the bigger one.

### The request template

```
Corley's Island (repo backhoe-dig). Read CLAUDE.md and follow its rules.

Task: [what the player should see or do, where (machine / island), in feet, mph or seconds where it matters]
Must not change: [anything that has to stay as it is]
Done when: [how you'll know it works]

Build it, check it with tools/play.js, and release it with tools/release.py. I asked at [time] Central today.
```

A batch of small ones:

```
Corley's Island (repo backhoe-dig). Read CLAUDE.md and follow its rules.

Small changes, one release for all of them:
1. ...
2. ...
3. ...

Check them with tools/play.js and release with tools/release.py. I asked at [time] Central today.
```

Precise asks save rounds of back-and-forth: "the mower's top speed 8 mph instead of 6" beats "the mower feels slow".
For something that looks wrong, one screenshot and where it is. Best: open the map editor at that spot, press **Copy view**
and paste the code (`view 40,-150,315,55,148`); Claude opens its headless screenshot at exactly that camera.

## 3. What runs on its own

- **Everything in one place**: https://corleys-island.vercel.app/hub.html shows the version, the roadmap, the design doc, the changelog (rebuilt by every release), the ideas and the credits, with links to the game, the build log and the editors. To change the roadmap or the design doc, edit `docs/ROADMAP.md` or `docs/GDD.md` on GitHub (the pencil button) or ask Claude.
- **Releases**: `tools/release.py` does the whole release in one step (version number, build log, merge, snapshot).
- **Checks**: every change to the game on `main` is loaded headless by GitHub (the `check` workflow, free on this
  public repo); a red X on the commit means the game threw an error. GitHub emails you when it fails.
- **Testing in a session**: `tools/play.js` runs game code headless in one step instead of a hand-written script.
- **Dig checks**: the same `check` workflow runs the dig site test's checks (digging across tile edges, the grid following the machine between islands, saves) and goes red if one fails.
- **Frame rate on your phone**: open https://corleys-island.vercel.app/?digtest=low and put the phone down. It digs at every dig site and drives between the islands by itself for about 2 minutes, then puts your site back and shows FPS for each part (30 passes). Copy results and paste them to Claude if anything is red. `?speedtest` runs the older speed test the same way.
- **Backhoe or excavator controls and loading speed**: open https://corleys-island.vercel.app/?bhtest=low for the backhoe or ?extest=low for the excavator (or ☰ → Backhoe load test / Excavator load test). From the cab it works each arm control, then digs and dumps six buckets into the dump truck by itself (about a minute), coming out behind the truck at each dump to watch the bucket empty, and shows which controls passed, how long a pass takes, cubic yards an hour, minutes to fill the truck and the cab's FPS. Copy results and paste them to Claude.
- **Art prompts**: `docs/IMAGE_PROMPTS.md` has ready-to-paste ChatGPT prompts for textures, icons, sprites and concept art (Ultra source quality); `tools/make_tiers.py` cuts a saved image into the Ultra / High / Medium / Low sizes.

## 4. Systems that would let you do more yourself

Each is a one-time build that then saves asking Claude for that kind of change. All four from the first list (the
tuning panel, the words editor, your own textures and place-a-thing) are built and now sit in the table in section 1.
Ideas for the next ones: a shipped default map everyone starts from, editing the other islands in the map editor, and
your own models for the catalogue.

The build log shows why: 25 of the last 60 versions were small changes of 3 developer hours or less, many of them a
default, a key, a label or a setting to remember. Each was a whole session and release. The screen editor's Tuning
and Words tabs now cover a good part of that kind of change: a number the panel doesn't have yet is a small ask (add it
to `TUNE` in `js/tune.js`).
