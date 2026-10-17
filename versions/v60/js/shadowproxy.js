// Backhoe Dig: cheaper shadows. The machines are built from about 130 small meshes, and each one cast its own shadow,
// so the shadow pass drew them one by one. Here the parts that sit still on one parent are merged into one shadow-only
// mesh per parent (a handful of draws). A part that later moves, scales or hides on its own goes back to casting itself.
// Trees cast only from the few near the shadow area, not all 230 round the mesa. The shadow-only meshes are switched on
// just while the shadow map renders, so they never draw in the picture.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const shpMats={},shpGroups=[],shpTrees=[];
function shpMat(side){return shpMats[side]||(shpMats[side]=new THREE.MeshBasicMaterial({side}))}
// one parent's still parts (of one face side) merged into one position-only mesh in the parent's space
function shpBuild(G){
  if(G.proxy){G.parent.remove(G.proxy);G.proxy.geometry.dispose();G.proxy=null}
  const pos=[],v=new THREE.Vector3();
  for(const s of G.src){const g=s.m.geometry,p=g.attributes.position,ix=g.index;s.m.updateMatrix();
    const n=ix?ix.count:p.count;for(let i=0;i<n;i++){v.fromBufferAttribute(p,ix?ix.getX(i):i).applyMatrix4(s.m.matrix);pos.push(v.x,v.y,v.z)}}
  if(!pos.length)return;
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeBoundingSphere();
  const m=new THREE.Mesh(g,shpMat(G.side));m.castShadow=true;m.visible=false;m.userData.shProxy=true;G.parent.add(m);G.proxy=m;
}
function shpSnap(m){return [m.position.x,m.position.y,m.position.z,m.quaternion.x,m.quaternion.y,m.quaternion.z,m.quaternion.w,m.scale.x,m.scale.y,m.scale.z,m.visible]}
function shpSame(m,s){const p=m.position,q=m.quaternion,c=m.scale;
  return p.x===s[0]&&p.y===s[1]&&p.z===s[2]&&q.x===s[3]&&q.y===s[4]&&q.z===s[5]&&q.w===s[6]&&c.x===s[7]&&c.y===s[8]&&c.z===s[9]&&m.visible===s[10]}
function shpProxies(root){const by=new Map();
  root.traverse(m=>{if(!m.isMesh||m.isInstancedMesh||!m.castShadow||!m.visible||m.morphTargetInfluences||m.userData.shProxy)return;
    const side=m.material.side===THREE.DoubleSide?THREE.DoubleSide:THREE.FrontSide,key=m.parent.uuid+side;
    if(!by.has(key))by.set(key,{parent:m.parent,side,src:[],proxy:null});by.get(key).src.push({m,s:shpSnap(m)})});
  for(const G of by.values()){if(G.src.length<2)continue;for(const s of G.src)s.m.castShadow=false;shpBuild(G);shpGroups.push(G)}}
for(const r of [machine,truck,mower,tbox])shpProxies(r);
// trees: a shadow-only copy holding the instances near the shadow camera
for(const im of treeIMs){im.castShadow=false;const n=im.count,M=[];for(let i=0;i<n;i++){const m=new THREE.Matrix4();im.getMatrixAt(i,m);M.push(m)}
  const near=new THREE.InstancedMesh(im.geometry,shpMat(THREE.FrontSide),n);near.count=0;near.castShadow=true;near.visible=false;near.frustumCulled=false;near.userData.shProxy=true;
  scene.add(near);shpTrees.push({M,near,x:1e9,z:1e9})}
// every frame: give back any part that has moved since it was merged, and refill the near trees when the shadow moves
function shadowProxyTick(){
  for(const G of shpGroups){let ch=false;
    for(let i=G.src.length-1;i>=0;i--){const s=G.src[i];
      if(!shpSame(s.m,s.s)){s.m.castShadow=true;G.src.splice(i,1);ch=true}}
    if(ch)shpBuild(G)}
  const c=sun.target.position,R=sun.shadow.camera.right*1.45+6;
  for(const T of shpTrees){if(Math.abs(c.x-T.x)<3&&Math.abs(c.z-T.z)<3)continue;T.x=c.x;T.z=c.z;let k=0;
    for(const m of T.M){const e=m.elements;if(Math.abs(e[12]-c.x)<R&&Math.abs(e[14]-c.z)<R)T.near.setMatrixAt(k++,m)}
    T.near.count=k;T.near.instanceMatrix.needsUpdate=true}
}
// the shadow-only meshes take part in the shadow pass and nothing else
{const draw=renderer.shadowMap.render;const all=()=>shpGroups.map(G=>G.proxy).filter(Boolean).concat(shpTrees.map(T=>T.near));
  renderer.shadowMap.render=function(){const P=all();for(const p of P)p.visible=true;try{draw.apply(this,arguments)}finally{for(const p of P)p.visible=false}}}
