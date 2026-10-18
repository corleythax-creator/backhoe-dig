// Corley's Island: the tuning, every number the game feels by (top speeds, turn and arm rates, bucket and bed sizes,
// jump height, grass regrowth, rain, drying, groundwater). The game reads them from TU while it runs, so a change takes
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
  ['trTop','Dump truck','Top speed',8.9,'mph',2,60,0.5],['trRev','Dump truck','Top speed in reverse or bed up',2.7,'mph',1,30,0.5],
  ['trSteer','Dump truck','Steering rate',1.1,'deg',10,240,1],['trCap','Dump truck','Bed holds',12/1.308,'yd3',2,40,0.5],
  ['mwFwd','Mower','Top speed forward',3.6,'mph',1,25,0.1],['mwRev','Mower','Top speed back',1.8,'mph',0.5,20,0.1],
  ['skSpd','Skid steer','Top speed',3.1,'mph',1,25,0.1],['skTurn','Skid steer','Turn rate',1.7,'deg',10,300,1],
  ['skArm','Skid steer','Arm rate',0.55,'deg',5,180,1],['skCurl','Skid steer','Bucket curl rate',0.9,'deg',5,240,1],
  ['skCap','Skid steer','Bucket holds',0.38,'yd3',0.1,3,0.05],
  ['wkRun','On foot','Jog (stick all the way)',2.8,'mph',1,20,0.1],['wkSprint','On foot','Sprint',5.6,'mph',1,40,0.1],
  ['wkJump','On foot','Jump height',6.2,'jump',0.5,30,0.1],['blkReach','On foot','Farthest block reach (cab view)',80*0.3048,'ft',10,300,5],
  ['lawnWait','Grass','Wait before cut grass grows',45,'s',0,1200,5],['lawnGrow','Grass','Time to grow back tall',240,'s',10,3600,10],
  ['rainGap','Weather','Dry spell between showers (average)',510,'min',0.5,120,0.5],['rainLen','Weather','Shower length (average)',180,'min',0.5,60,0.5],
  ['soak','Weather','How fast rain soaks the ground',1,'pct',10,500,5],
  ['mudDry','Mud and water','Soaked ground dries in about',1200,'min',1,240,1],
  ['seep','Mud and water','Groundwater seeps in',1,'pct',0,500,5],['pump','Mud and water','Pump drains',1,'pct',10,1000,10],
  ['wtDepth','Mud and water','Water table depth',1.85,'ft',1,40,0.5]];
// unit: [shown = code value × factor, label]; jump is a launch speed (m/s) shown as the height it reaches
const TUNE_U={mph:[1/0.44704,'mph'],ft:[1/0.3048,'ft'],deg:[180/Math.PI,'°/s'],yd3:[1.307951,'yd³'],pct:[100,'%'],s:[1,'s'],min:[1/60,'min'],jump:[0,'ft']};
const tuneShow=(e,v)=>e[4]==='jump'?v*v/(2*9.8)/0.3048:v*TUNE_U[e[4]][0];
const tuneCode=(e,d)=>e[4]==='jump'?Math.sqrt(2*9.8*d*0.3048):d/TUNE_U[e[4]][0];
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
