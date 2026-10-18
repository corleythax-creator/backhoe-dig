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
| The ground: sculpt, paint materials (32 of them), roads, trees, boulders, where machines park | Map editor | ☰ → Map editor (or G) |
| Your own textures for painting and blocks | Map editor → Paint → + Your own texture: pick a photo or picture, name it, set its tile size in feet, kind and shine, type the owner key | Reaches every device; Edit this texture changes one later |
| Which ideas get built next | Idea board | https://claude.ai/artifact/FMrDEa4VsKvPS5Z3ktTrS3, then send Claude the picked ids |
| Graphics, weather, keys, UI size, turn sensitivity | The game's own settings | ☰ |

If you catch yourself asking Claude for a colour, a label, a size or a position, the screen editor does it.

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
For something that looks wrong, one screenshot and where it is.

## 3. What runs on its own

- **Releases**: `tools/release.py` does the whole release in one step (version number, build log, merge, snapshot).
- **Checks**: every change to the game on `main` is loaded headless by GitHub (the `check` workflow, free on this
  public repo); a red X on the commit means the game threw an error. GitHub emails you when it fails.
- **Testing in a session**: `tools/play.js` runs game code headless in one step instead of a hand-written script.

## 4. Systems that would let you do more yourself

Each is a one-time build that then saves asking Claude for that kind of change. Costs are for a fresh session.

| System | What you'd do yourself afterwards | One-time cost |
| --- | --- | --- |
| **Tuning panel** (like the screen editor, published live) | Speeds, turn rates, dig and bucket rates, jump height, grass growth, how often it rains, how fast mud dries, block sizes: every number the game feels by | about 3-6M tokens |
| **Place-a-thing** in the map editor | Drop houses, sheds, fences, light towers and props from a catalogue onto any island, move and turn them | about 6-10M tokens |
| **Start card and help text editor** | Rewrite the start card, tips and help in the screen editor | about 1-2M tokens |

The build log shows why: 25 of the last 60 versions were small changes of 3 developer hours or less, many of them a
default, a key, a label or a setting to remember. Each was a whole session and release. The tuning panel and the
screen editor between them would cover a good part of that kind of change.
