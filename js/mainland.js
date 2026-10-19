// Corley's Island: the mainland across the lake (mainHeight in terrain.js). To the north the field and woods: a mown
// hayfield with a fence and round bales east of the trail, a pine and leaf woods west of it. To the south the lakeside
// town: a boardwalk on the beach, a marina, Main Street with a block of shops each side and a cross street. Both are
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

// a shop or house on a town lot: a block with a parapet, two rows of windows and a door on the face toward the street
// (face: the yaw it looks along), and a coloured awning; solid to the machines and the worker
function mainLot(K,x,z,w,d,h,col,face,awn){const y=Math.min(baseHeight(x-w/2,z-d/2),baseHeight(x+w/2,z+d/2),baseHeight(x-w/2,z+d/2),baseHeight(x+w/2,z-d/2));
  const fx=Math.sin(face),fz=Math.cos(face),F=(o,s)=>[x+fx*o+fz*s,z+fz*o-fx*s];
  K.box(w,h+1,d,col,x,y+(h-1)/2,z,face);K.box(w+0.3,0.5,d+0.3,0xd8d2c4,x,y+h+0.15,z,face);
  for(let s=-w/2+1.6;s<=w/2-1.5;s+=2.4){for(const wy of [h>7?h-2.4:null,h>4.5?h-4.6:null])if(wy){const [a,b]=F(d/2+0.03,s);K.box(1.3,1.4,0.06,0x2c3a44,a,y+wy,b,face)}}
  {const [a,b]=F(d/2+0.03,0);K.box(1.2,2.2,0.08,0x4a3424,a,y+1.1,b,face);const [c,e]=F(d/2+0.7,0);K.box(w*0.8,0.1,1.4,awn,c,y+2.9,e,face,-0.25)}
  SOLIDS.push({x,z,hx:(Math.abs(fz)*w+Math.abs(fx)*d)/2+0.1,hz:(Math.abs(fx)*w+Math.abs(fz)*d)/2+0.1})}

(function(){let sd=31;const rnd=()=>{sd=(sd+0x6D2B79F5)|0;let t=Math.imul(sd^(sd>>>15),1|sd);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296};
  // ---------- north: the field and woods ----------
  const N=famKit();
  // a post and two-rail fence along the hayfield's south edge, a gap where the lane runs in, and round bales on the stubble
  for(let x=24;x<=400;x+=3.5){const z=-306,y=baseHeight(x,z);N.box(0.16,1.3,0.16,0x7a6a55,x,y+0.55,z);
    if(x+3.5<=400)for(const ry of [0.55,1.0])N.box(3.5,0.1,0.06,0x8c7b62,x+1.75,baseHeight(x+1.75,z)+ry,z)}
  for(let i=0;i<26;i++){const x=40+rnd()*340,z=-320-rnd()*220;if(Math.abs(roadOff(x,z))<4)continue;
    N.cyl(0.75,0.75,1.3,12,0xc2a45a,x,baseHeight(x,z)+0.7,z,rnd()*6.3,0,Math.PI/2)}
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
  let li=0;const lot=(x,z,w,d,h,face)=>{mainLot(T,x,z,w,d,h,COLS[li%COLS.length],face,AWN[(li*3)%AWN.length]);li++};
  // Main Street: a block of shops each side, facing the street, with sidewalks and lamps
  for(const s of [-1,1]){for(let i=0;i<7;i++){const z=588+i*19+(i>2?8:0),w=15+((i*7+(s>0?3:0))%4),h=5.5+((i*5+(s>0?2:0))%5)*1.3;if(Math.abs(z-652)<10)continue;
      lot(s*(4+2+6.5),z,w,13,h,s>0?-Math.PI/2:Math.PI/2)}
    for(let z=568;z<724;z+=6){const x=s*5,y=baseHeight(x,z);T.box(2,0.16,6,0xbdb8ac,x,y+0.08,z)}
    for(let z=574;z<724;z+=22){const x=s*5.6,y=baseHeight(x,z);T.cyl(0.07,0.1,5,8,0x2f3236,x,y+2.5,z);T.box(0.5,0.2,0.5,0x2f3236,x,y+5.05,z);T.lit(new THREE.BoxGeometry(0.4,0.05,0.4),0xfff1c8,x,y+4.93,z)}}
  // along the cross street, both sides
  for(const s of [-1,1])for(let i=0;i<5;i++){const x=s*(30+i*22);lot(x,652-13,16,12,5+((i*3)%4)*1.4,0);lot(x,652+13,16,12,5.5+((i*2)%3)*1.5,Math.PI)}
  // a boardwalk along the top of the beach, and a few benches on it looking out at the islands
  for(let x=-160;x<160;x+=6){if(Math.abs(x)<7)continue;const z0=mainRimS(x)+3,z1=mainRimS(x+6)+3,y=Math.max(baseHeight(x+3,(z0+z1)/2),WATER+1.8);
    T.box(6.1,0.16,3.6,0x8c6e4c,x+3,y+0.25,(z0+z1)/2,-Math.atan2(z1-z0,6));
    if(((x+160)/6|0)%5===2)T.box(1.6,0.45,0.5,0x5c4632,x+3,y+0.55,(z0+z1)/2+1.2)}
  // the marina: a pier out from the beach east of town with finger slips and boats tied up
  {const X=72,Z0=mainRimS(X)+2,Y=WATER+1.1,Lp=46;T.box(3,0.2,Lp,0x8c6e4c,X,Y,Z0-Lp/2);
    for(let t=0;t<=Lp;t+=4)for(const s of [-1,1])T.cyl(0.14,0.14,4,6,0x5c4632,X+s*1.4,Y-1.9,Z0-t);
    for(let i=0;i<3;i++){const z=Z0-14-i*12;T.box(9,0.18,1.6,0x8c6e4c,X+6,Y,z);
      for(const [dz,col] of [[-3,0xf2f2ee],[3,i===1?0x2a4f7a:0xf2f2ee]]){T.box(2.4,0.9,6,col,X+7,WATER+0.35,z+dz,Math.PI/2);T.box(1.4,0.8,2,0xdadfe2,X+6.6,WATER+1.1,z+dz,Math.PI/2)}}}
  famSign(['LAKESIDE','Main Street'],4.2,1.5,7.5,baseHeight(7.5,568)+2.0,568,Math.PI,'#1f4d6b','#ffffff');
  for(const s of [-1,1])T.box(0.12,2.5,0.12,0x8a8a86,7.5+s*1.9,baseHeight(7.5,568)+1.25,568);
  famAdd(T);
})();
