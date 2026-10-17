// Backhoe Dig build-time tracking, read as data by build.html and the master dashboard. Add a version entry when one ships.
window.EFFORT = {
 "project": "Backhoe Dig",
 "updated": "2026-10-17T05:40:00Z",
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
   "dh": 127,
   "act": 1.0,
   "versions": 10
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
  }
 ]
};
