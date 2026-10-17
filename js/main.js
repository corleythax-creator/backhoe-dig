// Backhoe Dig: the frame loop: inputs, machines, digging, spills, gas main, terrain, HUD and camera.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// the machines catch their own shadows (cab under the boom, bed under the load); glass stays clear
for(const g of [machine,truck])g.traverse(o=>{if(o.isMesh&&!o.material.transparent)o.receiveShadow=true});
function frame(now){
  const dt=Math.min(0.05,(now-last)/1000);last=now;crushT-=dt;
  // inputs
  keyAxes(dt);pollPad();
  const Lx=clamp(SL.x+KA.lx+PA.lx,-1,1),Ly=clamp(SL.y+KA.ly+PA.ly+(mode==='dig'||mode==='mow'?0:PA.thr),-1,1),Rx=clamp(SR.x+KA.rx+PA.rx,-1,1),Ry=clamp(SR.y+KA.ry+PA.ry,-1,1);
  let swingIn=0,stickIn=0,driveIn=0,turnIn=0,boomIn=-Ry,bucketIn=Rx;
  if(mode==='dig'){swingIn=Lx;stickIn=Ly}else if(mode==='drive'){driveIn=Ly;turnIn=Lx}
  let tThr=0,tSteer=0,tBed=0;
  if(mode==='truck'){tThr=Ly;tSteer=Lx;tBed=Ry;boomIn=0;bucketIn=0}
  // mower: one stick per lap bar; the left stick sideways spins it as well
  let mL=0,mR=0;
  if(mode==='mow'){mL=clamp(Ly+Lx*0.7,-1,1);mR=clamp(Ry-Lx*0.7,-1,1);boomIn=0;bucketIn=0}
  const res=st.res;
  st.swing-=swingIn*0.85*dt*res;
  st.a1=clamp(st.a1+boomIn*0.6*dt*res,...LIM.a1);
  st.a2=clamp(st.a2+stickIn*0.8*dt*res,...LIM.a2);
  st.a3=clamp(st.a3+bucketIn*1.3*dt*res,...LIM.a3);
  if(bench.on){benchTick(dt);driveIn=0;turnIn=0;tThr=0;tSteer=0;tBed=0;mL=0;mR=0}
  updateTruck(dt,tThr,tSteer,tBed);updateMower(dt,mL,mR);updateSound(dt,Math.abs(swingIn)+Math.abs(stickIn)+Math.abs(boomIn)+Math.abs(bucketIn)+Math.abs(driveIn)+Math.abs(turnIn));updateHeapClods();
  // drive
  st.yaw-=turnIn*0.8*dt;
  st.x=clamp(st.x+Math.sin(st.yaw)*driveIn*2.6*dt,-60,60);
  st.z=clamp(st.z+Math.cos(st.yaw)*driveIn*2.6*dt,-60,60);
  {const rr=mesaR(st.x,st.z),lim=EDGE-3.5;if(rr>lim){const f=lim/rr;st.x*=f;st.z=MZ+(st.z-MZ)*f}}
  blkPush(st,EX_C,EX_R);
  const sy=Math.sin(st.yaw),cy=Math.cos(st.yaw);
  // tracks rut loose fill, crush clods, pick up mud and kick up a little dust
  if(!bench.on&&(Math.abs(driveIn)>0.05||Math.abs(turnIn)>0.05))for(const sd of [-1,1]){const tx=st.x+sd*1.05*cy,tz=st.z-sd*1.05*sy;
    if(stampRut(tx,tz,st.yaw,0.28,1.5,dt)){st.mud=Math.min(1,st.mud+dt*0.06);dustPuff(tx,hAt(tx,tz)+0.1,tz,dt*4)}}
  if(crushT<=0)crushT=0.1;
  const sample=(lx,lz)=>surfAt(st.x+lx*cy+lz*sy,st.z-lx*sy+lz*cy);
  const hf=(sample(-1,1.7)+sample(1,1.7))/2,hb=(sample(-1,-1.7)+sample(1,-1.7))/2;
  const hr=(sample(1,1.7)+sample(1,-1.7))/2,hl=(sample(-1,1.7)+sample(-1,-1.7))/2;
  const k=Math.min(1,dt*8);
  st.y+=((hf+hb)/2-st.y)*k; st.pitch+=(-Math.atan2(hf-hb,3.4)-st.pitch)*k; st.roll+=(Math.atan2(hr-hl,2.1)-st.roll)*k;
  machine.position.set(st.x,st.y,st.z); machine.rotation.set(st.pitch,st.yaw,st.roll);
  house.rotation.y=st.swing;
  boomP.rotation.x=-st.a1; stickP.rotation.x=-st.a2; bucketP.rotation.x=-st.a3;
  machine.updateMatrixWorld(true); updateLinkage(); jointJ.updateMatrixWorld(); updateRams(); updateHoses();
  tipMark.getWorldPosition(tip); midMark.getWorldPosition(mid); bucketP.getWorldQuaternion(q);
  updateBox(dt);blkTick(dt);

  // dig
  const g=hAt(tip.x,tip.z);
  st.below=tip.y<g&&!blkHit(tip.x,tip.y,tip.z);
  // soil at the teeth sets how hard the arm works; a full bucket pushing on barely moves
  {const ti=Math.max(0,Math.min(N,Math.round((tip.x+S/2)/CELL))),tj=Math.max(0,Math.min(N,Math.round((tip.z+S/2)/CELL)));
    st.soil=st.below?matAt(tj*V+ti,tip.y):-1;
    st.res=st.soil<0?1:SOIL[st.soil].h*(st.load>=CAP-0.002?0.5:1);
    if(st.soil===2&&!st.seenSand){st.seenSand=true;toast('Sand bedding. The gas main is right below. Go easy.','',3200)}
    if(st.soil===3&&!st.seenRock){st.seenRock=true;toast('Rock. You are past trench depth.','',3000)}
    st.rumT-=dt;if(padUsed&&st.soil>=0&&st.rumT<=0&&(Math.abs(swingIn)+Math.abs(stickIn)+Math.abs(boomIn)+Math.abs(bucketIn))>0.1){st.rumT=0.12;rumble(140,0.15+0.55*(1-SOIL[st.soil].h))}}
  if(st.below&&!bench.on){
    if(st.load<CAP-0.002){
      const got=dig(tip,CAP-st.load);
      if(got>0){const f=got/(st.load+got);for(let q=0;q<3;q++)st.loadC[q]+=(digC[q]-st.loadC[q])*f;for(let q=0;q<4;q++)st.loadMix[q]+=(digMix[q]-st.loadMix[q])*f;
        st.load+=got;st.dirty=true;st.slumpT=2.5;if(Math.random()<0.5)spawn(tip.clone().setY(g+0.05),1.2)}
    }else if(!fullWarned){toast('Bucket full. Boom up, swing, dump.');fullWarned=true}
  }
  if(st.load<CAP*0.9)fullWarned=false;
  // spill: bucket interior points along local -y
  const up=tmp.set(0,-1,0).applyQuaternion(q).y;
  const f=clamp((0.25-up)/0.5,0,1);
  if(f>0&&st.load>0.0005){
    const out=Math.min(st.load,f*(0.35+st.load*1.6)*dt);
    st.load-=out;
    if(inBed(mid)&&tr.load<TRUCK_CAP){const take=Math.min(out,TRUCK_CAP-tr.load);if(take>0){const f=take/(tr.load+take);for(let q=0;q<3;q++)tr.loadC[q]+=(st.loadC[q]-tr.loadC[q])*f;for(let q=0;q<4;q++)tr.loadMix[q]+=(st.loadMix[q]-tr.loadMix[q])*f}tr.load+=take;
      if(out-take>0){deposit(mid.x,mid.z,out-take,st.loadC,st.loadMix);st.dirty=true;st.slumpT=2.5}
      if(!tr.loadedOnce){tr.loadedOnce=true;toast('Dirt in the truck.','good')}
      if(tr.load>=TRUCK_CAP*0.99&&!tr.fullWarned){tr.fullWarned=true;toast('Truck full. Tap Truck, back it to the cliff edge and raise the bed.','',3500)}}
    else{deposit(mid.x,mid.z,out,st.loadC,st.loadMix); st.dirty=true; st.slumpT=2.5}
    for(let n=0;n<Math.ceil(out*80);n++)spawn(mid,0.8);
    if(st.load<0.0005){st.load=0;st.stuck=0.03*(0.3+st.loadMix[CLAY])}
  }
  // a heaped bucket swung or lifted fast loses crumbs over the rim
  {const armV=Math.abs(swingIn)*0.85+Math.abs(boomIn)*0.6+Math.abs(stickIn)*0.8;
    if(f===0&&!st.below&&!bench.on&&st.load>CAP*0.7&&armV>0.2){const out=Math.min(st.load,(st.load/CAP-0.7)/0.3*armV*0.006*dt);st.load-=out;
      if(inBed(mid))tr.load=Math.min(TRUCK_CAP,tr.load+out);else{deposit(mid.x,mid.z,out,st.loadC,st.loadMix);st.dirty=true}
      if(Math.random()<armV*dt*8)spawn(mid,0.4)}}
  // gas main
  st.strikeCd-=dt;
  if(Math.abs(tip.x)<12&&Math.hypot(tip.y-PIPE_Y,tip.z-PIPE_Z)<PIPE_R+0.07&&st.strikeCd<=0){
    st.strikes++;st.strikeCd=2.5;shake=reduceMotion?0:0.45;
    const fl=$('#flash');fl.style.opacity='0.45';setTimeout(()=>fl.style.opacity='0',180);
    toast('LINE STRIKE! You hit the gas main.','bad',3000);rumble(600,1);
  }
  if(!bench.on)caveTick(dt);
  // terrain
  if(st.slumpT>0){st.slumpT-=dt;for(let n=0;n<3*GRID_K;n++)if(slump())st.dirty=true}
  if(st.dirty){
    updateTufts(dI0-1,dI1+1,dJ0-1,dJ1+1);lawnTerrain();
    updateTerrain();st.dirty=false;mapDirty=true;blkTerrainMoved();
    if(st.slumpT<=0){winOn=false}
    if(!st.exposed){
      const jz=Math.round((PIPE_Z+S/2)/CELL);
      outer:for(let j=jz-1;j<=jz+1;j++)for(let i=Math.round((-12+S/2)/CELL);i<=Math.round((12+S/2)/CELL);i++)
        if(H[j*V+i]<PIPE_Y+PIPE_R+0.17){st.exposed=true;toast('Gas main exposed. Nice and careful.','good',2800);break outer}
    }
  }
  // HUD
  hudT-=dt;
  if(hudT<=0)mapsTick(0.1);
  if(hudT<=0){hudT=0.1;
    {const bb=$('#boxBtn'),show=TB.hooked||boxNear();if(bb.hidden===show)bb.hidden=!show;const t=TB.hooked?'Drop box':'Hook box';if(bb.textContent!==t)bb.textContent=t}
    const pct=Math.round(st.load/CAP*100);
    $('#bucketVal').textContent=`${(st.load*1.308).toFixed(2)} yd³ · ${pct}%`;
    $('#bucketBar').style.width=pct+'%';
    $('#bucketPanel').classList.toggle('full',pct>=99);
    const dep=h0At(tip.x,tip.z)-tip.y;
    $('#tipVal').textContent=(dep>0?`Tip ${(dep*3.281).toFixed(1)} ft below grade`:`Tip ${(-dep*3.281).toFixed(1)} ft above grade`)+(st.soil>=0?` · ${SOIL[st.soil].n}`:'');
    let c=0;for(const kk of trenchK)if(H0[kk]-H[kk]>=0.85)c++;
    const tp=Math.round(c/trenchK.length*100);
    if(tp>=100&&!st.done){st.done=true;st.doneT=now;const s=Math.round((now-(st.startT||now))/1000);
      toast(`Trench complete in ${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}${st.strikes?` · ${st.strikes} strike${st.strikes>1?'s':''}`:' · no strikes'}${st.caves?` · ${st.caves} cave-in${st.caves>1?'s':''}`:''}`,'good',6000)}
    const secs=st.startT?Math.round(((st.done?st.doneT:now)-st.startT)/1000):0;
    $('#trenchVal').textContent=`${tp}% · ${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}`;
    $('#trenchBar i').style.width=tp+'%';
    $('#truckVal').textContent=`${(tr.load*1.308).toFixed(1)} / 10 yd³`;
    $('#truckBar').style.width=Math.round(tr.load/TRUCK_CAP*100)+'%';
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
  particlesTick(dt);dustTick(dt);grimeTick();
  // bucket load visual
  const lv=Math.max(st.load,st.stuck);loadMesh.visible=lv>0.01;
  if(loadMesh.visible){const s=0.35+0.75*Math.sqrt(lv/CAP);loadMesh.scale.set(s,s*0.6,s*1.15);tintLoad(loadMesh.material,st.loadC)}
  // camera
  const hy=st.yaw+st.swing;
  if(camMode==='chase'){
    let cyaw,cd=camDist;
    if(mode==='truck'){look.set(tr.x,tr.y+1.6,tr.z);cyaw=tr.yaw+Math.PI+orbitYaw;cd=camDist+3}
    else if(mode==='mow'){look.set(mw.x+Math.sin(mw.yaw)*0.8,mw.y+0.7,mw.z+Math.cos(mw.yaw)*0.8);cyaw=mw.yaw+Math.PI+orbitYaw;cd=camDist*0.6}
    else{const fx=Math.sin(hy),fz=Math.cos(hy);look.set(st.x+fx*4,st.y+0.8,st.z+fz*4);cyaw=hy+Math.PI+orbitYaw}
    camT.set(look.x+Math.sin(cyaw)*Math.cos(orbitPitch)*cd,look.y+Math.sin(orbitPitch)*cd,look.z+Math.cos(cyaw)*Math.cos(orbitPitch)*cd);
    camT.y=Math.max(camT.y,surfAt(camT.x,camT.z)+1.2);
    if(firstCam){camera.position.copy(camT);firstCam=false}else camera.position.lerp(camT,Math.min(1,dt*5));
    camera.lookAt(look);
  }else{
    if(mode==='truck'){sprung.localToWorld(camera.position.set(-0.55,1.6,1.95));sprung.localToWorld(look.set(-0.3,0.6,14))}
    else if(mode==='mow'){mower.localToWorld(camera.position.set(0,1.42,0.02));mower.localToWorld(look.set(0,0.1,4.5))}
    else{house.localToWorld(camera.position.set(-0.72,2.2,0.5));house.localToWorld(look.set(-0.1,-0.4,6))}
    camera.lookAt(look); firstCam=true;
  }
  if(bench.on)benchCamera();
  if(shake>0){shake-=dt;camera.position.x+=(Math.random()-0.5)*0.25;camera.position.y+=(Math.random()-0.5)*0.25}
  sky.position.copy(camera.position);
  const fv=mode==='truck'?tr:mode==='mow'?mw:st;sun.position.set(fv.x,fv.y,fv.z).addScaledVector(SUN_DIR,25); sun.target.position.set(fv.x,fv.y,fv.z);
  {const o=groundOcc.value;o[0].set(st.x,st.z,st.yaw,0);o[2].set(tr.x,tr.z,tr.yaw,0)}
  timeU.value=now/1000;
  renderer.render(scene,camera);
  if(bench.on)benchSample(dt);
  fpsFrames++;fpsTime+=dt;
  if(fpsTime>=0.5){const f=Math.round(fpsFrames/fpsTime);const fe=$('#fpsVal');fe.textContent=f;fe.style.color=f>=50?'var(--ok)':f>=30?'var(--gas)':'var(--danger)';
    if(!bench.on&&f<48&&pr>1){if(++lowN>=3){pr=Math.max(1,pr-0.25);renderer.setPixelRatio(pr);resize();lowN=0}}else lowN=0;
    if(!bench.on&&f>=58&&pr<maxPR){if(++hiN>=8){pr=Math.min(maxPR,pr+0.25);renderer.setPixelRatio(pr);resize();hiN=0}}else hiN=0;
    $('#resVal').textContent=pr.toFixed(2).replace(/0$/,'')+'x';
    const t=renderer.info.render.triangles;$('#triVal').textContent=t>=1e6?(t/1e6).toFixed(2)+'M':t>=1e3?Math.round(t/1e3)+'k':t;fpsFrames=0;fpsTime=0}
  requestAnimationFrame(frame);
}
// textures may finish loading before the later scripts arrive: apply them now if they are in, otherwise when they are
if([texGrass,texDirt,texGrime].every(t=>t.image&&t.image.width))applyTextures();else texManager.onLoad=applyTextures;
requestAnimationFrame(frame);
