// Corley's Island: the pickups' beds and the trip to town. Both pickups (heavy.js, car 'pk': Dexter's and Corley's)
// carry a load in the bed: bags of mulch, toolboxes and bags of groceries, bought at the Lakeside General Store at the
// south end of Main Street on the mainland (SHOP, mainland.js), over the bridges and the trestle. On foot, [carry] does
// what is at hand: at the store it takes one of what is stocked there (or puts it back); at a pickup's bed it loads what
// you carry, or takes out the top thing; anywhere else it sets what you carry down (a bag of mulch on Corley's island is
// emptied instead: Wood mulch paint, laid with the map editor's brush, so it saves and syncs with the map) or picks a
// thing up off the ground. What rides in the bed slides when the pickup brakes, turns hard or leans (it grips with
// TU.bedGrip of its weight), and what is stacked above the rails can slide over them and fall out. The beds, what lies
// on the ground, what you carry, the store's stock and what you have bought save with the rigs (save.js: pbSave, pbLoad).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// each kind: what it is called, its size (w across the bed, d along it, h tall, in metres), how many the store holds
const PB_KINDS={mulch:{n:'bag of mulch',s:'mulch',w:0.6,d:0.42,h:0.13,max:30,c:'m'},tools:{n:'toolbox',s:'toolbox',w:0.52,d:0.24,h:0.27,max:6,c:'t'},
  groc:{n:'bag of groceries',s:'groceries',w:0.3,d:0.19,h:0.4,max:12,c:'g'}};
const PB_K=Object.keys(PB_KINDS),PB_CODE={m:'mulch',t:'tools',g:'groc'},PB_MULCH=MAT_LIST.findIndex(m=>m.id==='mulch')+1,PB_LOOSE=40;
// the bed in the pickup's frame: 2 by 4 cells between the wheel wells (x across, z along, front row first), loaded up to
// PB_TOP above the floor; whatever sits PB_RAIL or more above the floor is up over the rails and can slide out
const PB_CX=[-0.33,0.33],PB_CZ=[-1.14,-1.62,-2.1,-2.58],PB_CW=0.66,PB_CD=0.48,PB_TOP=0.62,PB_RAIL=0.34;
const pbS={hold:null,holdM:null,loose:[],stock:{mulch:30,tools:6,groc:12},bought:{mulch:0,tools:0,groc:0},spread:0,rt:0,hint:false,btnT:0,looseT:0};
const pbV=new THREE.Vector3();

// ---------- how the things look: printed poly bags, red steel toolboxes, kraft paper grocery sacks ----------
function pbCanvas(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c);t.anisotropy=4;t.colorSpace=THREE.SRGBColorSpace;return t}
function pbStd(c,rough,metal,o){const m=new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:rough,metalness:metal||0,envMap:skyEnv,envMapIntensity:0.8},o||{}));
  if(typeof wetPatch==='function')wetPatch(m);return m}
const PB_PARTS=(function(){
  // a 2 cu ft bag of hardwood mulch: printed poly film, plump in the middle, flat at the heat-sealed ends
  const bagT=pbCanvas(512,256,(g,w,h)=>{g.fillStyle='#2a1f17';g.fillRect(0,0,w,h);
    for(let i=0;i<900;i++){const v=40+Math.random()*70|0;g.fillStyle=`rgb(${v+30},${v},${v*0.6|0})`;g.fillRect(40+Math.random()*(w-40),h*0.68+Math.random()*h*0.3,3+Math.random()*9,2+Math.random()*4)}
    g.fillStyle='#2f5d2a';g.fillRect(40,0,w-40,h*0.3);g.fillStyle='#f1ead8';g.textAlign='center';g.textBaseline='middle';
    g.font='700 30px "Barlow Condensed","Arial Narrow",Arial,sans-serif';g.fillText('PREMIUM  HARDWOOD',w/2+20,h*0.15);
    g.font='800 96px "Barlow Condensed","Arial Narrow",Arial,sans-serif';g.fillText('MULCH',w/2+20,h*0.47);
    g.fillStyle='#e0a83a';g.font='700 26px "Barlow Condensed","Arial Narrow",Arial,sans-serif';g.fillText('NATURAL BROWN  ·  2 CU FT',w/2+20,h*0.64)});
  const bag=new THREE.BoxGeometry(0.6,0.13,0.42,12,3,8),p=bag.attributes.position,nr=bag.attributes.normal,uv=bag.attributes.uv;
  for(let i=0;i<p.count;i++){const x=p.getX(i)/0.3,z=p.getZ(i)/0.21,y=p.getY(i);
    p.setY(i,y*(1-0.85*Math.pow(Math.abs(x),6))*(1-0.3*Math.pow(Math.abs(z),4))+0.065);if(Math.abs(nr.getY(i))<0.5)uv.setX(i,0.01+0.05*uv.getX(i))}
  bag.computeVertexNormals();
  const bagM=pbStd(0xffffff,0.36,0,{map:bagT,envMapIntensity:1});
  // a steel toolbox: red body and lid, black handle on its posts, bright latches
  const tb=[],tk=[],add=(L,g,x,y,z)=>{g.translate(x,y,z);L.push(g)};
  add(tb,new THREE.BoxGeometry(0.52,0.18,0.24),0,0.09,0);add(tb,new THREE.BoxGeometry(0.53,0.06,0.25),0,0.21,0);
  add(tk,new THREE.BoxGeometry(0.3,0.025,0.035),0,0.265,0);for(const s of [-1,1]){add(tk,new THREE.BoxGeometry(0.025,0.03,0.03),s*0.14,0.25,0);add(tk,new THREE.BoxGeometry(0.04,0.05,0.01),s*0.18,0.18,0.125)}
  // a kraft paper sack, open at the top, with the market's print, and the shopping showing over its rim
  const kraft=pbCanvas(256,256,(g,w,h)=>{g.fillStyle='#b98c58';g.fillRect(0,0,w,h);
    for(let i=0;i<500;i++){g.strokeStyle=`rgba(${Math.random()<0.5?'90,60,30':'230,200,160'},0.15)`;g.beginPath();const x=Math.random()*w,y=Math.random()*h;g.moveTo(x,y);g.lineTo(x+Math.random()*30-15,y+Math.random()*4-2);g.stroke()}
    g.fillStyle='#24462e';g.beginPath();g.arc(148,104,44,0,7);g.fill();g.fillStyle='#b98c58';g.font='800 46px "Barlow Condensed","Arial Narrow",Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('L',148,106);
    g.fillStyle='#24462e';g.font='700 30px "Barlow Condensed","Arial Narrow",Arial,sans-serif';g.fillText('LAKESIDE',148,178);g.font='600 22px "Barlow Condensed","Arial Narrow",Arial,sans-serif';g.fillText('MARKET',148,206)});
  let sack=new THREE.BoxGeometry(0.3,0.33,0.19,2,3,2).toNonIndexed();{const P=sack.attributes.position,N=sack.attributes.normal,U=sack.attributes.uv,keep=[];
    for(let i=0;i<P.count;i+=3)if(N.getY(i)<0.5)keep.push(i);const g=new THREE.BufferGeometry();
    for(const [k,A] of [['position',P],['normal',N],['uv',U]]){const s=A.itemSize,a=new Float32Array(keep.length*3*s);keep.forEach((i,o)=>{for(let q=0;q<3*s;q++)a[o*3*s+q]=A.array[i*s+q]});g.setAttribute(k,new THREE.BufferAttribute(a,s))}
    const P2=g.attributes.position,N2=g.attributes.normal,U2=g.attributes.uv;for(let i=0;i<P2.count;i++){if(Math.abs(N2.getX(i))>0.5)U2.setX(i,0.02+0.12*U2.getX(i));else U2.setX(i,0.16+0.84*U2.getX(i));P2.setY(i,P2.getY(i)+0.165)}
    sack=g}
  const sackM=pbStd(0xffffff,0.85,0,{map:kraft,side:THREE.DoubleSide});
  const fk=famKit();fk.cyl(0.035,0.032,0.42,10,0xc98a45,0.07,0.36,0.02,0,0.25,0.3);fk.geo(new THREE.IcosahedronGeometry(0.07,1),0x5c8f3a,-0.06,0.33,0);
  fk.geo(new THREE.SphereGeometry(0.045,12,8),0xa8231c,-0.09,0.31,0.05);fk.geo(new THREE.SphereGeometry(0.042,12,8),0xe08a1e,0.0,0.31,-0.045);fk.box(0.08,0.14,0.08,0xf0efe8,0.09,0.28,-0.04);
  const shop=famMerge(fk.solid);
  const merge=L=>{L=L.map(q=>q.toNonIndexed());const g=new THREE.BufferGeometry(),P=new Float32Array(L.reduce((a,q)=>a+q.attributes.position.array.length,0));let o=0;
    for(const q of L){const a=q.attributes.position.array;P.set(a,o);o+=a.length}g.setAttribute('position',new THREE.BufferAttribute(P,3));g.computeVertexNormals();return g};
  return {mulch:[[bag,bagM]],tools:[[merge(tb),pbStd(0xb3241c,0.32,0.35)],[merge(tk),pbStd(0x9aa0a4,0.3,0.9)]],
    groc:[[sack,sackM],[shop,pbStd(0xffffff,0.55,0,{vertexColors:true})]]}})();
// one of a kind, its bottom at its origin, long side along x
function pbMesh(k){const g=new THREE.Group();for(const [geo,mat] of PB_PARTS[k]){const m=new THREE.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;m.layers.enable(RAIN_LAYER);g.add(m)}return g}

// ---------- the store's stock: a pallet stack of bags, toolboxes on the shelf, sacks on the stand ----------
// slot i of a kind (the last one taken first: the top of a stack): x, y, z and its turn
function pbSlot(k,i){const [sx,sz]=SHOP.st[k],j=(i*7919%13)/13-0.5;
  if(k==='mulch'){const px=sx+(i&1?1.3:-1.3),q=(i>>1)&3,l=i>>3,x=px+(q&1?0.3:-0.3),z=sz+(q&2?0.22:-0.22);return [x,baseHeight(px,sz)+0.215+l*0.13,z,j*0.08]}
  if(k==='tools'){const y=baseHeight(sx,sz)+0.12+[0.135,0.635,1.135][i>>1];return [sx+(i&1?0.45:-0.45),y,sz-0.02,j*0.1]}
  return [sx-0.8+(i%6)*0.32,baseHeight(sx,sz)+0.945,sz+(i<6?-0.18:0.18),j*0.3]}
const pbShelf={};
(function(){const O=new THREE.Object3D();for(const k of PB_K){pbShelf[k]=PB_PARTS[k].map(([geo,mat])=>{const im=new THREE.InstancedMesh(geo,mat,PB_KINDS[k].max);
    for(let i=0;i<PB_KINDS[k].max;i++){const [x,y,z,r]=pbSlot(k,i);O.position.set(x,y,z);O.rotation.set(0,r,0);O.updateMatrix();im.setMatrixAt(i,O.matrix)}
    im.castShadow=im.receiveShadow=true;im.layers.enable(RAIN_LAYER);scene.add(im);return im})}})();
function pbStockDraw(){for(const k of PB_K)for(const im of pbShelf[k])im.count=Math.max(0,Math.min(PB_KINDS[k].max,pbS.stock[k]))}
pbStockDraw();

// ---------- the beds ----------
function pbBedOf(h){if(!h.pb){const g=new THREE.Group();h.g.add(g);h.pb={g,it:[],fl:0,pv:0}}return h.pb}
// the bed floor's height: the detailed model's liner sits a little lower than the kit-built one's
const pbFloor=h=>h.mdl&&mdl.hvOn?1.015:1.075;
function pbCellTop(b,c){let t=0;for(const i of b.it)if(i.c===c)t=Math.max(t,i.y+PB_KINDS[i.k].h);return t}
// the cell a k goes in: the lowest stack it still fits on, front ones first; -1 when the bed is full
function pbFits(b,k){if(b.it.length>=TU.bedMax)return -1;let best=-1,bt=9;
  for(let c=0;c<8;c++){const t=pbCellTop(b,c);if(t+PB_KINDS[k].h<=PB_TOP+1e-3&&t<bt-1e-3){bt=t;best=c}}return best}
function pbAdd(h,k,m){const b=pbBedOf(h),c=pbFits(b,k);if(c<0)return false;m=m||pbMesh(k);if(m.parent)m.parent.remove(m);m.rotation.set(0,0,0);b.g.add(m);
  b.it.push({k,c,y:pbCellTop(b,c),m,ox:0,oz:0,vx:0,vz:0,ry:(Math.random()-0.5)*0.1});pbPose(h);return true}
function pbRestack(b){const top=new Array(8).fill(0);for(const i of b.it){i.y=top[i.c];top[i.c]+=PB_KINDS[i.k].h}}
function pbPose(h){const b=h.pb;if(!b)return;const f=b.fl=pbFloor(h);for(const i of b.it){i.m.position.set(PB_CX[i.c&1]+i.ox,f+i.y,PB_CZ[i.c>>1]+i.oz);i.m.rotation.y=i.ry}}
// what rides in the bed feels the pickup's braking and turning and the slope it is on; past what it grips with
// (TU.bedGrip of its weight) it slides, a few inches in its place, or over the rails from up on top
function pbSlide(h,dt){const b=h.pb;if(!b)return;if(!b.it.length){b.pv=h.v;return}
  const a=clamp((h.v-b.pv)/Math.max(dt,1e-3),-15,15);b.pv=h.v;if(b.fl!==pbFloor(h))pbPose(h);
  const g=9.8,fx=-h.v*h.w-g*Math.sin(h.roll),fz=-a+g*Math.sin(h.pitch),fm=Math.hypot(fx,fz),mu=TU.bedGrip*g;let moved=false,lost=null;
  for(const i of b.it){const sp=Math.hypot(i.vx,i.vz);if(sp<1e-3&&fm<=mu)continue;
    let ax=fx,az=fz;if(sp>1e-3){ax-=mu*i.vx/sp;az-=mu*i.vz/sp}else{ax-=mu*fx/fm;az-=mu*fz/fm}
    const nvx=i.vx+ax*dt,nvz=i.vz+az*dt;if(sp>1e-3&&nvx*i.vx+nvz*i.vz<=0&&fm<=mu){i.vx=i.vz=0;continue}
    i.vx=nvx;i.vz=nvz;i.ox+=i.vx*dt;i.oz+=i.vz*dt;
    const K=PB_KINDS[i.k],cx=PB_CX[i.c&1],cz=PB_CZ[i.c>>1],high=i.y>=PB_RAIL-1e-3,lx=Math.max(0.01,(PB_CW-K.w)/2),lz=Math.max(0.01,(PB_CD-K.d)/2);
    let x0=-lx,x1=lx,z0=-lz;if(high){if(cx>0)x1=1.3;else x0=-1.3;if((i.c>>1)===3)z0=-0.8}
    if(i.ox<x0){i.ox=x0;i.vx=0}if(i.ox>x1){i.ox=x1;i.vx=0}if(i.oz<z0){i.oz=z0;i.vz=0}if(i.oz>lz){i.oz=lz;i.vz=0}moved=true;
    if(high&&(Math.abs(cx+i.ox)>0.97||cz+i.oz<-2.95))lost=i}
  if(lost)pbFallOut(h,lost);else if(moved)pbPose(h)}
// over the side or the tailgate: it lands beside the pickup, or in the lake off a bridge
function pbFallOut(h,i){const b=h.pb,K=PB_KINDS[i.k],x=PB_CX[i.c&1]+i.ox,z=PB_CZ[i.c>>1]+i.oz;b.it.splice(b.it.indexOf(i),1);pbRestack(b);pbPose(h);
  h.g.localToWorld(pbV.set(Math.abs(x)>0.97?x+Math.sign(x)*0.5:x,0,z<-2.95?z-0.6:z));
  if(landIn(pbV.x,pbV.z,0,0,true)){pbDrop(i.k,pbV.x,pbV.z,h.yaw+i.ry+1,i.m);toast(say('bedLost',{item:K.n}),'bad',2800)}
  else{b.g.remove(i.m);toast(say('bedLostLake',{item:K.n}),'bad',2800)}}
// the pickup whose bed the worker stands at (beside it or behind the tailgate, within TU.bedReach), or null
function pbNearBed(){let best=null,bd=9;
  for(const h of hvs){if(h.K.car!=='pk'||Math.abs(wk.y-h.y)>1.6)continue;const dx=wk.x-h.x,dz=wk.z-h.z,c=Math.cos(h.yaw),s=Math.sin(h.yaw),lx=dx*c-dz*s,lz=dx*s+dz*c,r=TU.bedReach;
    if(Math.abs(lx)<=1.0+r&&lz<=-0.6&&lz>=-2.95-r){const d=Math.hypot(lx,lz+1.9);if(d<bd){bd=d;best=h}}}
  return best}

// ---------- carrying, setting down, spreading ----------
function pbHold(k,m){if(pbS.holdM&&pbS.holdM!==m)pbS.holdM.parent&&pbS.holdM.parent.remove(pbS.holdM);pbS.hold=k||null;pbS.holdM=null;if(!k)return;
  m=m||pbMesh(k);if(m.parent)m.parent.remove(m);walker.add(m);m.position.set(0,k==='groc'?0.72:0.84,0.36);m.rotation.set(0,0,0);pbS.holdM=m}
function pbDrop(k,x,z,yaw,m){m=m||pbMesh(k);if(m.parent)m.parent.remove(m);scene.add(m);m.position.set(x,surfAt(x,z),z);m.rotation.set(0,yaw,0);
  pbS.loose.push({k,x,z,yaw,m});if(pbS.loose.length>PB_LOOSE){const o=pbS.loose.shift();scene.remove(o.m)}}
// where a bag of mulch can be emptied: the map's paint grid (Corley's island and its banks), on land, off the decks
function pbPaintable(x,z){const r=TU.mulchW/2+1;return x-r>ED_X0+2&&x+r<ED_X0+(ED_NX-3)*ED_C&&z-r>ED_Z0+2&&z+r<ED_Z0+(ED_NZ-3)*ED_C&&deckAt(x,z)<-1e8&&baseHeight(x,z)>WATER+0.3&&landIn(x,z,0,0,true)}
// a soft round of Wood mulch paint, TU.mulchW across, through the editor's own brush (undo, save and sync come with it)
function pbSpread(x,z){const keep={};for(const k of ['tool','mat','size','soft','square','keep','feather','str','bx','bz','flatH','stroke0'])keep[k]=ed[k];
  Object.assign(ed,{tool:'paint',mat:PB_MULCH,size:TU.mulchW/2,soft:true,square:false,keep:false,feather:0.45,str:5});
  try{edStrokeStart(x,z);edBrush(0.05);edStrokeEnd()}finally{Object.assign(ed,keep)}}
// what [carry] does here: {a: the action, and what it acts on}, or null
function pbCtx(){if(mode!=='walk'||wk.inside)return null;const H=pbS.hold;let st=null,sd=2.2;
  for(const k of PB_K){const [x,z]=SHOP.st[k],d=Math.hypot(wk.x-x,wk.z-z);if(d<sd&&Math.abs(wk.y-baseHeight(x,z))<1.6){sd=d;st=k}}
  const bh=pbNearBed();
  if(H){if(bh)return {a:'load',h:bh};if(st===H)return {a:'back'};const x=wk.x+Math.sin(wk.yaw)*1.0,z=wk.z+Math.cos(wk.yaw)*1.0;
    return H==='mulch'&&pbPaintable(x,z)?{a:'spread',x,z}:{a:'down'}}
  if(st)return {a:pbS.stock[st]>0?'buy':'out',k:st};
  if(gunShopNear())return {a:'guns'};
  if(bh&&bh.pb&&bh.pb.it.length)return {a:'unload',h:bh};
  let j=-1,ld=1.4;pbS.loose.forEach((o,q)=>{const d=Math.hypot(wk.x-o.x,wk.z-o.z);if(d<ld&&Math.abs(wk.y-o.m.position.y)<1.6){ld=d;j=q}});
  return j>=0?{a:'up',j}:null}
const PB_BTN={load:'Load',unload:'Unload',back:'Put back',spread:'Spread',down:'Set down',up:'Pick up',out:'Sold out',guns:'Gun counter'};
function pbAct(){const c=pbCtx(),H=pbS.hold,K=H&&PB_KINDS[H];pbS.btnT=0;
  if(!c){toast(say(mode!=='walk'||wk.inside?'pbWalk':'pbNothing'),'',2600);return}
  if(c.a==='guns'){gunShopOpen();return}
  if(c.a==='buy'){pbS.stock[c.k]--;pbS.bought[c.k]++;pbStockDraw();pbHold(c.k);toast(say('shopTake',{item:PB_KINDS[c.k].n,n:pbS.bought[c.k]}),'',3200)}
  else if(c.a==='out')toast(say('shopOut',{items:PB_KINDS[c.k].s,min:+(TU.shopRestock/60).toFixed(1)}),'',2600);
  else if(c.a==='back'){pbS.stock[H]=Math.min(K.max,pbS.stock[H]+1);pbS.bought[H]=Math.max(0,pbS.bought[H]-1);pbHold(null);pbStockDraw();toast(say('shopBack',{item:K.n}),'',2000)}
  else if(c.a==='load'||c.a==='unload'){if(Math.abs(c.h.v)>0.5){toast(say('bedMoving'),'',2000);return}
    if(c.a==='load'){const m=pbS.holdM;if(!pbAdd(c.h,H,m)){toast(say('bedFull'),'',2400);return}pbS.holdM=null;pbHold(null);toast(say('bedLoad',{item:K.n,n:c.h.pb.it.length}),'',2200)}
    else{const b=c.h.pb,i=b.it.pop();pbHold(i.k,i.m);toast(say('bedUnload',{item:PB_KINDS[i.k].n,n:b.it.length}),'',2600)}}
  else if(c.a==='spread'){pbSpread(c.x,c.z);pbHold(null);pbS.spread++;toast(say('mulchSpread',{ft:Math.round(TU.mulchW/FT),n:pbS.spread}),'',2600)}
  else if(c.a==='down'){const m=pbS.holdM;pbS.holdM=null;pbHold(null);pbDrop(H,wk.x+Math.sin(wk.yaw)*0.75,wk.z+Math.cos(wk.yaw)*0.75,wk.yaw,m);toast(say(H==='mulch'?'mulchNoPaint':'itemDown',{item:K.n}),'',2600)}
  else if(c.a==='up'){const o=pbS.loose.splice(c.j,1)[0];pbHold(o.k,o.m);toast(say('itemUp',{item:PB_KINDS[o.k].n}),'',1800)}}
$('#bedBtn').addEventListener('pointerdown',e=>{e.preventDefault();pbAct()});

// every frame, after the machines have moved: the loads ride and slide, the store restocks, the worker carries, and the
// Carry button says what it will do (a few times a second)
function pbTick(dt){for(const h of hvs)if(h.pb)pbSlide(h,dt);
  pbS.rt+=dt;if(pbS.rt>=TU.shopRestock){pbS.rt=0;let ch=false;for(const k of PB_K)if(pbS.stock[k]<PB_KINDS[k].max){pbS.stock[k]++;ch=true}if(ch)pbStockDraw()}
  if(!SHOP.loaded&&(Math.hypot(camera.position.x-SHOP.x,camera.position.z-SHOP.z)<320||Math.hypot(camera.position.x-95,camera.position.z-530)<320))shopLoad();
  if(pbS.hold&&mode==='walk'&&!wk.inside)for(let s=0;s<2;s++){wkArms[s].top.rotation.x=-0.75;wkArms[s].low.rotation.x=-0.85}
  if((pbS.looseT-=dt)<0){pbS.looseT=1;for(const o of pbS.loose)o.m.position.y=surfAt(o.x,o.z)}
  if((pbS.btnT-=dt)>0)return;pbS.btnT=0.15;const c=pbCtx(),b=$('#bedBtn'),t=c?(c.a==='buy'?'Take '+PB_KINDS[c.k].s:PB_BTN[c.a]):'';
  if(b.hidden===!!c)b.hidden=!c;if(c&&b.textContent!==t)b.textContent=t;
  if(!pbS.hint&&mode==='walk'&&!wk.inside&&!pbS.hold&&pbNearBed()){pbS.hint=true;toast(say('pbHint'),'tip',6000)}}

// ---------- saved with the rigs (save.js) ----------
function pbSave(){return {b:hvs.map(h=>h.pb?h.pb.it.map(i=>PB_KINDS[i.k].c).join(''):''),l:pbS.loose.map(o=>[PB_KINDS[o.k].c,+o.x.toFixed(2),+o.z.toFixed(2),+o.yaw.toFixed(2)]),
  h:pbS.hold?PB_KINDS[pbS.hold].c:'',s:PB_K.map(k=>pbS.stock[k]),by:PB_K.map(k=>pbS.bought[k]),sp:pbS.spread,rt:Math.round(pbS.rt)}}
function pbLoad(d){if(!d||typeof d!=='object')return;
  if(Array.isArray(d.b))d.b.forEach((s,i)=>{const h=hvs[i];if(!h||h.K.car!=='pk'||typeof s!=='string')return;for(const ch of s.slice(0,40))if(PB_CODE[ch])pbAdd(h,PB_CODE[ch])});
  if(Array.isArray(d.l))for(const o of d.l.slice(-PB_LOOSE))if(Array.isArray(o)&&PB_CODE[o[0]]&&[o[1],o[2],o[3]].every(isFinite))pbDrop(PB_CODE[o[0]],o[1],o[2],o[3]);
  if(PB_CODE[d.h])pbHold(PB_CODE[d.h]);
  PB_K.forEach((k,i)=>{if(Array.isArray(d.s)&&isFinite(d.s[i]))pbS.stock[k]=clamp(d.s[i]|0,0,PB_KINDS[k].max);if(Array.isArray(d.by)&&isFinite(d.by[i]))pbS.bought[k]=Math.max(0,d.by[i]|0)});
  if(isFinite(d.sp))pbS.spread=Math.max(0,d.sp|0);if(isFinite(d.rt))pbS.rt=Math.max(0,+d.rt);pbStockDraw()}
// changes to any of it, for the rigs' save signature
function pbSig(){let a=pbS.spread*11+(pbS.hold?PB_K.indexOf(pbS.hold)+1:0)*3;hvs.forEach((h,i)=>{if(h.pb)a+=h.pb.it.length*(i+1)*1000});
  for(const o of pbS.loose)a+=o.x+o.z*3;PB_K.forEach((k,i)=>{a+=pbS.stock[k]*(i+2)+pbS.bought[k]*(i+5)*7});return a}
