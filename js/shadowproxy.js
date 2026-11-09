// Corley's Island: cheaper shadows. The machines are built from about 130 small meshes, and each one cast its own shadow,
// so the shadow pass drew them one by one. Here the parts that sit still on one parent are merged into one shadow-only
// mesh per parent (a handful of draws). A part that later moves, scales or hides on its own goes back to casting itself.
// Trees cast only from the few near the shadow area, not all 230 round the mesa. The shadow-only meshes are switched on
// just while the shadow map renders, so they never draw in the picture.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const shpMats={},shpGroups=[],shpTrees=[];
function shpMat(side){return shpMats[side]||(shpMats[side]=new THREE.MeshBasicMaterial({side}))}
// one parent's still parts (of one face side) merged into one position-only mesh in the parent's space, its vertices
// shared as in the parts (indexed), so it costs little memory even for the detailed models
function shpBuild(G){
  if(G.proxy){G.parent.remove(G.proxy);G.proxy.geometry.dispose();G.proxy=null}
  let nv=0,ni=0;for(const s of G.src){const g=s.m.geometry;nv+=g.attributes.position.count;ni+=g.index?g.index.count:g.attributes.position.count}
  if(!ni)return;
  const P=new Float32Array(nv*3),I=nv>65535?new Uint32Array(ni):new Uint16Array(ni),v=new THREE.Vector3();let o=0,q=0;
  for(const s of G.src){const g=s.m.geometry,p=g.attributes.position,ix=g.index;s.m.updateMatrix();
    for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(s.m.matrix);P[(o+i)*3]=v.x;P[(o+i)*3+1]=v.y;P[(o+i)*3+2]=v.z}
    if(ix)for(let i=0;i<ix.count;i++)I[q++]=o+ix.getX(i);else for(let i=0;i<p.count;i++)I[q++]=o+i;
    o+=p.count}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setIndex(new THREE.BufferAttribute(I,1));g.computeBoundingSphere();
  const m=new THREE.Mesh(g,shpMat(G.side));m.castShadow=true;m.visible=false;m.userData.shProxy=true;G.parent.add(m);G.proxy=m;
}
function shpSnap(m){return [m.position.x,m.position.y,m.position.z,m.quaternion.x,m.quaternion.y,m.quaternion.z,m.quaternion.w,m.scale.x,m.scale.y,m.scale.z,m.visible]}
function shpSame(m,s){const p=m.position,q=m.quaternion,c=m.scale;
  return p.x===s[0]&&p.y===s[1]&&p.z===s[2]&&q.x===s[3]&&q.y===s[4]&&q.z===s[5]&&q.w===s[6]&&c.x===s[7]&&c.y===s[8]&&c.z===s[9]&&m.visible===s[10]}
// a part that moved once casts by itself from then on (shpOut), so it is not merged again; skinned, morphing and
// cut-out (alphaTest) parts always cast by themselves
const shpByKey=new Map();
function shpProxies(root){const by=new Map();
  root.traverse(m=>{if(!m.isMesh||m.isInstancedMesh||m.isSkinnedMesh||!m.castShadow||!m.visible||m.morphTargetInfluences||m.userData.shProxy||m.userData.shpOut||m.customDepthMaterial)return;
    const mt=[].concat(m.material);if(mt.length>1||mt[0].alphaTest>0)return;
    const side=mt[0].side===THREE.DoubleSide?THREE.DoubleSide:THREE.FrontSide,key=m.parent.uuid+side;
    if(!by.has(key))by.set(key,[]);by.get(key).push({m,s:shpSnap(m)})});
  for(const [key,src] of by){let G=shpByKey.get(key);
    if(!G){if(src.length<2)continue;G={parent:src[0].m.parent,side:src[0].m.material.side===THREE.DoubleSide?THREE.DoubleSide:THREE.FrontSide,src:[],proxy:null};shpByKey.set(key,G);shpGroups.push(G)}
    for(const s of src){s.m.castShadow=false;G.src.push(s)}shpBuild(G)}}
for(const r of [machine,truck,mower,tbox,skid])shpProxies(r);
// the detailed models (models.js), Dexter's machines, the twins and the attachments come in later or change, so their
// still parts are looked for again every couple of seconds (shpScan)
let shpScanT=0;
function shpScan(){for(const r of [machine,truck,mower,tbox,skid,bike,cplG,thG,hmG,agG].concat(hvs.map(h=>h.g),TWINS.map(t=>t.g)))if(r)shpProxies(r)}
// trees: a shadow-only copy holding the instances near the shadow camera
for(const im of treeIMs){im.castShadow=false;const near=new THREE.InstancedMesh(im.geometry,shpMat(THREE.FrontSide),im.instanceMatrix.count);near.count=0;near.castShadow=true;near.visible=false;near.frustumCulled=false;near.userData.shProxy=true;
  // and one for the far shadows (core.js sunFar), holding the instances across its wider map; it draws into that map only
  const far=new THREE.InstancedMesh(im.geometry,near.material,im.instanceMatrix.count);far.count=0;far.castShadow=true;far.visible=false;far.frustumCulled=false;far.userData.shProxy=true;
  far.userData.n=0;far.onBeforeShadow=function(r,o,c,sc){this.count=sc===sunFar.shadow.camera?this.userData.n:0};
  scene.add(near,far);shpTrees.push({im,M:[],near,far,x:1e9,z:1e9,fx:1e9,fz:1e9})}
// the instances' matrices, read again after the map editor moves, adds or removes trees and boulders
function shpTreesRefresh(){for(const T of shpTrees){const n=T.im.count;T.M.length=0;for(let i=0;i<n;i++){const m=new THREE.Matrix4();T.im.getMatrixAt(i,m);T.M.push(m)}T.x=T.fx=1e9}}
shpTreesRefresh();
// every frame: give back any part that has moved since it was merged, and refill the near trees when the shadow moves
function shadowProxyTick(){sunNearTick();sunFarTick();
  for(const G of shpGroups){let ch=false;
    for(let i=G.src.length-1;i>=0;i--){const s=G.src[i];
      if(!shpSame(s.m,s.s)){s.m.castShadow=true;s.m.userData.shpOut=true;G.src.splice(i,1);ch=true}}
    if(ch)shpBuild(G)}
  const now=performance.now();if(now>shpScanT){shpScanT=now+2000;shpScan()}
  const c=sun.target.position,R=sun.shadow.camera.right*1.45+6;
  for(const T of shpTrees){if(Math.abs(c.x-T.x)<3&&Math.abs(c.z-T.z)<3)continue;T.x=c.x;T.z=c.z;let k=0;
    for(const m of T.M){const e=m.elements;if(Math.abs(e[12]-c.x)<R&&Math.abs(e[14]-c.z)<R)T.near.setMatrixAt(k++,m)}
    T.near.count=k;T.near.instanceMatrix.needsUpdate=true}
  if(sunFar.visible){const f=sunFar.target.position,F=sunFar.shadow.camera.right*1.45+10;
    for(const T of shpTrees){if(Math.abs(f.x-T.fx)<8&&Math.abs(f.z-T.fz)<8)continue;T.fx=f.x;T.fz=f.z;let k=0;
      for(const m of T.M){const e=m.elements;if(Math.abs(e[12]-f.x)<F&&Math.abs(e[14]-f.z)<F)T.far.setMatrixAt(k++,m)}
      T.far.userData.n=k;T.far.instanceMatrix.needsUpdate=true}}
}
// the shadow-only meshes take part in the shadow pass and nothing else
{const draw=renderer.shadowMap.render;const all=()=>shpGroups.map(G=>G.proxy).filter(Boolean).concat(shpTrees.map(T=>T.near),shpTrees.map(T=>T.far));
  renderer.shadowMap.render=function(){const P=all();for(const p of P)p.visible=true;try{draw.apply(this,arguments)}finally{for(const p of P)p.visible=false}}}
// ---------- the still world's shadow, kept (shc) ----------
// The sun's near map drew every caster every frame: in town about 540 draws, most of them buildings, lamps, benches and
// trees that never move. While the map holds still (sunNearTick, core.js: TU.shHold), its depth with only the still
// casters in it is kept in a depth buffer of its own; each frame that is copied back in place of clearing the map and
// only what moves is drawn over it. What moves is found, not listed: a caster whose place, shape (its vertices, say the
// dug ground), instance list or count changes since it was kept is drawn every frame from then on, and joins the kept
// picture again once it has been still 3 s; a caster new to the map is drawn as moving until then; one gone from it, a
// moved map or a turned sun draws the kept picture again. People (skinned) always draw. The shadows look the same: at
// most one frame shows a moved thing's shadow both where it was and where it is.
const shc={on:false,ok:false,in:false,build:false,broken:false,gen:0,f:0,n:0,cn:0,mat:new Float32Array(16),fb:null,rb:null,w:0,h:0,defer:[],cull:false,builds:0,kept:0,drawn:0,st:new WeakMap()};
const SHC_STILL=180;
function shcFbo(w,h){const gl=renderer.getContext();if(shc.fb&&shc.w===w&&shc.h===h)return;
  if(shc.fb){gl.deleteFramebuffer(shc.fb);gl.deleteRenderbuffer(shc.rb)}
  shc.fb=gl.createFramebuffer();shc.rb=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,shc.rb);
  gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT24,w,h);gl.bindRenderbuffer(gl.RENDERBUFFER,null);
  gl.bindFramebuffer(gl.FRAMEBUFFER,shc.fb);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,shc.rb);
  const ok=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER,renderer.properties.get(sun.shadow.map).__webglFramebuffer||null);
  shc.w=w;shc.h=h;shc.ok=false;if(!ok)shc.broken=true}
// depth from the map into the kept buffer (keep) or back (!keep); the map stays bound as three.js expects
function shcCopy(keep){const gl=renderer.getContext(),m=sun.shadow.map,f=renderer.properties.get(m).__webglFramebuffer;
  renderer.state.buffers.depth.setMask(true);
  gl.bindFramebuffer(gl.READ_FRAMEBUFFER,keep?f:shc.fb);gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,keep?shc.fb:f);
  gl.blitFramebuffer(0,0,shc.w,shc.h,0,0,shc.w,shc.h,gl.DEPTH_BUFFER_BIT,gl.NEAREST);gl.bindFramebuffer(gl.FRAMEBUFFER,f);
  if(gl.getError()!==gl.NO_ERROR){shc.broken=true;shc.ok=false}}
// a caster as the map last saw it: its world matrix, its vertices' and indices' versions, its instances and draw range
function shcSame(s,o,g){const e=o.matrixWorld.elements,m=s.m;let same=true;for(let i=0;i<16;i++)if(m[i]!==e[i]){same=false;break}
  const v=g.id*1e6+(g.attributes.position?g.attributes.position.version:0)*1e3+(g.index?g.index.version:0),
    iv=o.isInstancedMesh?o.instanceMatrix.version*1e5+o.count:0,dr=g.drawRange.start*1e7+Math.min(g.drawRange.count,1e7);
  if(same&&(s.v!==v||s.iv!==iv||s.dr!==dr))same=false;
  if(!same){m.set(e);s.v=v;s.iv=iv;s.dr=dr}return same}
function shcState(o,g){let s=shc.st.get(o);if(!s){s={m:new Float32Array(16),v:-1,iv:-1,dr:-1,dyn:true,still:0,f:-1,pass:-1,always:!!(o.isSkinnedMesh||o.morphTargetInfluences)};shcSame(s,o,g);shc.st.set(o,s)}
  // once a frame: still or moving since last frame; a moving one waits SHC_STILL frames before it is kept again
  if(s.f!==shc.f){s.f=shc.f;const same=shcSame(s,o,g);
    if(s.always)s.dyn=true;
    else if(!same){if(!s.dyn&&s.pass===shc.gen)shc.ok=false;s.dyn=true;s.still=0}
    else if(s.dyn&&++s.still>=SHC_STILL){s.dyn=false;shc.ok=false}}
  return s}
function shcBegin(){shc.in=true;shc.f++;shc.n=0;shc.cull=gfxCull.on;gfxCull.on=false;const m=sun.shadow.map;shcFbo(m.width,m.height);
  const e=sun.shadow.matrix.elements;let same=true;for(let i=0;i<16;i++)if(shc.mat[i]!==e[i]){same=false;break}
  if(!same)shc.ok=false;
  shc.build=!shc.ok;if(shc.build){shc.mat.set(e);shc.gen++}}
function shcEnd(){shc.in=false;gfxCull.on=shc.cull;
  if(shc.build){shc.build=false;shcCopy(true);shc.ok=!shc.broken;shc.cn=shc.n;shc.builds++;
    for(const a of shc.defer)shcDraw(a[0],a[1],a[2],a[3],a[4],a[5]);shc.defer.length=0}
  else if(shc.n!==shc.cn)shc.ok=false}
let shcDraw=null;
{const rbd=renderer.renderBufferDirect.bind(renderer),clr=renderer.clear.bind(renderer),srt=renderer.setRenderTarget.bind(renderer);shcDraw=rbd;
  renderer.setRenderTarget=function(t,f,l){if(shc.in&&t!==sun.shadow.map)shcEnd();return srt(t,f,l)};
  renderer.clear=function(c,d,s){if(shc.in)shcEnd();
    shc.on=(TU.shHold||0)>0&&!shc.broken&&!renderer.xr.isPresenting&&sun.castShadow&&!!sun.shadow.map;
    if(shc.on&&renderer.getRenderTarget()===sun.shadow.map){shcBegin();if(!shc.build){shcCopy(false);if(!shc.broken)return}}
    return clr(c,d,s)};
  renderer.renderBufferDirect=function(cam,sc,g,mt,o,gr){if(!shc.in)return rbd(cam,sc,g,mt,o,gr);
    const s=shcState(o,g);
    if(s.dyn||(!shc.build&&s.pass!==shc.gen)){shc.drawn++;if(shc.build){shc.defer.push([cam,sc,g,mt,o,gr]);return}return rbd(cam,sc,g,mt,o,gr)}
    shc.n++;if(shc.build){s.pass=shc.gen;shc.drawn++;return rbd(cam,sc,g,mt,o,gr)}
    shc.kept++}}
