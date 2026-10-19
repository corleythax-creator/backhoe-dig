// Corley's Island: shared per-frame vectors and resize.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// ---------- loop ----------
const tip=new THREE.Vector3(),mid=new THREE.Vector3(),q=new THREE.Quaternion(),tmp=new THREE.Vector3(),camT=new THREE.Vector3(),look=new THREE.Vector3();
let camFov=60,fpsFrames=0,fpsTime=0;
let last=performance.now(),hudT=0,shake=0,firstCam=true,fullWarned=false;
// the trench's centre line in the grid (empty while the grid is elsewhere)
const trenchK=[];
function trenchKeys(){trenchK.length=0;if(inDig(0,TRENCH_Z0)&&inDig(0,TRENCH_Z1))for(let j=Math.round(gJ(TRENCH_Z0));j<=Math.round(gJ(TRENCH_Z1));j++)trenchK.push(j*V+Math.round(gI(0)))}
trenchKeys();
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camFov=(w<h?68:58)+gfxFov;camera.fov=camFov;camera.updateProjectionMatrix()}
addEventListener('resize',()=>{viewDirty=true});resize();
