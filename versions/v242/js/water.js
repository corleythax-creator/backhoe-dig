// Corley's Island: groundwater, puddles and mud. Below about 6 ft the cut meets the water table: water seeps into the hole,
// levels across connected pools and muddies the ground around them. Ground painted Mud in the map editor is saturated: its
// water stays 2 in under the surface, so ruts and dips there fill as puddles; so does ground soaked by rain (rain.js). Rain
// also falls into anything dug, and rainwater above the water table drains away once it stops. Dirt dug from under water comes up as mud:
// it sticks in the bucket and truck bed, and wet spoil, mud and puddles bog the truck, slow the tracks and take deep ruts
// (stampRut, dirt.js). The Pump button dewaters a flooded hole.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const SAT_DEPTH=0.05,SAT_MUD=0.5,SEEP=0.008,PUMP=0.03;
const Wt=new Float32Array(V*V).fill(-1e9),mudA=new Float32Array(V*V);
let waterT=0,dryT=0,pumpOn=false,waterAny=false,puddleAny=false,waterMoved=false,waterSeen=false,seeping=0;
// the water surface: a mesh 96 ft across over the dug area (or around the camera when that is bigger); dry points sit just
// under the ground. The water itself is the same everywhere; the Graphics setting only changes how it is drawn: every 6 in
// with sky reflections on Medium and High, every 1 ft without them on Low (phones)
let WM_N=96,WM_K=GRID_K,wmI0=-1,wmJ0=-1,wmAge=0;
const wmMat=new THREE.MeshPhongMaterial({color:0x6b5238,specular:0x5a544c,shininess:90,transparent:true,opacity:0.9,combine:THREE.MixOperation,reflectivity:0.55});
wmMat.userData.noWet=true;
// the dig area's water: a copy coloured per point by how muddy it is (Tu): dark and settled when still, milky tan where
// running water has just brought dirt in
const wmMatD=wmMat.clone();wmMatD.vertexColors=true;wmMatD.color.set(0xffffff);
const WM_CLEAR=[0.36,0.28,0.2],WM_MUDDY=[0.7,0.54,0.36];
const wmMesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1,1,1),wmMatD);
wmMesh.frustumCulled=false;wmMesh.visible=false;wmMesh.receiveShadow=true;scene.add(wmMesh);
function wmSet(fine){WM_K=fine?1:GRID_K;WM_N=96*GRID_K/WM_K;wmMesh.geometry.dispose();wmMesh.geometry=new THREE.PlaneGeometry(1,1,WM_N,WM_N);
  wmMesh.geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array((WM_N+1)*(WM_N+1)*3),3));
  wmMat.envMap=wmMatD.envMap=fine?skyEnv:null;wmMat.needsUpdate=wmMatD.needsUpdate=true;wmI0=-1;waterT=0}
wmSet(false);
function waterClear(){Wt.fill(-1e9);Rq.fill(0);Rs.fill(0);Tu.fill(0);runAny=false;mudA.fill(0);soakMax.fill(0);crkA.fill(0);geo.attributes.crk.clearUpdateRanges();geo.attributes.crk.needsUpdate=true;pumpOn=false;waterAny=puddleAny=false;waterSeen=false;wmMesh.visible=false}
// ---------- runoff: rain that runs downhill ----------
// Over the dig area rain that the soil can't take (more of it the wetter the soil) runs off as a thin film, Rq (m): each
// step it moves toward the lowest neighbouring surface, so it gathers into rills down spoil piles and ruts and pours into
// any pool or dug hole (Wt). Running water picks up loose dirt (dug, dumped or rutted ground, Rs: dirt carried, m) where
// it runs fast and steep and drops it where it slows, so piles grow gullies and the trench floor takes silt. Once the
// rain stops the film soaks away in a few seconds. It is behaviour, the same on every device; TU.runoff and TU.erode tune it
const Rq=new Float32Array(V*V),Rs=new Float32Array(V*V),Rq2=new Float32Array(V*V),Rs2=new Float32Array(V*V);let runAny=false;
const RUN_NB=[1,-1,V,-V],Tu=new Float32Array(V*V);
function runoffStep(dt){const r=weather.r,rain=r>0.02;if(!rain&&!runAny)return false;
  // at most about 100 ft square of it, round the camera, so a big dig costs no more
  const li=Math.round(gI(look.x)),lj=Math.round(gJ(look.z)),RW=100;
  const i0=Math.max(cI0+1,li-RW),i1=Math.min(cI1-1,li+RW),j0=Math.max(cJ0+1,lj-RW),j1=Math.min(cJ1-1,lj+RW);if(i1<=i0||j1<=j0)return false;
  const ke=0.45*TU.erode,emax=0.0006*TU.erode*dt;let runIn=0,runPool=0,washed=0,silt=0,any=false,ti0=N,ti1=-1,tj0=N,tj1=-1;
  for(let j=j0;j<=j1;j++){const o=j*V;Rq2.fill(0,o+i0,o+i1+1);Rs2.fill(0,o+i0,o+i1+1)}
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const k=j*V+i,h=H[k];let q=Rq[k],sd=Rs[k];
    // rain on ground at or above grade (a dug hole catches its own rain, waterTick); the soaked share runs off
    if(rain&&h>=H0[k]-0.02){const a=r*RAIN_IN*0.4*TU.runoff*dt*(0.25+0.75*rainSoakK(k));q+=a;runIn+=a}
    // untouched ground (grass, roots) drinks a film in; once the rain stops it all soaks away in seconds
    if(Math.abs(h-H0[k])<=0.04)q=Math.max(0,q-0.00025*dt*(1.2-rainSoakK(k)));
    if(!rain)q=Math.max(0,q-0.0006*dt);
    if(q<1e-6){if(sd>0&&!prot[k]){H[k]+=sd;ti0=Math.min(ti0,i);ti1=Math.max(ti1,i);tj0=Math.min(tj0,j);tj1=Math.max(tj1,j)}continue}
    // into a pool: the water joins it and the dirt settles out as silt
    if(Wt[k]>h+0.001){Wt[k]+=q;runPool+=q;silt+=sd;Tu[k]=Math.min(1,Tu[k]+(q*0.4+sd*150)/Math.max(0.03,Wt[k]-h));if(sd>0&&!prot[k]){H[k]+=sd;ti0=Math.min(ti0,i);ti1=Math.max(ti1,i);tj0=Math.min(tj0,j);tj1=Math.max(tj1,j)}continue}
    const s0=h+q;let best=-1,bs=s0;
    for(const d of RUN_NB){const n=k+d,sn=Wt[n]>H[n]?Wt[n]:H[n]+Rq[n];if(sn<bs){bs=sn;best=n}}
    any=true;if(best<0){Rq2[k]+=q;Rs2[k]+=sd;continue}
    const mv=Math.min(q,(s0-bs)*0.5),f=mv/q,slope=(h-H[best])/CELL;
    // loose ground gives up dirt where the water runs steep; it drops it again where the flow can't carry it
    if(!prot[k]&&Math.abs(h-H0[k])>0.04&&h>H0[k]-FLOOR+0.05){const cap=ke*mv*Math.max(0,slope);
      let dh=sd<cap?-Math.min((cap-sd)*0.3,emax):Math.min((sd-cap)*0.3,sd);if(dh){H[k]+=dh;sd-=dh;if(dh<0)washed-=dh;else silt+=dh;ti0=Math.min(ti0,i);ti1=Math.max(ti1,i);tj0=Math.min(tj0,j);tj1=Math.max(tj1,j)}}
    Rq2[best]+=mv;Rs2[best]+=sd*f;Rq2[k]+=q-mv;Rs2[k]+=sd*(1-f);
    // running water keeps the ground under it wet
    if(mv>0.0015)mudA[k]=1}
  // water that runs off the edge of the dig area is gone
  for(let j=j0;j<=j1;j++){const o=j*V;Rq.set(Rq2.subarray(o+i0,o+i1+1),o+i0);Rs.set(Rs2.subarray(o+i0,o+i1+1),o+i0)}
  runAny=any;if(ti1>=ti0){touch(ti0,ti1,tj0,tj1);st.dirty=true}
  // for the Stats panel (stats.js): rain that ran off, water it brought into pools, dirt washed off and settled as silt
  if(runIn+runPool+washed+silt>0){stats.runoff+=runIn*CA;stats.runPool+=runPool*CA;stats.washed+=washed*CA;stats.silt+=silt*CA;statDirty=true}
  return any}
function waterTick(dt){
  waterT-=dt;if(waterT>0||cI1<cI0)return;const step=0.25;waterT+=step;runoffStep(step);
  let any=false,hole=false,moved=false,crk=false;seeping=0;const rain=weather.r>0.02,dry=(dryT-=step)<=0;if(dry)dryT=2.5;
  for(let j=cJ0;j<=cJ1;j++)for(let i=cI0;i<=cI1;i++){const k=j*V+i,h=H[k],w0=Wt[k];
    // soaked ground holds water near the surface: painted Mud everywhere while it is soaked, other rain-soaked ground only
    // in ruts and shallow dips (a deep cut just catches the rain that falls in it)
    const g=H0[k]-((mudBase[k]>SAT_MUD||h>H0[k]-0.5)&&rainSoakK(k)>SAT_MUD?SAT_DEPTH:TU.wtDepth);
    // seep up from the water table into anything dug below it
    if(h<g){if(Wt[k]<h)Wt[k]=h;if(Wt[k]<g){const w1=Math.min(g,Wt[k]+SEEP*TU.seep*step);if(Wt[k]>=h)stats.seeped+=(w1-Wt[k])*CA;Wt[k]=w1;seeping++}}
    // rain falls into anything dug below grade; once it stops, rainwater above the table drains away
    if(rain&&h<H0[k]-0.02){const top=H0[k]-SAT_DEPTH;if(Wt[k]<h)Wt[k]=h;if(Wt[k]<top)Wt[k]=Math.min(top,Wt[k]+weather.r*RAIN_IN*step)}
    else if(!rain&&Wt[k]>g)Wt[k]=Math.max(g,Wt[k]-RAIN_DRAIN*step);
    // wet spoil and churned mud dry out over several minutes once there is no water on them
    if(dry&&mudA[k]>0&&Wt[k]<-1e8)mudA[k]=Math.max(0,mudA[k]-0.005);
    // dug, dumped and rutted ground remembers the wettest it got (soakMax, terrain.js) and, drying out from there,
    // turns pale and matte, then cracks once it was proper mud
    if(dry){let cx=0,cy=0;
      if(Math.abs(h-H0[k])>0.02){const s=mudOf(k);if(s>soakMax[k])soakMax[k]=s;const m=soakMax[k];
        if(m>0.4){cx=ss(0.4,0.8,m)*(1-ss(0.3,0.6,s));cy=ss(0.5,0.9,m)*(1-ss(0.06,0.25,s))}}
      if(Math.abs(cx-crkA[k*2])>0.01||Math.abs(cy-crkA[k*2+1])>0.01||(!cx&&crkA[k*2])||(!cy&&crkA[k*2+1])){crkA[k*2]=cx;crkA[k*2+1]=cy;crk=true}}
    // level out with wetter neighbours (water runs into any low ground next to a pool, never above the table)
    if(i>cI0&&i<cI1&&j>cJ0&&j<cJ1){const m=Math.max(Wt[k-1],Wt[k+1],Wt[k-V],Wt[k+V]);if(m>Wt[k]&&m>h)Wt[k]=Math.min(m,Math.max(Wt[k],g,m-0.002))}
    if(pumpOn&&Wt[k]>-1e8){if(Wt[k]>h)stats.pumped+=Math.min(Wt[k]-h,PUMP*TU.pump*step)*CA;Wt[k]-=PUMP*TU.pump*step}
    // muddy water mixes through a pool and its dirt settles out over a few minutes
    if(Tu[k]>0){if(Wt[k]>h&&i>cI0&&i<cI1&&j>cJ0&&j<cJ1)Tu[k]+=((Tu[k-1]+Tu[k+1]+Tu[k-V]+Tu[k+V])*0.25-Tu[k])*0.3;Tu[k]*=Wt[k]>h?0.999:0.9}
    else if(Wt[k]>h&&i>cI0&&i<cI1&&j>cJ0&&j<cJ1)Tu[k]=(Tu[k-1]+Tu[k+1]+Tu[k-V]+Tu[k+V])*0.075;
    // water only stands in ground dug or rutted below grade: never higher than 2 in under the original surface, so a
    // pool on a slope can't level out over the untouched ground below it
    if(Wt[k]>H0[k]-SAT_DEPTH)Wt[k]=H0[k]-SAT_DEPTH;
    // a film thinner than 3 mm is not shown; rain builds one up in a dug spot instead of losing it
    if(Wt[k]<=h+0.001&&!(rain&&Wt[k]>-1e8&&h<H0[k]-0.02))Wt[k]=-1e9;else if(Wt[k]>h+0.003){any=true;if(Wt[k]<H0[k]-1)hole=true;mudA[k]=1;wetT[k]=timeU.value}
    if(Math.abs(Wt[k]-w0)>1e-4)moved=true}
  if(crk){const a=geo.attributes.crk;a.addUpdateRange(cJ0*V*2,(cJ1-cJ0+1)*V*2);a.needsUpdate=true}
  // waterAny: a flooded hole (the Pump button); puddleAny: any water at all
  if(runAny){any=true;moved=true}
  waterAny=hole;puddleAny=any;waterMoved=moved;if(!hole)pumpOn=false;
  if(hole&&!waterSeen){waterSeen=true;toast(say(rain?'waterRain':'waterSeep'),'',3800)}
  // place the surface over the dug area, or around the camera when the dug area is wider; it moves only when the camera
  // nears its edge, and is redrawn when the water moves or the camera moves it, and each second for the ground under it
  const span=WM_N*WM_K;let i0=Math.max(0,Math.min(N-span,Math.round(((cI0+cI1)/2-span/2)/GRID_K)*GRID_K)),j0=Math.max(0,Math.min(N-span,Math.round(((cJ0+cJ1)/2-span/2)/GRID_K)*GRID_K));
  if(cI1-cI0>span||cJ1-cJ0>span){const li=gI(look.x),lj=gJ(look.z);
    if(wmI0>=0&&Math.abs(li-wmI0-span/2)<span/4&&Math.abs(lj-wmJ0-span/2)<span/4){i0=wmI0;j0=wmJ0}
    else{i0=Math.max(0,Math.min(N-span,Math.round((li-span/2)/GRID_K)*GRID_K));j0=Math.max(0,Math.min(N-span,Math.round((lj-span/2)/GRID_K)*GRID_K))}}
  wmMesh.visible=any;wmAge+=step;if(!any||(!moved&&wmAge<1&&i0===wmI0&&j0===wmJ0))return;wmI0=i0;wmJ0=j0;wmAge=0;
  const p=wmMesh.geometry.attributes.position.array,cl=wmMesh.geometry.attributes.color.array,G=WM_K;
  for(let j=0;j<=WM_N;j++)for(let i=0;i<=WM_N;i++){const gi=i0+i*G,gj=j0+j*G,k=gj*V+gi,o=(j*(WM_N+1)+i)*3;
    // a dry point next to water takes the pool's level (it is inside the bank there, so the surface ends flat at the wall)
    let y=Rq[k]>0.004&&Math.abs(H[k]-H0[k])>0.04&&Wt[k]<H[k]+0.003?H[k]+Rq[k]+0.002:Wt[k];if(y<H[k]+0.003){const m=Math.max(gi>=G?Wt[k-G]:-1e9,gi+G<=N?Wt[k+G]:-1e9,gj>=G?Wt[k-G*V]:-1e9,gj+G<=N?Wt[k+G*V]:-1e9);y=m>-1e8?Math.min(m,H[k]-0.02):H[k]-0.12}
    p[o]=gX(gi);p[o+1]=y;p[o+2]=gZ(gj);
    const t=Wt[k]>H[k]+0.003?Tu[k]:Rq[k]>0.004?Math.min(1,0.45+Rs[k]/Rq[k]*40):0;for(let c=0;c<3;c++)cl[o+c]=WM_CLEAR[c]+(WM_MUDDY[c]-WM_CLEAR[c])*t}
  wmMesh.geometry.attributes.position.needsUpdate=true;wmMesh.geometry.attributes.color.needsUpdate=true;wmMesh.geometry.computeVertexNormals();
}
// the dried-out memory for the site save: each point that has one, as the gap since the last (varint) and a byte
function smSave(){const out=[];let last=-1;for(let k=0;k<V*V;k++){const b=Math.round(soakMax[k]*255);if(b<1)continue;let g=k-last;last=k;
    while(g>=128){out.push((g&127)|128);g>>>=7}out.push(g,b)}
  return out.length?siteB64(new Uint8Array(out)):''}
function smLoad(t){soakMax.fill(0);if(typeof t!=='string'||!t)return;let b;try{b=siteUnB64(t)}catch(e){return}
  let o=0,k=-1;while(o<b.length){let g=0,sh=0,c;do{c=b[o++];g|=(c&127)<<sh;sh+=7}while(c&128&&o<b.length);k+=g;if(k>=V*V||o>=b.length)break;soakMax[k]=b[o++]/255}}
// how wet point k is: puddles and wet spoil (mudA), or the soil water (rainSoakK, rain.js: rain, and painted Mud,
// which starts soaked and dries out)
function soakK(k){return rainSoakK(k)}
function mudOf(k){return Math.max(mudA[k],soakK(k))}
// how muddy the ground is at x,z (0 dry, 1 puddle, wet spoil or soaked ground; farMud in mud.js outside the dig zone)
function mudAt(x,z){const i=Math.round(gI(x)),j=Math.round(gJ(z));if(i<0||i>N||j<0||j>N)return farMud(x,z);return mudOf(j*V+i)}
// is the bucket tip under water?
function underWater(p){const i=Math.round(gI(p.x)),j=Math.round(gJ(p.z));if(i<0||i>N||j<0||j>N)return false;return Wt[j*V+i]>p.y}
function setPump(on){pumpOn=!!on&&waterAny;const b=$('#pumpBtn');b.textContent=pumpOn?'Pump: on':'Pump';b.setAttribute('aria-pressed',pumpOn);
  if(pumpOn)toast(say('pumpOn'),'good')}
$('#pumpBtn').onclick=()=>setPump(!pumpOn);
