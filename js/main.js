// Corley's Island: the frame loop: inputs, machines, digging, spills, gas main, terrain, HUD and camera.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// the machines catch their own shadows (cab under the boom, bed under the load); glass stays clear
for(const g of [machine,truck])g.traverse(o=>{if(o.isMesh&&!o.material.transparent)o.receiveShadow=true});
// first person in a machine: the eye at (px,py,pz) in the machine's frame, looking along (dx,dy,dz) turned by fpl
function fpEye(o,px,py,pz,dx,dy,dz){o.localToWorld(camera.position.set(px,py,pz));
  const y=Math.atan2(dx,dz)+fpl.yaw,p=clamp(Math.atan2(dy,Math.hypot(dx,dz))+fpl.pitch,-1.45,1.45),c=Math.cos(p)*10;
  o.localToWorld(look.set(px+Math.sin(y)*c,py+Math.sin(p)*10,pz+Math.cos(y)*c))}
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
  // inputs
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
  if(mode==='heavy'){hDrive=Ly;hTurn=Lx*Ts;boomIn=0;bucketIn=0;if(hvCur().K.trail){if(camMode==='chase')orbitYaw-=Rx*1.6*dt}else{hArm=-Ry;hCurl=-Rx}}
  const res=st.res;
  st.swing-=swingIn*TU.exSwing*dt*res;
  st.a1=clamp(st.a1+boomIn*TU.exBoom*dt*res,...LIM.a1);
  st.a2=clamp(st.a2+stickIn*TU.exStick*dt*res,...LIM.a2);
  {const a3=st.a3;st.a3=clamp(st.a3+bucketIn*TU.exBucket*dt*res,...LIM.a3);st.a3v=dt>0?(st.a3-a3)/dt:0}
  if(bench.on){benchTick(dt);driveIn=0;turnIn=0;tThr=0;tSteer=0;tBed=0;mL=0;mR=0}
  updateTruck(dt,tThr,tSteer,tBed);updateMower(dt,mL,mR);if(bench.on){sDrive=sTurn=sArm=sCurl=0}updateSkid(dt,sDrive,sTurn,sArm,sCurl);
  siteTick();
  if(mode==='walk'&&!bench.on)updateWalker(dt,Lx,Ly,Rx*Ts,Ry);else updateWalker(dt,0,0,0,0);
  boatTick(dt,bThr,bSteer);lakeBoatsTick(dt);bikeTick(dt,kThr,kSteer);hvTick(dt,hDrive,hTurn,hArm,hCurl);
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
  updateBox(dt);blkTick(dt);

  // dig
  const g=hAt(tip.x,tip.z);
  st.below=tip.y<g&&!blkHit(tip.x,tip.y,tip.z);
  // soil at the teeth sets how hard the arm works; a full bucket pushing on barely moves
  {const ti=Math.max(0,Math.min(N,Math.round(gI(tip.x)))),tj=Math.max(0,Math.min(N,Math.round(gJ(tip.z))));
    st.soil=st.below?matAt(tj*V+ti,tip.y):-1;
    st.res=st.soil<0?1:soilRes(tj*V+ti,tip.y)*(st.load>=TU.exCap-0.002?0.5:1);
    if(st.soil===2&&!st.seenSand){st.seenSand=true;toast(say('sand'),'',3200)}
    if(st.soil===3&&!st.seenRock){st.seenRock=true;toast(say('rock'),'',3000)}
    st.rumT-=dt;if(padUsed&&st.soil>=0&&st.rumT<=0&&(Math.abs(swingIn)+Math.abs(stickIn)+Math.abs(boomIn)+Math.abs(bucketIn))>0.1){st.rumT=0.12;rumble(140,0.15+0.55*(1-SOIL[st.soil].h))}}
  if(st.below&&!bench.on){
    if(st.load<TU.exCap-0.002){
      const got=dig(tip,TU.exCap-st.load);
      if(got>0){const f=got/(st.load+got);for(let q=0;q<3;q++)st.loadC[q]+=(digC[q]-st.loadC[q])*f;for(let q=0;q<4;q++)st.loadMix[q]+=(digMix[q]-st.loadMix[q])*f;
        st.loadWet+=((underWater(tip)?1:mudAt(tip.x,tip.z))-st.loadWet)*f;
        st.load+=got;statDug(got);st.dirty=true;st.slumpT=2.5;if(Math.random()<0.5)spawn(tip.clone().setY(g+0.05),1.2)}
    }else if(!fullWarned){toast(say('bucketFull'));fullWarned=true}
  }
  if(st.load<TU.exCap*0.9)fullWarned=false;
  // spill: bucket interior points along local -y
  const up=tmp.set(0,-1,0).applyQuaternion(q).y;
  const f=clamp((0.25-up)/0.5,0,1);
  let pourA=0,pourY=0;
  // dirt leaving the bucket goes into the truck bed under it (what does not fit spills) or onto the ground
  const exDrop=(out,spr)=>{
    if(inBed(mid)&&tr.load<TU.trCap){const take=Math.min(out,TU.trCap-tr.load);if(take>0){const f=take/(tr.load+take);for(let q=0;q<3;q++)tr.loadC[q]+=(st.loadC[q]-tr.loadC[q])*f;for(let q=0;q<4;q++)tr.loadMix[q]+=(st.loadMix[q]-tr.loadMix[q])*f;tr.loadWet+=(st.loadWet-tr.loadWet)*f}tr.load+=take;
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
  // a heaped bucket swung or lifted fast loses crumbs over the rim
  {const armV=Math.abs(swingIn)*TU.exSwing+Math.abs(boomIn)*TU.exBoom+Math.abs(stickIn)*TU.exStick;
    if(f===0&&!st.below&&!bench.on&&st.load>TU.exCap*0.7&&armV>0.2){const out=Math.min(st.load,(st.load/TU.exCap-0.7)/0.3*armV*0.006*TU.exSpill*dt);st.load-=out;
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
  if(st.slumpT>0){st.slumpT-=dt;for(let n=0;n<3*GRID_K;n++)if(slump())st.dirty=true}
  if(st.dirty){
    updateTufts(dI0-1,dI1+1,dJ0-1,dJ1+1);lawnTerrain();
    updateTerrain();st.dirty=false;site.dirty=true;mapDirty=true;blkTerrainMoved();
    if(st.slumpT<=0){winOn=false}
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
    {const pb=$('#pumpBtn');if(pb.hidden===waterAny)pb.hidden=!waterAny}
    {const sb=$('#seatBtn'),walk=mode==='walk',mc=walk&&wkNear(),gm=walk&&!mc?famGameNear():null,show=walk?!!(mc||gm):!!wk.inside;if(sb.hidden===show)sb.hidden=!show;const t=walk?(gm?gm.b:'Get in'):'Get out';if(sb.textContent!==t)sb.textContent=t}
    {const bb=$('#boxBtn'),show=TB.hooked||boxNear();if(bb.hidden===show)bb.hidden=!show;const t=TB.hooked?'Drop box':'Hook box';if(bb.textContent!==t)bb.textContent=t}
    // in the skid steer the bucket line is its bucket
    const skm=mode==='skid',bl=skm?sk.load:st.load,pct=Math.round(bl/(skm?TU.skCap:TU.exCap)*100);
    $('#bucketVal').textContent=`${(bl*1.308).toFixed(2)} yd³ · ${pct}%`;
    $('#bucketBar').style.width=pct+'%';
    $('#bucketPanel').classList.toggle('full',pct>=99);
    const dep=h0At(tip.x,tip.z)-tip.y;
    if(skm){const sd=h0At(skTip.x,skTip.z)-skTip.y;$('#tipVal').textContent=`${(Math.abs(sk.v)*2.237).toFixed(1)} mph · edge ${(Math.abs(sd)*3.281).toFixed(1)} ft ${sd>0?'below':'above'} grade`}else
    $('#tipVal').textContent=(dep>0?`Tip ${(dep*3.281).toFixed(1)} ft below grade`:`Tip ${(-dep*3.281).toFixed(1)} ft above grade`)+(st.soil>=0?` · ${SOIL[st.soil].n}`:'');
    let c=0;for(const kk of trenchK)if(H0[kk]-H[kk]>=0.85)c++;
    const tp=trenchK.length?(st.tpLast=Math.round(c/trenchK.length*100)):(st.tpLast||0);
    if(tp>=100&&!st.done){st.done=true;st.doneT=now;const s=Math.round((now-(st.startT||now))/1000);
      toast(say('trenchDone',{time:`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`,strikes:st.strikes?` · ${st.strikes} strike${st.strikes>1?'s':''}`:' · no strikes',caves:st.caves?` · ${st.caves} cave-in${st.caves>1?'s':''}`:''}),'good',6000)}
    const secs=st.startT?Math.round(((st.done?st.doneT:now)-st.startT)/1000):0;
    $('#trenchVal').textContent=`${tp}% · ${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}`;
    $('#trenchBar i').style.width=tp+'%';
    $('#truckVal').textContent=`${(tr.load*1.308).toFixed(1)} / 12 yd³`;
    $('#truckBar').style.width=Math.round(tr.load/TU.trCap*100)+'%';
    $('#haulVal').textContent=(mode==='truck'?`${Math.round(Math.abs(tr.v)*2.237)} mph · ${tr.shiftT>0?'N':tr.gear>0?'D':'R'} · `:'')+`Hauled ${(tr.hauled*1.308).toFixed(1)} yd³`;
    // in Mow mode the lawn takes the bucket's place, so the card keeps its height
    {const lr=$('#lawnRow'),show=mode==='mow';if(lr.hidden===show){lr.hidden=!show;$('#bucketPanel').hidden=show}
      if(show){const lp=Math.floor(lawnPct()*100),ls=lawn.startT?Math.round(((lawn.done?lawn.doneT:now)-lawn.startT)/1000):0;
        $('#lawnVal').textContent=`${lp}% · ${Math.floor(ls/60)}:${String(ls%60).padStart(2,'0')}`;$('#lawnBar i').style.width=lp+'%';
        $('#mowVal').textContent=`${(Math.abs(mw.v)*2.237).toFixed(1)} mph · blades ${mw.load>0.2?'cutting':'on'}`}}
    const gv=$('#gasVal');
    gv.textContent=st.strikes?`Gas main: ${st.strikes} strike${st.strikes>1?'s':''}`:st.exposed?'Gas main: exposed ✓':'Gas main: buried';
    gv.style.color=st.strikes?'var(--danger)':st.exposed?'var(--ok)':'';
  }
  // flying dirt
  particlesTick(dt);dustTick(dt);grimeTick();mdlTick(dt);
  // groundwater, the tailgate stream and the dirt sounds
  digTilesTick(dt);if(!bench.on)waterTick(dt);mudTick(dt);rainTick(dt);grassTick(dt);jesTick(dt);mainTick(dt);treesTick(dt);plantTick();
  pourStream(streams[1],tr.pourP,hAt(tr.pourP.x,tr.pourP.z),tr.pourRate,tr.loadC,now/1000);
  dirtSndTick(dt);
  // bucket load visual
  const lv=Math.max(st.load,st.stuck);loadMesh.visible=lv>0.01;
  if(loadMesh.visible){const s=0.35+0.75*Math.sqrt(lv/TU.exCap);loadMesh.scale.set(s,s*0.6,s*1.15);tintLoad(loadMesh.material,st.loadC)}
  // camera
  const hy=st.yaw+st.swing;
  if(camMode==='chase'){
    let cyaw,cd=camDist,op=orbitPitch;
    if(mode==='truck'){look.set(tr.x,tr.y+1.6,tr.z);cyaw=tr.yaw+Math.PI+orbitYaw;cd=camDist+3}
    else if(mode==='skid'){look.set(sk.x+Math.sin(sk.yaw)*1.2,sk.y+1.0,sk.z+Math.cos(sk.yaw)*1.2);cyaw=sk.yaw+Math.PI+orbitYaw;cd=camDist*0.7}
    else if(mode==='boat'){const b=btCur();look.set(b.x+Math.sin(b.yaw)*0.8,b.y+1.0,b.z+Math.cos(b.yaw)*0.8);cyaw=b.yaw+Math.PI+orbitYaw;cd=camDist*0.85}
    else if(mode==='heavy'){const h=hvCur();look.set(h.x+Math.sin(h.yaw)*1.0,h.y+1.6,h.z+Math.cos(h.yaw)*1.0);cyaw=h.yaw+Math.PI+orbitYaw;cd=camDist*h.K.cam}
    else if(mode==='bike'){look.set(bk.x+Math.sin(bk.yaw)*0.6,bk.y+1.0,bk.z+Math.cos(bk.yaw)*0.6);cyaw=bk.yaw+Math.PI+orbitYaw;cd=camDist*0.55}
    else if(mode==='mow'){look.set(mw.x+Math.sin(mw.yaw)*0.8,mw.y+0.7,mw.z+Math.cos(mw.yaw)*0.8);cyaw=mw.yaw+Math.PI+orbitYaw;cd=camDist*0.6}
    else if(mode==='walk'){look.set(wk.x,wk.y+1.35,wk.z);cyaw=wk.view+Math.PI+orbitYaw;cd=camDist*0.5;
      // inside Jessica's cottage the roof lifts off and the camera looks down from above the walls
      if(jesIn){cd=camDist*0.42;op=Math.max(op,1.05)}}
    else{const fx=Math.sin(hy),fz=Math.cos(hy);look.set(st.x+fx*4,st.y+0.8,st.z+fz*4);cyaw=hy+Math.PI+orbitYaw}
    camT.set(look.x+Math.sin(cyaw)*Math.cos(op)*cd,look.y+Math.sin(op)*cd,look.z+Math.cos(cyaw)*Math.cos(op)*cd);
    camT.y=Math.max(camT.y,surfAt(camT.x,camT.z)+1.2,WATER+0.9);
    if(firstCam){camera.position.copy(camT);firstCam=false}else camera.position.lerp(camT,Math.min(1,dt*5));
    camera.lookAt(look);
  }else{
    // the seat's eye point and its straight-ahead look, turned by where you have turned your head (fpl)
    if(mode==='truck')fpEye(sprung,-0.55,1.6,1.95,0.25,-1,12.05);
    else if(mode==='skid')fpEye(skid,0,1.72,0.0,0,-0.9,4.5);
    else if(mode==='boat')fpEye(btCur().g,0,1.62,-0.47,0,-1.1,8);
    else if(mode==='heavy')fpEye(hvCur().g,...hvCur().K.eye);
    else if(mode==='bike')fpEye(bike,0,1.62-bk.comp,-0.12,0,-0.35,1);
    else if(mode==='mow')fpEye(mower,0,1.42,0.02,0,-1.32,4.48);
    else if(mode==='walk'){const p=fpl.pitch,fx=Math.sin(wk.view),fz=Math.cos(wk.view);camera.position.set(wk.x+fx*0.1,wk.y+WK_H-0.12+wkBody.position.y,wk.z+fz*0.1);
      look.set(camera.position.x+fx*Math.cos(p)*5,camera.position.y+Math.sin(p)*5,camera.position.z+fz*Math.cos(p)*5)}
    else fpEye(house,-0.72,2.15,0.3,0.45,-1.75,5.5);
    camera.lookAt(look); firstCam=true;
  }
  fpTick(dt);
  if(bench.on)benchCamera();
  if(viewPin)viewPinApply();
  // VR: the rig goes to the seat and the headset looks round from there (vr.js)
  if(vrOn())vrFrame(dt);
  updateSound(dt);
  if(shake>0){shake-=dt;camera.position.x+=(Math.random()-0.5)*0.25;camera.position.y+=(Math.random()-0.5)*0.25}
  sky.position.copy(camera.position);
  const fv=mode==='boat'?btCur():mode==='heavy'?hvCur():mode==='bike'?bk:mode==='truck'?tr:mode==='mow'?mw:mode==='skid'?sk:mode==='walk'?wk:st;sun.position.set(fv.x,fv.y,fv.z).addScaledVector(LIGHT_DIR,SUN_D); sun.target.position.set(fv.x,fv.y,fv.z);
  {const o=groundOcc.value;o[0].set(st.x,st.z,st.yaw,0);o[2].set(tr.x,tr.z,tr.yaw,0)}
  timeU.value=now/1000;
  shadowProxyTick();lawnLod();tuftLod();rainCover();if(vr.fake)vrFakeHead();postRender();if(vrOn())vrAfter();
  if(bench.on)benchSample(dt);
  fpsFrames++;fpsTime+=dt;
  if(fpsTime>=0.5){const f=Math.round(fpsFrames/fpsTime);const fe=$('#fpsVal');fe.textContent=f;fe.style.color=f>=50?'var(--ok)':f>=30?'var(--gas)':'var(--danger)';
    // auto resolution: step down when slow; step back up only after a long steady run, and never within 30 s of a step down
    if(!bench.on&&!vrOn()&&gfxCur.auto&&f<48&&pr>1){if(++lowN>=3){pr=Math.max(1,pr-0.25);viewDirty=true;lowN=0;prHold=now+30000}}else lowN=0;
    if(!bench.on&&!vrOn()&&gfxCur.auto&&f>=58&&pr<maxPR&&now>prHold){if(++hiN>=8){pr=Math.min(maxPR,pr+0.25);viewDirty=true;hiN=0}}else hiN=0;
    $('#resVal').textContent=pr.toFixed(2).replace(/0$/,'')+'x';
    const t=renderer.info.render.triangles;$('#triVal').textContent=t>=1e6?(t/1e6).toFixed(2)+'M':t>=1e3?Math.round(t/1e3)+'k':t;fpsFrames=0;fpsTime=0}
}
// textures may finish loading before the later scripts arrive: apply them now if they are in, otherwise when they are
if([texGrass,texDirt,texGrime].every(t=>t.image&&t.image.width))applyTextures();else texManager.onLoad=applyTextures;
// every lit material gets its wet look before anything is drawn, so nothing compiles twice (rain.js)
wetPatchAll();
// the renderer runs the loop: a WebXR headset only draws frames asked for through it (vr.js)
renderer.setAnimationLoop(frame);
