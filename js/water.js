// Corley's Island: groundwater, puddles and mud. Below about 6 ft the cut meets the water table: water seeps into the hole,
// levels across connected pools and muddies the ground around them. Ground painted Mud in the map editor is saturated: its
// water stays 2 in under the surface, so ruts and dips there fill as puddles; so does ground soaked by rain (rain.js). Rain
// also falls into anything dug, and rainwater above the water table drains away once it stops. Dirt dug from under water comes up as mud:
// it sticks in the bucket and truck bed, and wet spoil, mud and puddles bog the truck, slow the tracks and take deep ruts
// (stampRut, dirt.js). The Pump button dewaters a flooded hole.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const WT_DEPTH=1.85,SAT_DEPTH=0.05,SAT_MUD=0.5,SEEP=0.008,PUMP=0.03;
const Wt=new Float32Array(V*V).fill(-1e9),mudA=new Float32Array(V*V);
let waterT=0,dryT=0,pumpOn=false,waterAny=false,puddleAny=false,waterMoved=false,waterSeen=false,seeping=0;
// the water surface: a mesh 96 ft across over the dug area (or around the camera when that is bigger); dry points sit just
// under the ground. The water itself is the same everywhere; the Graphics setting only changes how it is drawn: every 6 in
// with sky reflections on Medium and High, every 1 ft without them on Low (phones)
let WM_N=96,WM_K=GRID_K,wmI0=-1,wmJ0=-1,wmAge=0;
const wmMat=new THREE.MeshPhongMaterial({color:0x6b5238,specular:0x5a544c,shininess:90,transparent:true,opacity:0.9,combine:THREE.MixOperation,reflectivity:0.55});
const wmMesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1,1,1),wmMat);
wmMesh.frustumCulled=false;wmMesh.visible=false;wmMesh.receiveShadow=true;scene.add(wmMesh);
function wmSet(fine){WM_K=fine?1:GRID_K;WM_N=96*GRID_K/WM_K;wmMesh.geometry.dispose();wmMesh.geometry=new THREE.PlaneGeometry(1,1,WM_N,WM_N);
  wmMat.envMap=fine?skyEnv:null;wmMat.needsUpdate=true;wmI0=-1;waterT=0}
wmSet(false);
function waterClear(){Wt.fill(-1e9);mudA.fill(0);pumpOn=false;waterAny=puddleAny=false;waterSeen=false;wmMesh.visible=false}
function waterTick(dt){
  waterT-=dt;if(waterT>0||cI1<cI0)return;const step=0.25;waterT=step;
  let any=false,hole=false,moved=false;seeping=0;const rain=weather.r>0.02,dry=(dryT-=step)<=0;if(dry)dryT=2.5;
  for(let j=cJ0;j<=cJ1;j++)for(let i=cI0;i<=cI1;i++){const k=j*V+i,h=H[k],w0=Wt[k];
    // soaked ground holds water near the surface: painted Mud everywhere, rain-soaked ground only in ruts and shallow
    // dips (a deep cut just catches the rain that falls in it)
    const g=H0[k]-((mudBase[k]>SAT_MUD||h>H0[k]-0.5&&rainSoakK(k)>SAT_MUD)?SAT_DEPTH:WT_DEPTH);
    // seep up from the water table into anything dug below it
    if(h<g){if(Wt[k]<h)Wt[k]=h;if(Wt[k]<g){Wt[k]=Math.min(g,Wt[k]+SEEP*step);seeping++}}
    // rain falls into anything dug below grade; once it stops, rainwater above the table drains away
    if(rain&&h<H0[k]-0.02){const top=H0[k]-SAT_DEPTH;if(Wt[k]<h)Wt[k]=h;if(Wt[k]<top)Wt[k]=Math.min(top,Wt[k]+weather.r*RAIN_IN*step)}
    else if(!rain&&Wt[k]>g)Wt[k]=Math.max(g,Wt[k]-RAIN_DRAIN*step);
    // wet spoil and churned mud dry out over several minutes once there is no water on them
    if(dry&&mudA[k]>0&&Wt[k]<-1e8)mudA[k]=Math.max(0,mudA[k]-0.005);
    // level out with wetter neighbours (water runs into any low ground next to a pool, never above the table)
    if(i>cI0&&i<cI1&&j>cJ0&&j<cJ1){const m=Math.max(Wt[k-1],Wt[k+1],Wt[k-V],Wt[k+V]);if(m>Wt[k]&&m>h)Wt[k]=Math.min(m,Math.max(Wt[k],g,m-0.002))}
    if(pumpOn&&Wt[k]>-1e8)Wt[k]-=PUMP*step;
    // water only stands in ground dug or rutted below grade: never higher than 2 in under the original surface, so a
    // pool on a slope can't level out over the untouched ground below it
    if(Wt[k]>H0[k]-SAT_DEPTH)Wt[k]=H0[k]-SAT_DEPTH;
    // a film thinner than 3 mm is not shown; rain builds one up in a dug spot instead of losing it
    if(Wt[k]<=h+0.001&&!(rain&&Wt[k]>-1e8&&h<H0[k]-0.02))Wt[k]=-1e9;else if(Wt[k]>h+0.003){any=true;if(Wt[k]<H0[k]-1)hole=true;mudA[k]=1;wetT[k]=timeU.value}
    if(Math.abs(Wt[k]-w0)>1e-4)moved=true}
  // waterAny: a flooded hole (the Pump button); puddleAny: any water at all
  waterAny=hole;puddleAny=any;waterMoved=moved;if(!hole)pumpOn=false;
  if(hole&&!waterSeen){waterSeen=true;toast(rain?'Rain is filling the hole. Tap Pump to dewater it.':'Groundwater seeping in. Tap Pump to dewater the hole.','',3800)}
  // place the surface over the dug area, or around the camera when the dug area is wider; it moves only when the camera
  // nears its edge, and is redrawn when the water moves or the camera moves it, and each second for the ground under it
  const span=WM_N*WM_K;let i0=Math.max(0,Math.min(N-span,Math.round(((cI0+cI1)/2-span/2)/GRID_K)*GRID_K)),j0=Math.max(0,Math.min(N-span,Math.round(((cJ0+cJ1)/2-span/2)/GRID_K)*GRID_K));
  if(cI1-cI0>span||cJ1-cJ0>span){const li=(look.x+S/2)/CELL,lj=(look.z+S/2)/CELL;
    if(wmI0>=0&&Math.abs(li-wmI0-span/2)<span/4&&Math.abs(lj-wmJ0-span/2)<span/4){i0=wmI0;j0=wmJ0}
    else{i0=Math.max(0,Math.min(N-span,Math.round((li-span/2)/GRID_K)*GRID_K));j0=Math.max(0,Math.min(N-span,Math.round((lj-span/2)/GRID_K)*GRID_K))}}
  wmMesh.visible=any;wmAge+=step;if(!any||(!moved&&wmAge<1&&i0===wmI0&&j0===wmJ0))return;wmI0=i0;wmJ0=j0;wmAge=0;
  const p=wmMesh.geometry.attributes.position.array,G=WM_K;
  for(let j=0;j<=WM_N;j++)for(let i=0;i<=WM_N;i++){const gi=i0+i*G,gj=j0+j*G,k=gj*V+gi,o=(j*(WM_N+1)+i)*3;
    // a dry point next to water takes the pool's level (it is inside the bank there, so the surface ends flat at the wall)
    let y=Wt[k];if(y<H[k]+0.003){const m=Math.max(gi>=G?Wt[k-G]:-1e9,gi+G<=N?Wt[k+G]:-1e9,gj>=G?Wt[k-G*V]:-1e9,gj+G<=N?Wt[k+G*V]:-1e9);y=m>-1e8?Math.min(m,H[k]-0.02):H[k]-0.12}
    p[o]=gi*CELL-S/2;p[o+1]=y;p[o+2]=gj*CELL-S/2}
  wmMesh.geometry.attributes.position.needsUpdate=true;wmMesh.geometry.computeVertexNormals();
}
// how wet point k is: puddles and wet spoil (mudA), painted Mud (mudBase, terrain.js) or rain (rainSoakK, rain.js)
function soakK(k){return Math.max(mudBase[k],rainSoakK(k))}
function mudOf(k){return Math.max(mudA[k],soakK(k))}
// how muddy the ground is at x,z (0 dry, 1 puddle, wet spoil or soaked ground; farMud in mud.js outside the dig zone)
function mudAt(x,z){const i=Math.round((x+S/2)/CELL),j=Math.round((z+S/2)/CELL);if(i<0||i>N||j<0||j>N)return farMud(x,z);return mudOf(j*V+i)}
// is the bucket tip under water?
function underWater(p){const i=Math.round((p.x+S/2)/CELL),j=Math.round((p.z+S/2)/CELL);if(i<0||i>N||j<0||j>N)return false;return Wt[j*V+i]>p.y}
function setPump(on){pumpOn=!!on&&waterAny;const b=$('#pumpBtn');b.textContent=pumpOn?'Pump: on':'Pump';b.setAttribute('aria-pressed',pumpOn);
  if(pumpOn)toast('Pump running. The water will drop slowly.','good')}
$('#pumpBtn').onclick=()=>setPump(!pumpOn);
