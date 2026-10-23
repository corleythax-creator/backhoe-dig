// Corley's Island: Dexter's equipment trailer and his mini excavator (M08). A 16 ft tandem-axle tag trailer rides on the
// ball hitch behind his pickup (heavy.js) and swings in behind it as it turns; its ramps fold down when the pickup
// stops and stand up when it pulls away. The deck and the lowered ramps are ground for whatever drives up them (surfAt
// reads MOVE_DECKS, blocks.js), and what is parked on the deck rides along when the pickup tows it: drive the mini excavator
// (a 3½ ton machine with a blade, a rubber-tracked undercarriage and a canopy, Heavy mode like the dozer: the left
// stick drives, the right stick up and down works the boom, left and right the stick and bucket) up the ramps, get
// out, climb into the pickup and haul it. The four-wheeler fits on the deck too. The trailer's heading saves in the
// pickup's ty (save.js), the mini with the other heavy machines (it is made after the backhoe, so old saves keep theirs).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// the trailer, in its own frame (origin on the ground under the ball, forward +z toward the pickup): the ball TG_KP
// behind the pickup's middle, the axles TG_LT behind the ball, the deck from TG_U0 back to TG_U1, its top TG_TOP high,
// two ramps TG_RL long at ±TG_RX
const TG_KP=3.15,TG_LT=4.0,TG_U0=-0.75,TG_U1=-5.95,TG_TOP=0.58,TG_HW=1.04,TG_RL=1.65,TG_RX=0.6,TG_RW=0.24;
HV_KINDS.mini={n:'mini excavator',x:-201,z:236,yaw:Math.PI/2,C:[0.75,-0.6],R:1.0,P:[[-0.88,1.55],[0.88,1.55],[-0.88,-1.15],[0.88,-1.15]],hw:0.68,af:0.85,ab:-0.85,
  eye:[0,1.75,-0.15,0,-0.7,4.5],lamp:[0,1.9,0.3,0,-1,8],cam:0.6,col:'#f2b705',len:3.6,wid:1.7,track:true,mini:true};
// ---------- the mini excavator ----------
const mnI=(function(){const h=hvMake('mini'),Y=DEX_Y,D=DEX_D,STEEL=0x55595a,RUB=0x1d1d1f;
  // undercarriage: two rubber tracks on their frames, idlers and rollers, the blade on its arms at the front
  const b=hvKit();
  for(const sx of [-0.68,0.68]){b.box(0.3,0.34,1.9,RUB,sx,0.2,0);for(const sz of [-0.8,0.8])b.cyl(0.19,0.19,0.32,12,RUB,sx,0.2,sz,0,Math.PI/2);
    b.box(0.18,0.18,1.5,0x3a3c40,sx,0.24,0);for(const sz of [-0.8,0.8])b.cyl(0.12,0.12,0.34,10,0x8a8e92,sx,0.2,sz,0,Math.PI/2)}
  b.box(1.0,0.22,1.1,D,0,0.32,0);b.cyl(0.45,0.45,0.12,16,D,0,0.48,0);
  for(const sx of [-0.4,0.4])b.box(0.1,0.12,0.6,Y,sx,0.28,0.95,0.25);b.box(1.72,0.4,0.1,Y,0,0.24,1.32,-0.2);b.box(1.74,0.06,0.12,STEEL,0,0.05,1.36);
  hvMesh(b,h.g);
  // the house, swung on its slewing ring: frame, engine cover, counterweight, seat, controls and a four-post canopy
  const hs=new THREE.Group();hs.position.y=0.54;h.g.add(hs);h.mnHouse=hs;
  const u=hvKit();u.box(1.4,0.36,1.5,Y,0,0.2,-0.1);u.box(1.36,0.55,0.62,Y,0,0.62,-0.5);u.box(1.42,0.5,0.24,D,0,0.42,-0.86);
  u.box(0.5,0.12,0.5,0x222426,-0.1,0.48,0.12);u.box(0.5,0.6,0.12,0x222426,-0.1,0.78,-0.14,-0.15);for(const sx of [-0.42,0.22])u.box(0.14,0.3,0.32,D,sx,0.52,0.24);
  for(const sx of [-0.42,0.22])u.cyl(0.015,0.015,0.2,6,STEEL,sx,0.75,0.3);for(const sx of [-0.42,0.22])u.K.geo(new THREE.SphereGeometry(0.03,8,6),0x111111,sx,0.86,0.3);
  for(const [sx,sz] of [[-0.6,0.5],[0.42,0.5],[-0.6,-0.55],[0.42,-0.55]])u.box(0.07,1.35,0.07,D,sx,1.05,sz);u.box(1.15,0.07,1.2,D,-0.09,1.74,-0.03);
  u.box(0.3,0.06,0.04,0xfff6d8,-0.09,1.7,0.58);u.box(0.18,0.12,0.18,0xffa21a,0.3,1.84,-0.4);
  hvMesh(u,hs);
  // the boom on its swing post at the front right, the stick and the bucket with its teeth
  const bp=new THREE.Group();bp.position.set(0.42,0.38,0.62);hs.add(bp);h.mnBoom=bp;
  const q=hvKit();q.box(0.26,0.3,0.24,D,0,0,0);q.box(0.16,0.22,1.25,Y,0,0.42,0.55,-0.62);q.box(0.16,0.2,1.0,Y,0,0.82,1.48,0.38);q.cyl(0.04,0.04,0.95,8,STEEL,0,0.25,0.75,Math.PI/2-0.75);hvMesh(q,bp);
  const sp=new THREE.Group();sp.position.set(0,0.58,1.86);bp.add(sp);h.mnStick=sp;
  const w=hvKit();w.box(0.13,0.16,1.2,Y,0,0,0.5,0.2);w.cyl(0.035,0.035,0.8,8,STEEL,0,0.14,0.35,Math.PI/2+0.2);hvMesh(w,sp);
  const kp=new THREE.Group();kp.position.set(0,-0.24,1.1);sp.add(kp);h.mnBkt=kp;
  const c=hvKit();c.box(0.42,0.3,0.06,STEEL,0,-0.12,0.02);c.box(0.42,0.06,0.3,STEEL,0,-0.28,0.14);for(const sx of [-0.21,0.21])c.box(0.04,0.3,0.3,STEEL,sx,-0.12,0.14);
  for(let i=0;i<4;i++)c.box(0.05,0.04,0.1,0x3a3c40,-0.15+i*0.1,-0.3,0.33);hvMesh(c,kp);
  return hvs.indexOf(h)})();
// the boom (h.a: raise) and the stick and bucket (h.c: curl in) on the right stick
function mnWork(h,dt,arm,curl,on){if(on){h.a=clamp(h.a+arm*0.7*dt,...HV_BLIM);h.c=clamp(h.c+curl*0.9*dt,...HV_CLIM)}
  const r=h.a*1.6,f=h.c;h.mnBoom.rotation.x=-r;h.mnStick.rotation.x=0.55-r*0.35-f*0.9;h.mnBkt.rotation.x=0.4-f*1.3;hvPose(h)}
// ---------- the trailer ----------
const DK_V=new THREE.Vector3();
function tgMake(h){const K=hvKit(),D=DEX_D,STEEL=0x55595a;
  // tongue and coupler, the frame rails and cross members, the oak deck, fenders, two axles, lamps, stake pockets
  for(const sx of [-1,1])K.K.box(0.1,0.14,1.25,D,sx*0.34,0.42,-0.45,-sx*0.25);K.box(0.16,0.12,0.3,D,0,0.48,0.05);K.cyl(0.05,0.05,0.06,8,STEEL,0,0.5,0.12);
  K.box(2.1,0.3,0.08,D,0,0.73,-0.72);for(const sx of [-1,1])K.box(0.12,0.16,5.25,D,sx*0.98,0.42,-3.35);for(let i=0;i<7;i++)K.box(2.0,0.1,0.08,D,0,0.42,-1.15-i*0.78);
  K.box(2.08,0.06,5.2,0x8a6040,0,0.55,-3.35);for(let i=0;i<10;i++)K.box(0.012,0.004,5.2,0x5e3f26,-0.94+i*0.208,0.582,-3.35);
  for(const sx of [-1,1]){K.box(0.3,0.04,1.55,D,sx*1.02,0.86,-4.0);K.box(0.3,0.3,0.04,D,sx*1.02,0.72,-3.22);K.box(0.3,0.3,0.04,D,sx*1.02,0.72,-4.78);
    for(const sz of [-3.62,-4.38]){K.cyl(0.36,0.36,0.22,12,0x1d1d1f,sx*1.02,0.36,sz,0,Math.PI/2);K.cyl(0.2,0.2,0.24,8,0xb8bcc0,sx*1.02,0.36,sz,0,Math.PI/2)}
    K.box(0.12,0.08,0.04,0xb3262c,sx*0.9,0.45,-5.98);for(const sz of [-1.6,-2.6,-5.4])K.box(0.06,0.08,0.06,D,sx*1.05,0.55,sz)}
  K.box(2.06,0.14,0.08,D,0,0.5,-5.95);
  const t=new THREE.Group();scene.add(t);hvMesh(K,t);
  // the ramps, hinged at the back of the deck
  const ramps=[];for(const sx of [-1,1]){const r=new THREE.Group();r.position.set(sx*TG_RX,TG_TOP,TG_U1);t.add(r);const q=hvKit();
    q.box(TG_RW*2,0.05,TG_RL,0x6c7378,0,-0.03,-TG_RL/2);for(let i=0;i<8;i++)q.box(TG_RW*2,0.03,0.03,0x8a9096,0,0.0,-0.1-i*0.2);hvMesh(q,r);ramps.push(r)}
  const d={x:0,z:0,y:0,s:0,c:1,sp:0,cp:1,r2:49,u0:TG_U0,u1:TG_U1,top:TG_TOP,hw:TG_HW,rl:TG_RL,rx:TG_RX,rw:TG_RW,ramp:1};MOVE_DECKS.push(d);
  h.tag={g:t,ramps,d,ramp:1,still:1,circ:[]};tgPose(h)}
// the trailer on the ball (heading h.ty), its pitch from the ground under its axles, and the deck as MOVE_DECKS has it
function tgPose(h){const T=h.tag,d=T.d;h.g.localToWorld(DK_V.set(0,0.5,-TG_KP));const s=Math.sin(h.ty),c=Math.cos(h.ty);
  const yK=DK_V.y-0.5,yA=hAt(DK_V.x-s*TG_LT,DK_V.z-c*TG_LT),p=-Math.atan2(yK-yA,TG_LT);
  T.g.position.set(DK_V.x,yK,DK_V.z);T.g.rotation.set(p,h.ty,0,'YXZ');
  const a=Math.asin(Math.min(1,(TG_TOP+0.02)/TG_RL)),th=-a+(Math.PI/2+a)*(1-T.ramp);for(const r of T.ramps)r.rotation.x=th;
  Object.assign(d,{x:DK_V.x,z:DK_V.z,y:yK,s,c,sp:Math.sin(p),cp:Math.cos(p),ramp:T.ramp});
  // the stone guard at the front of the deck stops what drives up it (hvPose adds these to the pickup's circles)
  T.circ.length=0;for(const v of [-0.55,0.55])T.circ.push([DK_V.x+v*c+(TG_U0+0.05)*s,DK_V.z-v*s+(TG_U0+0.05)*c,0.42])}
// every frame after the pickup moves: the trailer swings in behind, the ramps go up or down, and what is parked on the
// deck moves with it
function tgTick(h,dt){const T=h.tag,d=T.d,ox=d.x,oz=d.z,oty=h.ty,oy=d.y;
  const v=h.v||0;h.ty+=v/TG_LT*Math.sin((h.mv===undefined?h.yaw:h.mv)-h.ty)*dt;const f=Math.atan2(Math.sin(h.yaw-h.ty),Math.cos(h.yaw-h.ty));if(Math.abs(f)>1.4)h.ty=h.yaw-Math.sign(f)*1.4;
  if(!T.told&&mode==='heavy'&&hvCur()===h&&wk.inside){T.told=true;toast(say('trailerTip'),'',5200)}
  T.still=Math.abs(v)<0.15?T.still+dt:0;T.ramp=clamp(T.ramp+(T.still>0.8?dt*0.9:T.still>0?0:-dt*1.35),0,1);
  tgPose(h);
  const dy=h.ty-oty;if(Math.abs(d.x-ox)+Math.abs(d.z-oz)+Math.abs(dy)<1e-6)return;
  const os=Math.sin(oty),oc=Math.cos(oty),ns=Math.sin(h.ty),nc=Math.cos(h.ty);
  for(const o of hvs){if(o===h||o.K.trail||o.tag)continue;const ex=o.x-ox,ez=o.z-oz,u=ex*os+ez*oc,w=ex*oc-ez*os;
    if(u>TG_U0+0.3||u<TG_U1-0.3||Math.abs(w)>TG_HW+0.3||o.y<oy+TG_TOP*0.6)continue;
    o.x=d.x+w*nc+u*ns;o.z=d.z-w*ns+u*nc;o.yaw+=dy;if(o.mv!==undefined)o.mv+=dy;if(o.ty!==undefined&&!o.tag)o.ty+=dy;hvPose(o)}}
// on Dexter's pickup (not Corley's)
for(const h of hvs)if(h.k==='pickup'&&h.home.island!=='corley'){tgMake(h);break}
WK_RIDES['hv'+mnI]={o:hvs[mnI],c:hvs[mnI].K.C,r:hvs[mnI].K.R,m:'heavy',n:hvs[mnI].K.n,pick(){hvI=mnI}};hvReset(hvs[mnI]);
