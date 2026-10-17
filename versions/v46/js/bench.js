// Backhoe Dig: speed test.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// ---------- speed test ----------
const LEVELS=[0,8,24,56,120,248],LEVEL_S=5,WARM=1;
const bench={on:false,t:0,lvl:-1,stats:[],clones:[],built:false,barT:0};
function buildClones(){
  machine.updateMatrixWorld(true);
  const inv=new THREE.Matrix4().copy(machine.matrixWorld).invert(),rel=new THREE.Matrix4(),P=new THREE.Matrix4(),q=new THREE.Quaternion(),o=new THREE.Vector3(),sc=new THREE.Vector3(1,1,1),out=new THREE.Matrix4();
  const max=LEVELS[LEVELS.length-1],places=[];
  for(let i=0;i<max;i++){const r=11+(i%8)*4.2+Math.floor(i/80)*2.1,a=i*2.39996;const x=Math.cos(a)*r,z=Math.sin(a)*r;
    q.setFromAxisAngle(new THREE.Vector3(0,1,0),a*1.7);o.set(x,baseHeight(x,z),z);places.push(new THREE.Matrix4().compose(o.clone(),q.clone(),sc))}
  const cloneOf=(root,offset)=>{root.updateMatrixWorld(true);const rinv=new THREE.Matrix4().copy(root.matrixWorld).invert();
    root.traverse(m=>{if(!m.isMesh||m.isInstancedMesh)return;
      rel.multiplyMatrices(rinv,m.matrixWorld);
      const im=new THREE.InstancedMesh(m.geometry,m.material,max);im.castShadow=true;im.receiveShadow=false;im.frustumCulled=false;
      for(let i=0;i<max;i++){out.multiplyMatrices(places[i],offset).multiply(rel);im.setMatrixAt(i,out)}
      im.count=0;scene.add(im);bench.clones.push(im)})};
  cloneOf(machine,new THREE.Matrix4());
  cloneOf(truck,new THREE.Matrix4().makeRotationY(Math.PI/2).setPosition(-6.5,0,1.5));
  bench.built=true;
}
function setClones(n){for(const im of bench.clones)im.count=n}
function startBench(){
  if(bench.on)return;
  if(!bench.built)buildClones();
  bench.on=true;bench.t=0;bench.lvl=-1;bench.stats=LEVELS.map(n=>({n,ft:[],tris:0,calls:0,k:0}));
  viewDirty=true;
  help.hidden=true;$('#bench').hidden=true;$('#benchBar').hidden=false;
  st.load=0;
}
function endBench(){
  bench.on=false;setClones(0);$('#benchBar').hidden=true;firstCam=true;
  viewDirty=true;
  showBenchResults();
}
function fmtTris(t){return t>=1e6?(t/1e6).toFixed(2)+'M':t>=1e3?Math.round(t/1e3)+'k':String(Math.round(t))}
function gpuName(){try{const gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)}catch(e){return 'unknown'}}
function showBenchResults(){
  const rows=bench.stats.map(s=>{const ft=s.ft.slice().sort((a,b)=>a-b),tot=ft.reduce((a,b)=>a+b,0);
    const avg=tot>0?ft.length/tot:0,p99=ft.length?ft[Math.min(ft.length-1,Math.floor(ft.length*0.99))]:0;
    return{machines:1+s.n,tris:s.k?s.tris/s.k:0,calls:s.k?s.calls/s.k:0,avg,low:p99>0?1/p99:0}});
  const cls=f=>f>=55?'fps-good':f>=30?'fps-mid':'fps-bad';
  let html='<tr><th>Excavators + trucks</th><th>Tris</th><th>Avg FPS</th><th>1% low</th></tr>';
  for(const r of rows)html+=`<tr><td>${r.machines} + ${r.machines}</td><td>${fmtTris(r.tris)}</td><td class="${cls(r.avg)}">${r.avg.toFixed(1)}</td><td class="${cls(r.low)}">${r.low.toFixed(0)}</td></tr>`;
  $('#benchTable').innerHTML=html;
  const best=lim=>{let t=0;for(const r of rows)if(r.avg>=lim)t=Math.max(t,r.tris);return t};
  const t55=best(55),t30=best(30),base=rows[0].avg;
  let sum=`<div class="lbl">Smooth (55+ FPS) up to</div><div class="big">${t55?fmtTris(t55)+' tris':'not reached'}</div>
    <div class="lbl" style="margin-top:8px">Playable (30+ FPS) up to</div><div class="big">${t30?fmtTris(t30)+' tris':'not reached'}</div>`;
  if(base>=27&&base<=31.5)sum+=`<p style="margin-top:8px;color:var(--gas)">The baseline sat right at 30 FPS. That usually means Low Power Mode is on and capping the frame rate.</p>`;
  if(rows[rows.length-1].avg>=55)sum+=`<p style="margin-top:8px;color:var(--ok)">Still smooth at the heaviest level. This device has more headroom than the test reaches.</p>`;
  $('#benchSummary').innerHTML=sum;
  const w=renderer.domElement.width,h=renderer.domElement.height,gpu=gpuName();
  $('#benchDevice').textContent=`${gpu} · ${w}×${h} px at ${maxPR}x${PHONE?' (phone settings)':''} · ${navigator.platform||''}`+(glResets?` · ${glResets} graphics reset${glResets>1?'s':''} on this device`:'');
  $('#benchText').value=['Backhoe Dig speed test (v2: excavator + truck pairs)',`GPU: ${gpu}`,`Resolution: ${w}x${h} (${maxPR}x${PHONE?', phone settings: 1.5x cap, 1024 shadows':''})`,`Smooth 55+ FPS up to: ${t55?fmtTris(t55):'not reached'}`,`Playable 30+ FPS up to: ${t30?fmtTris(t30):'not reached'}`,
    ...rows.map(r=>`${r.machines} excavators + ${r.machines} trucks | ${fmtTris(r.tris)} tris | ${Math.round(r.calls)} draws | ${r.avg.toFixed(1)} avg FPS | ${r.low.toFixed(0)} 1% low`)].join('\n');
  $('#bench').hidden=false;
}
function benchTick(dt){
  bench.t+=dt;
  const lvl=Math.min(LEVELS.length-1,Math.floor(bench.t/LEVEL_S));
  if(lvl!==bench.lvl){bench.lvl=lvl;setClones(LEVELS[lvl])}
  const u=bench.t;
  st.a1=0.75+0.25*Math.sin(u*1.3);st.a2=-1.45+0.3*Math.sin(u*0.9+1);st.a3=-1.6+0.9*Math.sin(u*1.7);st.swing+=dt*0.7;
  if(bench.t>=LEVEL_S*LEVELS.length)endBench();
}
function benchCamera(){
  const u=bench.t%LEVEL_S,seg=Math.floor(u/(LEVEL_S/4)),k=u-seg*(LEVEL_S/4);
  if(seg===0){const a=st.yaw+st.swing+Math.PI+k*1.4;look.set(st.x,st.y+1.5,st.z);camera.position.set(st.x+Math.sin(a)*9,st.y+4,st.z+Math.cos(a)*9);camera.lookAt(look)}
  else if(seg===1){house.localToWorld(camera.position.set(-0.72,2.2,0.5));house.localToWorld(look.set(-0.1+Math.sin(k*2.5)*3,-0.4,6));camera.lookAt(look)}
  else if(seg===2){const a=0.8+bench.t*0.35;camera.position.set(Math.sin(a)*24,9,Math.cos(a)*24);camera.lookAt(look.set(0,0,0))}
  else{const a=bench.t*0.3;camera.position.set(Math.sin(a)*5,28,Math.cos(a)*5);camera.lookAt(look.set(0,0,0))}
}
function benchSample(dt){
  const s=bench.stats[bench.lvl];if(!s)return;
  if(bench.t-bench.lvl*LEVEL_S>=WARM){s.ft.push(dt);s.tris+=renderer.info.render.triangles;s.calls+=renderer.info.render.calls;s.k++}
  bench.barT-=dt;
  if(bench.barT<=0){bench.barT=0.2;const left=Math.max(0,Math.ceil(LEVEL_S*LEVELS.length-bench.t));
    $('#benchBar').innerHTML=`SPEED TEST · ${left} s left<small>Level ${bench.lvl+1} of ${LEVELS.length} · ${1+LEVELS[bench.lvl]} excavators + trucks · ${fmtTris(renderer.info.render.triangles)} tris</small>`}
}
$('#benchBtn').onclick=()=>{showMenu(false);startBench()};
$('#benchClose').onclick=()=>{$('#bench').hidden=true};
$('#benchCopy').onclick=()=>{const t=$('#benchText').value,b=$('#benchCopy');
  const fallback=()=>{const ta=$('#benchText');ta.hidden=false;ta.select();b.textContent='Select and copy'};
  try{navigator.clipboard.writeText(t).then(()=>{b.textContent='Copied'},fallback)}catch(e){fallback()}};
