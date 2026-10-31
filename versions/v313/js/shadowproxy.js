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
