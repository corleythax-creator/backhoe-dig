# Backhoe Dig: notes for Claude

- Pushes to `main` deploy to Vercel (project `backhoe-dig`, Corley team). The claude.ai artifact (https://claude.ai/artifact/6nxYC5EK3422JouxaZx2DF) is the same game; `index.html` here is the artifact file wrapped in a doctype and head. Keep both in step.
- Owner preferences for this game: flat-shaded low-poly look, imperial units in everything shown, large readable HUD text, runs above 30 FPS on his phone.
- When a version ships, add an entry to `versions` in `data/effort.js` (asked/live times in Central, estimated developer hours, triangles from a headless scene count, file size) and add its hours to that day in `days` (`dh`, and `act` as half-hour blocks holding a release). The master dashboard (`corley-master-dashboard`, `LIVE`) and `build.html` both read it.
- Dev hours are a feature-by-feature judgment of one experienced three.js developer working by hand.
