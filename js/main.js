// Corley's Island: the frame loop: inputs, machines, digging, spills, gas main, terrain, HUD and camera.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// the machines catch their own shadows (cab under the boom, bed under the load); glass stays clear
for(const g of [machine,truck])g.traverse(o=>{if(o.isMesh&&!o.material.transparent)o.receiveShadow=true});
// first person in a machine: the eye at (px,py,pz) in the machine's frame, looking along (dx,dy,dz) turned by fpl
function fpEye(o,px,py,pz,dx,dy,dz){o.localToWorld(camera.position.set(px,py,pz));
  const y=Math.atan2(dx,dz)+fpl.yaw,p=clamp(Math.atan2(dy,Math.hypot(dx,dz))+fpl.pitch,-1.45,1.45),c=Math.cos(p)*10;
  o.localToWorld(look.set(px+Math.sin(y)*c,py+Math.sin(p)*10,pz+Math.cos(y)*c))}
// the bucket (or blade) in use for the bucket gauge: its load, what it holds, how far it heaps over full, whether it is
// spilling over its rim; null on foot and in machines without one
function bucketNow(){
  if(mode==='dig'||mode==='drive')return {n:'Excavator bucket',l:Math.max(st.load,st.stuck||0),c:TU.exCap,h:TU.bkHeap,s:(st.spillT||0)>0};
  if(mode==='skid')return {n:'Skid steer bucket',l:sk.load,c:TU.skCap,h:0,s:false};
  if(mode==='heavy'){const h=hvCur();if(!h)return null;
    if(h.K.hoe)return h.hoe?{n:'Hoe bucket',l:h.hl.load,c:TU.bhCap,h:TU.bkHeap,s:(h.spillT||0)>0}:{n:'Loader bucket',l:h.load,c:TU.bhLdCap,h:0,s:false};
    if(h.k==='dozer')return {n:'Blade',l:h.load,c:TU.hvDzCap,h:0,s:false};if(h.k==='loader')return {n:'Loader bucket',l:h.load,c:TU.hvLdCap,h:0,s:false}}
  return null}
// the top bar's chip: what you are in (the machine's name, the excavator's Dig or Drive), the clock and rain; once a second
const NOW_MODE={dig:'Excavator · Dig',drive:'Excavator · Drive',truck:'Dump truck',mow:'Mower',skid:'Skid steer',walk:'On foot'};
function nowChip(){const w=wk.inside&&WK_RIDES[wk.inside]?WK_RIDES[wk.inside].n+(wk.inside==='ex'?(mode==='drive'?' · Drive':' · Dig'):''):NOW_MODE[mode]||'',
    t=dnTime(dn.t)+(weather.r>0.05?' · Rain':'');
  const a=$('#nowWhat'),b=$('#nowTime');if(a.textContent!==w)a.textContent=w;if(b.textContent!==t)b.textContent=t}
function bucketChip(){const b=bucketNow(),el=$('#bucketChip');if(el.hidden===!!b)el.hidden=!b;if(!b)return;
  const f=b.l/b.c,pct=Math.round(f*100),span=1+b.h,heaped=f>1.005;
  if($('#bucketChipName').textContent!==b.n)$('#bucketChipName').textContent=b.n;
  $('#bucketChipVal').textContent=`${(b.l*1.308).toFixed(2)} yd³ · ${pct}%`;$('#bucketChipBar').style.width=Math.min(100,f/span*100)+'%';$('#bucketChipFull').style.left=(100/span)+'%';
  $('#bucketChipSub').textContent=b.s?'Spilling over the rim':heaped?'Heaped over the rim':'';el.classList.toggle('heaped',heaped&&!b.s);el.classList.toggle('spill',b.s)}
// a heaped-full bucket still cutting: what it cuts and has no room for spills back over its sides, falling by the bucket
function exOver(v,dt){const a=Math.random()*6.283,x=mid.x+Math.cos(a)*0.5,z=mid.z+Math.sin(a)*0.5;
  if(inDig(x,z,0.5)){deposit(x,z,v,digC.slice(),digMix.slice(),0.9,mudAt(x,z),true);st.dirty=true;st.slumpT=2.5}
  st.spillT=0.5;for(let n=0;n<Math.min(3,Math.ceil(v*200));n++)spawn(mid,0.7)}
function frame(now){
  // frame cap (Graphics panel): skip this display refresh if the last frame was too recent
  if(gfxCur.fps&&!bench.on&&!vrOn()&&now-last<900/gfxCur.fps)return;
  gfxFrame(now-last);
  matPbrSync();
  const dt=Math.min(0.05,(now-last)/1000);last=now;crushT-=dt;
  // resolution changes and window resizes land here, before anything is drawn this frame
  if(viewDirty&&!renderer.xr.isPresenting){viewDirty=false;const want=bench.on?(bench.pr||maxPR):pr;if(renderer.getPixelRatio()!==want)renderer.setPixelRatio(want);resize()}
  // the map editor has the frame while it is open; the game stands still
  if(edOn){editorFrame(dt,now);return}
  // inputs (the island tour test pushes the left stick itself, tourtest.js)
  if(tour.on)tourStep(dt);
  keyAxes(dt);pollPad();vrPoll();
  const Lx=clamp(SL.x+KA.lx+PA.lx,-1,1),Ly=clamp(SL.y+KA.ly+PA.ly+(mode==='dig'||mode==='mow'||mode==='walk'?0:PA.thr),-1,1),Rx=clamp(SR.x+KA.rx+PA.rx,-1,1),Ry=clamp(SR.y+KA.ry+PA.ry,-1,1);
  let swingIn=0,stickIn=0,driveIn=0,turnIn=0,boomIn=-Ry,bucketIn=Rx;
  // Turn sensitivity (controls.js) scales every left / right
  const Ts=turnSens;
  if(mode==='dig'){swingIn=Lx*Ts;stickIn=Ly}else if(mode==='drive'){driveIn=Ly;turnIn=Lx*Ts}
  let tThr=0,tSteer=0,tBed=0;
  if(mode==='truck'){tThr=Ly;tSteer=clamp(Lx*Ts,-1,1);tBed=Ry;boomIn=0;bucketIn=0}
  // mower: one stick per lap bar; the left stick sideways spins it as well
  let mL=0,mR=0;
  if(mode==='mow'){mL=clamp(Ly+Lx*0.7*Ts,-1,1);mR=clamp(Ry-Lx*0.7*Ts,-1,1);boomIn=0;bucketIn=0}
  // on foot: the left stick walks, the right stick looks around
  if(mode==='walk'){boomIn=0;bucketIn=0}
  // skid steer: left stick drives, right stick runs the arms (up lowers them, as the boom) and the bucket (right dumps)
  let sDrive=0,sTurn=0,sArm=0,sCurl=0;
  if(mode==='skid'){sDrive=Ly;sTurn=Lx*Ts;sArm=-Ry;sCurl=-Rx;boomIn=0;bucketIn=0}
  // boat: the left stick is the throttle and the wheel; the right stick looks round
  let bThr=0,bSteer=0;
  if(mode==='boat'){bThr=Ly;bSteer=Lx*Ts;boomIn=0;bucketIn=0;if(camMode==='chase')orbitYaw-=Rx*1.6*dt}
  // dirt bike: the left stick is the throttle (back to brake) and the bars; the right stick looks round
  let kThr=0,kSteer=0;
  if(mode==='bike'){kThr=Ly;kSteer=Lx*Ts;boomIn=0;bucketIn=0;if(camMode==='chase')orbitYaw-=Rx*1.6*dt}
  // Dexter's heavy machines: the left stick drives; the right stick runs the dozer's blade or the loader's arms and bucket
  // (as the skid steer's), and looks round from the semi
  let hDrive=0,hTurn=0,hArm=0,hCurl=0;
  // run dry (fuel.js): the engine dies and the controls do nothing until you fill up
  if(fuelOut()){swingIn=stickIn=driveIn=turnIn=boomIn=bucketIn=0;tThr=tBed=0;mL=mR=0;sDrive=sTurn=sArm=sCurl=0}
  if(mode==='heavy'){hDrive=Ly;hTurn=Lx*Ts;boomIn=0;bucketIn=0;if(hvCur().K.trail||hvCur().K.car){if(camMode==='chase')orbitYaw-=Rx*1.6*dt}else{hArm=-Ry;hCurl=-Rx}}
  const res=st.res;
  st.swing-=swingIn*TU.exSwing*dt*res;
  st.a1=clamp(st.a1+boomIn*TU.exBoom*dt*res,...LIM.a1);
  st.a2=clamp(st.a2+stickIn*TU.exStick*dt*res,...LIM.a2);
  {const a3=st.a3;st.a3=clamp(st.a3+bucketIn*TU.exBucket*dt*res,...LIM.a3);st.a3v=dt>0?(st.a3-a3)/dt:0}
  if(bench.on){benchTick(dt);driveIn=0;turnIn=0;tThr=0;tSteer=0;tBed=0;mL=0;mR=0}
  updateTruck(dt,tThr,tSteer,tBed);updateMower(dt,mL,mR);if(bench.on){sDrive=sTurn=sArm=sCurl=0}updateSkid(dt,sDrive,sTurn,sArm,sCurl);
  siteTick();
  if(mode==='walk'&&!bench.on)updateWalker(dt,Lx,Ly,Rx*Ts,Ry);else updateWalker(dt,0,0,0,0);trimTick(dt);gunTick(dt);
  boatTick(dt,bThr,bSteer);lakeBoatsTick(dt);trainTick(dt);bikeTick(dt,kThr,kSteer);hvTick(dt,hDrive,hTurn,hArm,hCurl);pbTick(dt);twinTick();
  statTick(dt);
  // what the mixer hears: hydraulic demand, a ram pushed against its stop (relief valve), tracks moving
  {const end=(v,l,i)=>(i>0.1&&v>=l[1]-1e-4)||(i<-0.1&&v<=l[0]+1e-4);
    sndIn.hyd=Math.abs(swingIn)+Math.abs(stickIn)+Math.abs(boomIn)+Math.abs(bucketIn)+Math.abs(driveIn)+Math.abs(turnIn);
    sndIn.relief=end(st.a1,LIM.a1,boomIn)||end(st.a2,LIM.a2,stickIn)||end(st.a3,LIM.a3,bucketIn);sndIn.track=Math.min(1,Math.abs(driveIn)+Math.abs(turnIn)*0.7);sndIn.pour=0}updateHeapClods();
  // drive
  // clay packed in the undercarriage (packTick, dirt.js) makes the tracks drag and turn slower
  const packK=1-Math.min(0.9,TU.packDrag*(st.pack||0)/PACK_CAP);
  st.yaw-=turnIn*TU.exTurn*dt*(1-0.5*(1-packK));
  // mud slows the tracks, and pushing on in it digs them in until they spin (bogTick, mud.js)
  const mudN=mudAt(st.x,st.z),mudK=packK**0.5*Math.max(0,1-0.5*mudN*TU.mudDrag)*bogTick(st,mudN,bench.on?0:driveIn,0.03,dt),ox=st.x,oz=st.z,w0=wallCount(st.x,st.z,st.yaw,EX_P);
  st.x+=Math.sin(st.yaw)*driveIn*TU.exTrack*mudK*dt;
  st.z+=Math.cos(st.yaw)*driveIn*TU.exTrack*mudK*dt;
  // stays on the mesa, the Family Island or a bridge deck
  [st.x,st.z]=landClamp(st.x,st.z,3.5,1.9);
  // the scarp face, ramp banks and stockpiles are too steep to climb: the tracks stop at their foot
  if(wallCount(st.x,st.z,st.yaw,EX_P)>w0){st.x=ox;st.z=oz}
  blkPush(st,EX_C,EX_R);
  const sy=Math.sin(st.yaw),cy=Math.cos(st.yaw);
  // tracks rut loose fill and mud, crush clods, pick up mud and kick up a little dust (not off mud)
  if(!bench.on&&(Math.abs(driveIn)>0.05||Math.abs(turnIn)>0.05))for(const sd of [-1,1]){const tx=st.x+sd*1.1*cy,tz=st.z-sd*1.1*sy;
    const r=stampRut(tx,tz,st.yaw,0.26,1.6,dt*(1+2*st.spin));if(r){st.mud=Math.min(1,st.mud+dt*(r===2?0.2+0.6*st.spin:0.06));if(r===1)dustPuff(tx,hAt(tx,tz)+0.1,tz,dt*4)}
    // the front of each track splashes through puddles
    {const tv=driveIn*2.6*mudK,f=Math.sign(tv||1)*1.4;splashMud(tx+sy*f,tz+cy*f,st.yaw,tv,0.3,1,dt)}
    // spinning tracks throw mud off the back; driving through it flicks a little
    if(mudN>RUT_MUD){const bk=-Math.sign(driveIn||1)*1.7;flingMud(tx+sy*bk,hAt(tx,tz)+0.25,tz+cy*bk,st.yaw+(driveIn<0?Math.PI:0),2+5*st.spin,(st.spin*40+Math.abs(driveIn)*4)*mudN,dt)}}
  packTick(dt,bench.on?0:driveIn,bench.on?0:turnIn);
  if(crushT<=0)crushT=0.1;
  const sample=(lx,lz)=>surfAt(st.x+lx*cy+lz*sy,st.z-lx*sy+lz*cy);
  const hf=(sample(-1.1,1.8)+sample(1.1,1.8))/2,hb=(sample(-1.1,-1.8)+sample(1.1,-1.8))/2;
  const hr=(sample(1.1,1.8)+sample(1.1,-1.8))/2,hl=(sample(-1.1,1.8)+sample(-1.1,-1.8))/2;
  const k=Math.min(1,dt*8);
  st.y+=((hf+hb)/2-0.18*st.sink-st.y)*k; st.pitch+=(-Math.atan2(hf-hb,3.6)-st.pitch)*k; st.roll+=(Math.atan2(hr-hl,2.2)-st.roll)*k;
  machine.position.set(st.x,st.y,st.z); machine.rotation.set(st.pitch,st.yaw,st.roll);
  house.rotation.y=st.swing;
  // the cab's joysticks lean the way the sticks are pushed while the arm is worked
  exJoyTick(dt,mode==='dig'?[Lx,Ly]:[0,0],mode==='dig'?[Rx,Ry]:[0,0]);
  boomP.rotation.x=-st.a1; stickP.rotation.x=-st.a2; bucketP.rotation.x=-st.a3;
  machine.updateMatrixWorld(true); updateLinkage(); jointJ.updateMatrixWorld(); updateRams(); updateHoses();
  tipMark.getWorldPosition(tip); midMark.getWorldPosition(mid); bucketP.getWorldQuaternion(q);
  updateBox(dt);cplTick(dt);blkTick(dt);

  // dig
  const g=hAt(tip.x,tip.z);
  st.below=tip.y<g&&!blkHit(tip.x,tip.y,tip.z);
  // soil at the teeth sets how hard the arm works; a full bucket pushing on barely moves
  {const ti=Math.max(0,Math.min(N,Math.round(gI(tip.x)))),tj=Math.max(0,Math.min(N,Math.round(gJ(tip.z))));
    st.soil=st.below?matAt(tj*V+ti,tip.y):-1;
    st.res=st.soil<0?1:soilRes(tj*V+ti,tip.y)*(st.load>=TU.exCap-0.002?0.5:1);
    // the hammer and the auger get through hard ground faster; a bare coupler or the thumb hardly goes in (coupler.js)
    if(st.soil>=0)st.res=cplRes(st.res);
    if(st.soil===2&&!st.seenSand){st.seenSand=true;toast(say('sand'),'',3200)}
    if(st.soil===3&&!st.seenRock){st.seenRock=true;toast(say('rock'),'',3000)}
    if(padUsed&&st.soil>=0&&(Math.abs(swingIn)+Math.abs(stickIn)+Math.abs(boomIn)+Math.abs(bucketIn))>0.1)rumbleDig(0.15+0.55*(1-SOIL[st.soil].h))}
  if(st.below&&(!bench.on||bench.kind==='load')){
    // another attachment on the coupler works the ground its own way (coupler.js)
    if(cpl.fit!=='bucket')cplWork(dt);
    // the bucket cuts as deep as its teeth only with them leading; dragged flat it skims (bkCut). It fills over the
    // stroke, as the backhoe's does: only teeth moving through the ground bring dirt in, at a rate that goes with how fast
    // they move (TU.exCutV) and how thick a cut they take (TU.exThick), so a good stroke in loam fills it in about
    // TU.exFillT; hard ground slows the arm and so the filling too
    // It heaps over its rim to TU.bkHeap past full; what it cuts beyond that spills back over the sides (exOver)
    else{
      const cp=bkCut(g,dt),tv=bkPrevOk&&dt>0?bkVel.length()/dt:0,rate=TU.exCap/TU.exFillT*clamp(tv/TU.exCutV,0,1.25)*ss(0,TU.exThick,g-cp.y);
      const hcap=TU.exCap*(1+TU.bkHeap),room=Math.max(0,hcap-st.load),want=rate*dt,cut=want>1e-6?dig(cp,want):0,got=Math.min(cut,room);
      if(cut>got+1e-7){exOver(cut-got,dt);if(!fullWarned){toast(say('bucketFull'));fullWarned=true}}
      if(got>0){const f=got/(st.load+got);for(let q=0;q<3;q++)st.loadC[q]+=(digC[q]-st.loadC[q])*f;for(let q=0;q<4;q++)st.loadMix[q]+=(digMix[q]-st.loadMix[q])*f;
        st.loadWet+=((underWater(tip)?1:mudAt(tip.x,tip.z))-st.loadWet)*f;
        st.load+=got;statDug(got);st.dirty=true;st.slumpT=2.5;if(Math.random()<0.5)spawn(tip.clone().setY(g+0.05),1.2)}
    }
  }
  if(st.load<TU.exCap)fullWarned=false;st.spillT=Math.max(0,(st.spillT||0)-dt);
  // spill: bucket interior points along local -y
  const up=tmp.set(0,-1,0).applyQuaternion(q).y;
  const f=clamp((0.25-up)/0.5,0,1);
  let pourA=0,pourY=0;
  // dirt leaving the bucket goes into the truck bed under it (what does not fit spills) or onto the ground
  const exDrop=(out,spr)=>{
    if(inBed(mid)&&tr.load<TU.trCap){const take=Math.min(out,TU.trCap-tr.load);if(take>0){const f=take/(tr.load+take);for(let q=0;q<3;q++)tr.loadC[q]+=(st.loadC[q]-tr.loadC[q])*f;for(let q=0;q<4;q++)tr.loadMix[q]+=(st.loadMix[q]-tr.loadMix[q])*f;tr.loadWet+=(st.loadWet-tr.loadWet)*f;if(padUsed)rumbleDig(Math.min(0.5,0.12+take*25))}tr.load+=take;
      if(out-take>0){deposit(mid.x,mid.z,out-take,st.loadC,st.loadMix,spr,st.loadWet);st.dirty=true;st.slumpT=2.5}
      if(!tr.loadedOnce){tr.loadedOnce=true;toast(say('truckFirst'),'good')}
      if(tr.load>=TU.trCap*0.99&&!tr.fullWarned){tr.fullWarned=true;toast(say('truckFull'),'',3500)}}
    else{deposit(mid.x,mid.z,out,st.loadC,st.loadMix,spr,st.loadWet);st.dirty=true;st.slumpT=2.5}};
  st.stuck=Math.min(st.stuck||0,st.load);
  // sticky clay: when it starts to pour, part of the load (stickFrac) clings to the bucket and stays in it, taking up
  // room, until it is shaken out with the curl
  if(f>0&&st.load-st.stuck>0.0005){
    if(!st.pouring){st.pouring=true;dirtThud(mid,0.3+st.load/TU.exCap);st.stuck=Math.min(st.load,TU.exCap*0.4,st.stuck+(st.load-st.stuck)*stickFrac(st.loadMix,st.loadWet))}
    const out=Math.min(st.load-st.stuck,f*(0.35+st.load*1.6)*TU.exPour*dt);
    st.load-=out;pourA=out/dt;sndIn.pour=out/dt;
    const bed=inBed(mid);pourY=bed?mid.y-(tl.y-heapTop()):hAt(mid.x,mid.z);
    exDrop(out,dropSpread(mid.y-pourY));
    for(let n=0;n<Math.ceil(out*80);n++)spawn(mid,0.8);
    if(st.load-st.stuck<0.0005){st.load=st.stuck;if(st.stuck>TU.exCap*0.06&&!st.seenStick){st.seenStick=true;toast(say('claySticks'),'',4200)}}
  }else st.pouring=false;
  {const fell=shakeOut(st,st.a3v||0,TU.exBucket*0.45,st.a3<=LIM.a3[0]+1e-4||st.a3>=LIM.a3[1]-1e-4,clamp((0.5-up)/0.75,0,1),dt);
    if(fell>0){st.stuck-=fell;st.load-=fell;exDrop(fell,1);if(st.stuck<0.0005){st.load=Math.max(0,st.load-st.stuck);st.stuck=0}
      if(st.jolt){dirtThud(mid,0.25+fell*3);if(!inBed(mid))shakeClods(mid.x,mid.z,fell);for(let n=0;n<Math.ceil(fell*120);n++)spawn(mid,0.7);rumble(120,0.4)}}}
  pourStream(streams[0],mid,pourY,pourA,st.loadC,now/1000);
  // a heaped bucket swung or lifted fast loses crumbs over the rim; what is heaped over full sheds faster, and slowly
  // even held still, unless the bucket is curled up tight
  {const armV=Math.abs(swingIn)*TU.exSwing+Math.abs(boomIn)*TU.exBoom+Math.abs(stickIn)*TU.exStick;
    if(f===0&&!st.below&&st.load>TU.exCap&&(!bench.on||bench.kind==='load')){const tuck=clamp((up-0.55)/0.4,0,1),out=Math.min(st.load-TU.exCap,(st.load-TU.exCap)*(0.08+0.9*armV)*(1-0.85*tuck)*TU.exSpill*dt);
      if(out>1e-6){st.load-=out;exDrop(out,1.2);if(out>0.02*TU.exCap*dt)st.spillT=0.4;if(Math.random()<dt*(4+armV*20))spawn(mid,0.5)}}
    if(f===0&&!st.below&&(!bench.on||bench.kind==='load')&&st.load>TU.exCap*0.7&&armV>0.2){const out=Math.min(st.load,(st.load/TU.exCap-0.7)/0.3*armV*0.006*TU.exSpill*dt);st.load-=out;
      if(inBed(mid))tr.load=Math.min(TU.trCap,tr.load+out);else{deposit(mid.x,mid.z,out,st.loadC,st.loadMix,1,st.loadWet);st.dirty=true}
      if(Math.random()<armV*dt*8)spawn(mid,0.4)}}
  // gas main
  st.strikeCd-=dt;
  if(Math.abs(tip.x)<12&&Math.hypot(tip.y-PIPE_Y,tip.z-PIPE_Z)<PIPE_R+0.07&&st.strikeCd<=0){
    st.strikes++;st.strikeCd=2.5;shake=reduceMotion?0:0.45;
    const fl=$('#flash');fl.style.opacity='0.45';setTimeout(()=>fl.style.opacity='0',180);
    toast(say('strike'),'bad',3000);rumble(600,1);
  }
  if(!bench.on)caveTick(dt);slopeTick(dt);
  // terrain
  // slump passes by the second (as many as 60 FPS took), so a phone settles a heap as a PC does
  if(st.slumpT>0){st.slumpT-=dt;st.slAcc=(st.slAcc||0)+dt*180*GRID_K;for(;st.slAcc>=1;st.slAcc--)if(slump())st.dirty=true}
  if(st.dirty){
    updateTufts(dI0-1,dI1+1,dJ0-1,dJ1+1);lawnTerrain();
    updateTerrain();st.dirty=false;site.dirty=true;mapDirty=true;blkTerrainMoved();
    winOn=false;
    if(!st.exposed&&inDig(-12,PIPE_Z+CELL)&&inDig(12,PIPE_Z-CELL)){
      const jz=Math.round(gJ(PIPE_Z));
      outer:for(let j=jz-1;j<=jz+1;j++)for(let i=Math.round(gI(-12));i<=Math.round(gI(12));i++)
        if(H[j*V+i]<PIPE_Y+PIPE_R+0.17){st.exposed=true;toast(say('exposed'),'good',2800);break outer}
    }
  }
  // HUD
  hudT-=dt;
  if(hudT<=0)mapsTick(0.1);
  if(hudT<=0){hudT=0.1;
    // the job gauges (#status) are hidden by the stylesheet unless a skin shows them: checked once a second, written only when seen
    // the job card shows the rows for what you are running (none: the card hides); the top bar's chip says what you are in
    {const dg=mode==='dig'||mode==='drive',rows=[['bucketPanel',dg||mode==='skid'],['trenchRow',dg],['truckRow',dg||mode==='truck'],['lawnRow',mode==='mow'||mode==='walk'&&trim.on]];let any=false;
      for(const [id,s] of rows){const el=$('#'+id);any=any||s;if(el.hidden===s){el.hidden=!s;stVisT=0}}const se=$('#status');if(se.hidden===any)se.hidden=!any}
    if((stVisT-=0.1)<=0){stVisT=1;stVis=$('#status').offsetParent!==null;nowChip()}
    // the action dock and the Use button (ctx.js); the box button's words
    ctxTick();{const bb=$('#boxBtn'),t=TB.hooked?'Drop box':'Hook box';if(bb.textContent!==t)bb.textContent=t}
    // in the skid steer the bucket line is its bucket
    const skm=mode==='skid',bl=skm?sk.load:st.load,pct=Math.round(bl/(skm?TU.skCap:TU.exCap)*100);
    if(stVis){$('#bucketVal').textContent=`${(bl*1.308).toFixed(2)} yd³ · ${pct}%`;
    $('#bucketBar').style.width=pct+'%';
    $('#bucketPanel').classList.toggle('full',pct>=99)}bucketChip();
    const dep=h0At(tip.x,tip.z)-tip.y;
    if(!stVis);else if(skm){const sd=h0At(skTip.x,skTip.z)-skTip.y;$('#tipVal').textContent=`${(Math.abs(sk.v)*2.237).toFixed(1)} mph · edge ${(Math.abs(sd)*3.281).toFixed(1)} ft ${sd>0?'below':'above'} grade`}else
    $('#tipVal').textContent=(dep>0?`Tip ${(dep*3.281).toFixed(1)} ft below grade`:`Tip ${(-dep*3.281).toFixed(1)} ft above grade`)+(st.soil>=0?` · ${SOIL[st.soil].n}`:'');
    let c=0;for(const kk of trenchK)if(H0[kk]-H[kk]>=0.85)c++;
    const tp=trenchK.length?(st.tpLast=Math.round(c/trenchK.length*100)):(st.tpLast||0);
    if(tp>=100&&!st.done){st.done=true;st.doneT=now;const s=Math.round((now-(st.startT||now))/1000);
      toast(say('trenchDone',{time:`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`,strikes:st.strikes?` · ${st.strikes} strike${st.strikes>1?'s':''}`:' · no strikes',caves:st.caves?` · ${st.caves} cave-in${st.caves>1?'s':''}`:''}),'good',6000)}
    const secs=st.startT?Math.round(((st.done?st.doneT:now)-st.startT)/1000):0;
    if(stVis){$('#trenchVal').textContent=`${tp}% · ${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}`;
    $('#trenchBar i').style.width=tp+'%';
    $('#truckVal').textContent=`${(tr.load*1.308).toFixed(1)} / 12 yd³`;
    $('#truckBar').style.width=Math.round(tr.load/TU.trCap*100)+'%';
    $('#haulVal').textContent=(mode==='truck'?`${Math.round(Math.abs(tr.v)*2.237)} mph · ${tr.shiftT>0?'N':tr.gear>0?'D':'R'} · `:'')+`Hauled ${(tr.hauled*1.308).toFixed(1)} yd³`}
    // in Mow mode the lawn takes the bucket's place, so the card keeps its height
    lawnsTick(dt);
    {if(!$('#lawnRow').hidden&&stVis){const lp=Math.floor(lawnPct()*100),ls=lawn.startT?Math.round(((lawn.done?lawn.doneT:now)-lawn.startT)/1000):0;
        $('#lawnVal').textContent=`${lp}% · ${Math.floor(ls/60)}:${String(ls%60).padStart(2,'0')}`;$('#lawnBar i').style.width=lp+'%';
        $('#mowVal').textContent=mode==='mow'?`${(Math.abs(mw.v)*2.237).toFixed(1)} mph · blades ${mw.load>0.2?'cutting':'on'}`:`Trimmer line ${trimIn(trim.line)} in · spool ${Math.round(trim.spool/0.3048)} ft${trim.line<TU.trimMin?' · bump it':''}`}}
    const gv=$('#gasVal');if(stVis){
    gv.textContent=st.strikes?`Gas main: ${st.strikes} strike${st.strikes>1?'s':''}`:st.exposed?'Gas main: exposed ✓':'Gas main: buried';
    gv.style.color=st.strikes?'var(--danger)':st.exposed?'var(--ok)':''}
  }
  // flying dirt
  particlesTick(dt);dustTick(dt);grimeTick();pebTick(dt);mtnTick();mdlTick(dt);wkMdlPose();
  // groundwater, the tailgate stream and the dirt sounds
  digTilesTick(dt);if(!bench.on)waterTick(dt);mudTick(dt);rainTick(dt);lakeTick(dt);grassTick(dt);jesTick(dt);mainTick(dt);marinaTick(dt);tfTick(dt);stlTick(dt);talkTick(dt);townTick(dt);brTick(dt);treesTick(dt);plantTick();
  pourStream(streams[1],tr.pourP,hAt(tr.pourP.x,tr.pourP.z),tr.pourRate,tr.loadC,now/1000);
  dirtSndTick(dt);
  // bucket load visual
  const lv=Math.max(st.load,st.stuck);loadMesh.visible=lv>0.01;
  if(loadMesh.visible){ldMoundSet(loadMesh,lv/TU.exCap,TU.bkHeap);tintLoad(loadMesh.material,st.loadC)}
  // camera
  const hy=st.yaw+st.swing;
  if(camMode==='chase'){
    let cyaw,cd=camDist,op=orbitPitch;
    if(mode==='truck'){look.set(tr.x,tr.y+1.6,tr.z);cyaw=tr.yaw+Math.PI+orbitYaw;cd=camDist+3}
    else if(mode==='skid'){look.set(sk.x+Math.sin(sk.yaw)*1.2,sk.y+1.0,sk.z+Math.cos(sk.yaw)*1.2);cyaw=sk.yaw+Math.PI+orbitYaw;cd=camDist*0.7}
    else if(mode==='boat'){const b=btCur();look.set(b.x+Math.sin(b.yaw)*0.8,b.y+1.0,b.z+Math.cos(b.yaw)*0.8);cyaw=b.yaw+Math.PI+orbitYaw;cd=camDist*0.85}
    else if(mode==='heavy'){const h=hvCur(),f=h.K.hoe?h.camF:1;look.set(h.x+Math.sin(h.yaw)*f,h.y+1.6,h.z+Math.cos(h.yaw)*f);cyaw=h.yaw+Math.PI+orbitYaw+(h.K.hoe?h.camO:0);cd=camDist*h.K.cam}
    else if(mode==='bike'){look.set(bk.x+Math.sin(bk.yaw)*0.6,bk.y+1.0,bk.z+Math.cos(bk.yaw)*0.6);cyaw=bk.yaw+Math.PI+orbitYaw;cd=camDist*0.55}
    else if(mode==='mow'){look.set(mw.x+Math.sin(mw.yaw)*0.8,mw.y+0.7,mw.z+Math.cos(mw.yaw)*0.8);cyaw=mw.yaw+Math.PI+orbitYaw;cd=camDist*0.6}
    else if(mode==='walk'){look.set(wk.x,wk.y+1.35,wk.z);cyaw=wk.view+Math.PI+orbitYaw;cd=camDist*0.5;
      // inside Jessica's cottage the roof lifts off and the camera looks down from above the walls
      if(jesIn){cd=camDist*0.42;op=Math.max(op,1.05)}}
    else{const fx=Math.sin(hy),fz=Math.cos(hy);look.set(st.x+fx*4,st.y+0.8,st.z+fz*4);cyaw=hy+Math.PI+orbitYaw}
    // any turn of orbitYaw since the last frame is yours (mouse, drag, stick or pad)
    if(Math.abs(orbitYaw-camOY)>1e-5)camUserT=now;
    // the orbit camera keeps its bearing as the machine turns under it (on foot the view is yours to turn already)
    if(camFree&&mode!=='walk'){const base=cyaw-orbitYaw;if(camBase!==null){const d=Math.atan2(Math.sin(base-camBase),Math.cos(base-camBase));orbitYaw-=d;cyaw-=d}camBase=base}else camBase=null;
    // the chase camera drifts back behind a machine on the move a while after you last turned it (not on foot, where the
    // view steers you, nor at the excavator's controls, where it already follows the swing)
    const spd=firstCam?0:Math.hypot(look.x-camLkP.x,look.z-camLkP.z)/Math.max(dt,1e-3);camLkP.copy(look);
    if(!camFree&&mode!=='walk'&&mode!=='dig'&&TU.camBack>0&&now-camUserT>TU.camBack*1000&&spd>1){
      const o=Math.atan2(Math.sin(orbitYaw),Math.cos(orbitYaw)),n=o*Math.exp(-dt*1.4);cyaw+=n-orbitYaw;orbitYaw=n}
    camOY=orbitYaw;
    // the machine's own turn is eased so the camera swings round behind it rather than snapping with it; your own turn
    // (orbitYaw) goes straight through so the mouse feels direct. On foot the view is the steering, so it isn't eased
    const base=cyaw-orbitYaw;
    if(firstCam||mode==='walk')camBS=base;else camBS+=Math.atan2(Math.sin(base-camBS),Math.cos(base-camBS))*(1-Math.exp(-dt*6*TU.camFollow));
    const yw=camBS+orbitYaw;
    if(firstCam)camLk.copy(look);else camLk.lerp(look,1-Math.exp(-dt*14));
    camT.set(camLk.x+Math.sin(yw)*Math.cos(op)*cd,camLk.y+Math.sin(op)*cd,camLk.z+Math.cos(yw)*Math.cos(op)*cd);
    camT.y=Math.max(camT.y,surfAt(camT.x,camT.z,mode==='walk'?wk.y+1:undefined)+1.2,WATER+0.9);
    // on foot in a shop or a house the camera stays in the room (interiors.js)
    if(mode==='walk')rmCamClip(camLk,camT);
    if(firstCam){camera.position.copy(camT);firstCam=false}else camera.position.lerp(camT,1-Math.exp(-dt*25));
    camera.lookAt(camLk);
  }else{
    // the seat's eye point and its straight-ahead look, turned by where you have turned your head (fpl)
    if(mode==='truck')fpEye(sprung,-0.55,1.6,1.72,0.25,-1.5,12.05);
    else if(mode==='skid')fpEye(skid,0,1.72,0.0,0,-0.9,4.5);
    else if(mode==='boat')fpEye(btCur().g,0,1.62,-0.47,0,-1.5,8);
    else if(mode==='heavy')fpEye(hvCur().g,...(hvCur().eye||hvCur().K.eye));
    else if(mode==='bike')fpEye(bike,0,1.62-bk.comp,-0.12,0,-0.35,1);
    else if(mode==='mow')fpEye(mower,0,1.42,-0.12,0,-1.45,4.48);
    else if(mode==='walk'){const p=fpl.pitch,fx=Math.sin(wk.view),fz=Math.cos(wk.view);camera.position.set(wk.x+fx*0.1,wk.y+WK_H-0.12+wkBody.position.y,wk.z+fz*0.1);
      look.set(camera.position.x+fx*Math.cos(p)*5,camera.position.y+Math.sin(p)*5,camera.position.z+fz*Math.cos(p)*5)}
    else fpEye(house,-0.72,2.15,0.3,0.45,-1.75,5.5);
    camera.lookAt(look); firstCam=true;
  }
  // the gun into his hands once the camera is where it will be drawn from: in first person it is held in the view, and
  // placed before the camera moved it trailed a frame behind (jittering, and swinging out of sight on a quick turn)
  gunPlace();
  fpTick(dt);
  if(bench.on)benchCamera();
  if(viewPin)viewPinApply();
  // VR: the rig goes to the seat and the headset looks round from there (vr.js)
  if(vrOn())vrFrame(dt);
  updateSound(dt);
  if(shake>0){shake-=dt;camera.position.x+=(Math.random()-0.5)*0.25;camera.position.y+=(Math.random()-0.5)*0.25}
  gunCamFx(dt);
  sky.position.copy(camera.position);
  const fv=mode==='boat'?btCur():mode==='heavy'?hvCur():mode==='bike'?bk:mode==='truck'?tr:mode==='mow'?mw:mode==='skid'?sk:mode==='walk'?wk:st;sun.position.set(fv.x,fv.y,fv.z).addScaledVector(LIGHT_DIR,SUN_D); sun.target.position.set(fv.x,fv.y,fv.z);
  {const o=groundOcc.value;o[0].set(st.x,st.z,st.yaw,0);o[2].set(tr.x,tr.z,tr.yaw,0)}
  timeU.value=now/1000;
  shadowProxyTick();lawnLod();tuftLod();turfLod();rainCover();if(vr.fake)vrFakeHead();warmAllTick();warmLaterTick();warmFarTick();loadReportTick();shBenchTick();gpuWarmTick();if(!loadHold()){const wm=warmPre(),d0=performance.now(),di=drawInfo();postRender();warmPost(wm);if(performance.now()-d0>150)drawSlow(d0,di)}if(vrOn())vrAfter();
  if(bench.on)benchSample(dt);
  fpsFrames++;fpsTime+=dt;
  if(fpsTime>=0.5){
    // the frame rate as the clock has it (dt is capped at 0.05 s, so counted in game time it never read under 20)
    const f=Math.round(fpsFrames/Math.max(fpsTime,(now-fpsT0)/1000));fpsT0=now;
    const fe=$('#fpsVal');fe.textContent=f;fe.style.color=f>=50?'var(--ok)':f>=30?'var(--gas)':'var(--danger)';
    // auto resolution: step down when slow (under 48 fps above 1x; under 30 it goes on below 1x, to PR_MIN, a soft
    // picture being better than a slow one; twice as fast under 20); step back up only after a long steady run, and
    // never within 30 s of a step down. Only in play: the start card's warm-up frames don't count
    const play=!bench.on&&!vrOn()&&help.hidden&&!loadHold();
    if(play&&gfxCur.auto&&pr>Math.min(PR_MIN,maxPR)&&f<(pr>1?48:30)){if(++lowN>=(f<20?2:3)){pr=Math.max(Math.min(PR_MIN,maxPR),f>=30?1:0,pr-(f<20?0.5:0.25));viewDirty=true;lowN=0;prHold=now+30000}}else lowN=0;
    if(!bench.on&&!vrOn()&&gfxCur.auto&&f>=58&&pr<maxPR&&now>prHold){if(++hiN>=8){pr=Math.min(maxPR,pr+0.25);viewDirty=true;hiN=0}}else hiN=0;
    // graphics guard: still slow at the lowest resolution (under 40 fps on Ultra, under 26 on the others), or under 15
    // at any resolution, and the setting steps down one level (gfx.js): after about 15 s, about 8 s under 20 fps and
    // about 4 s under 15, so an unplayable picture never lasts
    if(play&&!edOn&&!navigator.webdriver&&GFX_DOWN[gfxKey]&&f<(gfxKey==='ultra'?40:26)&&(pr<=PR_MIN+0.01||f<15)){ultraLowN+=f<15?4:f<20?2:1;if(ultraLowN>=30)ultraGuard(f)}else ultraLowN=0;
    $('#resVal').textContent=pr.toFixed(2).replace(/0$/,'')+'x';
    const t=renderer.info.render.triangles;$('#triVal').textContent=t>=1e6?(t/1e6).toFixed(2)+'M':t>=1e3?Math.round(t/1e3)+'k':t;fpsFrames=0;fpsTime=0}
}
// first-use warm-up: what only shows while digging and dumping (the pour streams, flying dirt, clods, dust, packed clay,
// the loads in the buckets and the truck bed, mud and water films, the trench walls' shadow caster) is drawn in the first frames after the game opens,
// behind the start card, and again once the textures are in (they change those materials), so the browser builds
// their shaders and uploads their textures then, not with a freeze of a second or more the first time you dig or dump
// (the load tests' freeze check, bhtest.js, times it). warmN: frames still to warm
let warmN=3;
function warmList(){const l=[...streams.map(s=>s.m),loadMesh,heap,pInst,packMesh,dustPts,typeof mfInst!=='undefined'?mfInst:null,typeof rgInst!=='undefined'?rgInst:null,typeof wmMesh!=='undefined'?wmMesh:null];
  l.push(shMesh);for(const k of CLODS)l.push(k.mesh);for(const h of hvs){l.push(h.heap,h.hheap)}return l.filter(Boolean)}
function warmPre(){if(warmN<=0||bench.on)return null;warmN--;const keep=[];
  for(const o of warmList()){keep.push([o,o.visible,o.count,o.isPoints?o.geometry.drawRange.count:0]);o.visible=true;if(o.isInstancedMesh)o.count=Math.max(1,o.count);if(o.isPoints)o.geometry.setDrawRange(0,Math.max(1,o.geometry.drawRange.count))}
  // the pour stream takes the dirt texture when it first pours (pourStream, dirt.js): give it now
  for(const s of streams)if(pMat.map&&s.m.material.map!==pMat.map){s.m.material.map=pMat.map;s.m.material.needsUpdate=true}
  return keep}
function warmPost(keep){if(!keep)return;for(const [o,v,c,d] of keep){o.visible=v;if(o.isInstancedMesh)o.count=c;if(o.isPoints)o.geometry.setDrawRange(0,d)}}
// textures may finish loading before the later scripts arrive: apply them now if they are in, otherwise when they are
const texReady=()=>{applyTextures();warmN=Math.max(warmN,3);warmAll={t0:performance.now(),next:0,mats:0,pend:0,still:0};LOADP.warm=true};
// the rest of the world's first use. Shaders: every material in the scene, hidden or far away, has its shader built in
// the background (compileAsync, which waits on the browser's parallel compiling instead of stalling a frame), once the
// textures are in and again whenever new materials turn up (the detailed machines load later), checked every 4 s for
// the first 3 minutes; on Windows a shader built at first sight can stall a second or more. Textures: uploaded three a
// frame while the start card is up, where a hitch can't be felt. (The island tour test, tourtest.js, waits for this and
// times it; warmIdle says when nothing is left to do)
let warmAll=null;
// a drawn frame that took over 150 ms goes in the Profiler's timeline with what was new on the graphics card in it
const drawInfo=()=>[renderer.info.programs.length,renderer.info.memory.geometries,renderer.info.memory.textures];
function drawSlow(t0,a){const b=drawInfo();pfMark('Slow frame drawn',t0,`new on the card: ${b[0]-a[0]} shaders, ${b[1]-a[1]} meshes, ${b[2]-a[2]} pictures`)}
// the places a player gets to (where the island tour test goes): the rain cover's top-down pass draws what is there
// once, inside one call with nothing drawn on screen, so its depth shaders for what is only found there are built
// before you arrive. Only behind the start card or while the tour test gets ready
const WARM_AT=[[-190,248],[-200,205],[FAM_X,FAM_Z],[JES_X,JES_Z],[72,540],[0,600],[0,652],[0,-5],[40,-330]];
function warmAt(x,z){const pm0=performance.now(),c=camera.position.clone(),sp=sun.position.clone(),stp=sun.target.position.clone(),y=Math.max(WATER,baseHeight(x,z))+2;
  try{camera.position.set(x,y,z);camera.updateMatrixWorld();if(typeof rcRender==='function'&&typeof rcRT!=='undefined')rcRender();
    // (the sun's shadow pass was drawn here too, but called outside a frame it left WebGL failing every draw after it,
    // GL_INVALID_OPERATION, and the screen froze on its last picture; v240)
    }catch(e){}
  finally{camera.position.copy(c);camera.updateMatrixWorld();sun.position.copy(sp);sun.target.position.copy(stp);sun.updateMatrixWorld();sun.target.updateMatrixWorld();renderer.shadowMap.needsUpdate=true;pfMark('Place',pm0,Math.round(x*FT)+', '+Math.round(z*FT)+' ft')}}
const warmQuiet=()=>!help.hidden||typeof tour!=='undefined'&&tour.on&&tour.ph==='ready';
function warmIdle(){const W=warmAll;return !W||W.pend===0&&W.still>=1&&(!W.q||!W.q.length||help.hidden)&&(!W.at||!W.at.length||!warmQuiet())}
// for the loading cover (start.js): the same, but the shaders count as done once a pass has finished and WARM_SETTLE ms
// have gone by since, even if new materials keep turning up (the townsfolk and the town's buildings arrive for a while
// and each restarted the wait, so the cover sat till its 60 s cap); what turns up after is still warmed behind the start card
const WARM_SETTLE=6000;
function warmCover(){const W=warmAll;if(!W)return true;const sh=W.pend===0&&W.still>=1||W.c1&&performance.now()-W.c1>WARM_SETTLE;
  return sh&&(!W.q||!W.q.length||help.hidden)&&(!W.at||!W.at.length||!warmQuiet())}
// the textures still to upload: every one in the scene whose picture is in and that isn't uploaded or queued yet (the
// queue is topped up with the ones that arrive later at each 4 s check)
function warmTexQ(W){if(!W.q){W.q=[];W.up=new Set();W.q0=0}const inQ=new Set(W.q),ok=im=>im&&(im.width||im.data||Array.isArray(im));
  scene.traverse(o=>{for(const m of [].concat(o.material||[]))for(const k in m){const t=m[k];if(t&&t.isTexture&&!W.up.has(t)&&!inQ.has(t)&&ok(t.image)){inQ.add(t);W.q.push(t)}}});
  W.q0=Math.max(W.q0,W.up.size+W.q.length)}
// how far the warming is, 0 to 1, for the loading cover (start.js): texture uploads, the places visited, the shaders
function warmFrac(){const W=warmAll;if(!W)return LOADP.warm?1:0;const q=W.q0?1-W.q.length/W.q0:0,a=W.at?1-W.at.length/WARM_AT.length:0,c=W.pend===0&&W.still>=1?1:W.mats?.5:0;return (q+a+c)/3}
function warmAllTick(){const W=warmAll;if(!W||bench.on||vrOn())return;const now=performance.now();W.f=(W.f||0)+1;
  if(!W.at){W.at=WARM_AT.slice();rcWarm()}if(W.at.length&&W.f%8===0&&W.mats&&W.pend===0&&warmQuiet())warmAt(...W.at.pop());
  if(!W.q)warmTexQ(W);
  // behind the loading cover, as many as fit in about 12 ms (at least 6); behind the start card after it, three a frame
  if(!help.hidden){const t0=performance.now();for(let i=0;W.q.length&&(LOADP.done?i<3:i<6||performance.now()-t0<12);i++){const t=W.q.pop();W.up.add(t);try{renderer.initTexture(t)}catch(e){}}}
  // the check for new materials: each second while loading (so the cover lifts as soon as the shaders are done), then every 4 s
  if(now<W.next)return;W.next=now+(LOADP.done?4000:1000);warmTexQ(W);
  // while loading, the shaders wait for the pictures (start.js loadPicsIn): a material built before its picture arrives is
  // built again with it (a shader with a picture is another shader), which was nearly half of all the building. Nothing
  // is drawn behind the cover meanwhile (loadHold), so nothing needs them sooner
  if(!LOADP.done&&typeof loadPicsIn==='function'&&!loadPicsIn()&&now-W.t0<20000)return;
  // new materials, or the structures' ones whose pictures arrived (that swaps their shaders: brVer, bridges.js)
  const ms=new Set();scene.traverse(o=>{if(o.material)for(const m of [].concat(o.material))ms.add(m)});
  if(ms.size>W.mats||brVer!==W.ver){W.mats=Math.max(W.mats||0,ms.size);W.ver=brVer;W.still=0;W.pend++;
    const pm0=performance.now(),pg0=renderer.info.programs.length,pmN=()=>`${ms.size} materials, shaders ${pg0} to ${renderer.info.programs.length}`;
    try{warmVm()}catch(e){}try{if(!W.postW){W.postW=1;postWarm()}}catch(e){}
    const c1=()=>{W.pend--;if(!W.c1)W.c1=performance.now();pfMark('Shader pass',pm0,pmN())};
    if(!LOADP.done){W.pend++;const s1=()=>{W.pend--;pfMark('Shadow shaders',pm0)};try{const q=warmShadows(warmRoot());if(q&&q.then)q.then(s1,s1);else W.pend--}catch(e){W.pend--}}
    // (and the lamps' other set, gfx.js ltSl, once you have been in 10 s: built during the loading it held up the shaders
    // the loading needed, on Windows a third of a second each with the lamps in; nothing waits for it)
    const c2=()=>{c1();const go=()=>{if(!LOADP.done||!help.hidden||performance.now()-PF_BOOT.done<10000){setTimeout(go,2000);return}
      try{const pm1=performance.now(),q=warmCompile(warmRoot(),scene,true);if(q&&q.then)q.then(()=>pfMark('Shader pass, other lamp set',pm1,pmN()))}catch(e){}};go()};
    try{const p=warmCompile(warmRoot(),scene);if(p&&p.then)p.then(c2,c2);else c2()}catch(e){c1()}
    pfMark('Shader pass set-up',pm0,pmN())}
  else W.still++;
  if(now-W.t0>180000&&W.pend===0&&(!W.q.length||help.hidden)&&(!W.at.length||!warmQuiet()))warmAll=null}
// behind the loading cover nothing is drawn while shaders are being built in the background: a frame drawn then has to
// wait for every shader in view to finish there and then, one after another (on Windows that froze the page for 10 to 25
// s at a time, the most of a minute's load), whereas left alone the browser builds them side by side. Each pass (and the
// passes for materials that turn up later) is waited out the same way until the cover lifts
function loadHold(){if(LOADP.done||bench.on||vrOn())return false;const W=warmAll;return !W||!W.mats||W.pend>0}
// the sun's shadow pass draws every caster with a depth material of three.js's own (WebGLShadowMap getDepthMaterial),
// whose shaders were only built at the first real frame, one after another (about 15 of them: most of the 9 s freeze
// at the end of loading on Windows). The same materials are made here, set as three.js would set them (picture, cut-out,
// side as the shadow side), swapped onto each caster just long enough to be built in the background into a plain
// target (no tone mapping, linear colours: as the shadow map) with the scene's lights. Points-light (distance) shadows
// are left: none cast while loading
const warmShRT=new THREE.WebGLRenderTarget(1,1),warmShSide={[THREE.FrontSide]:THREE.BackSide,[THREE.BackSide]:THREE.FrontSide,[THREE.DoubleSide]:THREE.DoubleSide};
function warmShadows(root){if(!renderer.shadowMap.enabled)return null;const swap=[],made=new Map(),dm=m=>{let d=made.get(m);if(d)return d;
    d=new THREE.MeshDepthMaterial();d.visible=m.visible;d.wireframe=m.wireframe;d.side=m.shadowSide!==null&&m.shadowSide!==undefined?m.shadowSide:warmShSide[m.side];
    d.alphaMap=m.alphaMap||null;d.alphaTest=m.alphaToCoverage===true?0.5:m.alphaTest||0;d.map=m.map||null;d.displacementMap=m.displacementMap||null;d.displacementScale=m.displacementScale??1;
    made.set(m,d);return d};
  // three.js gives a material a depth material of its own only for a cut-out or displacement (own: made exactly, above).
  // Everything else shares ONE, whose side and picture it sets for each caster without picking the shader again, so
  // which side and picture a kind of object (plain, instanced, skinned, by its vertex data) gets built with is whatever
  // was drawn before it. So for each kind, one of its objects is built with every side and with and without a picture
  // that the sharers have (these are small shaders): whichever the shadow pass lands on is ready
  const own=m=>m.displacementMap&&m.displacementScale!==0||m.alphaMap&&m.alphaTest>0||m.map&&m.alphaTest>0||m.alphaToCoverage===true;
  const kindOf=o=>(o.isInstancedMesh?'i':'')+(o.instanceColor?'c':'')+(o.morphTexture?'M':'')+(o.isSkinnedMesh?'s':'')+(o.isBatchedMesh?'b':'')+(o.isPoints?'p':o.isLine?'l':'')+
    Object.keys(o.geometry.attributes).sort().join()+'|'+Object.keys(o.geometry.morphAttributes||{}).join();
  const L=[],kinds=new Map(),sides=new Set(),pics=new Set();let pic=null;
  root.traverse(o=>{if(!(o.isMesh||o.isLine||o.isPoints)||!o.castShadow||!o.material||!o.geometry)return;
    if(o.customDepthMaterial){swap.push([o,o.material]);o.material=o.customDepthMaterial;L.push(o);return}
    const ex=[];let sh=false;for(const m of [].concat(o.material)){if(!m)continue;if(own(m))ex.push(dm(m));else{sh=true;sides.add(m.shadowSide!==null&&m.shadowSide!==undefined?m.shadowSide:warmShSide[m.side]);pics.add(!!m.map);if(m.map)pic=m.map}}
    let rep=false;if(sh){const k=kindOf(o);if(!kinds.has(k)){kinds.set(k,o);rep=true}}
    if(ex.length||rep){swap.push([o,o.material]);o.material=ex;L.push(o)}});
  const shared=[];for(const sd of sides)for(const p of pics){const d=new THREE.MeshDepthMaterial();d.side=sd;d.map=p?pic:null;shared.push(d);made.set(d,d)}
  for(const o of kinds.values())o.material=o.material.concat(shared);
  // (the shadow pass draws with no scene behind it, so no fog: part of the shader's key even for a depth material)
  if(!L.length)return null;const t=renderer.getRenderTarget(),fog=scene.fog;let p=null;
  try{renderer.setRenderTarget(warmShRT);scene.fog=null;p=renderer.compileAsync({isObject3D:true,traverseVisible(){},traverse(cb){for(const o of L)cb(o)}},camera,scene)}
  finally{scene.fog=fog;renderer.setRenderTarget(t);for(const [o,m] of swap)o.material=m}
  // (kept a while: disposing them now would drop the very shaders built, before the shadow pass takes them up)
  const drop=()=>{if(!LOADP.done){setTimeout(drop,2000);return}setTimeout(()=>{for(const d of made.values())d.dispose()},15000)};drop();return p}
// the islands' machines (gfxMachines standing on an island: about a third of the game's shaders) are not drawn from town,
// where every visit starts (controls.js START_AT, gfxAway): the warming passes leave them out (warmRoot, a stand-in root
// that walks the scene without them) and, once you are in, they are built one machine at a time in the background
// (warmLaterTick, gpuWarm), long before you can get to an island. Starting anywhere else warms the whole scene as before
const warmLater={list:null,i:0,t:0,busy:false,done:false};
function warmRoot(){const L=warmLater;if(L.done||typeof startAuto!=='function'||!startAuto()){if(warmFar.done)return scene;if(!L.list)L.list=[]}
  else if(!L.list)L.list=gfxMachines().filter(g=>gfxIsl(g.position.x,g.position.z,15));
  // (left out only while they really are kept out of the picture: the island machines while the camera is in town, as
  // gfxAway hides them, and the far world while it is over WARM_SHOW m from the camera. Behind the loading cover the
  // camera stands at the dig site, not in town where you start, and what was left out there was drawn all the same,
  // its shaders built there and then: a 21 s freeze in the owner's Windows loading, v427)
  const c=camera.position,away=c.z>=TU.townZ&&!gfxIsl(c.x,c.z,30),skip=new Set(away?L.list:[]);
  warmFarList();for(const e of warmFar.L||[])if(warmFarD(e,c)>WARM_SHOW)skip.add(e[0]);
  return {isObject3D:true,traverseVisible(){},traverse(cb){const t=o=>{if(skip.has(o))return;cb(o);for(const c of o.children)t(c)};t(scene)}}}
// the far world: what stands more than WARM_NEAR m from where the visit starts (START_AT, or the camera on a test page)
// is left out of the loading cover's shader pass (warmRoot), so the cover lifts once what is round you is ready (most
// of the island's materials are only out there: the minute's wait on Windows). Those things stay out of the picture
// (warmFarHide, from the frame's draw in gfx.js; never in the map editor, never within WARM_SHOW m of the camera)
// until their shaders are built in the background behind the start card and as you play, a batch at a time nearest
// you first (warmFarTick, gpuWarm). Without hiding, a far thing in view would build its shaders there and then, a frame
// frozen for every one. warmFar.L: [thing, its middle from its position (x, z), radius]
const WARM_NEAR=200,WARM_SHOW=150,WARM_BATCH=40;
const warmFar={L:null,busy:false,done:false,t:0};
function warmFarList(){const F=warmFar;if(F.L||F.done)return;F.L=[];const from=typeof startAuto==='function'&&startAuto()?START_AT:camera.position,
    skip=new Set(warmLater.list||[]),b=new THREE.Box3(),s=new THREE.Sphere();
  for(const o of scene.children){if(skip.has(o)||o.isLight||o.isCamera)continue;b.setFromObject(o);if(b.isEmpty())continue;b.getBoundingSphere(s);
    if(s.radius>400||Math.hypot(s.center.x-from.x,s.center.z-from.z)-s.radius<WARM_NEAR)continue;
    F.L.push([o,s.center.x-o.position.x,s.center.z-o.position.z,s.radius])}
  pfMark('Far world held back',performance.now(),F.L.length+' things')}
const warmFarD=(e,c)=>Math.hypot(e[0].position.x+e[1]-c.x,e[0].position.z+e[2]-c.z)-e[3];
function warmFarHide(cam){const F=warmFar;if(!F.L||!F.L.length||cam!==camera||edOn||renderer.xr.isPresenting)return;const c=cam.position;
  for(const e of F.L)if(e[0].visible&&warmFarD(e,c)>WARM_SHOW){e[0].visible=false;gfxHid.push(e[0])}}
function warmFarTick(){const F=warmFar;if(F.done||!F.L||F.busy&&performance.now()-F.b0<20000||!LOADP.done||performance.now()<F.t)return;
  // (not while the start card is still up and getting your spot ready, startReveal: a batch built then held up the shaders
  // the first frames at your spot needed, the freeze just after the cover lifted; 3 s after it goes)
  if(!help.hidden){F.t=performance.now()+3000;return}
  // (a batch whose building never reports back is let go after 20 s, and everything is shown 3 minutes after you are in)
  if(performance.now()-PF_BOOT.done>180000){pfMark('Far world shown (time up)',performance.now(),F.L.length+' things');F.done=true;F.L=null;return}
  F.L=F.L.filter(e=>e[0].parent);if(!F.L.length){F.done=true;F.L=null;pfMark('Far world all built',performance.now());return}
  const c=camera.position;F.L.sort((a,b)=>warmFarD(a,c)-warmFarD(b,c));const B=F.L.slice(0,WARM_BATCH);F.busy=true;F.b0=performance.now();
  const root={isObject3D:true,name:'far world, '+B.length+' things',traverseVisible(){},traverse(cb){for(const e of B)e[0].traverse(cb)}};
  const end=()=>{F.busy=false;F.t=performance.now()+200;if(!F.L)return;const done=new Set(B);F.L=F.L.filter(e=>!done.has(e))};gpuWarm(root).then(end,end)}
// the loading report: once a visit, when the far world is built (or 2 minutes after the cover lifted), how the getting
// ready went on this device goes to the shared board (island_tour_put, kind 'load'; the Vercel site only, as sync is):
// the graphics card, the steps' times, the long stalls, the shaders built and the slowest parts of the timeline. Only
// timings, nothing of the save. It shows how the loading really goes on the owner's PC, which the test machine can't
let loadRep=false;
function loadReportTick(){if(loadRep||!LOADP.done||!(warmFar.done||performance.now()-PF_BOOT.done>120000))return;loadRep=true;
  if(typeof sync==='undefined'||!sync.on||typeof syncRpc!=='function')return;
  try{const E=window.EFFORT,v=E&&E.versions?+E.versions[E.versions.length-1].v||0:0,gl=renderer.getContext();
    const d={cover:Math.round(PF_BOOT.done),steps:PF_BOOT.steps,programs:renderer.info.programs.length,
      parallel:!!gl.getExtension('KHR_parallel_shader_compile'),long:PF_BOOT.long.filter(l=>l[1]>=200).slice(0,80).map(l=>[Math.round(l[0]),Math.round(l[1])]),
      tl:PF_BOOT.tl.filter(r=>r[2]>=200||/Far world|Shader pass/.test(r[0])).slice(0,120)};
    const dev=`${typeof gpuName==='function'?gpuName():''} · ${renderer.domElement.width}×${renderer.domElement.height} px · Graphics ${typeof gfxName==='function'?gfxName():''} · ${navigator.platform||''}`;
    syncRpc('island_tour_put',{p_v:v,p_device:dev,p_gfx:typeof gfxKey!=='undefined'?gfxKey:'',p_kind:'load',p_fps:null,p_data:d},true).catch(()=>{})}catch(e){}}
// the shader timing test (open the site with ?shaderbench): while loading, a few sample shaders are built here one at a
// time, each with a mark of its own so nothing is reused from before, and how long each took to build goes to the
// shared board (kind 'shaderbench'): plain, with the wet look, with all the lamps or just the sun, a heavy one with
// pictures. It shows what makes this computer's shaders slow to build (a second or more each on the owner's Windows PC)
let shBenchOn=/[?&]shaderbench\b/.test(location.search),shBenchN=0;
// (run first thing, before the loading's own shaders are built, so nothing else is building beside it: each sample is
// built twice with marks of its own and the faster time kept; then each of the game's changes to three.js's shader
// pieces (core.js, SC0) is taken out in turn, to find the one that is slow to build)
function shBenchTick(){if(!shBenchOn||++shBenchN<5||typeof wetPatch!=='function')return;shBenchOn=false;const T0=performance.now();
  const gl=renderer.getContext(),C=THREE.ShaderChunk,sun0=new THREE.Scene(),out=[];sun0.add(new THREE.HemisphereLight(0xffffff,0x444444,1));
  {const d=new THREE.DirectionalLight(0xffffff,1);d.castShadow=true;sun0.add(d,d.target)}
  const geo=new THREE.BoxGeometry(1,1,1),changed=Object.keys(SC0).filter(k=>C[k]!==SC0[k]);
  const std=wet=>()=>{const m=new THREE.MeshStandardMaterial();if(wet)wetPatch(m);return m};
  const time=(make,tg)=>{let best=1e9,src=0;for(let rep=0;rep<2;rep++){const m=make(),nonce='shb'+Math.random().toString(36).slice(2),ob=m.onBeforeCompile,ok=m.customProgramCacheKey;
      m.onBeforeCompile=function(sh,r){if(ob)ob.call(this,sh,r);sh.fragmentShader+='\n// '+nonce;sh.vertexShader+='\n// '+nonce};m.customProgramCacheKey=function(){return (ok?ok.call(this):'')+nonce};
      const t0=performance.now();try{renderer.compile(new THREE.Mesh(geo,m),camera,tg);const P=renderer.properties.get(m).currentProgram;
        if(P){if(!gl.getProgramParameter(P.program,gl.LINK_STATUS))src=-1;else src=0;if(src>=0)for(const x of gl.getAttachedShaders(P.program))src+=gl.getShaderSource(x).length}}catch(e){src=-2}
      best=Math.min(best,performance.now()-t0);m.dispose()}return [Math.round(best),src]};// (src -1: it failed to build)
  const swap=(keys,f)=>{const keep=keys.map(k=>C[k]);keys.forEach(k=>C[k]=SC0[k]);try{return f()}finally{keys.forEach((k,i)=>C[k]=keep[i])}};
  time(std(false),sun0);// (the first one built pays for setting things up)
  const add=(n,r)=>out.push([n,...r]);
  add('standard, sun only',time(std(false),sun0));add('standard, all lamps',time(std(false),scene));
  add('standard + wet, sun only',time(std(true),sun0));add('standard + wet, all lamps',time(std(true),scene));
  add('standard + wet, all lamps, none of the game changes',swap(changed,()=>time(std(true),scene)));
  const groups={fog:changed.filter(k=>/^fog_/.test(k)),'lamp skip and light shading':changed.filter(k=>/^lights_fragment/.test(k)),'cloud shadows and building lights':changed.filter(k=>k==='lights_pars_begin'),
    'colour fix':changed.filter(k=>/^(color_fragment|emissivemap_fragment)$/.test(k))};
  const other=changed.filter(k=>!Object.values(groups).some(g=>g.includes(k)));if(other.length)groups['other ('+other.join(' ')+')']=other;
  {const L0=C.lights_fragment_begin;C.lights_fragment_begin=lightsLooped(L0);try{add('standard + wet, all lamps, lamps as a loop',time(std(true),scene));add('standard + wet, sun only, lamps as a loop',time(std(true),sun0))}finally{C.lights_fragment_begin=L0}}
  for(const [n,keys] of Object.entries(groups))if(keys.length)add('standard + wet, all lamps, without '+n,swap(keys,()=>time(std(true),scene)));
  pfMark('Shader timing test',T0,out.map(r=>r[0]+' '+r[1]+' ms').join('; '));
  toast('Shader timing test done ('+Math.round((performance.now()-T0)/1000)+' s)','good',6000);
  if(typeof sync!=='undefined'&&sync.on)try{const E=window.EFFORT,v=E&&E.versions?+E.versions[E.versions.length-1].v||0:0;
    syncRpc('island_tour_put',{p_v:v,p_device:`${typeof gpuName==='function'?gpuName():''} · Graphics ${gfxName()} · ${navigator.platform||''}`,p_gfx:gfxKey,p_kind:'shaderbench',p_fps:null,
      p_data:{res:out,changed,boot:true,parallel:!!gl.getExtension('KHR_parallel_shader_compile')}},true).catch(()=>{})}catch(e){}}
function warmLaterTick(){const L=warmLater;if(L.done||!L.list||!LOADP.done||L.busy||performance.now()<L.t)return;
  const g=L.list[L.i++];if(!g){L.done=true;return}L.busy=true;const end=()=>{L.busy=false;L.t=performance.now()+400};gpuWarm(g).then(end,end)}
// in first person the gun and the worker's own body are drawn last, as see-through (gunVm, gunVmBody, pistol.js), which
// gives their materials other shaders than the opaque ones (three.js keys them on it): those are built here too, or the
// first steps on foot built a dozen of them at once, the stutter after dropping in
function warmVm(){if(typeof gunVm!=='function')return;gunMdl.traverse(gunVm);const g=wkMdl.g;if(!g)return;const flip=[];
  g.traverse(o=>{if(o.isMesh)for(const m of [].concat(o.material))if(!m.transparent){m.transparent=true;flip.push(m)}});
  try{warmCompile(g,scene)}finally{for(const m of flip)m.transparent=false}}
// warming one thing before it first shows (the town's cars, a townsperson's look or crowd, a close-up hero), at any
// time in the game: its shaders built in the background (compileAsync, hidden parts too) and its textures uploaded one
// a frame (gpuWarmTick), then the promise resolves and the caller shows it. Without it the frame it first appears in
// builds its shaders and uploads its pictures there and then: the stutter as cars and people come into town
const gpuQ=[];
function gpuUp(tx){return new Promise(r=>gpuQ.push({tx:[...tx],done:r}))}
function gpuWarm(o){const tx=new Set(),ok=im=>im&&(im.width||im.data||Array.isArray(im));
  o.traverse(m=>{for(const M of [].concat(m.material||[]))for(const k in M){const t=M[k];if(t&&t.isTexture&&ok(t.image))tx.add(t)}});
  const pm0=performance.now(),pg0=renderer.info.programs.length;let p=null;try{p=warmCompile(o,scene)}catch(e){}
  return Promise.all([p&&p.then?p.catch(()=>{}):null,gpuUp(tx)]).then(r=>{pfMark('Warmed '+(o.name||o.type||'scene'),pm0,`${tx.size} pictures, shaders ${pg0} to ${renderer.info.programs.length}`);return r})}
// (a few milliseconds' worth a frame, at least one)
function gpuWarmTick(){const t0=performance.now();while(gpuQ.length){const j=gpuQ[0],t=j.tx.pop();if(t)try{renderer.initTexture(t)}catch(e){}
  if(!j.tx.length){gpuQ.shift();j.done()}if(performance.now()-t0>(help.hidden?3:14))break}}// more a frame behind the start card
if([texGrass,texDirt,texGrime].every(t=>t.image&&t.image.width))texReady();else texManager.onLoad=texReady;
// every lit material gets its wet look before anything is drawn, so nothing compiles twice (rain.js)
wetPatchAll();
// the renderer runs the loop: a WebXR headset only draws frames asked for through it (vr.js)
renderer.setAnimationLoop(frame);
