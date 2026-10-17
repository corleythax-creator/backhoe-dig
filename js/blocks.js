// Backhoe Dig: concrete blocks: 1, 2 and 3 ft cubes set down under the bucket, stacking, settling and machine collisions.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// ---------- blocks ----------
// blocks snap to a 1 ft world grid so they line up into walls and stacks. Each rests on the highest ground or block top
// under its footprint and drops when what holds it is dug out or picked up. Tracks and tires roll over a 1 ft block;
// taller ones stop them
const FT=0.3048,BLK_MAX=240,BLK_CLIMB=0.35,blocks=[];
let blkOn=false,blkSize=2,blkWake=0;
const blkMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),M(0xffffff),BLK_MAX);
blkMesh.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(BLK_MAX*3),3);
blkMesh.castShadow=blkMesh.receiveShadow=true;blkMesh.frustumCulled=false;blkMesh.count=0;scene.add(blkMesh);
// placement preview: a see-through box with bright edges where the block will land; red when it can't go there
const blkGhost=new THREE.Group(),ghostFill=new THREE.MeshBasicMaterial({color:0xf5c518,transparent:true,opacity:0.22,depthWrite:false,toneMapped:false}),
  ghostLine=new THREE.LineBasicMaterial({color:0xf5c518,toneMapped:false});
blkGhost.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),ghostFill),new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1,1,1)),ghostLine));
blkGhost.visible=false;scene.add(blkGhost);
const blkO=new THREE.Object3D(),blkCol=new THREE.Color(),blkP={x:0,z:0,y:0,s:FT,ok:false,why:''};
function blkReset(){blocks.length=0;blkMesh.count=0;blkWake=0}
function blkSnap(v,n){return n%2?(Math.floor(v/FT)+0.5)*FT:Math.round(v/FT)*FT}
function blkOver(a,x,z,s){const m=(a.s+s)/2-0.01;return Math.abs(a.x-x)<m&&Math.abs(a.z-z)<m}
// highest ground under a footprint, sampled about every 6 in
function blkGround(x,z,s){const m=Math.max(1,Math.ceil(s/CELL)),h=s/2;let y=-1e9;
  for(let a=0;a<=m;a++)for(let b=0;b<=m;b++)y=Math.max(y,hAt(x-h+s*a/m,z-h+s*b/m));return y}
// ground or block top at a point: what tracks, tires and flying dirt land on
function surfAt(x,z){let y=hAt(x,z);
  for(const b of blocks){const h=b.s/2;if(Math.abs(x-b.x)<=h&&Math.abs(z-b.z)<=h&&b.y+b.s>y)y=b.y+b.s}return y}
function blkHit(x,y,z){for(const b of blocks){const h=b.s/2;if(Math.abs(x-b.x)<h&&Math.abs(z-b.z)<h&&y>b.y-0.05&&y<b.y+b.s)return b}return null}
// a machine is a row of circles of radius r along its heading (offsets lz); pushes it out of blocks too tall to climb
function blkCircleD(o,lz,b){const cx=o.x+Math.sin(o.yaw)*lz,cz=o.z+Math.cos(o.yaw)*lz,h=b.s/2;
  return Math.hypot(cx-Math.max(b.x-h,Math.min(b.x+h,cx)),cz-Math.max(b.z-h,Math.min(b.z+h,cz)))}
function blkPush(o,lzs,r){let hit=false;
  for(const b of blocks){if(b.y+b.s<o.y+BLK_CLIMB||b.y>o.y+3)continue;const h=b.s/2;
    for(const lz of lzs){const cx=o.x+Math.sin(o.yaw)*lz,cz=o.z+Math.cos(o.yaw)*lz,dx=cx-b.x,dz=cz-b.z,px=h+r-Math.abs(dx),pz=h+r-Math.abs(dz);
      if(px<=0||pz<=0)continue;
      const nx=dx-Math.max(-h,Math.min(h,dx)),nz=dz-Math.max(-h,Math.min(h,dz)),d=Math.hypot(nx,nz);
      if(d>1e-4){if(d>=r)continue;o.x+=nx/d*(r-d);o.z+=nz/d*(r-d)}
      else if(px<pz)o.x+=Math.sign(dx||1)*px;else o.z+=Math.sign(dz||1)*pz;
      hit=true}}
  return hit}
const EX_C=[0.85,-0.85],EX_R=1.25,TR_C=[2.2,-0.4,-2.6,-3.6],TR_R=1.25;
// where a block of the chosen size would land (under the bucket, or in Walk mode just in front of the worker's feet),
// and whether it may go there
function blkTarget(n){const s=n*FT;if(mode!=='walk')return [tip.x,tip.z];const d=WK_R+s/2+0.12;return [wk.x+Math.sin(wk.yaw)*d,wk.z+Math.cos(wk.yaw)*d]}
function blkAim(){const n=blkSize,s=n*FT,[ax,az]=blkTarget(n),x=blkSnap(ax,n),z=blkSnap(az,n);let y=blkGround(x,z,s);
  for(const b of blocks)if(blkOver(b,x,z,s))y=Math.max(y,b.y+b.s);
  const p=blkP;p.x=x;p.z=z;p.y=y;p.s=s;p.ok=false;
  const t={x,z,s};
  if(Math.abs(x)>S/2-s||Math.abs(z)>S/2-s||mesaR(x,z)>EDGE-2)p.why='Too close to the edge for a block.';
  else if(blocks.length>=BLK_MAX)p.why=`That's all ${BLK_MAX} blocks. Pick some up first.`;
  else if(mode!=='walk'&&y>tip.y+0.6)p.why='Raise the bucket above the stack to set a block on it.';
  else if(mode==='walk'&&y+s>wk.y+WK_REACH)p.why='Too high to reach. Climb up first.';
  else if(mode==='walk'&&Math.abs(wk.x-x)<s/2+WK_R&&Math.abs(wk.z-z)<s/2+WK_R&&y<wk.y+WK_H&&y+s>wk.y+0.02)p.why='You are standing there. Step back.';
  else if(EX_C.some(lz=>blkCircleD(st,lz,t)<EX_R+0.05))p.why='Too close to the excavator. Reach out farther.';
  else if(TR_C.some(lz=>blkCircleD(tr,lz,t)<TR_R+0.05))p.why='That spot is under the truck.';
  else{p.ok=true;p.why=''}
  return p}
function placeBlock(){
  if(mode!=='dig'&&mode!=='walk'){toast('Switch to Dig or Walk to set blocks.');return}
  if(!blkOn)setBlocks(true);
  const p=blkAim();if(!p.ok){toast(p.why);return}
  const v=0.88+Math.random()*0.12,y=mode==='walk'?p.y+0.05:Math.max(p.y,Math.min(tip.y-0.25-p.s,p.y+4));
  blocks.push({x:p.x,z:p.z,y,s:p.s,n:blkSize,vy:0,c:[0.66*v,0.65*v,0.62*v]});
  blkWake=1.5;started();
  toast(`${blkSize}×${blkSize} ft block set · ${blocks.length} on site`,'good',1600)}
// the highest block the bucket is over or touching comes away; on foot, the highest one within reach just in front
function removeBlock(){
  if(mode!=='dig'&&mode!=='walk'){toast('Switch to Dig or Walk to pick up blocks.');return}
  let best=-1,top=-1e9;const walk=mode==='walk',fx=walk?wk.x+Math.sin(wk.yaw)*(WK_R+0.3):tip.x,fz=walk?wk.z+Math.cos(wk.yaw)*(WK_R+0.3):tip.z;
  for(let i=0;i<blocks.length;i++){const b=blocks[i],h=b.s/2+(walk?0.12:0.2),t=b.y+b.s;
    const inY=walk?t<=wk.y+WK_REACH+0.3&&t>wk.y-0.8:tip.y>b.y-0.3&&tip.y<t+1.5;
    if(Math.abs(fx-b.x)<h&&Math.abs(fz-b.z)<h&&inY&&t>top){top=t;best=i}}
  if(best<0){toast(!blocks.length?'No blocks set yet.':walk?'Face a block within reach to pick it up.':'Bring the bucket onto a block to pick it up.');return}
  const b=blocks.splice(best,1)[0];blkWake=1.5;
  toast(`${b.n}×${b.n} ft block picked up · ${blocks.length} on site`,'good',1600)}
function setBlocks(on){blkOn=on;const btn=$('#blkBtn');btn.setAttribute('aria-pressed',on);$('#blkBar').hidden=!on;
  if(on&&mode!=='dig'&&mode!=='walk')setMode('dig')}
function setBlkSize(n){blkSize=n;document.querySelectorAll('#blkBar button[data-b]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.b===n))}
function blkTerrainMoved(){if(blocks.length)blkWake=Math.max(blkWake,0.3)}
// settle bottom-up: each block sits on the ground or the blocks already settled under it; dirt pushed under one lifts it
function blkTick(dt){
  if(blkWake>0){blkWake-=dt;
    const order=blocks.slice().sort((a,b)=>a.y-b.y);let moving=false;
    for(let i=0;i<order.length;i++){const b=order[i];let ty=blkGround(b.x,b.z,b.s);
      for(let j=0;j<i;j++){const o=order[j];if(blkOver(o,b.x,b.z,b.s))ty=Math.max(ty,o.y+o.s)}
      if(ty>=b.y){b.y=ty;b.vy=0}
      else{b.vy+=9.8*dt;b.y=Math.max(ty,b.y-b.vy*dt);if(b.y>ty)moving=true;
        else{if(b.vy>2.5&&b.n>1){shake=reduceMotion?0:Math.min(0.2,0.04*b.n);rumble(160,0.2*b.n)}b.vy=0}}}
    if(moving)blkWake=Math.max(blkWake,0.1);
    for(let i=0;i<blocks.length;i++){const b=blocks[i];blkO.position.set(b.x,b.y+b.s/2,b.z);blkO.scale.setScalar(b.s);blkO.updateMatrix();
      blkMesh.setMatrixAt(i,blkO.matrix);blkMesh.setColorAt(i,blkCol.setRGB(b.c[0],b.c[1],b.c[2]))}
    blkMesh.count=blocks.length;blkMesh.instanceMatrix.needsUpdate=true;blkMesh.instanceColor.needsUpdate=true}
  blkGhost.visible=blkOn&&(mode==='dig'||mode==='walk')&&!bench.on;
  if(blkGhost.visible){const p=blkAim(),c=p.ok?0xf5c518:0xff5143;
    blkGhost.position.set(p.x,p.y+p.s/2+0.005,p.z);blkGhost.scale.setScalar(p.s+0.01);ghostFill.color.setHex(c);ghostLine.color.setHex(c)}}
$('#blkBtn').onclick=()=>setBlocks(!blkOn);
$('#blkPlace').onclick=placeBlock;$('#blkRemove').onclick=removeBlock;
document.querySelectorAll('#blkBar button[data-b]').forEach(b=>b.onclick=()=>setBlkSize($('#hud').classList.contains('lg')&&+b.dataset.b===blkSize?blkSize%3+1:+b.dataset.b));
