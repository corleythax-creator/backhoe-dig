// Corley's Island: the tuning, every number the game feels by (top speeds, turn and arm rates, bucket and bed sizes,
// jump height, grass regrowth, rain, drying, groundwater, mud, digging and cave-ins). The game reads them from TU while it runs, so a change takes
// at once. The owner edits them on the screen editor's Tuning tab (js/gui.js) and publishes them, with the owner key or
// from the claude.ai screen editor, as the live tuning every device loads when the game opens (Supabase,
// supabase/island_tune.sql; only on the Vercel site, as the skin is). It is behaviour, not looks, so there is no phone
// or computer layer: saves sync between devices and must play the same on each.
// A tuning: {v:1, t: when it went live (ms), set:{key: value}} with only the changed values, in the units the code uses
// (metres, seconds, radians); the editor shows them in mph, ft, degrees and yd³.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md. This file needs nothing from the
// others, so the claude.ai screen editor can load it alone.
// [key, group, name, default, unit, lowest, highest, step] (lowest, highest and step in the units shown)
const TUNE=[
  ['exTrack','Excavator','Track speed',2.6,'mph',0.5,15,0.1],['exTurn','Excavator','Track turn rate',0.8,'deg',5,180,1],
  ['exSwing','Excavator','Swing rate',0.85,'deg',5,180,1],['exBoom','Excavator','Boom rate',0.6,'deg',5,180,1],
  ['exStick','Excavator','Stick rate',0.8,'deg',5,180,1],['exBucket','Excavator','Bucket curl rate',1.3,'deg',5,240,1],
  ['exCap','Excavator','Bucket holds',1.0,'yd3',0.2,5,0.05],
  ['exPour','Excavator','How fast the bucket pours',1,'pct',10,500,5],['exSpill','Excavator','Spill from a fast swing with a full bucket',1,'pct',0,500,5],
  // the bucket's angle (D08): teeth leading into the cut dig as deep as they go; dragged flat or back first it only skims
  ['bkAngle','Excavator','How much the bucket\'s angle in the cut matters (0% = it digs the same at any angle)',1,'pct',0,100,5],
  ['bkSkim','Excavator','A bucket dragged flat or back first only skims',0.05,'in',0.5,12,0.5],
  // the quick coupler's attachments (coupler.js)
  ['cpReach','Attachments','The coupler picks up an attachment from',0.9,'ft',1,8,0.25],
  ['cpHammer','Attachments','Hammer: how much faster than the bucket it gets through rock and clay',4,'pct',100,1000,10],
  ['cpAuger','Attachments','Auger: how fast it bores (of the bucket\'s dig speed)',0.8,'pct',10,300,5],
  ['cpBore','Attachments','Auger: hole across',0.5,'in',12,36,1],
  ['cpGrip','Attachments','Thumb: biggest block it can grip (each way)',1.25,'ft',1,10,0.5],
  ['trTop','Dump truck','Top speed',8.9,'mph',2,60,0.5],['trRev','Dump truck','Top speed in reverse or bed up',2.7,'mph',1,30,0.5],
  ['trSteer','Dump truck','Steering rate',1.1,'deg',10,240,1],['trGrip','Dump truck','Grip in turns',1,'pct',20,300,5],
  ['trBrake','Dump truck','Braking',1,'pct',10,400,5],['trLoadMass','Dump truck','How much a full load weighs it down',1,'pct',0,300,5],
  ['trBedUp','Dump truck','Bed raise rate',0.4,'deg',2,120,1],['trBedDown','Dump truck','Bed lower rate',0.55,'deg',2,120,1],['trCap','Dump truck','Bed holds',12/1.308,'yd3',2,40,0.5],
  ['mwFwd','Mower','Top speed forward',3.6,'mph',1,25,0.1],['mwRev','Mower','Top speed back',1.8,'mph',0.5,20,0.1],
  ['skSpd','Skid steer','Top speed',3.1,'mph',1,25,0.1],['skTurn','Skid steer','Turn rate',1.7,'deg',10,300,1],
  ['skArm','Skid steer','Arm rate',0.55,'deg',5,180,1],['skCurl','Skid steer','Bucket curl rate',0.9,'deg',5,240,1],
  ['skCap','Skid steer','Bucket holds',0.38,'yd3',0.1,3,0.05],
  ['hvDzSpd','Dozer','Top speed',2.4,'mph',1,15,0.1],['hvDzTurn','Dozer','Turn rate',0.6,'deg',5,120,1],['hvDzBlade','Dozer','Blade rate',0.35,'deg',5,90,1],
  ['hvDzCap','Dozer','Blade carries',1.9,'yd3',0.5,8,0.1],['hvRipD','Dozer','Ripper reaches down',0.75,'ft',0.5,3,0.1],
  ['hvLdSpd','Wheel loader','Top speed',5.4,'mph',2,30,0.5],['hvLdLock','Wheel loader','Steering lock',0.7,'deg',10,50,1],
  ['hvLdArm','Wheel loader','Arm rate',0.45,'deg',5,90,1],['hvLdCurl','Wheel loader','Bucket curl rate',0.8,'deg',5,180,1],['hvLdCap','Wheel loader','Bucket holds',1.9,'yd3',0.5,6,0.1],
  ['bhSpd','Backhoe','Top speed',15*0.44704,'mph',2,30,0.5],['bhLock','Backhoe','Steering lock',0.62,'deg',10,50,1],
  ['bhLdArm','Backhoe','Loader arm rate',0.5,'deg',5,90,1],['bhLdCurl','Backhoe','Loader bucket curl rate',0.9,'deg',5,180,1],['bhLdCap','Backhoe','Loader bucket holds',1.0/1.308,'yd3',0.3,4,0.05],
  ['bhSwing','Backhoe','Hoe swing rate',0.7,'deg',5,180,1],['bhBoom','Backhoe','Hoe boom rate',0.6,'deg',5,180,1],['bhStick','Backhoe','Hoe stick rate',0.8,'deg',5,180,1],
  ['bhBucket','Backhoe','Hoe bucket curl rate',1.3,'deg',5,240,1],['bhCap','Backhoe','Hoe bucket holds',0.33/1.308,'yd3',0.1,2,0.05],
  ['bhOutT','Backhoe','Outriggers down or up in',2.2,'s',0.5,10,0.1],['bhSeatT','Backhoe','Seat swivels round in',1.2,'s',0.3,5,0.1],
  ['hvSmSpd','Semi','Top speed',15.6,'mph',5,70,1],['hvSmLock','Semi','Steering lock',0.6,'deg',10,45,1],
  ['pkSpd','Pickup','Top speed',35*0.44704,'mph',5,120,1],['pkRev','Pickup','Top speed in reverse',10*0.44704,'mph',2,30,1],
  ['pkAcc','Pickup','Acceleration (engine pull)',1,'pct',20,400,5],['pkBrake','Pickup','Braking',1,'pct',20,400,5],
  ['pkLock','Pickup','Steering lock',0.6,'deg',10,50,1],['pkGrip','Pickup','Grip in turns (lower slides sooner)',1,'pct',20,400,5],
  // the pickups' beds and the store in town (pickup.js)
  ['bedGrip','Pickup bed','How well loads grip the bed (lower slides sooner)',0.45,'pct',5,150,5],['bedMax','Pickup bed','Most things the bed holds',32,'n',1,40,1],
  ['bedReach','Pickup bed','How far from the bed you can load it',0.9,'ft',1,10,0.5],['mulchW','Pickup bed','A bag of mulch spreads this wide',1.8,'ft',2,20,0.5],
  ['shopRestock','Pickup bed','The store restocks one of each every',180,'min',0.5,60,0.5],
  ['atSpd','Four-wheeler','Top speed',30*0.44704,'mph',5,90,1],['atRev','Four-wheeler','Top speed in reverse',7*0.44704,'mph',2,25,1],
  ['atAcc','Four-wheeler','Acceleration (engine pull)',1,'pct',20,400,5],['atBrake','Four-wheeler','Braking',1,'pct',20,400,5],
  ['atLock','Four-wheeler','Steering lock',0.7,'deg',10,50,1],['atGrip','Four-wheeler','Grip in turns (lower slides sooner)',0.85,'pct',20,400,5],
  ['wkRun','On foot','Jog (stick all the way)',2.8,'mph',1,20,0.1],['wkSwim','On foot','Swim',1.1,'mph',0.5,10,0.1],['wkSprint','On foot','Sprint',5.6,'mph',1,40,0.1],
  ['wkJump','On foot','Jump height',6.2*6.2/(2*9.8),'ft',0.5,30,0.1],['wkGrav','On foot','Gravity (how floaty a jump is)',1,'pct',10,300,5],
  ['stepMud','On foot','Footsteps squelch where the ground is wetter than',0.45,'pct',5,100,5],['wkLook','On foot','Camera turn speed with the stick',1,'pct',20,400,5],['wkReachUp','On foot','How high the worker reaches for blocks',2.3,'ft',2,20,0.5],['blkReach','On foot','Farthest block reach (cab view)',80*0.3048,'ft',10,300,5],
  ['bkSpd','Dirt bike','Top speed',13.4,'mph',5,60,0.5],['bkPull','Dirt bike','Engine pull',1,'pct',20,300,5],['bkLock','Dirt bike','Steering lock at a crawl',0.55,'deg',5,60,1],
  ['btSpeed','Boats','Top speed',11,'mph',2,60,0.5],['btTurn','Boats','Turn rate at speed',0.9,'deg',10,180,1],
  ['trimLine','String trimmer','Line out after a bump (longest)',0.15,'in',2,12,0.25],['trimMin','String trimmer','Shortest line that still cuts',0.025,'in',0.25,6,0.25],
  ['trimBump','String trimmer','Line one bump feeds out',0.04,'in',0.25,6,0.25],['trimWear','String trimmer','Line worn away per second of cutting',0.006,'in',0.02,2,0.02],
  ['trimSpool','String trimmer','Line on a full spool',25*0.3048,'ft',2,100,1],
  ['lawnCut','Grass','Mower cuts the grass to',0.09,'in',1,24,0.5],['lawnWait','Grass','Wait before cut grass grows',45,'s',0,1200,5],['lawnGrow','Grass','Time to grow back tall',240,'s',10,3600,10],
  ['rainGap','Weather','Dry spell between showers (average)',510,'min',0.5,120,0.5],['rainLen','Weather','Shower length (average)',180,'min',0.5,60,0.5],
  ['soak','Weather','How fast rain soaks the ground',1,'pct',10,500,5],
  ['rainHard','Weather','How hard it rains',1,'pct',10,300,5],['puddleDrain','Weather','How fast puddles drain',1,'pct',0,1000,10],
  ['rainWind','Weather','Wind in the rain (leans the drops)',2.2,'mph',0,40,0.5],
  ['runoff','Weather','How much rain runs off instead of soaking in',1,'pct',0,300,5],['erode','Weather','How fast running water carries loose dirt',1,'pct',0,500,5],
  ['mudDry','Mud and water','Soaked ground dries in about',1200,'min',1,240,1],
  ['seep','Mud and water','Groundwater seeps in',1,'pct',0,500,5],['pump','Mud and water','Pump drains',1,'pct',10,1000,10],
  ['wtDepth','Mud and water','Water table depth',1.85,'ft',1,40,0.5],
  ['rutDepth','Mud and water','How deep tracks and tires sink',0.23,'in',1,24,0.5],['mudDrag','Mud and water','How much mud slows the machines',1,'pct',0,200,5],
  ['stuck','Mud and water','How easily machines get stuck',1,'pct',0,500,5],
  ['rutWet','Mud and water','How wet ground must be before it ruts',0.15,'pct',0,100,5],['rutRate','Mud and water','How fast ruts cut in',1,'pct',10,500,5],
  ['rutBerm','Mud and water','How high mud piles up beside the ruts',0.2,'in',0,24,0.5],
  ['soilTop','Digging','Dig speed in topsoil (of full speed)',0.7,'pct',5,100,1],['soilClay','Digging','Dig speed in clay',0.45,'pct',5,100,1],
  ['soilSand','Digging','Dig speed in sand',0.85,'pct',5,100,1],['soilRock','Digging','Dig speed in rock',0.12,'pct',2,100,1],
  ['fluff','Digging','How much dug dirt fluffs up (100% = about a quarter)',1,'pct',0,400,5],
  ['slopeDamp','Digging','How much steeper damp sand and soil stand',1,'pct',0,300,5],['slopeWet','Digging','How much soaked soil slumps (0% = holds like dry)',1,'pct',0,200,5],
  ['slopeSlide','Digging','How far a face slides back under its angle when it lets go',0.1,'pct',0,40,1],
  ['clayStick','Digging','Most moist clay that sticks in a bucket or bed when tipped',0.25,'pct',0,100,1],['clayShake','Digging','How much each shake knocks loose',0.3,'pct',0,100,5],
  ['packRate','Excavator','How fast wet clay packs into the tracks',1,'pct',0,500,5],['packDrag','Excavator','How much packed tracks drag',0.6,'pct',0,90,5],
  ['packShed','Excavator','How fast packed clay drops off',1,'pct',0,500,5],
  ['caveDepth','Cave-ins','Walls start to cave in deeper than',1.2,'ft',1,30,0.5],['caveSpoil','Cave-ins','Spoil this close to the edge loads the wall',0.64,'ft',0,10,0.5],
  ['craneSpan','Bridges','The crane builds a steel span in about',240,'min',1,60,1],
  ['caveRate','Cave-ins','How fast a bad wall gives way (0% = never)',1,'pct',0,500,5],['caveWarn','Cave-ins','Dirt trickles off the lip for',2.2,'s',0,20,0.5],
  // only drawn on High graphics (Graphics → Material relief); how the ground looks, not what it does, so every device may use the same numbers
  ['pbrRelief','Ground look','Relief: how deep the bumps in gravel, brick and concrete look',1,'pct',0,300,5],
  ['pbrSheen','Ground look','Sheen: how strong the glints on wet and shiny ground are',1,'pct',0,300,5],
  ['pbrRain','Ground look','Extra sheen while it rains',1,'pct',0,400,5],['pbrGround','Ground look','Relief: how bumpy the natural dirt and grass look',0.9,'pct',0,300,5],
  ['pbrFace','Ground look','Relief: how deep the bucket-tooth grooves, cracks, pebbles and roots on dug faces look',1,'pct',0,300,5],
  ['fxAo','Screen effects','Shade where things meet and in hollows (Ultra)',1,'pct',0,200,5],['fxAoR','Screen effects','How far that shade reaches',1.6,'ft',0.5,10,0.25],
  ['fxBloom','Screen effects','Glow round bright light (Ultra)',0.2,'pct',0,200,5],['fxBloomThr','Screen effects','How bright light must be to glow',0.88,'pct',40,99,1],
  ['fxCon','Screen effects','Contrast of the colour grade (Ultra)',0.3,'pct',0,100,5],['fxSat','Screen effects','Colour strength of the grade',0.97,'pct',50,150,1],
  ['fxVig','Screen effects','Darker corners (vignette)',0.22,'pct',0,80,2],
  // Ultra lighting (post.js): how much the sky colours the shade, how soft the sun's shadows get, the rain on the machines
  ['ultraSky','Ultra','Sky lighting: how much the sky as it is colours the shade and reflections',1,'pct',0,200,5],
  ['ultraShSoft','Ultra','Soft sun shadows: blur per foot a shadow falls from what casts it',0.03,'pct',0,10,0.5],
  ['ultraDrops','Ultra','Rain on machines: how many beads and runs of water',1,'pct',0,300,5],
  ['ultraWetGround','Ultra','Wet ground shine: how strongly soaked dirt and mud mirror the sky',1,'pct',0,300,5],
  ['pbrFar','Ground look','Relief fades out by',180*0.3048,'ft',60,600,10],
  ['treeSway','Trees','How much the trees and undergrowth sway in the breeze',1,'pct',0,400,5],['treeGlow','Trees','How much sunlight shines through the leaves',1,'pct',0,300,5],
  // how the clock runs (☰ menu, Time) and how dark the night gets
  ['dayLen','Day and night','A whole day (24 hours) passes in',2880,'min',2,1440,1],
  ['nightLight','Day and night','Moonlight and starlight at night',1,'pct',0,400,5],
  ['lampLight','Day and night','Headlights, lamps and lit windows',1,'pct',0,300,5],
  // VR headset (vr.js): how the right stick turns you on foot
  ['vrTurn','VR','Turn speed on foot with the right stick (0 = 30° snap steps)',120*Math.PI/180,'deg',0,360,5],
  ['vrComfort','VR','Comfort vignette: how far the view darkens at its edges while you drive fast or turn (0 = off)',0.5,'pct',0,100,5]];
// unit: [shown = code value × factor, label]
const TUNE_U={mph:[1/0.44704,'mph'],ft:[1/0.3048,'ft'],deg:[180/Math.PI,'°/s'],yd3:[1.307951,'yd³'],pct:[100,'%'],s:[1,'s'],min:[1/60,'min'],in:[1/0.0254,'in'],n:[1,'']};
const tuneShow=(e,v)=>v*TUNE_U[e[4]][0];
const tuneCode=(e,d)=>d/TUNE_U[e[4]][0];
// the values the game runs on
const TU={};
const tune={live:null,draft:null};
const TUNE_LS='bhd_tune',TUNE_LIVE_LS='bhd_tune_live';
// a tuning from anywhere (a save, the server, a paste): known keys only, each kept within its range
function tuneNorm(o){const s={v:1,t:0,set:{}};if(!o||typeof o!=='object')return s;s.t=+o.t||0;
  if(o.set&&typeof o.set==='object')for(const e of TUNE){const v=+o.set[e[0]];if(o.set[e[0]]===undefined||!isFinite(v))continue;
    const a=tuneCode(e,e[5]),b=tuneCode(e,e[6]);s.set[e[0]]=Math.min(Math.max(a,b),Math.max(Math.min(a,b),v))}
  return s}
function tuneParse(t){try{return t?tuneNorm(JSON.parse(t)):null}catch(e){return null}}
function tuneLs(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){}return null}
// this device's unpublished tuning while the owner tries it, else the live one, else the game's own numbers
function tuneUse(){const s=(tune.draft||tune.live||{set:{}}).set;for(const e of TUNE)TU[e[0]]=s[e[0]]!==undefined?s[e[0]]:e[3]}
tune.live=tuneParse(tuneLs(TUNE_LIVE_LS));tune.draft=tuneParse(tuneLs(TUNE_LS));tuneUse();
