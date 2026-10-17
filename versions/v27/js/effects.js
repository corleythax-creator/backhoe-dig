// Backhoe Dig: dirt particles, shared per-frame vectors and resize.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// ---------- particles ----------
const pGeo=new THREE.DodecahedronGeometry(0.075,1),pMat=M(0x6e4628),parts=[];
const pInst=new THREE.InstancedMesh(pGeo,pMat,90);pInst.frustumCulled=false;scene.add(pInst);const ZERO=new THREE.Matrix4().makeScale(0,0,0);
for(let i=0;i<90;i++){const m=new THREE.Object3D();m.visible=false;pInst.setMatrixAt(i,ZERO);parts.push({m,v:new THREE.Vector3(),on:false})}
let pi=0;
function spawn(p,spread){const q=parts[pi=(pi+1)%parts.length];q.on=true;q.m.visible=true;q.m.position.copy(p);
  q.v.set((Math.random()-0.5)*spread,Math.random()*0.6,(Math.random()-0.5)*spread);q.m.rotation.set(Math.random()*3,Math.random()*3,0)}

// ---------- loop ----------
const tip=new THREE.Vector3(),mid=new THREE.Vector3(),q=new THREE.Quaternion(),tmp=new THREE.Vector3(),camT=new THREE.Vector3(),look=new THREE.Vector3();
let fpsFrames=0,fpsTime=0;
let last=performance.now(),hudT=0,shake=0,firstCam=true,fullWarned=false;
const trenchK=[];for(let j=Math.round((TRENCH_Z0+S/2)/CELL);j<=Math.round((TRENCH_Z1+S/2)/CELL);j++)trenchK.push(j*V+Math.round(S/2/CELL));
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<h?68:58;camera.updateProjectionMatrix()}
addEventListener('resize',resize);resize();
