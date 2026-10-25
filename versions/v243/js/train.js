// Corley's Island: a freight line in the distance. Far across the lake to the north a single track runs along the foot
// of the front mountain range on a low rock causeway just above the water, from a tunnel in the west to a tunnel in the
// east (about 1.4 miles in the open). Every few minutes a train comes out of one and goes into the other, sounding its
// horn as it leaves the tunnel and again before it goes in: CN and CPKC freights of two or three locomotives and 25 to 55
// cars (boxcars, tank cars, covered hoppers, double stacks, gondolas), and now and then Amtrak's City of New Orleans.
// The trains, their models (models/tr_*.glb) and the horn come from Cruise Brandon (its js/train.js and docs/RAIL.md).
// They run on the real clock, so every device sees the same train; nothing about them is saved. Out past the fog like
// the mountains, the line and the trains draw without it and take the haze themselves (trnHaze), deeper in rain.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.

const TRN_R=800,TRN_A0=188*Math.PI/180,TRN_A1=344*Math.PI/180,TRN_RAMP=10*Math.PI/180,TRN_OUT=90;   // the arc, its ends curving out into the mountain
const TRN_Y=WATER+1.5,TRN_RAIL=TRN_Y+0.18,TRN_LMAX=1150;   // causeway top, rail head, longest train (m)
const TRN_TYPES=['loco_cn','loco_cp','box','tank','hopper','stack','gondola','loco_amtk','viewliner','superliner'],
  TRN_LEN={loco_cn:22,loco_cp:22,box:17.5,tank:18,hopper:17,stack:20.5,gondola:16,loco_amtk:21,viewliner:26,superliner:26};
// lamps on a leading locomotive, in its own frame (x across, y up, z forward from its centre): headlight, ditch lights
const TRN_LAMPS={loco_cn:[[0,2.75,10.4],[-1.05,1.45,10.6],[1.05,1.45,10.6]],loco_cp:[[0,2.75,10.4],[-1.05,1.45,10.6],[1.05,1.45,10.6]],loco_amtk:[[0,3.55,9.95],[-0.95,1.5,10.3],[0.95,1.5,10.3]]};
const trn={X:[],Z:[],S:[],L:0,runs:new Map(),inst:null,lamp:null,glb:null,glbOn:false,mats:[]};
const trnLin=c=>c.map(v=>Math.pow(v,2.2));

// the front mountain range's height (scenery.js, range(790, ...)): where the track goes into the hill
function trnMtn(r,a){const t=Math.pow(Math.max(0,(r-790)/290),1/0.85),env=ss(0,0.3,t)*(1-0.5*ss(0.8,1,t)),side=0.5+0.5*Math.sin(a+2.4);
  const n=(1-Math.abs(Math.sin(a*7+r*0.013)))*0.5+(1-Math.abs(Math.sin(a*17+r*0.031+1.3)))*0.3+(1-Math.abs(Math.sin(a*37-r*0.05+2.1)))*0.2;
  return WATER-6+env*(0.45+0.55*side)*(30+240*n*n)}

// the far haze: like the mountains these draw without the fog; they fade toward its colour instead, more as the fog
// closes in (rain), less as the map editor pushes it back
const trnHazeU={value:0.45};
function trnHaze(m){m.fog=false;m.onBeforeCompile=s=>{s.uniforms.uHz={value:scene.fog.color};s.uniforms.uHk=trnHazeU;
  s.fragmentShader=s.fragmentShader.replace('void main() {','uniform vec3 uHz;uniform float uHk;\nvoid main() {')
    .replace('#include <fog_fragment>','gl_FragColor.rgb=mix(gl_FragColor.rgb,uHz,uHk);')};
  m.customProgramCacheKey=()=>'trnHaze';trn.mats.push(m);return m}

// ---- the line: samples every 4 m along the arc, its ends curving out to the tunnel portals ----
(function(){const n=Math.ceil((TRN_A1-TRN_A0)*TRN_R/4),A=[],R=[];
  for(let i=0;i<=n;i++){const a=TRN_A0+(TRN_A1-TRN_A0)*i/n,e=Math.min(a-TRN_A0,TRN_A1-a);A.push(a);R.push(TRN_R+TRN_OUT*(1-ss(0,TRN_RAMP,e)))}
  // a portal where the hill first stands well over the track, out from the middle each way; the line runs 40 m on inside
  const mid=n>>1,deep=i=>trnMtn(R[i],A[i])>TRN_Y+11;let iw=mid,ie=mid;while(iw>0&&!deep(iw))iw--;while(ie<n&&!deep(ie))ie++;
  const i0=Math.max(0,iw-10),i1=Math.min(n,ie+10);let s=0;
  for(let i=i0;i<=i1;i++){const x=Math.cos(A[i])*R[i],z=Math.sin(A[i])*R[i];if(trn.X.length)s+=Math.hypot(x-trn.X[trn.X.length-1],z-trn.Z[trn.Z.length-1]);trn.X.push(x);trn.Z.push(z);trn.S.push(s)}
  trn.L=s;trn.pw=iw-i0;trn.pe=ie-i0})();
function trnIdx(s){let lo=0,hi=trn.S.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(trn.S[m]<=s)lo=m;else hi=m}return lo}
function trnAt(s){s=clamp(s,0,trn.L);const i=trnIdx(s),j=Math.min(i+1,trn.S.length-1),f=(s-trn.S[i])/((trn.S[j]-trn.S[i])||1);
  return[trn.X[i]+(trn.X[j]-trn.X[i])*f,TRN_RAIL,trn.Z[i]+(trn.Z[j]-trn.Z[i])*f]}

// the causeway: riprap sides down into the water, a ballast shoulder, the track (dark ties and rails) on top, a pole
// line along the lake side, and a concrete portal with a dark mouth at each tunnel
(function(){const P=[],C=[],I=[],X=trn.X,Z=trn.Z,N=X.length;
  const quad=(a,b,c,d,col)=>{const o=P.length/3;P.push(...a,...b,...c,...d);for(let k=0;k<4;k++)C.push(...col);I.push(o,o+1,o+2,o,o+2,o+3)};
  const box=(cx,cy,cz,w,h,l,yaw,col)=>{const cs=Math.cos(yaw),sn=Math.sin(yaw),p=(u,v,t)=>[cx+u*cs+t*sn,cy+v,cz-u*sn+t*cs],w2=w/2,l2=l/2;
    const c=[p(-w2,0,-l2),p(w2,0,-l2),p(w2,0,l2),p(-w2,0,l2),p(-w2,h,-l2),p(w2,h,-l2),p(w2,h,l2),p(-w2,h,l2)];
    quad(c[4],c[7],c[6],c[5],col);quad(c[0],c[1],c[5],c[4],col);quad(c[1],c[2],c[6],c[5],col);quad(c[2],c[3],c[7],c[6],col);quad(c[3],c[0],c[4],c[7],col)};
  // across the line (u out from the centre, + to the right going east): [u, y] and each band's colour
  const prof=[[-12,WATER-3],[-4.2,TRN_Y-0.45],[-2.6,TRN_Y],[-1.3,TRN_Y],[-1.3,TRN_Y+0.18],[1.3,TRN_Y+0.18],[1.3,TRN_Y],[2.6,TRN_Y],[4.2,TRN_Y-0.45],[12,WATER-3]];
  const rock=trnLin([0.46,0.43,0.39]),bal=trnLin([0.5,0.48,0.45]),ties=trnLin([0.22,0.18,0.15]),band=[rock,bal,bal,ties,ties,ties,bal,bal,rock];
  const seg=(i,u)=>{const j=Math.min(i+1,N-1),k=Math.max(i-1,0),tx=X[j]-X[k],tz=Z[j]-Z[k],l=Math.hypot(tx,tz)||1;return[X[i]-tz/l*u,Z[i]+tx/l*u]};
  for(let i=trn.pw;i<trn.pe;i++)for(let b=0;b<prof.length-1;b++){const [u0,y0]=prof[b],[u1,y1]=prof[b+1],a0=seg(i,u0),a1=seg(i,u1),b0=seg(i+1,u0),b1=seg(i+1,u1);
    const k=0.9+0.2*hash(i*0.37,b);quad([a0[0],y0,a0[1]],[b0[0],y0,b0[1]],[b1[0],y1,b1[1]],[a1[0],y1,a1[1]],band[b].map(v=>v*k))};
  // weathered wooden poles every 55 m on the lake side, with a crossarm
  const pole=trnLin([0.3,0.24,0.18]);for(let s=20;s<trn.L-20;s+=55){const i=trnIdx(s);if(i<trn.pw+3||i>trn.pe-3)continue;const p=seg(i,-5.2),j=Math.min(i+1,N-1),h=Math.atan2(X[j]-X[i],Z[j]-Z[i]);
    box(p[0],TRN_Y-0.5,p[1],0.32,9.5,0.32,h,pole);box(p[0],TRN_Y+8.2,p[1],2.4,0.18,0.18,h,pole)}
  // the portals face out along the line
  const conc=trnLin([0.62,0.6,0.56]),dark=[0.01,0.01,0.012];
  for(const [i,o] of [[trn.pw,-1],[trn.pe,1]]){const j=i+o,h=Math.atan2(X[j]-X[i],Z[j]-Z[i]);
    box(X[i],WATER-2,Z[i],13,17,2.4,h,conc);const f=-1.3;box(X[i]+Math.sin(h)*f,TRN_Y-0.2,Z[i]+Math.cos(h)*f,6,7.6,0.3,h,dark);
    box(X[i]-Math.sin(h)*1.5,WATER+15,Z[i]-Math.cos(h)*1.5,14,1.1,3.4,h,conc)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.setIndex(I);
  g.computeVertexNormals();const m=new THREE.Mesh(g.toNonIndexed(),trnHaze(new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.95,flatShading:true,side:THREE.DoubleSide})));
  g.dispose();m.geometry.computeVertexNormals();m.renderOrder=-0.4;scene.add(m);trn.line=m})();

// ---- the trains ----
// boxes in each car's shape (Cruise Brandon's stand-ins), for the Simple machine models setting and until the models load
function trnGeo(type){const parts=[],L=TRN_LEN[type],dark=[0.07,0.07,0.075],add=(g,col,x,y,z,rx)=>{if(rx)g.rotateX(rx);g.translate(x,y,z);const n=g.toNonIndexed();g.dispose();
    const c=new Float32Array(n.attributes.position.count*3);for(let i=0;i<c.length;i+=3){c[i]=col[0];c[i+1]=col[1];c[i+2]=col[2]}n.setAttribute('color',new THREE.BufferAttribute(c,3));parts.push(n)};
  const box=(w,h,l,col,x,y,z)=>add(new THREE.BoxGeometry(w,h,l),col,x,y,z);
  for(const s of [-1,1])box(2.6,0.95,3.0,dark,0,0.5,s*(L/2-2.6));
  box(2.9,0.35,L-0.4,dark,0,1.2,0);
  const W=[1,1,1],steel=[0.74,0.75,0.77],glass=[0.05,0.07,0.09],red=[0.75,0.08,0.1],blue=[0.1,0.2,0.55];
  if(type==='loco_cn'||type==='loco_cp'){const body=type==='loco_cn'?[0.06,0.06,0.06]:[0.55,0.06,0.06],acc=type==='loco_cn'?[0.85,0.2,0.05]:[0.85,0.8,0.75];
    box(3.0,2.6,L-6,body,0,2.7,-2.2);box(3.1,3.3,3.6,body,0,3.05,L/2-4.6);box(3.0,1.7,1.9,body,0,2.25,L/2-1.6);
    box(2.7,0.75,0.06,glass,0,3.95,L/2-2.77);for(const s of [-1,1])box(0.06,0.7,1.6,glass,s*1.56,3.95,L/2-4.2);
    box(3.04,0.32,L-2.5,acc,0,1.85,0);box(3.02,0.25,0.06,acc,0,2.5,L/2-0.64);box(2.4,1.1,6,dark,0,0.95,-1)}
  else if(type==='loco_amtk'){box(3.05,3.0,L-3.2,steel,0,2.9,-1.0);box(3.05,2.2,1.6,steel,0,2.5,L/2-1.4);box(2.8,0.9,1.0,steel,0,3.7,L/2-1.6);
    box(2.6,0.6,0.06,glass,0,3.75,L/2-1.08);box(3.08,0.32,L-1.5,blue,0,2.05,-0.4);box(3.08,0.1,L-1.5,red,0,2.3,-0.4);box(2.2,0.9,5,dark,0,0.95,-2)}
  else if(type==='superliner'){box(3.1,4.6,L-0.6,steel,0,3.55,0);box(3.12,0.55,L-2.5,glass,0,4.6,0);box(3.12,0.5,L-6,glass,0,2.55,0);box(3.13,0.18,L-0.8,blue,0,3.45,0)}
  else if(type==='viewliner'){box(3.1,3.6,L-0.6,steel,0,3.15,0);box(3.12,0.25,L-0.8,blue,0,2.4,0)}
  else if(type==='box'){box(3.1,3.6,L-0.6,W,0,3.2,0);box(3.14,2.9,3.0,[0.72,0.72,0.72],0,2.9,0)}
  else if(type==='tank'){add(new THREE.CylinderGeometry(1.5,1.5,L-2.2,14),W,0,2.95,0,Math.PI/2);box(3.0,0.1,L-0.6,dark,0,1.45,0)}
  else if(type==='hopper'){box(3.1,2.6,L-1,W,0,3.0,0);box(2.6,0.9,L-2,W,0,4.7,0)}
  else if(type==='stack'){box(2.7,0.6,L-0.5,dark,0,0.95,0);box(2.44,2.6,12.2,[0.8,0.42,0.12],0,2.6,0);box(2.5,2.9,16.2,W,0,5.35,0)}
  else if(type==='gondola'){box(3.1,1.6,L-0.6,W,0,2.2,0);box(2.8,0.1,L-1,[0.12,0.1,0.09],0,2.95,0)}
  let n=0;for(const p of parts)n+=p.attributes.position.count;const g=new THREE.BufferGeometry();
  for(const a of ['position','normal','color']){const arr=new Float32Array(n*3);let o=0;for(const p of parts){arr.set(p.attributes[a].array,o);o+=p.attributes[a].array.length}g.setAttribute(a,new THREE.BufferAttribute(arr,3))}
  const c=g.attributes.color.array;for(let i=0;i<c.length;i++)c[i]=Math.pow(c[i],2.2);
  parts.forEach(p=>p.dispose());g.computeBoundingSphere();return g}
function trnMeshes(){if(trn.inst)return trn.inst;trn.inst={};trn.boxMat=trnHaze(new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.75,metalness:0.25}));
  for(const t of TRN_TYPES){const cap=t.startsWith('loco')?8:120,im=new THREE.InstancedMesh(trnGeo(t),trn.boxMat,cap);im.setColorAt(cap-1,new THREE.Color(1,1,1));
    im.count=0;im.visible=false;im.frustumCulled=false;im.userData.cap=cap;im.userData.box=[im.geometry,im.material];scene.add(im);trn.inst[t]=im}
  const lm=new THREE.InstancedMesh(new THREE.CircleGeometry(0.55,10),new THREE.MeshBasicMaterial({color:0xfff2d8,toneMapped:false,fog:false}),12);
  lm.count=0;lm.visible=false;lm.frustumCulled=false;scene.add(lm);trn.lamp=lm;return trn.inst}
// the textured models (Detailed machine models): fetched the first time they are wanted; freight cars are light grey so
// each car's tint colours them
function trnModels(){if(trn.glb)return;trn.glb={};
  for(const t of TRN_TYPES)mdlLoaderReady(()=>new THREE.GLTFLoader().load(`models/tr_${t}.glb`,gl=>{const root=gl.scene,L=TRN_LEN[t];
    const b=new THREE.Box3().setFromObject(root),sz=b.getSize(new THREE.Vector3());root.scale.setScalar(L/Math.max(sz.x,sz.z));
    b.setFromObject(root);root.position.set(-(b.min.x+b.max.x)/2,-b.min.y,-(b.min.z+b.max.z)/2);root.updateMatrixWorld(true);
    let mesh=null;root.traverse(o=>{if(o.isMesh&&!mesh)mesh=o});if(!mesh)return;
    const g=mesh.geometry.clone();g.applyMatrix4(mesh.matrixWorld);g.computeBoundingSphere();
    trn.glb[t]=[g,trnHaze(new THREE.MeshStandardMaterial({map:mesh.material.map,roughness:0.6,metalness:0.3}))];trn.glbOn=null},undefined,()=>{}))}

// a train's make-up from its run number: two or three locomotives and a mixed, tank or stack train; every fourth run
// that is Amtrak's City of New Orleans (two P42s, a baggage car and Superliners)
function trnConsist(k){const a=k>>>0;let s=a*2654435761>>>0;const rnd=()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296};
  const cars=[];if(a%4===3){cars.push({t:'loco_amtk',c:[1,1,1]},{t:'loco_amtk',c:[1,1,1]},{t:'viewliner',c:[1,1,1]});for(let i=0;i<6;i++)cars.push({t:'superliner',c:[1,1,1]});return trnLay(cars,1.45)}
  const loco=rnd()<0.3?'loco_cp':'loco_cn',nl=2+(rnd()<0.35?1:0);for(let i=0;i<nl;i++)cars.push({t:loco,c:[1,1,1]});
  const mix=rnd()<0.3?'stack':rnd()<0.5?'tank':'mixed',N=25+Math.floor(rnd()*30);
  const tint={box:[[0.55,0.22,0.15],[0.42,0.3,0.22],[0.24,0.36,0.5],[0.6,0.5,0.32]],tank:[[0.12,0.12,0.13],[0.85,0.85,0.83],[0.2,0.2,0.22]],hopper:[[0.72,0.72,0.7],[0.55,0.56,0.58],[0.8,0.78,0.72]],
    stack:[[0.85,0.85,0.85],[0.3,0.45,0.7],[0.75,0.3,0.2],[0.25,0.5,0.35],[0.8,0.6,0.2]],gondola:[[0.2,0.18,0.17],[0.4,0.25,0.18]]};
  for(let i=0;i<N;i++){const t=mix==='mixed'?['box','box','tank','hopper','hopper','gondola'][Math.floor(rnd()*6)]:mix==='tank'?(rnd()<0.85?'tank':'hopper'):'stack';
    const pal=tint[t],c=pal[Math.floor(rnd()*pal.length)],q=0.85+rnd()*0.25;cars.push({t,c:c.map(v=>Math.min(1,v*q))})}
  return trnLay(cars,1)}
function trnLay(cars,vk){let len=0;for(const c of cars){c.o=len+TRN_LEN[c.t]/2;len+=TRN_LEN[c.t]+1;c.lc=trnLin(c.c)}return{cars,len,vk}}

// the timetable: run k leaves its tunnel at k times the gap (never closer than one clear of the line), even runs
// eastbound and odd ones westbound; where each train is is worked out from the clock every frame
const _tro=new THREE.Object3D(),_trc=new THREE.Color(),_trv=new THREE.Vector3(),_trl=new THREE.Object3D();
function trainTick(dt){const M=trnMeshes(),cnt={};for(const k of TRN_TYPES)cnt[k]=0;
  // the models follow the Machine models setting
  if(mdl.want)trnModels();const want=!!(mdl.want&&trn.glb);
  if(trn.glbOn!==want){trn.glbOn=want;for(const t of TRN_TYPES){const im=M[t],G=want&&trn.glb[t];[im.geometry,im.material]=G||im.userData.box}}
  trnHazeU.value=clamp(0.42+0.7*(1-scene.fog.far/(760*gfxFog)),0.2,0.97);
  const v=TU.trSpeed,P=Math.max(TU.trEvery,(trn.L+TRN_LMAX)/v+20),t=Date.now()/1000,K=Math.floor(t/P),night=1-dayKU.value;let nl=0;
  for(const k of trn.runs.keys())if(k<K-1)trn.runs.delete(k);
  for(let k=K-1;k<=K;k++){let R=trn.runs.get(k);if(!R){R={C:trnConsist(k),h:0};trn.runs.set(k,R)}
    const C=R.C,front=(t-k*P)*v*C.vk,dir=k&1;if(front-C.len>trn.L)continue;const sOf=d=>dir?trn.L-d:d;
    // the horn: leaving the tunnel, and a quarter mile before the next
    const out=(dir?trn.L-trn.S[trn.pe]:trn.S[trn.pw])+30,inn=(dir?trn.L-trn.S[trn.pw]:trn.S[trn.pe])-400;
    if(R.h===0&&front>out){R.h=1;if(front<out+60)trainHorn(trnAt(sOf(front)))}
    if(R.h===1&&front>inn){R.h=2;if(front<inn+60)trainHorn(trnAt(sOf(front)))}
    C.cars.forEach((c,ci)=>{const d=front-c.o,hl=TRN_LEN[c.t]/2;if(d<0||d>trn.L)return;const im=M[c.t];if(cnt[c.t]>=im.userData.cap)return;
      const f=trnAt(sOf(d+hl-2.6)),b=trnAt(sOf(d-hl+2.6));_tro.position.set((f[0]+b[0])/2,TRN_RAIL,(f[2]+b[2])/2);_tro.lookAt(f[0],TRN_RAIL,f[2]);_tro.updateMatrix();
      const i=cnt[c.t]++;im.setMatrixAt(i,_tro.matrix);im.setColorAt(i,_trc.setRGB(c.lc[0],c.lc[1],c.lc[2]));
      if(ci===0&&night>0.05&&TRN_LAMPS[c.t])for(const q of TRN_LAMPS[c.t]){if(nl>=12)break;_trv.set(q[0],q[1],q[2]).applyMatrix4(_tro.matrix);_trl.position.copy(_trv);
        _trl.rotation.set(0,Math.atan2(f[0]-b[0],f[2]-b[2]),0);_trl.updateMatrix();trn.lamp.setMatrixAt(nl++,_trl.matrix)}})}
  for(const k of TRN_TYPES){const im=M[k];im.count=cnt[k];im.visible=cnt[k]>0;if(cnt[k]){im.instanceMatrix.needsUpdate=true;im.instanceColor.needsUpdate=true}}
  trn.lamp.count=nl;trn.lamp.visible=nl>0;if(nl){trn.lamp.instanceMatrix.needsUpdate=true;trn.lamp.material.color.setHex(0xfff2d8).multiplyScalar(0.4+2*night)}}

// a diesel's five-chime horn (Cruise Brandon's chord), two long blasts, heard late and dull from across the lake
function trainHorn(p){if(typeof snd==='undefined'||!snd||!snd.ready||!sndCfg.on||!actx)return;
  const cx=camera.position.x,cz=camera.position.z,dx=p[0]-cx,dz=p[2]-cz,d=Math.hypot(dx,dz)||1,t0=actx.currentTime+0.05+d/343;
  const k=sndVol(sndCfg.fx)*0.35*Math.min(1,400/d);if(k<0.005)return;
  const f=camera.getWorldDirection(_trv),pan=actx.createStereoPanner?actx.createStereoPanner():null,g=sndGain(0,snd.dry),lp=sndFilter('lowpass',Math.max(450,2400-d*1.3),0.6);
  if(pan){pan.pan.value=clamp((dx*-f.z+dz*f.x)/d,-1,1)*0.7;lp.connect(pan);pan.connect(g)}else lp.connect(g);
  for(const [a,b] of [[0,1.7],[2.2,4.3]]){g.gain.setTargetAtTime(k,t0+a,0.06);g.gain.setTargetAtTime(0,t0+b,0.12)}
  for(const fr of [311.1,370,415.3,493.9,622.3]){const o=actx.createOscillator(),og=sndGain(0.2,lp);o.type='sawtooth';o.frequency.value=fr;o.connect(og);o.start(t0);o.stop(t0+5.2)}}
