// Corley's Island: blocks: any size from 1 in to 10 ft each way, in plain concrete or any library material, set down
// under the bucket, in front of the worker in Walk mode, or at the middle of the screen in first person (the wheel
// pushes it out and pulls it in); stacking, settling and machine collisions. surfAt() is the ground-or-block height
// everything that rides or lands uses.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// ---------- blocks ----------
// blocks snap to a world grid (1 ft, or finer: blkGrid) and/or to the faces of the blocks already set, so they line up into walls and stacks; or go wherever you aim (blkLock). Each is a box w (east-west) by d (north-south)
// by h (tall), in metres, of material m (0 plain concrete, otherwise its MAT_LIST id). It rests on the highest ground or
// block top under its footprint and drops when what holds it is dug out or picked up. Tracks and tires roll over a 1 ft
// block; taller ones stop them
const FT=0.3048,IN=FT/12,BLK_MAX=240,BLK_CLIMB=0.35,BLK_FT=10,BLK_REACH=[3,80],blocks=[];
// the size being set (inches, from BLK_IN), its material, and how far out the first-person aim reaches (ft)
const blkDim={w:24,d:24,h:24},BLK_IN=[1,2,3,4,6,8,12,18,24,36,48,60,72,84,96,108,120];
// how a block lands: 'grid' on a whole-foot grid, 'blocks' the grid plus flush against nearby blocks, 'free' exactly where aimed
const BLK_LOCKS=[['grid','Grid'],['gridblocks','Grid + blocks'],['blocks','Blocks only'],['free','Free']];let blkLock='grid';
// the grid's cell, in inches (BLK_GRIDS, finest to coarsest)
const BLK_GRIDS=[1,2,3,6,12];let blkGrid=12;
// remembered on this device
try{const q=JSON.parse(localStorage.getItem('bhd_blkSnap')||'null');if(q){if(BLK_LOCKS.some(l=>l[0]===q.lock))blkLock=q.lock;if(BLK_GRIDS.includes(q.grid))blkGrid=q.grid}}catch(e){}
function blkSnapSave(){try{localStorage.setItem('bhd_blkSnap',JSON.stringify({lock:blkLock,grid:blkGrid}))}catch(e){}}
let blkOn=false,blkWake=0,blkMat=0,blkReach=12,blkFPTold=false;
// one instanced mesh per material in use; the texture is laid on in world space so any size tiles it evenly and
// neighbouring blocks line up. Plain concrete (blkMesh) gets its texture in applyTextures (truck.js)
const blkGeo=new THREE.BoxGeometry(1,1,1),blkMeshes=[];
function blkTileMat(mt,ft){mt.onBeforeCompile=sh=>{sh.uniforms.uTile={value:1/(ft*FT)};
  sh.vertexShader='uniform float uTile;\n'+sh.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
  #ifdef USE_UV
  {vec4 bw=modelMatrix*instanceMatrix*vec4(transformed,1.0);vec3 an=abs(normal);vUv=(an.x>0.5?bw.zy:an.y>0.5?bw.xz:bw.xy)*uTile;}
  #endif`)}}
function blkNewMesh(mt){const im=new THREE.InstancedMesh(blkGeo,mt,BLK_MAX);
  im.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(BLK_MAX*3),3);
  im.castShadow=im.receiveShadow=true;im.frustumCulled=false;im.count=0;scene.add(im);return im}
const blkMesh=blkMeshes[0]=blkNewMesh(M(0xffffff));blkTileMat(blkMesh.material,4);
// a library material's mesh, made the first time a block of it is set; its mean colour shows until the texture is in
// shiny ones (sh) get a tight highlight and the sky mirrored in them, plainly face-on too, as metal does (the Fresnel
// patch in core.js keeps paint and glass faint face-on)
function blkMeshOf(m){let im=blkMeshes[m];if(im)return im;const d=MAT_LIST[m-1],
    mt=M(0xffffff,d.sh?{shininess:90*d.sh,specular:new THREE.Color().setScalar(0.6*d.sh),envMap:skyEnv,combine:THREE.MixOperation,reflectivity:0.9*d.sh}:null);mt.color.setRGB(d.c[0],d.c[1],d.c[2]);
  blkTileMat(mt,Math.min(d.ft,6));if(d.sh){const ob=mt.onBeforeCompile;mt.onBeforeCompile=sh=>{ob(sh);sh.fragmentShader=sh.fragmentShader.replace(/\(0\.12\+0\.88\*/g,'(0.45+0.55*')}}
  im=blkMeshes[m]=blkNewMesh(mt);
  new THREE.TextureLoader().load(`textures/${d.id}.jpg`,t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    mt.map=t;mt.color.setScalar(1);mt.needsUpdate=true});
  return im}
const blkMatName=m=>m?MAT_LIST[m-1].n:'Concrete';
// placement preview: a see-through box with bright edges where the block will land; red when it can't go there
const blkGhost=new THREE.Group(),ghostFill=new THREE.MeshBasicMaterial({color:0xf5c518,transparent:true,opacity:0.22,depthWrite:false,toneMapped:false}),
  ghostLine=new THREE.LineBasicMaterial({color:0xf5c518,toneMapped:false});
blkGhost.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),ghostFill),new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1,1,1)),ghostLine));
blkGhost.visible=false;scene.add(blkGhost);
const blkO=new THREE.Object3D(),blkCol=new THREE.Color(),blkP={x:0,z:0,y:0,w:FT,d:FT,h:FT,ok:false,why:''},blkV=new THREE.Vector3(),blkE=new THREE.Vector3();
function blkReset(){blocks.length=0;for(const im of blkMeshes)if(im)im.count=0;blkWake=0}
// centre for a block w long on one axis so its edges sit on the grid
function blkSnap(v,w){const g=blkGrid*IN;return Math.round((v-w/2)/g)*g+w/2}
// pull a block's faces flush with the faces of blocks within 1 ft, on each axis
function blkMagnet(x,z,w,d){const R=0.3;let bx=R,bz=R,ox=0,oz=0;
  for(const b of blocks){
    if(Math.abs(b.z-z)<(b.d+d)/2+R)for(const e of [b.x-b.w/2,b.x+b.w/2])for(const s of [-1,1]){const dx=e-(x+s*w/2);if(Math.abs(dx)<bx){bx=Math.abs(dx);ox=dx}}
    if(Math.abs(b.x-x)<(b.w+w)/2+R)for(const e of [b.z-b.d/2,b.z+b.d/2])for(const s of [-1,1]){const dz=e-(z+s*d/2);if(Math.abs(dz)<bz){bz=Math.abs(dz);oz=dz}}}
  return [x+ox,z+oz]}
// the size as shown: inches under a foot, otherwise feet
const blkInTxt=n=>n<12?`${n} in`:`${+(n/12).toFixed(2)} ft`;
function blkOver(a,x,z,w,d){return Math.abs(a.x-x)<(a.w+w)/2-0.01&&Math.abs(a.z-z)<(a.d+d)/2-0.01}
// highest ground under a footprint, sampled about every 6 in
function blkGround(x,z,w,d){const mx=Math.max(1,Math.ceil(w/CELL)),mz=Math.max(1,Math.ceil(d/CELL));let y=-1e9;
  for(let a=0;a<=mx;a++)for(let b=0;b<=mz;b++)y=Math.max(y,hAt(x-w/2+w*a/mx,z-d/2+d*b/mz));return y}
// ground or block top at a point: what tracks, tires and flying dirt land on
function surfAt(x,z){let y=hAt(x,z);
  for(const b of blocks)if(Math.abs(x-b.x)<=b.w/2&&Math.abs(z-b.z)<=b.d/2&&b.y+b.h>y)y=b.y+b.h;return y}
function blkHit(x,y,z){for(const b of blocks)if(Math.abs(x-b.x)<b.w/2&&Math.abs(z-b.z)<b.d/2&&y>b.y-0.05&&y<b.y+b.h)return b;return null}
// a machine is a row of circles of radius r along its heading (offsets lz); pushes it out of blocks too tall to climb
function blkCircleD(o,lz,b){const cx=o.x+Math.sin(o.yaw)*lz,cz=o.z+Math.cos(o.yaw)*lz,hx=b.w/2,hz=b.d/2;
  return Math.hypot(cx-Math.max(b.x-hx,Math.min(b.x+hx,cx)),cz-Math.max(b.z-hz,Math.min(b.z+hz,cz)))}
function blkPush(o,lzs,r){let hit=false;
  // the Family Island's buildings
  for(const s of SOLIDS)for(const lz of lzs){const cx=o.x+Math.sin(o.yaw)*lz,cz=o.z+Math.cos(o.yaw)*lz,dx=cx-s.x,dz=cz-s.z;
    const nx=dx-Math.max(-s.hx,Math.min(s.hx,dx)),nz=dz-Math.max(-s.hz,Math.min(s.hz,dz)),d=Math.hypot(nx,nz);if(d>=r)continue;hit=true;
    if(d>1e-4){o.x+=nx/d*(r-d);o.z+=nz/d*(r-d)}else if(s.hx-Math.abs(dx)<s.hz-Math.abs(dz))o.x+=Math.sign(dx||1)*(s.hx-Math.abs(dx)+r);else o.z+=Math.sign(dz||1)*(s.hz-Math.abs(dz)+r)}
  for(const b of blocks){if(b.y+b.h<o.y+BLK_CLIMB||b.y>o.y+3)continue;const hx=b.w/2,hz=b.d/2;
    for(const lz of lzs){const cx=o.x+Math.sin(o.yaw)*lz,cz=o.z+Math.cos(o.yaw)*lz,dx=cx-b.x,dz=cz-b.z,px=hx+r-Math.abs(dx),pz=hz+r-Math.abs(dz);
      if(px<=0||pz<=0)continue;
      const nx=dx-Math.max(-hx,Math.min(hx,dx)),nz=dz-Math.max(-hz,Math.min(hz,dz)),d=Math.hypot(nx,nz);
      if(d>1e-4){if(d>=r)continue;o.x+=nx/d*(r-d);o.z+=nz/d*(r-d)}
      else if(px<pz)o.x+=Math.sign(dx||1)*px;else o.z+=Math.sign(dz||1)*pz;
      hit=true}}
  return hit}
const EX_C=[0.85,-0.85],EX_R=1.25,TR_C=[2.2,-0.4,-2.6,-3.6],TR_R=1.25;
// points round each machine's footprint ([side, forward] metres) that must stay off ground too steep to drive
const EX_P=[[-1.1,1.9],[1.1,1.9],[-1.1,-1.9],[1.1,-1.9],[0,2.1],[0,-2.1]],TR_P=[[-1.1,3.6],[1.1,3.6],[0,3.8],[-1.1,-3.3],[1.1,-3.3]],MW_P=[[-0.5,1.6],[0.5,1.6],[-0.6,-0.3],[0.6,-0.3]];
// first person on foot: blocks go where the middle of the screen points
const blkFP=()=>mode==='walk'&&camMode==='cab';
// from the eyes along the middle of the screen, out to the reach: the last clear point before the ground or a block
// (hit), or the point at full reach if nothing is in the way
function blkRay(far){camera.getWorldPosition(blkE);camera.getWorldDirection(blkV);const o=blkE,v=blkV,max=(far||blkReach)*FT;
  let px=o.x,py=o.y,pz=o.z,hit=null;
  const n=Math.ceil(max/0.1);
  for(let i=1;i<=n;i++){const t=max*i/n,x=o.x+v.x*t,y=o.y+v.y*t,z=o.z+v.z*t;
    if(y<hAt(x,z)){hit='ground';break}const b=blkHit(x,y,z);if(b){hit=b;break}px=x;py=y;pz=z}
  return {x:px,y:py,z:pz,hit}}
// where the centre of a block of the chosen size goes: under the bucket; on foot just in front of the feet; in first
// person where the aim meets the ground or a block top, or against the side of the block it meets
function blkTarget(w,d){
  if(mode!=='walk')return [tip.x,tip.z];
  if(blkFP()){const r=blkRay(),b=r.hit;
    if(b&&b!=='ground'&&r.y<b.y+b.h-0.02){const ox=Math.abs(r.x-b.x)-b.w/2,oz=Math.abs(r.z-b.z)-b.d/2;
      if(ox>oz)return [b.x+Math.sign(r.x-b.x)*(b.w+w)/2,r.z];return [r.x,b.z+Math.sign(r.z-b.z)*(b.d+d)/2]}
    return [r.x,r.z]}
  const k=WK_R+Math.max(w,d)/2+0.12;return [wk.x+Math.sin(wk.yaw)*k,wk.z+Math.cos(wk.yaw)*k]}
// where a block of the chosen size would land and whether it may go there
function blkAim(){const w=blkDim.w*IN,d=blkDim.d*IN,h=blkDim.h*IN,[ax,az]=blkTarget(w,d);let x=ax,z=az;
  if(blkLock==='grid'||blkLock==='gridblocks'){x=blkSnap(ax,w);z=blkSnap(az,d)}
  if(blkLock==='gridblocks'||blkLock==='blocks')[x,z]=blkMagnet(x,z,w,d)
  let y=blkGround(x,z,w,d);
  for(const b of blocks)if(blkOver(b,x,z,w,d))y=Math.max(y,b.y+b.h);
  const p=blkP;p.x=x;p.z=z;p.y=y;p.w=w;p.d=d;p.h=h;p.ok=false;
  const t={x,z,w,d},walk=mode==='walk';
  if(blocks.length>=BLK_MAX)p.why=`That's all ${BLK_MAX} blocks. Pick some up first.`;
  else if(!walk&&y>tip.y+0.6)p.why='Raise the bucket above the stack to set a block on it.';
  else if(walk&&!blkFP()&&y+Math.min(h,FT*3)>wk.y+WK_REACH)p.why='Too high to reach. Climb up first.';
  else if(walk&&Math.abs(wk.x-x)<w/2+WK_R&&Math.abs(wk.z-z)<d/2+WK_R&&y<wk.y+WK_H&&y+h>wk.y+0.02)p.why='You are standing there. Step back.';
  else if(EX_C.some(lz=>blkCircleD(st,lz,t)<EX_R+0.05))p.why='Too close to the excavator. Reach out farther.';
  else if(TR_C.some(lz=>blkCircleD(tr,lz,t)<TR_R+0.05))p.why='That spot is under the truck.';
  else{p.ok=true;p.why=''}
  return p}
const blkSizeTxt=(w,d,h)=>`${blkInTxt(w)} × ${blkInTxt(d)} × ${blkInTxt(h)}`;
function placeBlock(){
  if(mode!=='dig'&&mode!=='walk'){toast('Switch to Dig or Walk to set blocks.');return}
  if(!blkOn)setBlocks(true);
  const p=blkAim();if(!p.ok){toast(p.why);return}
  const v=0.88+Math.random()*0.12,y=mode==='walk'?p.y+0.05:Math.max(p.y,Math.min(tip.y-0.25-p.h,p.y+4)),m=blkMat;
  blocks.push({x:p.x,z:p.z,y,w:p.w,d:p.d,h:p.h,m,vy:0,c:m?[v,v,v]:[0.66*v,0.65*v,0.62*v]});
  blkWake=1.5;started();
  toast(`${blkSizeTxt(blkDim.w,blkDim.d,blkDim.h)} ${blkMatName(m).toLowerCase()} block set · ${blocks.length} on site`,'good',1600)}
const blkFt=b=>blkSizeTxt(Math.round(b.w/IN),Math.round(b.d/IN),Math.round(b.h/IN));
// the highest block the bucket is over or touching comes away; on foot, the highest one within reach just in front;
// in first person, the first one the middle of the screen meets (out to the longest reach)
function removeBlock(){
  if(mode!=='dig'&&mode!=='walk'){toast('Switch to Dig or Walk to pick up blocks.');return}
  let best=-1,top=-1e9;const walk=mode==='walk';
  if(blkFP()){const r=blkRay(BLK_REACH[1]);if(r.hit&&r.hit!=='ground')best=blocks.indexOf(r.hit)}
  else{const fx=walk?wk.x+Math.sin(wk.yaw)*(WK_R+0.3):tip.x,fz=walk?wk.z+Math.cos(wk.yaw)*(WK_R+0.3):tip.z;
    for(let i=0;i<blocks.length;i++){const b=blocks[i],e=walk?0.12:0.2,t=b.y+b.h;
      const inY=walk?t<=wk.y+WK_REACH+0.3&&t>wk.y-0.8||b.y<wk.y+WK_REACH&&t>wk.y:tip.y>b.y-0.3&&tip.y<t+1.5;
      if(Math.abs(fx-b.x)<b.w/2+e&&Math.abs(fz-b.z)<b.d/2+e&&inY&&t>top){top=t;best=i}}}
  if(best<0){toast(!blocks.length?'No blocks set yet.':blkFP()?'Put the dot on a block to pick it up.':walk?'Face a block within reach to pick it up.':'Bring the bucket onto a block to pick it up.');return}
  const b=blocks.splice(best,1)[0];blkWake=1.5;
  toast(`${blkFt(b)} block picked up · ${blocks.length} on site`,'good',1600)}
// ---------- the block bar ----------
function setBlocks(on){blkOn=on;const btn=$('#blkBtn');btn.setAttribute('aria-pressed',on);$('#blkBar').hidden=!on;
  if(on&&mode!=='dig'&&mode!=='walk')setMode('dig');blkUI()}
const blkReachEl=$('#blkReach');
function blkUI(){for(const k of ['w','d','h'])$(`#blkBar .bstep[data-k="${k}"] b`).textContent=blkInTxt(blkDim[k]);
  $('#blkGridRow b').textContent=blkInTxt(blkGrid);$('#blkGridRow').hidden=blkLock!=='grid'&&blkLock!=='gridblocks';
  $('#blkLock').textContent=BLK_LOCKS.find(l=>l[0]===blkLock)[1];
  blkReachEl.querySelector('b').textContent=`${Math.round(blkReach)} ft`;blkReachEl.hidden=!blkFP();
  const s=$('#blkMat');if(+s.value!==blkMat)s.value=blkMat}
// one step up or down the BLK_IN list
function blkStepDim(k,dir){const i=BLK_IN.findIndex(v=>v>=blkDim[k]),j=dir>0?(BLK_IN[i]>blkDim[k]?i:i+1):i-1;
  blkDim[k]=BLK_IN[clamp(j,0,BLK_IN.length-1)];blkUI()}
function blkLockNext(){blkLock=BLK_LOCKS[(BLK_LOCKS.findIndex(l=>l[0]===blkLock)+1)%BLK_LOCKS.length][0];blkSnapSave();blkUI();return BLK_LOCKS.find(l=>l[0]===blkLock)[1]}
// the size key and the D-pad step through cubes, 1 to 10 ft
function blkCube(dir){const n=((Math.round(Math.max(blkDim.w,blkDim.d,blkDim.h)/12)-1+dir)%BLK_FT+BLK_FT)%BLK_FT+1;blkDim.w=blkDim.d=blkDim.h=n*12;blkUI();
  toast(`Block size ${blkSizeTxt(n*12,n*12,n*12)}`,'',1200)}
// turn the block a quarter turn: width and length swap
function blkTurn(){[blkDim.w,blkDim.d]=[blkDim.d,blkDim.w];blkUI()}
function blkReachBy(ft){blkReach=clamp(blkReach+ft,BLK_REACH[0],BLK_REACH[1]);blkUI()}
function setBlkMat(m){blkMat=clamp(m|0,0,MAT_LIST.length);blkUI()}
function blkTerrainMoved(){if(blocks.length)blkWake=Math.max(blkWake,0.3)}
// settle bottom-up: each block sits on the ground or the blocks already settled under it; dirt pushed under one lifts it
function blkTick(dt){
  if(blkWake>0){blkWake-=dt;
    const order=blocks.slice().sort((a,b)=>a.y-b.y);let moving=false;
    for(let i=0;i<order.length;i++){const b=order[i];let ty=blkGround(b.x,b.z,b.w,b.d);
      for(let j=0;j<i;j++){const o=order[j];if(blkOver(o,b.x,b.z,b.w,b.d))ty=Math.max(ty,o.y+o.h)}
      if(ty>=b.y){b.y=ty;b.vy=0}
      else{b.vy+=9.8*dt;b.y=Math.max(ty,b.y-b.vy*dt);if(b.y>ty)moving=true;
        else{const n=Math.cbrt(b.w*b.d*b.h)/FT;if(b.vy>2.5&&n>1.2){shake=reduceMotion?0:Math.min(0.2,0.04*n);rumble(160,Math.min(1,0.2*n))}b.vy=0}}}
    if(moving)blkWake=Math.max(blkWake,0.1);
    for(const im of blkMeshes)if(im)im.count=0;
    for(const b of blocks){const im=blkMeshOf(b.m),i=im.count++;blkO.position.set(b.x,b.y+b.h/2,b.z);blkO.scale.set(b.w,b.h,b.d);blkO.updateMatrix();
      im.setMatrixAt(i,blkO.matrix);im.setColorAt(i,blkCol.setRGB(b.c[0],b.c[1],b.c[2]))}
    for(const im of blkMeshes)if(im){im.instanceMatrix.needsUpdate=true;im.instanceColor.needsUpdate=true}}
  blkGhost.visible=blkOn&&(mode==='dig'||mode==='walk')&&!bench.on;
  if(blkGhost.visible){const p=blkAim(),c=p.ok?0xf5c518:0xff5143;
    blkGhost.position.set(p.x,p.y+p.h/2+0.005,p.z);blkGhost.scale.set(p.w+0.01,p.h+0.01,p.d+0.01);ghostFill.color.setHex(c);ghostLine.color.setHex(c)}
  if(blkOn&&blkReachEl.hidden===blkFP()){blkUI();
    if(blkFP()&&!blkFPTold){blkFPTold=true;toast(`Blocks go where the dot is. The mouse wheel (or ${keyLabel('blkNear')} ${keyLabel('blkFar')}) pulls them in and pushes them out.`,'',4200)}}}
$('#blkBtn').onclick=()=>setBlocks(!blkOn);
$('#blkPlace').onclick=placeBlock;$('#blkRemove').onclick=removeBlock;$('#blkTurn').onclick=blkTurn;
document.querySelectorAll('#blkBar .bstep button').forEach(b=>b.onclick=()=>{const k=b.parentNode.dataset.k,s=+b.dataset.d;
  if(k==='reach')blkReachBy(s*2);else if(k==='grid'){blkGrid=BLK_GRIDS[clamp(BLK_GRIDS.indexOf(blkGrid)+s,0,BLK_GRIDS.length-1)];blkSnapSave();blkUI()}else blkStepDim(k,s)});
$('#blkLock').onclick=blkLockNext;
// the material list: plain concrete, then the library by group
{const s=$('#blkMat');s.add(new Option('Concrete (plain)',0));
  MAT_CATS.forEach((c,ci)=>{const g=document.createElement('optgroup');g.label=c;
    MAT_LIST.forEach((d,i)=>{if(d.cat===ci)g.appendChild(new Option(d.n,i+1))});s.appendChild(g)});
  s.onchange=()=>{setBlkMat(+s.value);s.blur()}}
