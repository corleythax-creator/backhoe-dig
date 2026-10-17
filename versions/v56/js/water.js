// Backhoe Dig: groundwater and mud. Below about 6 ft the cut meets the water table: water seeps into the hole, levels
// across connected pools and muddies the ground around them. Dirt dug from under water comes up as mud: it sticks in
// the bucket and truck bed, and wet spoil and puddles bog the truck and slow the tracks. The Pump button dewaters.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const WT_DEPTH=1.85,SEEP=0.008,PUMP=0.03;
const Wt=new Float32Array(V*V).fill(-1e9),mudA=new Float32Array(V*V);
let waterT=0,pumpOn=false,waterAny=false,waterSeen=false,seeping=0;
// the water surface: a 1 ft mesh over the same area as the shadow caster; dry points sit just under the ground
const WM_N=96,wmGeo=new THREE.PlaneGeometry(1,1,WM_N,WM_N);
const wmMesh=new THREE.Mesh(wmGeo,new THREE.MeshPhongMaterial({color:0x3e2f20,specular:0x3a342c,shininess:90,transparent:true,opacity:0.92}));
wmMesh.frustumCulled=false;wmMesh.visible=false;wmMesh.receiveShadow=true;scene.add(wmMesh);
function waterClear(){Wt.fill(-1e9);mudA.fill(0);pumpOn=false;waterAny=false;waterSeen=false;wmMesh.visible=false}
function waterTick(dt){
  waterT-=dt;if(waterT>0||cI1<cI0)return;const step=0.25;waterT=step;
  let any=false;seeping=0;
  for(let j=cJ0;j<=cJ1;j++)for(let i=cI0;i<=cI1;i++){const k=j*V+i,g=H0[k]-WT_DEPTH,h=H[k];
    // seep up from the water table into anything dug below it
    if(h<g){if(Wt[k]<h)Wt[k]=h;if(Wt[k]<g){Wt[k]=Math.min(g,Wt[k]+SEEP*step);seeping++}}
    // level out with wetter neighbours (water runs into any low ground next to a pool, never above the table)
    if(i>cI0&&i<cI1&&j>cJ0&&j<cJ1){const m=Math.max(Wt[k-1],Wt[k+1],Wt[k-V],Wt[k+V]);if(m>Wt[k]&&m>h)Wt[k]=Math.min(m,Math.max(Wt[k],g,m-0.002))}
    if(pumpOn&&Wt[k]>-1e8)Wt[k]-=PUMP*step;
    if(Wt[k]<=h+0.001)Wt[k]=-1e9;else{any=true;mudA[k]=1;wetT[k]=timeU.value}}
  waterAny=any;if(!any)pumpOn=false;
  if(any&&!waterSeen){waterSeen=true;toast('Groundwater seeping in. Tap Pump to dewater the hole.','',3800)}
  // redraw the surface around the dug area
  const span=WM_N*GRID_K,ci=(cI0+cI1)>>1,cj=(cJ0+cJ1)>>1;
  const i0=Math.max(0,Math.min(N-span,Math.round((ci-span/2)/GRID_K)*GRID_K)),j0=Math.max(0,Math.min(N-span,Math.round((cj-span/2)/GRID_K)*GRID_K));
  const p=wmGeo.attributes.position.array;
  for(let j=0;j<=WM_N;j++)for(let i=0;i<=WM_N;i++){const gi=i0+i*GRID_K,gj=j0+j*GRID_K,k=gj*V+gi,o=(j*(WM_N+1)+i)*3;
    // a dry point next to water takes the pool's level (it is inside the bank there, so the surface ends flat at the wall)
    let y=Wt[k];if(y<-1e8){const G=GRID_K,m=Math.max(gi>=G?Wt[k-G]:-1e9,gi+G<=N?Wt[k+G]:-1e9,gj>=G?Wt[k-G*V]:-1e9,gj+G<=N?Wt[k+G*V]:-1e9);y=m>-1e8?Math.min(m,H[k]-0.02):H[k]-0.12}
    p[o]=gi*CELL-S/2;p[o+1]=y;p[o+2]=gj*CELL-S/2}
  wmGeo.attributes.position.needsUpdate=true;wmGeo.computeVertexNormals();wmMesh.visible=any;
}
// how muddy the ground is at x,z (0 dry, 1 puddle or wet spoil)
function mudAt(x,z){const i=Math.round((x+S/2)/CELL),j=Math.round((z+S/2)/CELL);if(i<0||i>N||j<0||j>N)return 0;return mudA[j*V+i]}
// is the bucket tip under water?
function underWater(p){const i=Math.round((p.x+S/2)/CELL),j=Math.round((p.z+S/2)/CELL);if(i<0||i>N||j<0||j>N)return false;return Wt[j*V+i]>p.y}
function setPump(on){pumpOn=!!on&&waterAny;const b=$('#pumpBtn');b.textContent=pumpOn?'Pump: on':'Pump';b.setAttribute('aria-pressed',pumpOn);
  if(pumpOn)toast('Pump running. The water will drop slowly.','good')}
$('#pumpBtn').onclick=()=>setPump(!pumpOn);
