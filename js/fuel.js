// Corley's Island: fuel, hour meters and pay (J15). The machine you run counts engine hours on its hour meter and burns
// fuel in game time (a game day passes in Tuning's Day length), more working than idling; the tank runs dry and the
// machine stops until you fill it at a pump: stop beside Dexter's diesel tank or the fuel cube on the Lower Bench. The
// work pays: dirt dug, hauled off in the truck and moved by the skid steer by the yard, grass by the square foot, less
// the fuel you buy, and each day's work goes in the day's log (Stats). Pay rates, the fuel price and fuel use are in
// the Tuning tab (Work and pay). Everything here is kept in the stats (stats.js), so it saves and syncs with them.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// fuel burn is off for now (the owner's call): the tanks stay full, nothing runs dry, no low-fuel warnings or fill-ups,
// and Stats leaves out the fuel rows; hour meters and pay still run. Set it true to bring the whole fuel game back.
const FUEL_BURN=false;
// each machine: its tank (gal), the burn idling and working hard (gal an hour), its hour meter when you got it
const FUEL={ex:{n:'excavator',tank:66,idle:1.3,full:4.6,h0:1022},tr:{n:'dump truck',tank:100,idle:1.0,full:7.5,h0:4318},
  sk:{n:'skid steer',tank:24,idle:0.6,full:2.6,h0:611},mw:{n:'mower',tank:12,idle:0.3,full:1.4,h0:287}};
// the fuel cube: a 500 gal double-walled tank on skids at the foot of the ramp on the Lower Bench, with a hose reel
const FC_X=-38,FC_Z=55.5,FC_YAW=0.35;
const FUEL_PUMPS=[{x:-190.2,z:227,n:"Dexter's diesel tank"},{x:FC_X+Math.cos(FC_YAW)*1.6,z:FC_Z-Math.sin(FC_YAW)*1.6,n:'the fuel cube on the Lower Bench'}];
(function(){const K=famKit(),y=baseHeight(FC_X,FC_Z),c=Math.cos(FC_YAW),s=Math.sin(FC_YAW);
  // a part at (u along, h up, v across) in the cube's own frame
  const at=(u,v)=>[FC_X+u*c+v*s,FC_Z-u*s+v*c];const B=(w,h,d,col,u,hy,v,ry)=>{const [x,z]=at(u,v);K.box(w,h,d,col,x,y+hy,z,FC_YAW+(ry||0))};
  for(const v of [-0.55,0.55])B(2.3,0.14,0.16,0x5a5d5f,0,0.07,v);
  B(2.1,1.25,1.3,0xe5b322,0,0.77,0);B(2.14,0.06,1.34,0xc99a16,0,1.42,0);B(2.14,0.06,1.34,0xc99a16,0,0.16,0);
  for(const u of [-1.05,1.05])B(0.04,1.2,1.3,0xc99a16,u,0.77,0);
  // pump cabinet, the meter, the hose reel and the nozzle on its hook
  B(0.5,0.5,0.32,0xd8d8d4,0.55,1.7,0.2);B(0.26,0.18,0.02,0x202428,0.55,1.78,0.37);B(0.2,0.12,0.02,0x8fd1a0,0.55,1.78,0.38);
  {const [x,z]=at(-0.45,0.2);K.cyl(0.24,0.24,0.18,14,0x2b2d30,x,y+1.72,z,FC_YAW,Math.PI/2);K.cyl(0.18,0.18,0.2,14,0x141414,x,y+1.72,z,FC_YAW,Math.PI/2)}
  B(0.06,0.3,0.06,0x2b2d30,1.0,1.1,0.7);B(0.2,0.05,0.05,0x2f7a3a,1.0,1.28,0.72);
  for(const [u,v] of [[-0.9,-0.55],[0.9,-0.55],[-0.9,0.55],[0.9,0.55]])B(0.08,0.08,0.08,0x3a3d40,u,1.48,v);
  famAdd(K);{const [x,z]=at(0,-0.68);famSign(['DIESEL'],1.3,0.36,x,y+0.95,z,FC_YAW+Math.PI,'#c0392b','#ffffff')}
  SOLIDS.push({x:FC_X,z:FC_Z,hx:1.2,hz:1.2})})();
const fuelKey=m=>m==='dig'||m==='drive'?'ex':m==='truck'?'tr':m==='skid'?'sk':m==='mow'?'mw':null;
const fuelLeft=k=>Math.max(0,FUEL[k].tank-stats[k+'Use']);
// the machine you are in has run dry: its controls do nothing (main.js)
function fuelOut(){const k=fuelKey(mode);return FUEL_BURN&& !!k&&stats[k+'Use']>=FUEL[k].tank-1e-6}
// the hour meter, in hours
const fuelHrs=k=>FUEL[k].h0+stats[k+'Hrs']/3600;
// game seconds for a real one, at the clock's speed (daynight.js)
const fuelGameS=dt=>dt*86400/TU.dayLen;
// the day the clock is on (local midnight, in days); a new day starts a new log, and the last day's pay is told
function fuelDayNo(){return Math.round((dn.t-dnMin(dn.t)*60000)/86400000)}
function payRoll(){const d=fuelDayNo();if(stats.dDay===d)return;
  if(stats.dDay&&stats.dEarn>0.5)toast(say('payDay',{pay:usd(stats.dEarn-stats.dFuelCost)}),'good',4200);
  stats.yEarn=stats.dDay?stats.dEarn-stats.dFuelCost:0;
  stats.dDay=d;for(const k of ['dDug','dHaul','dSkid','dMow','dGal','dHrs','dEarn','dFuelCost'])stats[k]=0;statDirty=true}
const usd=v=>(v<0?'−$':'$')+Math.abs(v).toLocaleString([],{minimumFractionDigits:2,maximumFractionDigits:2});
function payAdd(v){if(!(v>0))return;payRoll();stats.earned+=v;stats.dEarn+=v;statDirty=true}
// the work that pays (stats.js calls these): volumes in cubic metres, mowing by the lawn cell
function payDug(v){payRoll();stats.dDug+=v;payAdd(v*1.307951*TU.payDig)}
function payHaul(v){payRoll();stats.dHaul+=v;payAdd(v*1.307951*TU.payHaul)}
function paySkid(v){payRoll();stats.dSkid+=v;payAdd(v*1.307951*TU.paySkid)}
function payMow(sqft){payRoll();stats.dMow+=sqft;payAdd(sqft/1000*TU.payMow)}
const fuel={load:0,warn:{},fill:null};
function fuelTick(dt,busy){payRoll();const k=fuelKey(mode);
  if(!k){fuelFillEnd();return}
  const F=FUEL[k],g=fuelGameS(dt),o=k==='ex'?st:k==='tr'?tr:k==='sk'?sk:mw;
  fuel.load+=((busy?1:0)-fuel.load)*Math.min(1,dt*1.5);
  stats[k+'Hrs']+=g;stats.dHrs+=g;
  // burn off: a tank left part used by an older save fills back up, free
  if(!FUEL_BURN){if(stats[k+'Use']>0)stats[k+'Use']=0;fuel.warn[k]=0;statDirty=true;return}
  if(stats[k+'Use']<F.tank){const b=Math.min(F.tank-stats[k+'Use'],(F.idle+(F.full-F.idle)*fuel.load)*g/3600*TU.fuelUse);stats[k+'Use']+=b;stats.fuelGal+=b;stats.dGal+=b}
  statDirty=true;
  // filling up: stopped within about 20 ft of a pump, a quick 12 gal a second
  const pump=FUEL_PUMPS.find(p=>Math.hypot(o.x-p.x,o.z-p.z)<6);
  if(pump&&!busy&&stats[k+'Use']>0.05){const f=Math.min(stats[k+'Use'],12*dt),cost=f*TU.fuelPrice;stats[k+'Use']-=f;stats.fuelCost+=cost;stats.dFuelCost+=cost;
    if(!fuel.fill)fuel.fill={k,gal:0,cost:0,pump};fuel.fill.gal+=f;fuel.fill.cost+=cost;fuel.warn[k]=0;statDirty=true;return}
  else fuelFillEnd();
  // warnings at a quarter and a tenth of a tank, and when it runs dry
  const left=fuelLeft(k)/F.tank,lv=left<=1e-6?3:left<0.1?2:left<0.25?1:0,w=fuel.warn[k]||0;
  if(lv>w){const near=FUEL_PUMPS.reduce((a,p)=>Math.hypot(o.x-p.x,o.z-p.z)<Math.hypot(o.x-a.x,o.z-a.z)?p:a,FUEL_PUMPS[0]);
    toast(say(lv===3?'fuelOut':'fuelLow',{machine:F.n,pct:Math.round(left*100),where:near.n}),'bad',lv===3?5200:4000)}
  fuel.warn[k]=Math.max(w,lv)}
function fuelFillEnd(){const f=fuel.fill;if(!f)return;fuel.fill=null;
  if(f.gal>0.5)toast(say('fuelFilled',{machine:FUEL[f.k].n,gal:f.gal.toFixed(1),cost:usd(f.cost),left:Math.round(fuelLeft(f.k)/FUEL[f.k].tank*100)}),'good',3600)}
// the Stats panel's rows (stats.js): the day's log, the pay, and each machine's hour meter and tank
function fuelRows(){const S=stats,sqft=n=>Math.round(n).toLocaleString()+' sq ft',gal=v=>v.toFixed(v<10?1:0)+' gal',hrs=s=>(s/3600).toFixed(1)+' h';payRoll();
  return [['Today on the job',[['Day',new Date(dn.t).toLocaleDateString([],{weekday:'long',month:'short',day:'numeric'})],['Dirt dug',sYd(S.dDug)],['Hauled off',sYd(S.dHaul)],
      ['Moved by the skid steer',sYd(S.dSkid)],['Grass mowed',sqft(S.dMow)],['Engine hours',hrs(S.dHrs)],...(FUEL_BURN?[['Fuel burned',gal(S.dGal)]]:[]),
      ['Earned',usd(S.dEarn)],...(FUEL_BURN?[['Fuel bought',usd(S.dFuelCost)]]:[]),['The day paid',usd(S.dEarn-S.dFuelCost)],['Yesterday paid',S.yEarn?usd(S.yEarn):'—']]],
    ['Pay',[['Earned, all time',usd(S.earned)],...(FUEL_BURN?[['Fuel bought',usd(S.fuelCost)]]:[]),['In the bank',usd(S.earned-S.fuelCost)],...(FUEL_BURN?[['Fuel burned, all time',gal(S.fuelGal)]]:[])]],
    [FUEL_BURN?'Hour meters and fuel':'Hour meters',Object.keys(FUEL).map(k=>[FUEL[k].n[0].toUpperCase()+FUEL[k].n.slice(1),`${fuelHrs(k).toFixed(1)} h`+(FUEL_BURN?` · ${gal(fuelLeft(k))} of ${FUEL[k].tank} (${Math.round(fuelLeft(k)/FUEL[k].tank*100)}%)`:'')])]]}
