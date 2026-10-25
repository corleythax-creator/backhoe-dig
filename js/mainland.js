// Corley's Island: the mainland across the lake (mainHeight in terrain.js). To the north the field and woods: a mown
// hayfield with a fence and round bales east of the trail, a pine and leaf woods west of it. To the south the lakeside
// town: a boardwalk on the beach, a marina (marina.js), Main Street with a block of shops each side and a cross street. Both are
// reached by temporary crossings, a timber trestle (BRIDGES with temp set) and a rock causeway (CAUSEWAYS); the crane
// on its barge replaces the trestles with steel spans one at a time (mainTick).
const mainGround=[groundPatch(-450,450,-572,-196,4,[MAIN_FINE[0]]),groundPatch(...MAIN_FINE[0],1,[]),
  groundPatch(-450,450,480,780,4,[MAIN_FINE[1]]),groundPatch(...MAIN_FINE[1],1,[])];

// a kit's meshes in a group that can be shown or hidden
function mainGroup(K){const g=new THREE.Group();
  if(K.solid.length){const m=new THREE.Mesh(famMerge(K.solid),famMat);m.castShadow=true;m.receiveShadow=true;g.add(m)}
  if(K.glow.length)g.add(new THREE.Mesh(famMerge(K.glow),famGlowMat));if(K.win.length)g.add(new THREE.Mesh(famMerge(K.win),famWinMat));scene.add(g);return g}
// a round bar from a to b ([x, y, z]) into a kit
function mainRod(K,a,b,r,col,seg){const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],l=Math.hypot(dx,dy,dz);if(l<1e-4)return;
  K.geo(new THREE.CylinderGeometry(r,r,l,seg||6,1,true),col,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,Math.atan2(dx,dz),Math.atan2(Math.hypot(dx,dz),dy))}

// each temporary trestle in steel-span lengths of about 20 m, the order the crane replaces them in: the south trestle
// from the mainland bridge outward, then the north one from Corley's lawn outward. Each span has its timber (tr) and
// its steel (st: plate girders, a concrete deck, a railing and a pipe-pile bent), one shown at a time
const crnSpans=[];
function mainSpanKits(b){
  const L=b.len,yaw=Math.atan2(b.ux,b.uz),W=(t,u)=>[b.x0+b.ux*t-b.uz*u,b.z0+b.uz*t+b.ux*u],Y=t=>b.y+(b.y1-b.y)*t/L;
  const pit=Math.atan2(b.y-b.y1,L),hw=b.hw,NS=Math.max(1,Math.round(L/20)),SL=L/NS,NB=Math.max(2,Math.round(L/6));
  const TIM=0x6e5236,DECK=0x8a6c4a,STL=0x5a5f63,GIRD=0x6b7a84,CON=0xa3a19a;
  for(let i=0;i<NS;i++){const t0=i*SL,t1=t0+SL,tm=t0+SL/2,last=i===NS-1;
    const T=famKit(),S=famKit(),at=(K,t,u,y,w,h,d,col,rx,rz)=>{const [x,z]=W(t,u);K.box(w,h,d,col,x,y,z,yaw,rx,rz)};
    // timber: plank deck, wheel guards, rails and posts, steel stringers, and the pile bents in this stretch
    at(T,tm,0,Y(tm)-0.09,2*hw,0.18,SL,DECK,pit);
    for(const s of [-1,1]){at(T,tm,s*(hw-0.2),Y(tm)+0.12,0.3,0.25,SL,TIM,pit);
      at(T,tm,s*(hw+0.1),Y(tm)+1.0,0.12,0.2,SL,TIM,pit);at(T,tm,s*(hw+0.1),Y(tm)+0.55,0.1,0.16,SL,TIM,pit);
      for(let t=Math.ceil(t0/2.4)*2.4;t<t1-0.01||(last&&t<=t1+0.01);t+=2.4)at(T,t,s*(hw+0.1),Y(t)+0.55,0.2,1.1,0.2,TIM)}
    for(const u of [-2.4,-0.8,0.8,2.4])at(T,tm,u,Y(tm)-0.48,0.3,0.6,SL,STL,pit);
    const trW=[],stW=[],wall=(Wl,t,u,r)=>{const [ax,az]=W(t,-u),[bx,bz]=W(t,u);Wl.push({ax,az,bx,bz,r})};
    for(let k=0;k<=NB;k++){const t=k*L/NB;if(t<t0-1e-6||(t>=t1-1e-6&&!(last&&t<=t1+1e-6)))continue;const top=Y(t)-1.0;at(T,t,0,top,2*hw+0.9,0.45,0.5,TIM);wall(trW,t,hw+0.2,0.35);
      let lo=1e9;for(const u of [-2.4,0,2.4]){const [x,z]=W(t,u),g=baseHeight(x,z),h=top-0.2-g;lo=Math.min(lo,g);if(h>0.3)T.cyl(0.17,0.19,h,7,TIM,x,g+h/2,z)}
      const hb=Math.min(3.2,top-0.4-Math.max(lo,WATER+0.2));
      if(hb>0.6){const dl=Math.hypot(4.8,hb),a=Math.atan2(hb,4.8);for(const sg of [-1,1])at(T,t,0,top-0.4-hb/2,dl,0.24,0.12,TIM,0,sg*a)}}
    // steel: two plate girders with stiffeners, a concrete deck with curbs, a steel railing, and a pipe-pile bent (or a
    // concrete abutment where the ground is close) at the far end, and at the near end of the first span
    at(S,tm,0,Y(tm)-0.15,2*hw+0.8,0.3,SL,CON,pit);at(S,tm,0,Y(tm)+0.005,2*hw-0.6,0.02,SL,0x45474a,pit);
    for(const s of [-1,1]){at(S,tm,s*(hw+0.15),Y(tm)+0.12,0.4,0.25,SL,0xb4b2aa,pit);
      at(S,tm,s*2.2,Y(tm)-0.78,0.05,0.9,SL,GIRD,pit);for(const dy of [-0.32,-1.24])at(S,tm,s*2.2,Y(tm)+dy,0.5,0.06,SL,GIRD,pit);
      for(let t=t0+1.5;t<t1;t+=2.5){at(S,t,s*2.2,Y(t)-0.78,0.35,0.85,0.03,GIRD)}
      at(S,tm,s*(hw+0.25),Y(tm)+1.05,0.1,0.1,SL,STL,pit);at(S,tm,s*(hw+0.25),Y(tm)+0.6,0.08,0.08,SL,STL,pit);
      for(let t=t0+0.5;t<t1;t+=2)at(S,t,s*(hw+0.25),Y(t)+0.6,0.1,0.95,0.1,STL)}
    for(const t of i===0?[t0,t1]:[t1]){const capY=Y(t)-1.6,[cx,cz]=W(t,0),gc=baseHeight(cx,cz);
      if(gc>capY-0.6){at(S,t,0,(Y(t)-0.3+gc-1)/2,2*hw+1,Y(t)-0.3-gc+1,1.6,CON);continue}
      at(S,t,0,capY,2*hw+1,0.7,0.9,STL);wall(stW,t,2.2,0.5);for(const u of [-2.2,2.2]){const [x,z]=W(t,u),g=baseHeight(x,z)-1,h=capY-0.35-g;if(h>0.3)S.cyl(0.45,0.45,h,12,0x7d5a43,x,g+h/2,z)}}
    const tr=mainGroup(T),st=mainGroup(S);st.visible=false;crnSpans.push({b,i,t0,t1,tm,SL,W,Y,tr,st,last,trW,stW})}
  // a yellow limit sign at each end, taken down when the last span is steel
  b.signs=[];for(const [t,ry] of [[-1.5,yaw+Math.PI],[L+1.5,yaw]]){const [x,z]=W(t,hw+1.3),y=baseHeight(x,z),K=famKit();
    for(const s of [-1,1]){const [px,pz]=W(t,hw+1.3+s*1.9);K.box(0.12,2.5,0.12,0x8a8a86,px,y+1.25,pz)}
    b.signs.push(mainGroup(K),famSign(['TEMPORARY BRIDGE','10 MPH · 40 TON LIMIT'],4.4,1.5,x,y+2.0,z,ry,'#e2b52a','#1a1a1a'))}}
mainSpanKits(BRIDGES[4]);mainSpanKits(BRIDGES[5]);

// ---------- the crane on its barge ----------
// a lattice-boom crawler crane on a deck barge that works its way along each trestle: for every span it lifts a steel
// pipe pile off the barge, upends it over the pier, drives it with the vibratory hammer, then sets a plate girder, and
// the span turns to steel. CRN.n spans are done and CRN.t seconds into the next (saved with the site, save.js); a span
// takes TU.craneSpan seconds. The barge (local x toward the bridge, z along it): hull, raked ends, spud poles, bollards,
// the pile stack and girder stack on the far side, a tool house; the crane's slew centre stands at CRN_SX
const CRN={n:0,t:0},CRN_LB=38,CRN_SX=2.8,CRN_DY=1.0,CRN_PILE=[-2.6,-9],CRN_GIRD=[-3.0,7];
const crnBarge=new THREE.Group(),crnUpper=new THREE.Group(),crnBoom=new THREE.Group(),crnHook=new THREE.Group();
const crnLines=[],crnPile=new THREE.Group(),crnGird=new THREE.Group();let crnHam=null;
(function(){const B=famKit(),HULL=0x2e3438,DK=0x5d5f5c,RUST=0x7d5a43,YEL=0xe5b322,DARK=0x2a2c2e,D=CRN_DY;
  B.box(12,2.2,29,HULL,0,-0.1,0);for(const s of [-1,1])B.box(12,2.2,2.6,HULL,0,0.25,s*15.2,0,s*0.5);
  B.box(11.6,0.06,28.6,DK,0,D,0);for(const s of [-1,1]){B.box(0.25,0.35,29,0x8a5a3a,s*5.85,D+0.18,0);B.box(11.9,0.35,0.25,0x8a5a3a,0,D+0.18,s*14.4)}
  for(const [x,z] of [[-5.3,-12],[5.3,-12],[-5.3,0],[5.3,0],[-5.3,12],[5.3,12]])B.cyl(0.22,0.26,0.6,10,DARK,x,D+0.3,z);
  for(const z of [-13.4,13.4]){B.box(1.6,2.6,1.6,0x3d4246,-5.2,D+1.0,z);B.cyl(0.45,0.45,17,12,0x3d4246,-5.2,D+3.5,z);B.cyl(0.46,0.46,0.6,12,YEL,-5.2,D+11.8,z)}
  // the pipe piles in a stack on timber dunnage, and the plate girders upright on blocking
  for(const z of [-14,-9,-4])B.box(5,0.25,0.4,0x6e5236,-2.4,D+0.13,z);
  {const rows=[[-4.1,-3.2,-2.3,-1.4],[-3.65,-2.75,-1.85],[-3.2,-2.3]];rows.forEach((r,k)=>r.forEach(x=>B.cyl(0.45,0.45,14,14,RUST,x,D+0.7+k*0.78,CRN_PILE[1],0,Math.PI/2)))}
  for(const z of [0,7,14])B.box(5,0.3,0.5,0x6e5236,-3,D+0.15,z);
  for(const x of [-4.4,-3.0,-1.6]){const y=D+0.3;B.box(0.05,0.9,18,0x6b7a84,x,y+0.5,CRN_GIRD[1]);for(const dy of [0.04,0.96])B.box(0.5,0.06,18,0x6b7a84,x,y+dy,CRN_GIRD[1])}
  B.box(2.4,2.3,3,0xd9d4c4,-4.2,D+1.15,-13.5+0.4);B.box(2.6,0.15,3.2,0x8a8a86,-4.2,D+2.35,-13.1);
  B.cyl(0.32,0.32,0.08,12,0xe0661e,5.95,D+1.2,6,0,0,Math.PI/2);
  crnBarge.add(mainGroup(B));
  // the crawler base: two track frames with shoes and idlers, the carbody and slewing ring
  const C=famKit();for(const s of [-1,1]){const x=CRN_SX+s*2.05;C.box(1.0,1.0,6.2,DARK,x,D+0.55,0);
    for(let z=-3.0;z<=3.01;z+=0.42){C.box(1.1,0.08,0.34,0x3a3c3e,x,D+1.08,z);C.box(1.1,0.08,0.34,0x3a3c3e,x,D+0.04,z)}
    for(const z of [-3.1,3.1])C.cyl(0.5,0.5,1.12,12,0x3a3c3e,x,D+0.55,z,0,0,Math.PI/2)}
  C.box(3.2,0.8,3.4,YEL,CRN_SX,D+0.9,0);C.cyl(1.5,1.6,0.35,18,DARK,CRN_SX,D+1.45,0);
  crnBarge.add(mainGroup(C));
  // the upper works (turns): machinery deck, house, cab, counterweight, A-frame gantry, boom foot and hoist drums
  const U=famKit();U.box(4.4,0.4,7.4,YEL,0,0.2,-0.6);U.box(3.6,2.3,5,YEL,0.3,1.55,-1.6);U.box(3.7,0.12,5.1,0x8a8a86,0.3,2.76,-1.6);
  U.box(1.2,1.9,2.1,YEL,-1.65,1.35,1.7);U.box(1.22,1.1,0.06,0x2c3a44,-1.65,1.6,2.76);U.box(0.06,1.0,1.7,0x2c3a44,-2.26,1.6,1.7);
  for(let k=0;k<4;k++)U.box(4.4,0.55,1.5,k%2?0x2a2c2e:0x3a3d40,0,0.7+k*0.57,-5.0);U.box(4.42,0.1,1.52,YEL,0,3.0,-5.0);
  for(const s of [-1,1]){mainRod(U,[s*1.5,0.4,-0.4],[s*0.6,6.4,-2.4],0.1,YEL);mainRod(U,[s*1.5,0.4,-4.2],[s*0.6,6.4,-2.4],0.1,YEL)}
  mainRod(U,[-0.7,6.4,-2.4],[0.7,6.4,-2.4],0.12,YEL);U.cyl(0.25,0.25,1.8,10,DARK,0,6.4,-2.4,0,0,Math.PI/2);
  for(const z of [-0.2,-1.4])U.cyl(0.42,0.42,2.4,14,DARK,0.3,1.0,z,0,0,Math.PI/2);
  U.cyl(0.09,0.09,1.2,8,DARK,1.6,3.3,-3.4);for(const s of [-1,1])mainRod(U,[s*1.4,0.8,2.05],[s*1.4,0.8,3.2],0.18,DARK);
  crnUpper.add(mainGroup(U));crnUpper.position.set(CRN_SX,D+1.65,0);crnBarge.add(crnUpper);
  // the boom: four chords, lacing on every face, tapering into the head with its sheaves; built along +z
  const M=famKit(),sz=z=>z<CRN_LB-4?0.65:0.65-0.3*(z-(CRN_LB-4))/4;
  for(const [a,b] of [[-1,-1],[1,-1],[1,1],[-1,1]]){mainRod(M,[a*0.65,b*0.65,0],[a*0.65,b*0.65,CRN_LB-4],0.07,YEL);mainRod(M,[a*0.65,b*0.65,CRN_LB-4],[a*0.35,b*0.35,CRN_LB],0.07,YEL)}
  for(let z=0,k=0;z<CRN_LB-0.5;z+=1.4,k++){const z2=Math.min(CRN_LB,z+1.4),s1=sz(z),s2=sz(z2),f=k%2?1:-1;
    mainRod(M,[-s1,f*s1,z],[s2,f*s2,z2],0.035,YEL);mainRod(M,[f*s1,-s1,z],[f*s2,s2,z2],0.035,YEL);
    mainRod(M,[s1,-f*s1,z],[-s2,-f*s2,z2],0.035,YEL);mainRod(M,[-f*s1,s1,z],[-f*s2,-s2,z2],0.035,YEL)}
  M.cyl(0.18,0.18,2.0,8,DARK,0,0,0,0,0,Math.PI/2);for(const x of [-0.25,0.25])M.cyl(0.55,0.55,0.12,14,DARK,x,0.1,CRN_LB+0.2,0,0,Math.PI/2);
  crnBoom.add(mainGroup(M));crnBoom.position.set(0,1.0,2.0);crnUpper.add(crnBoom);
  // the hook block, the loads and the lines (pendants and hoist falls), placed every frame
  const H=famKit();H.box(0.7,1.0,0.45,YEL,0,-0.5,0);H.cyl(0.32,0.32,0.5,12,DARK,0,-0.2,0,0,0,Math.PI/2);H.cyl(0.1,0.1,0.35,8,DARK,0,-1.15,0);
  H.geo(new THREE.TorusGeometry(0.24,0.07,6,12,Math.PI*1.4),DARK,0,-1.55,0,0,0,Math.PI*0.8);
  crnHook.add(mainGroup(H));crnBarge.add(crnHook);
  // a pile (its centre at the group's origin) and the vibratory hammer clamped on its top
  const P=famKit();P.cyl(0.45,0.45,14,14,RUST,0,0,0);crnPile.add(mainGroup(P));
  const VH=famKit();VH.box(1.2,1.6,1.0,0x3a6e8f,0,7.8,0);VH.box(0.5,0.4,0.5,DARK,0,8.8,0);crnHam=mainGroup(VH);crnPile.add(crnHam);crnPile.visible=false;scene.add(crnPile);
  const G=famKit();G.box(0.05,0.9,1,0x6b7a84,0,-0.5,0);for(const dy of [-0.04,-0.96])G.box(0.5,0.06,1,0x6b7a84,0,dy,0);
  crnGird.add(mainGroup(G));crnGird.visible=false;scene.add(crnGird);
  const lm=new THREE.MeshBasicMaterial({color:0x1d1f21});for(let k=0;k<6;k++){const m=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,1,4,1,true),lm);scene.add(m);crnLines.push(m)}
  scene.add(crnBarge)})();
// a line between two world points
function crnLine(m,a,b){const d=new THREE.Vector3().subVectors(b,a),l=d.length();m.position.copy(a).addScaledVector(d,0.5);m.scale.set(1,Math.max(0.01,l),1);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.divideScalar(l||1))}
// where the barge lies for span k: 16 m east of the trestle, abreast of the span (or farther out, where the water is
// deep enough to float it), its long side along the bridge and the crane's side toward it
function crnBargeAt(k){const s=crnSpans[Math.min(k,crnSpans.length-1)],b=s.b,yaw=Math.atan2(b.ux,b.uz),u=s.W(0,16)[0]>s.W(0,0)[0]?16:-16;
  let t=s.tm;for(let g=0;g<20&&baseHeight(...s.W(t,u))>WATER-1.5;g++)t+=3;const [x,z]=s.W(t,u);return {x,z,yaw:yaw+(u<0?Math.PI:0)}}
// the hook's way through one span, in the barge's own frame: [share of the span's time, x, z, hook height], the crane
// swinging between them; pile: carried from 0.08, upended 0.18-0.26, driven 0.30-0.42; girder: carried 0.59-0.84
function crnKeys(s,toL){const P=CRN_PILE,G=CRN_GIRD,D=CRN_DY,[px,pz]=toL(...s.W(s.t1,0)),[gx,gz]=toL(...s.W(s.tm,0));
  const [bx,bz]=s.W(s.t1,0),bed=baseHeight(bx,bz)-1,top=s.Y(s.t1)-1.95-WATER,drop=Math.max(bed-WATER+14,top)+2.2,hi=D+17,gy=s.Y(s.tm)-0.3-WATER+1.2;
  return [[0,12,3,hi],[0.05,P[0],P[1],D+5],[0.08,P[0],P[1],D+3.1],[0.12,P[0],P[1],hi],[0.24,px,pz,hi+4],[0.30,px,pz,drop],[0.42,px,pz,top+2.2],[0.46,px,pz,top+7],
    [0.56,G[0],G[1],D+5],[0.59,G[0],G[1],D+3.2],[0.63,G[0],G[1],hi],[0.76,gx,gz,hi],[0.84,gx,gz,gy],[0.88,gx,gz,gy+5],[1,12,3,hi]]}
function crnPose(keys,u){let i=0;while(i<keys.length-2&&u>keys[i+1][0])i++;const a=keys[i],b=keys[i+1],f=ss(0,1,(u-a[0])/(b[0]-a[0]));
  const pa=Math.atan2(a[1]-CRN_SX,a[2]),pb=Math.atan2(b[1]-CRN_SX,b[2]);let dA=pb-pa;while(dA>Math.PI)dA-=2*Math.PI;while(dA<-Math.PI)dA+=2*Math.PI;
  const ra=Math.hypot(a[1]-CRN_SX,a[2]),rb=Math.hypot(b[1]-CRN_SX,b[2]);return {th:pa+dA*f,r:ra+(rb-ra)*f,y:a[3]+(b[3]-a[3])*f}}
// shows spans 0..n-1 as steel (and span n too once its girder is down)
function crnShow(n,u){crnSpans.forEach((s,k)=>{const steel=k<n||(k===n&&u>=0.86);s.tr.visible=!steel;s.st.visible=steel});
  for(const b of [BRIDGES[4],BRIDGES[5]]){const left=crnSpans.some((s,k)=>s.b===b&&!(k<n||(k===n&&u>=0.86)));for(const g of b.signs)if(g)g.visible=left}}
const crnV=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()];
function mainTick(dt){
  const NS=crnSpans.length,T=Math.max(10,TU.craneSpan);
  if(CRN.n<NS){CRN.t+=dt;if(CRN.t>=T){CRN.t=0;CRN.n++;if(typeof site!=='undefined')site.dirty=true;
      const s=crnSpans[CRN.n-1],near=Math.hypot(camera.position.x-crnBarge.position.x,camera.position.z-crnBarge.position.z)<320;
      if(near)toast(say(s.last?'bridgeDone':'spanDone',{bridge:s.b===BRIDGES[4]?'town':'north',left:crnSpans.filter((q,k)=>k>=CRN.n&&q.b===s.b).length}),'good')}
    else if((CRN.saveT=(CRN.saveT||0)+dt)>30){CRN.saveT=0;if(typeof site!=='undefined')site.dirty=true}}
  const k=Math.min(CRN.n,NS-1),done=CRN.n>=NS,u=done?0:CRN.t/T,s=crnSpans[k];
  // the barge: abreast of the span, moving on to the next one once the girder is set (same trestle only)
  const A=crnBargeAt(done?NS-1:k);let bx=A.x,bz=A.z;
  if(!done&&u>0.9&&k+1<NS&&crnSpans[k+1].b===s.b){const B2=crnBargeAt(k+1),f=ss(0.9,1,u);bx+=(B2.x-bx)*f;bz+=(B2.z-bz)*f}
  crnBarge.position.set(bx,WATER+0.05*Math.sin(timeU.value*0.7),bz);crnBarge.rotation.set(0.006*Math.sin(timeU.value*0.9),A.yaw,0.008*Math.sin(timeU.value*0.6));crnBarge.updateMatrixWorld();
  const cs=Math.cos(A.yaw),sn=Math.sin(A.yaw),toL=(x,z)=>{const dx=x-bx,dz=z-bz;return [dx*cs-dz*sn,dx*sn+dz*cs]};
  const p=done?{th:Math.atan2(12-CRN_SX,3),r:Math.hypot(12-CRN_SX,3),y:CRN_DY+17}:crnPose(crnKeys(s,toL),u);
  // slew toward the hook, boom up or down to its radius, the hook hanging under the head
  const phi=Math.acos(Math.max(0.17,Math.min(0.97,(p.r-2.0)/CRN_LB)));crnUpper.rotation.y=p.th;crnBoom.rotation.x=-phi;crnBarge.updateMatrixWorld();
  const tip=crnBoom.localToWorld(crnV[0].set(0,0.1,CRN_LB+0.2)),hy=Math.min(p.y+WATER,tip.y-2);crnHook.position.copy(crnBarge.worldToLocal(crnV[1].set(tip.x,hy,tip.z)));
  const hook=crnV[1].set(tip.x,hy,tip.z);
  for(const s2 of [-1,1]){crnLine(crnLines[s2<0?0:1],crnUpper.localToWorld(crnV[2].set(s2*0.6,6.4,-2.4)),crnBoom.localToWorld(crnV[3].set(s2*0.3,0.3,CRN_LB)));
    crnLine(crnLines[s2<0?2:3],crnV[2].set(tip.x+s2*0.12,tip.y-0.4,tip.z),crnV[3].set(hook.x+s2*0.12,hook.y-0.3,hook.z))}
  crnLine(crnLines[4],crnUpper.localToWorld(crnV[2].set(0.3,1.4,-0.2)),crnBoom.localToWorld(crnV[3].set(0,0.6,1.5)));
  crnLine(crnLines[5],crnBoom.localToWorld(crnV[2].set(0,0.6,1.5)),crnBoom.localToWorld(crnV[3].set(0,0.4,CRN_LB-1)));
  // the loads: the pile hangs from the hook, swings upright and is driven; the girder hangs level along the bridge
  crnPile.visible=!done&&u>=0.08&&u<0.88;crnGird.visible=!done&&u>=0.59&&u<0.88;
  if(crnPile.visible){const up=u<0.42?ss(0.18,0.26,u):1,[px,pz]=s.W(s.t1,0),hold=u>=0.42,jit=u>0.3&&u<0.42?0.03*Math.sin(timeU.value*70):0;
    if(hold)crnPile.position.set(px,s.Y(s.t1)-1.95-7,pz);else crnPile.position.set(hook.x+jit,hy-0.9-8.3*up,hook.z);
    crnPile.rotation.set((1-up)*Math.PI/2,A.yaw,0,'YXZ');crnHam.visible=up>0.5&&!hold}
  if(crnGird.visible){const hold=u>=0.84,[gx,gz]=s.W(s.tm,0);crnGird.position.set(hold?gx:hook.x,hold?s.Y(s.tm)-0.3:hy-1.2,hold?gz:hook.z);
    crnGird.rotation.set(0,Math.atan2(s.b.ux,s.b.uz),0);crnGird.scale.set(1,1,s.SL)}
  crnShow(CRN.n,u)}
function craneSave(){return {n:CRN.n,t:Math.round(CRN.t)}}
function craneLoad(d){if(d&&isFinite(d.n)){CRN.n=Math.max(0,Math.min(crnSpans.length,d.n|0));CRN.t=Math.max(0,+d.t||0)}crnShow(CRN.n,CRN.t/Math.max(10,TU.craneSpan))}

// the town's shop signs: one picture holds them all (MAIN_SHOPS, two columns of 16), drawn as one mesh once the lots are
// built (mainSignsAdd). Each: its name, a line under it, the board colour and the lettering colour, serif or not
const MAIN_SHOPS=[["Lakeside Bakery","Bread · Pies · Coffee","#2f4a3a","#e9d9a6",1],["Harbor Books","New & Used","#1f3a5f","#f1ead8",1],
  ["Pine & Anchor","Cafe","#e9e1cc","#23402f",0],["Ridge Outfitters","Camp · Fish · Hike","#3a2a20","#e0b45a",0],["Hometown Hardware","Since 1948","#b8322a","#ffffff",0],
  ["Main St. Diner","Breakfast All Day","#e9e1cc","#b8322a",0],["Lakeside Pharmacy","Rx · Gifts","#ffffff","#1f5a7a",0],["Post Office","U.S. Mail","#1f3a5f","#ffffff",0],
  ["First Lake Bank","Est. 1912","#23402f","#e0c27a",1],["Barber Shop","Walk-ins Welcome","#2b2d2f","#f1ead8",1],["Wildflower","Florist","#e8d6dc","#6b2a44",1],
  ["Mountain Coffee","Roasted Here","#3a2a20","#f1ead8",0],["Lakeside Pizza","Slices · Pies","#23402f","#f4d27a",0],["Antiques","& Oddities","#5a2a22","#e9d9a6",1],
  ["Tackle & Trail","Bait · Licenses","#2f5a33","#ffffff",0],["The Sweet Shop","Fudge · Candy","#f3d9e2","#8a2a52",1],["Lake Realty","Homes · Cabins · Land","#ffffff","#1f3a5f",0],
  ["Village Deli","Sandwiches","#e9e1cc","#2f4a3a",0],["Gallery on Main","Local Art","#2b2d2f","#ffffff",1],["Toy Chest","Toys · Games","#2a5f9a","#f4d27a",0],
  ["Laundromat","Open 7 Days","#ffffff","#2a5f9a",0],["Copper Kettle","Pub & Grill","#2b2d2f","#d08a42",1],["Bike & Paddle","Rentals · Repairs","#d08a22","#ffffff",0],
  ["Lakeview Hotel","Rooms","#1f3a5f","#e0c27a",1],["Corner Market","Groceries","#2f6b4f","#ffffff",0],["Quilt Barn","Fabric · Yarn","#7e2f26","#f1ead8",1],
  ["Hair Studio","Cuts · Color","#e9e1cc","#2b2d2f",1],["Thrift & Treasure","Second Hand","#5a3a6b","#f1ead8",0],["Town Library","Books · Story Time","#23402f","#f1ead8",1],
  ["Town Hall","Lakeside","#e9e6dc","#1f3a5f",1],["Ice House","Ice · Firewood","#2a5f9a","#ffffff",0],["Lakeside Theater","Movies Fri · Sat","#5a2a22","#f4d27a",1]];
const mainSignList=[];
// a shop or house on a town lot: a block with its parapet and cornice; a storefront on the face toward the street (face:
// the yaw it looks along) with pilasters, display windows over kick plates, a door, flower boxes, a striped awning in its
// colour and the shop's sign above; two floors of windows with sills and lintels over it. Solid to the machines and the worker
function mainLot(K,x,z,w,d,h,col,face,awn,si){const y=Math.min(baseHeight(x-w/2,z-d/2),baseHeight(x+w/2,z+d/2),baseHeight(x-w/2,z+d/2),baseHeight(x+w/2,z-d/2));
  const fx=Math.sin(face),fz=Math.cos(face),F=(o,s)=>[x+fx*o+fz*s,z+fz*o-fx*s],TR=0xe9e4d6,DK=0x2a2c2f,c=new THREE.Color(col).multiplyScalar(0.72).getHex();
  K.box(w,h+1,d,col,x,y+(h-1)/2,z,face);
  // the roof: a dark membrane inside a parapet with a stone coping, and on most a rooftop unit and a vent
  K.box(w-0.4,0.06,d-0.4,0x4a4c4e,x,y+h+0.03,z,face);for(const s of [-1,1]){const [a,b]=F(0,s*(w/2-0.12));K.box(0.24,0.7,d,col,a,y+h+0.35,b,face);const [e,f]=F(s*(d/2-0.12),0);K.box(w,0.7,0.24,col,e,y+h+0.35,f,face)}
  for(const s of [-1,1]){const [a,b]=F(0,s*(w/2-0.1));K.box(0.36,0.1,d+0.1,0xd8d2c4,a,y+h+0.75,b,face);const [e,f]=F(s*(d/2-0.1),0);K.box(w+0.1,0.1,0.36,0xd8d2c4,e,y+h+0.75,f,face)}
  if(si%3){const [a,b]=F(-d*0.15,(si%2?1:-1)*w*0.2);K.box(1.6,1.0,1.2,0xa9adb0,a,y+h+0.53,b,face);K.box(1.4,0.06,1.0,0x55595c,a,y+h+1.06,b,face);const [e,f]=F(-d*0.3,-(si%2?1:-1)*w*0.25);K.cyl(0.15,0.15,0.9,8,0x8a8e91,e,y+h+0.48,f)}
  {const [a,b]=F(d/2+0.18,0);K.box(w+0.25,0.3,0.36,TR,a,y+h-0.25,b,face);const [e,f]=F(d/2+0.06,0);K.box(w,0.5,0.12,c,e,y+h-0.75,f,face)}
  // the storefront: pilasters at the ends, a kick plate and display window each side of the door, a transom
  for(const s of [-1,1]){const [a,b]=F(d/2+0.1,s*(w/2-0.25));K.box(0.5,4.2,0.2,TR,a,y+2.1,b,face)}
  {const [a,b]=F(d/2+0.08,0);K.box(w-0.6,0.25,0.16,TR,a,y+3.05,b,face)}
  const pw=(w-0.9)/2-0.8;for(const s of [-1,1]){const so=s*(0.8+pw/2),[a,b]=F(d/2+0.05,so),[e,f]=F(d/2+0.1,so),[g,k]=F(d/2+0.35,so);
    K.box(pw,0.6,0.1,c,a,y+0.3,b,face);K.box(pw,2.2,0.06,0x2c3a44,a,y+1.75,b,face);K.box(pw+0.1,0.08,0.14,TR,e,y+0.62,f,face);K.box(0.08,2.2,0.12,TR,e,y+1.75,f,face);
    K.box(pw-0.4,0.3,0.4,0x6b4a30,g,y+0.75,k,face);K.box(pw-0.5,0.16,0.36,0x3d6b2f,g,y+0.96,k,face);
    const fc=[0xc94c6a,0xe8b923,0xf2efe6,0x8a4fa8][(si+s+4)%4];for(let q=-(pw-0.7)/2;q<=(pw-0.7)/2;q+=0.22){const [m,n]=F(d/2+0.35+((q*7)%2?0.08:-0.08),so+q);K.box(0.11,0.1,0.11,fc,m,y+1.07,n,face+q)}}
  {const [a,b]=F(d/2+0.05,0);K.box(1.2,2.3,0.08,0x4a3424,a,y+1.15,b,face);K.box(1.2,0.5,0.06,0x2c3a44,a,y+2.65,b,face);const [e,f]=F(d/2+0.1,0);K.box(0.7,1.2,0.04,0x2c3a44,e,y+1.5,f,face)}
  // the awning: stripes of its colour and white, sloping out over the walk, with a valance
  {const n=Math.max(4,Math.round((w-1)/0.6)),sw=(w-1)/n;for(let i=0;i<n;i++){const s=-(w-1)/2+sw*(i+0.5),[a,b]=F(d/2+0.75,s);K.box(sw+0.005,0.06,1.5,i%2?0xf2efe6:awn,a,y+2.95,b,face,-0.32);
    const [e,f]=F(d/2+1.48,s);K.box(sw+0.005,0.3,0.04,i%2?0xf2efe6:awn,e,y+2.6,f,face)}}
  // the sign over the awning (MAIN_SHOPS[si]), on a dark board
  {const sw=Math.min(w-1.6,8.5),[a,b]=F(d/2+0.1,0);K.box(sw+0.24,1.14,0.08,DK,a,y+3.75,b,face);const [e,f]=F(d/2+0.15,0);mainSignList.push({x:e,y:y+3.75,z:f,ry:face,w:sw,h:0.95,i:si%MAIN_SHOPS.length})}
  // the upper floors: windows with a sill under and a lintel over each
  for(let wy=5.7;wy+1.1<h;wy+=2.8)for(let s=-w/2+1.5;s<=w/2-1.4;s+=2.3){const [a,b]=F(d/2+0.03,s),[e,f]=F(d/2+0.1,s);
    K.box(1.1,1.6,0.06,0x2c3a44,a,y+wy,b,face);K.box(1.4,0.1,0.18,TR,e,y+wy-0.86,f,face);K.box(1.35,0.16,0.1,TR,e,y+wy+0.88,f,face)}
  SOLIDS.push({x,z,hx:(Math.abs(fz)*w+Math.abs(fx)*d)/2+0.1,hz:(Math.abs(fx)*w+Math.abs(fz)*d)/2+0.1})}
// the shop signs: the lettering drawn into one picture, and every sign a quad of it, as one mesh
function mainSignsAdd(){const cv=document.createElement('canvas');cv.width=1024;cv.height=1024;const g=cv.getContext('2d'),SW=512,SH=64;
  MAIN_SHOPS.forEach(([n,sub,bg,fg,serif],i)=>{const x0=(i%2)*SW,y0=((i/2)|0)*SH,ff=serif?'Georgia,"Times New Roman",serif':'"Barlow Condensed","Arial Narrow",Arial,sans-serif';
    g.fillStyle=bg;g.fillRect(x0,y0,SW,SH);g.strokeStyle=fg;g.lineWidth=2;g.strokeRect(x0+4,y0+4,SW-8,SH-8);g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';
    g.font=`700 ${serif?32:36}px ${ff}`;let t=serif?n:n.toUpperCase(),m=g.measureText(t).width;if(m>SW-40)g.font=`700 ${Math.floor((serif?32:36)*(SW-40)/m)}px ${ff}`;g.fillText(t,x0+SW/2,y0+25);
    g.font=`${serif?'italic ':''}600 15px ${ff}`;g.fillText(serif?sub:sub.toUpperCase(),x0+SW/2,y0+50)});
  const tex=new THREE.CanvasTexture(cv);tex.anisotropy=4;tex.colorSpace=THREE.SRGBColorSpace;const P=[],U=[],v=new THREE.Vector3();
  for(const s of mainSignList){const u0=(s.i%2)/2,v1=1-((s.i/2)|0)/16,v0=v1-1/16,cs=Math.cos(s.ry),sn=Math.sin(s.ry),pt=(a,b)=>{v.set(a*cs,b,-a*sn);return [s.x+v.x,s.y+v.y,s.z+v.z]};
    const A=pt(-s.w/2,-s.h/2),B=pt(s.w/2,-s.h/2),C=pt(s.w/2,s.h/2),D=pt(-s.w/2,s.h/2);P.push(...A,...B,...C,...A,...C,...D);U.push(u0,v0,u0+0.5,v0,u0+0.5,v1,u0,v0,u0+0.5,v1,u0,v1)}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(P,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));geo.computeVertexNormals();
  const m=new THREE.Mesh(geo,M(0xffffff,{map:tex,flatShading:false}));m.receiveShadow=true;scene.add(m);return m}

(function(){let sd=31;const rnd=()=>{sd=(sd+0x6D2B79F5)|0;let t=Math.imul(sd^(sd>>>15),1|sd);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296};
  // ---------- north: the field and woods ----------
  const N=famKit();
  // a post and two-rail fence along the hayfield's south edge, a gap where the lane runs in, and round bales on the stubble
  for(let x=24;x<=400;x+=3.5){const z=-306,y=baseHeight(x,z);N.box(0.16,1.3,0.16,0x7a6a55,x,y+0.55,z);
    if(x+3.5<=400)for(const ry of [0.55,1.0])N.box(3.5,0.1,0.06,0x8c7b62,x+1.75,baseHeight(x+1.75,z)+ry,z)}
  const RB=famKit();
  for(let i=0;i<26;i++){const x=40+rnd()*340,z=-320-rnd()*220;if(Math.abs(roadOff(x,z))<4)continue;const yaw=rnd()*6.3;
    RB.cyl(0.75,0.75,1.3,12,0xc2a45a,x,baseHeight(x,z)+0.7,z,yaw,0,Math.PI/2);famSpot('roundbale',x,baseHeight(x,z),z,yaw)}
  famAddSpot('roundbale',RB);
  famSign(['FIELD AND WOODS','Trail west · Hayfield east'],4.6,1.5,-7,baseHeight(-7,-300)+2.0,-300,0,'#2f5a33','#ffffff');
  for(const s of [-1,1])N.box(0.12,2.5,0.12,0x8a8a86,-7+s*2.1,baseHeight(-7,-300)+1.25,-300);
  famAdd(N);
  // the woods: pines and leaf trees west of the trail, thinning at the edge, clear of the trail itself
  const out=[];
  for(let g=0;g<12000&&out.length<440;g++){const x=-440+rnd()*420,z=-555+rnd()*250,w=mainWoods(x,z);
    if(w<0.5||rnd()>0.35+0.65*ss(-20,-60,x)||Math.abs(roadOff(x,z))<ROAD_W/2+1.4)continue;
    out.push({p:rnd()<0.9,x,z,yaw:rnd()*6.3,s:0.85+rnd()*0.7,c:(rnd()*6)|0})}
  // and a ragged tree line along the far side of the hayfield
  for(let x=30;x<400;x+=5+rnd()*6){const z=-548+rnd()*10;out.push({p:rnd()<0.75,x,z,yaw:rnd()*6.3,s:0.9+rnd()*0.6,c:(rnd()*6)|0})}
  treeGroup('mainland',out.map(a=>treeEntry(a.p?'pine':'leafy',a.x,a.z,a.yaw,a.s,a.c,a.p?1+0.45*hash(a.x*1.3+0.7,a.z*2.1+0.3):0)));

  // ---------- south: the lakeside town ----------
  const T=famKit(),COLS=[0xb5654a,0xd9cdb0,0x7d9aa8,0xc9b27a,0x9c4f3f,0xe4e0d4,0x8f9a7a,0xb98b5e],AWN=[0x2f6b4f,0xb8322a,0x2a4f7a,0xd08a22];
  const LK=famKit(),BK=famKit();let li=0;const lot=(x,z,w,d,h,face)=>{mainLot(T,x,z,w,d,h,COLS[li%COLS.length],face,AWN[(li*3)%AWN.length],li);li++};
  // Main Street: a block of shops each side, facing the street, with sidewalks and lamps
  for(const s of [-1,1]){for(let i=0;i<7;i++){const z=588+i*19+(i>2?8:0),w=15+((i*7+(s>0?3:0))%4),h=5.5+((i*5+(s>0?2:0))%5)*1.3;if(Math.abs(z-652)<10)continue;
      lot(s*(4+2+6.5),z,w,13,h,s>0?-Math.PI/2:Math.PI/2)}
    for(let z=568;z<724;z+=6){const x=s*5,y=baseHeight(x,z);T.box(2,0.16,6,0xbdb8ac,x,y+0.08,z)}
    for(let z=574;z<724;z+=22){const x=s*5.6,y=baseHeight(x,z);LK.cyl(0.07,0.1,5,8,0x2f3236,x,y+2.5,z);LK.box(0.5,0.2,0.5,0x2f3236,x,y+5.05,z);LK.lit(new THREE.BoxGeometry(0.4,0.05,0.4),0xfff1c8,x,y+4.93,z);
      famSpot('lamp',x,y+0.16,z,0)}}
  // along the cross street, both sides
  for(const s of [-1,1])for(let i=0;i<5;i++){const x=s*(30+i*22);lot(x,652-13,16,12,5+((i*3)%4)*1.4,0);lot(x,652+13,16,12,5.5+((i*2)%3)*1.5,Math.PI)}
  // a boardwalk along the top of the beach, and a few benches on it looking out at the islands
  // (a gap where the marina's boat ramp crosses it, marina.js)
  for(let x=-160;x<160;x+=6){if(Math.abs(x)<7||Math.abs(x+3-107)<4)continue;const z0=mainRimS(x)+3,z1=mainRimS(x+6)+3,y=Math.max(baseHeight(x+3,(z0+z1)/2),WATER+1.8);
    T.box(6.1,0.16,3.6,0x8c6e4c,x+3,y+0.25,(z0+z1)/2,-Math.atan2(z1-z0,6));
    if(((x+160)/6|0)%5===2){BK.box(1.6,0.45,0.5,0x5c4632,x+3,y+0.55,(z0+z1)/2+1.2);famSpot('bench',x+3,y+0.33,(z0+z1)/2+1.2,Math.PI,0.9)}}
  // street trees along Main Street between the lamps, each in a square of brick pavers with an iron grate
  const TR=[];for(const sx of [-1,1])for(let z=585;z<724;z+=22){if(Math.abs(z-652)<9)continue;const x=sx*5.3,y=baseHeight(x,z);TR.push(treeEntry('leafy',x,z,(z*0.37)%6.3,0.62,(z/22|0)%6));
    T.box(1.3,0.04,1.3,0x8a4a36,x,y+0.18,z);T.box(1.0,0.03,1.0,0x2a2c2f,x,y+0.2,z)}
  treeGroup('town',TR);
  // a post clock at the foot of Main Street: a fluted iron post, a head with a face each way and the hands at ten past ten
  {const X=-7.5,Z=570,y=baseHeight(X,Z);T.cyl(0.32,0.38,0.5,10,0x1f2a24,X,y+0.25,Z);T.cyl(0.12,0.14,3.6,10,0x1f2a24,X,y+2.2,Z);T.box(0.95,0.95,0.42,0x1f2a24,X,y+4.4,Z);
    T.cyl(0,0.3,0.4,8,0x1f2a24,X,y+5.08,Z);for(const s of [-1,1]){T.cyl(0.4,0.4,0.03,20,0xf4f1e6,X,y+4.4,Z+s*0.22,0,Math.PI/2);
      T.box(0.04,0.22,0.02,0x111111,X+0.05,y+4.48,Z+s*0.24,0,0,-0.5);T.box(0.03,0.32,0.02,0x111111,X-0.07,y+4.52,Z+s*0.245,0,0,0.6)}
    SOLIDS.push({x:X,z:Z,hx:0.4,hz:0.4})}
  famSign(['LAKESIDE','Main Street'],4.2,1.5,7.5,baseHeight(7.5,568)+2.0,568,Math.PI,'#1f4d6b','#ffffff');
  for(const s of [-1,1])T.box(0.12,2.5,0.12,0x8a8a86,7.5+s*1.9,baseHeight(7.5,568)+1.25,568);
  famAdd(T);famAddSpot('lamp',LK);famAddSpot('bench',BK);mainSignsAdd();
})();

// ---------- the Lakeside General Store, at the south end of Main Street ----------
// where the pickups' beds fill up (pickup.js): a brick store with a glass front under a steel canopy, a parking lot in
// front where Main Street ends, and the garden centre under a shade roof on its west side. It is built physically based:
// the library's brick, broom-finish concrete, asphalt, corrugated steel and planks with their relief and roughness maps
// (relief only on High graphics, Material relief: shopPbr), and metal, glass and paint that read as metal, glass and
// paint. The pictures load the first time the camera comes near (shopLoad, from pickup.js), so the phone downloads them
// only for a trip to town. SHOP.st: where each kind of stock is taken; pickup.js draws the stock on them
const SHOP={x:0,z:752,fz:744,lib:[],st:{mulch:[-20.6,746.2],tools:[-4.6,743.3],groc:[4.6,743.2]},loaded:false};
// a library material: its mean colour until the pictures are in (one per id, shared with the marina)
function shopLib(id){const m0=SHOP.lib.find(m=>m.userData.lib===id);if(m0)return m0;const d=MAT_LIST.find(m=>m.id===id),m=new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.85,envMap:skyEnv,envMapIntensity:0.5});
  m.color.setRGB(d.c[0],d.c[1],d.c[2]);m.userData.ft=d.ft;m.userData.lib=id;SHOP.lib.push(m);return m}
function shopStd(c,metal,rough,o){const m=new THREE.MeshStandardMaterial(Object.assign({color:c,metalness:metal,roughness:rough,envMap:skyEnv},o||{}));m.userData.ft=4;return m}
function shopLoad(){if(SHOP.loaded)return;SHOP.loaded=true;
  for(const m of SHOP.lib){const L=k=>{const t=new THREE.TextureLoader().load(`textures/${m.userData.lib}${k}.jpg`);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;if(!k)t.colorSpace=THREE.SRGBColorSpace;return t};
    m.map=L('');m.color.setScalar(1);m.roughness=1;m.userData.n=L('_n');m.userData.r=L('_r');m.needsUpdate=true}
  shopPbr(SHOP.pbr)}
// relief and sheen maps on (High graphics) or off
function shopPbr(on){SHOP.pbr=!!on;if(!SHOP.loaded)return;for(const m of SHOP.lib){m.normalMap=on?m.userData.n:null;m.roughnessMap=on?m.userData.r:null;m.roughness=on?1:0.85;m.needsUpdate=true}}
// parts merged per material, with texture coordinates in world metres (each material's tile size in feet), so brick
// courses and concrete joints keep their real size on every part
function shopKit(){const parts=new Map(),O=new THREE.Object3D(),n=new THREE.Vector3(),a=new THREE.Vector3(),b=new THREE.Vector3();O.rotation.order='YXZ';
  function put(mat,g,x,y,z,ry,rx){O.position.set(x||0,y||0,z||0);O.rotation.set(rx||0,ry||0,0);O.updateMatrix();
    if(g.index)g=g.toNonIndexed();g.applyMatrix4(O.matrix);const P=g.attributes.position.array,t=1/(mat.userData.ft*0.3048),uv=new Float32Array(P.length/3*2);
    for(let i=0;i<P.length;i+=9){a.set(P[i+3]-P[i],P[i+4]-P[i+1],P[i+5]-P[i+2]);b.set(P[i+6]-P[i],P[i+7]-P[i+1],P[i+8]-P[i+2]);n.crossVectors(a,b);
      const ax=Math.abs(n.x),ay=Math.abs(n.y),az=Math.abs(n.z);
      for(let k=0;k<3;k++){const q=i+k*3,o=(i/3+k)*2;if(ay>=ax&&ay>=az){uv[o]=P[q]*t;uv[o+1]=P[q+2]*t}else if(ax>=az){uv[o]=P[q+2]*t;uv[o+1]=P[q+1]*t}else{uv[o]=P[q]*t;uv[o+1]=P[q+1]*t}}}
    g.setAttribute('uv',new THREE.BufferAttribute(uv,2));if(!parts.has(mat))parts.set(mat,[]);parts.get(mat).push(g)}
  return {put,box:(mat,w,h,d,x,y,z,ry,rx)=>put(mat,new THREE.BoxGeometry(w,h,d),x,y,z,ry,rx),
    cyl:(mat,r,h,x,y,z)=>put(mat,new THREE.CylinderGeometry(r,r,h,10),x,y,z),
    // a sheet lying on the ground, lift above it, x0 to x1 by z0 to z1
    sheet:(mat,x0,x1,z0,z1,lift)=>{const g=new THREE.PlaneGeometry(x1-x0,z1-z0,Math.max(1,Math.round((x1-x0)/2)),Math.max(1,Math.round((z1-z0)/2)));g.rotateX(-Math.PI/2);
      const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i)+(x0+x1)/2,z=p.getZ(i)+(z0+z1)/2;p.setXYZ(i,x,baseHeight(x,z)+lift,z)}put(mat,g)},
    add(){for(const [mat,list] of parts){let n=0;for(const g of list)n+=g.attributes.position.count;const P=new Float32Array(n*3),U=new Float32Array(n*2);let o=0;
      for(const g of list){P.set(g.attributes.position.array,o*3);U.set(g.attributes.uv.array,o*2);o+=g.attributes.position.count;g.dispose()}
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(P,3));geo.setAttribute('uv',new THREE.BufferAttribute(U,2));geo.computeVertexNormals();geo.computeBoundingSphere();
      const m=new THREE.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;m.layers.enable(RAIN_LAYER);scene.add(m)}}}}
(function(){const K=shopKit(),F=famKit(),fz=SHOP.fz,g0=baseHeight(0,fz),fl=g0+0.14,yb=g0-0.5,top=fl+6.2,par=top+0.7,mid=(par+yb)/2,hgt=par-yb;
  const brick=shopLib('brick'),conc=shopLib('concrete_broom'),asph=shopLib('asphalt'),corr=shopLib('corrugated'),cap=shopLib('concrete'),roof=shopLib('concrete_old'),wood=shopLib('planks');
  const bronze=shopStd(0x3b3631,0.85,0.35),glass=shopStd(0x18232a,0.25,0.04,{envMapIntensity:1.6}),green=shopStd(0x23402f,0.3,0.45),galv=shopStd(0x9aa0a4,0.9,0.38),
    paint=shopStd(0xe9e6dc,0,0.75),dark=shopStd(0x2b2d2f,0.2,0.6),pot=shopStd(0x1e1f20,0,0.55);
  // the store: brick walls with a parapet and its concrete coping, pilasters down the sides, a roll-up door on the east
  K.box(brick,30,hgt,0.35,0,mid,fz+15.825);for(const s of [-1,1]){K.box(brick,0.35,hgt,16,s*14.825,mid,fz+8);for(const z of [fz+3,fz+8,fz+13])K.box(brick,0.14,hgt,0.6,s*15.07,mid,z)}
  for(const s of [-1,1])K.box(brick,5,hgt,0.35,s*12.5,mid,fz+0.175);K.box(brick,20,par-fl-3.3,0.35,0,(par+fl+3.3)/2,fz+0.175);K.box(brick,20,fl-yb,0.35,0,(fl+yb)/2,fz+0.175);
  K.box(roof,29.3,0.2,15.3,0,top,fz+8);K.box(cap,30.3,0.25,0.42,0,fl+3.42,fz+0.12);
  for(const z of [fz+0.15,fz+15.85])K.box(cap,30.3,0.12,0.5,0,par+0.06,z);for(const s of [-1,1])K.box(cap,0.5,0.12,16.2,s*14.85,par+0.06,fz+8);
  K.box(corr,3.6,3.8,0.08,15.06,fl+1.9,fz+10,Math.PI/2);K.box(dark,0.12,0.2,3.8,15.07,fl+3.9,fz+10);
  // the glass front: bronze mullions, a transom, the sliding doors in the middle with their push bars and kick plates
  K.box(glass,20,3.3,0.04,0,fl+1.65,fz+0.2);
  for(const x of [-10,-8.75,-6.25,-3.75,-1.25,0,1.25,3.75,6.25,8.75,10])K.box(bronze,0.1,3.3,0.16,x,fl+1.65,fz+0.16);
  for(const y of [fl+0.06,fl+2.45,fl+3.26])K.box(bronze,20.1,y===fl+0.06?0.12:0.1,0.16,0,y,fz+0.16);
  for(const s of [-1,1]){K.box(galv,0.9,0.04,0.06,s*0.62,fl+1.05,fz+0.1);K.box(galv,1.1,0.25,0.02,s*0.62,fl+0.14,fz+0.17)}
  // the canopy over the walk on its posts, lit underneath
  const cy=fl+3.55;K.box(green,31,0.34,3.9,0,cy+0.17,fz-1.9);K.box(galv,30.8,0.03,3.7,0,cy-0.005,fz-1.9);
  for(const x of [-14.6,-7.5,7.5,14.6])K.box(green,0.16,cy-g0+0.1,0.16,x,(cy+g0-0.1)/2,fz-3.6);
  for(const x of [-11,-5.5,0,5.5,11])F.lit(new THREE.BoxGeometry(0.5,0.04,0.5),0xfff1c8,x,cy-0.03,fz-1.9);
  // the walk in front: broom-finish concrete with its curb; the lot: asphalt with painted stalls, two lamp poles
  K.sheet(conc,-15.5,15.5,fz-3.8,fz+0.02,0.12);K.box(conc,31,0.3,0.16,0,baseHeight(0,fz-3.8)-0.03,fz-3.8);
  K.sheet(asph,-27.5,17.5,724.5,fz-3.8,0.04);
  for(let x=-25.4;x<16;x+=3.2)if(Math.abs(x)>4.2)K.sheet(paint,x-0.06,x+0.06,fz-10.4,fz-4.6,0.055);
  for(const [x,z] of [[-13,731],[10,731]]){const y=baseHeight(x,z);F.cyl(0.25,0.3,0.6,10,0xa3a19a,x,y+0.3,z);F.cyl(0.08,0.11,8,8,0x3a3d40,x,y+4.3,z);
    for(const s of [-1,1]){F.box(1.0,0.08,0.08,0x3a3d40,x+s*0.5,y+8.2,z);F.box(0.55,0.14,0.32,0x2f3236,x+s*1.05,y+8.15,z);F.lit(new THREE.BoxGeometry(0.45,0.03,0.24),0xfff1c8,x+s*1.05,y+8.07,z)}
    SOLIDS.push({x,z,hx:0.3,hz:0.3})}
  // the garden centre: a concrete pad under a shade roof of corrugated steel on galvanized posts, two pallets of bagged
  // mulch, and benches of potted shrubs along the back
  const gy=baseHeight(-21,749)+3.4;K.sheet(conc,-27.4,-15.2,fz-3.8,fz+14.2,0.07);
  K.box(corr,11.6,0.05,17.6,-21.3,gy,fz+5.2);for(const z of [fz-3.7,fz+14])K.box(green,11.8,0.28,0.1,-21.3,gy-0.08,z);K.box(green,0.1,0.28,17.8,-27.15,gy-0.08,fz+5.2);
  for(const x of [-26.9,-21.3,-15.7])for(const z of [fz-3.4,fz+5.2,fz+13.7]){if(x===-15.7&&z>fz)continue;const y=baseHeight(x,z);K.cyl(galv,0.06,gy-y,x,(gy+y)/2,z);SOLIDS.push({x,z,hx:0.1,hz:0.1})}
  for(const px of [-21.9,-19.3]){const y=baseHeight(px,fz+2.2)+0.07;for(const dz of [-0.45,0,0.45])K.box(wood,1.2,0.1,0.14,px,y+0.05,fz+2.2+dz);for(let dx=-0.52;dx<0.6;dx+=0.26)K.box(wood,0.12,0.03,1.0,px+dx,y+0.115,fz+2.2)}
  SOLIDS.push({x:-20.6,z:fz+2.2,hx:1.35,hz:0.55});
  for(let i=0;i<9;i++){const x=-26.2,z=fz+5.6+i*0.95,y=baseHeight(x,z)+0.07;if(i===0)K.box(wood,1.0,0.06,8.8,x,y+0.62,fz+9.4);
    for(const lx of [-0.28,0.24]){const r=0.16+0.04*((i+lx*3)%2);K.put(pot,new THREE.CylinderGeometry(r,r*0.8,r*1.5,12),x+lx,y+0.65+r*0.75,z);
      F.geo(new THREE.IcosahedronGeometry(r*1.5,1),[0x3d6b2f,0x4f7a36,0x2f5a2a][(i+(lx>0?1:0))%3],x+lx,y+0.65+r*1.5+r*1.1,z,i)}}
  for(const z of [fz+5.4,fz+13.4])K.box(galv,0.06,0.6,0.06,-26.2,baseHeight(-26.2,z)+0.37,z);SOLIDS.push({x:-26.2,z:fz+9.4,hx:0.55,hz:4.5});
  // by the doors: a steel shelf of toolboxes and a stand of groceries
  {const [x,z]=SHOP.st.tools,y=baseHeight(x,z)+0.12;for(const s of [-1,1])K.box(galv,0.05,1.8,0.5,x+s*0.92,y+0.9,z);K.box(dark,1.85,1.7,0.03,x,y+0.95,z+0.24);
    for(const h of [0.12,0.62,1.12])K.box(galv,1.85,0.03,0.5,x,y+h,z);SOLIDS.push({x,z,hx:0.95,hz:0.3})}
  {const [x,z]=SHOP.st.groc,y=baseHeight(x,z)+0.12;K.box(wood,1.95,0.05,0.8,x,y+0.8,z);for(const s of [-1,1])for(const t of [-1,1])K.box(dark,0.05,0.8,0.05,x+s*0.92,y+0.4,z+t*0.35);
    SOLIDS.push({x,z,hx:1.0,hz:0.45})}
  SOLIDS.push({x:0,z:fz+8,hx:15.1,hz:8.1});
  K.add();famAdd(F);
  famSign(['LAKESIDE GENERAL STORE','Garden · Hardware · Groceries'],13,2.1,0,fl+5.05,fz-0.03,Math.PI,'#23402f','#f1ead8');
  famSign(['GARDEN CENTER','Mulch · Soil · Plants'],4.6,1.3,-21.3,gy+0.85,fz-3.78,Math.PI,'#23402f','#f1ead8');
  SHOP.y=fl})();
