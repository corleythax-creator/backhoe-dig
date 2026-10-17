# Backhoe Dig

A 3D low-poly excavator game in one HTML file (three.js r128). Dig a 3 ft trench on a grassy mesa above a mountain lake, expose the gas main without hitting it, load the dump truck and haul the spoil over the cliff edge.

- Live: https://backhoe-dig.vercel.app
- Build time: https://backhoe-dig.vercel.app/build.html (reads `data/effort.js`)
- Claude version: https://claude.ai/artifact/6nxYC5EK3422JouxaZx2DF

## Files

| File | What it is |
| --- | --- |
| `index.html` | The whole game: terrain, excavator, truck, HUD, minimap, speed test |
| `grass.jpg`, `dirt.jpg`, `grime.jpg` | Seamless textures (OpenAI GPT Image, made tileable) |
| `build.html` | Build-time page: ask-to-live per version, triangles, developer-hour estimate |
| `data/effort.js` | Build-time data. The master dashboard reads it for hours |

## Controls

Left stick swings and moves the stick; right stick moves the boom and curls the bucket. Drive and Truck modes put the left stick (or WASD) on the tracks or the truck, and the right stick raises the truck bed. M opens the map.
