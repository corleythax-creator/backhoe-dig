// Corley's Island: the bar's life. Harbor Light Brewing Co. (its Daylight design, forgetown.js, on High and Ultra):
// string lights over the rooftop bar and the porch, lit with the town's lamps (their bulbs glow as the building's own
// fixtures do, and a few of them give real light: K.lights); a band on the roof some nights (TU.barBand nights a week,
// Friday and Saturday first, seven till ten: two townsfolk on stools in the back corner with guitars), heard down the
// promenade; and the sound of the room, a murmur that grows with the people in it and the clink of a glass. The music
// and the murmur are made here by the game (plucked strings and voices worked out in a few frames the first time you
// come near), so there are no sound files to load.
// At any brewery's bar: a beer or a soft drink bought at the counter (town.js, the menu's 'd' and 'c') is a glass in
// your hand. He sips it by himself now and then, and Use ([enter]) takes a sip; walk up to a free chair or stool and Use sits you down (the glass stands on
// the table before you between sips); Use with an empty hand, or walking off, stands you up. A few beers sway the view
// for a while (TU.barBuzz, barBuzzTime).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const BAR_ID='harbor_brewery';
const bar={L:null,g:null,R:null,band:[null,null],bsp:[],seat:null,me:{me:1},drink:null,sipT:-1,buzz:0,buzzTold:0,t1:0,glass:null,gtr:[],v:new THREE.Vector3(),
  snd:null,job:null,crowdBuf:null,songs:[],song:0,songEnd:0,nextT:0,clinkT:5,told:0};
// ---------- the lights, and the band's corner ----------
function barMat(c,r,m){return new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m||0,envMap:skyEnv,envMapIntensity:0.5})}
function barSetup(L){const B=L.b,it=bf.lib[L.id],K=B.K,lv=it.levels&&it.levels[1];if(!lv||!Array.isArray(it.walls))return;
  const g=new THREE.Group();g.name='barlife';B.g.add(g);bar.g=g;bar.L=L;bar.R=B.gameR;
  const W=it.walls.filter(w=>w[5]===1),xs=W.flatMap(w=>[w[0],w[2]]),zs=W.flatMap(w=>[w[1],w[3]]);if(!W.length)return;
  const x0=Math.min(...xs)+0.25,x1=Math.max(...xs)-0.25,z0=Math.min(...zs)+0.25,z1=Math.max(...zs)-0.25,fy=lv.floorY,top=fy+3.55;
  const poles=[],runs=[],pole=(x,y,z,h)=>poles.push([x,y,z,h]),run=(a,b,sag)=>runs.push([a,b,sag]);
  // the roof: five poles along the front and the back, strings along both rows, down the sides and across
  {const N=5,F=[],Bk=[];for(let i=0;i<N;i++){const x=x0+(x1-x0)*i/(N-1);pole(x,fy,z1,top-fy);pole(x,fy,z0,top-fy);F.push([x,top,z1]);Bk.push([x,top,z0])}
    for(let i=0;i<N-1;i++){run(F[i],F[i+1],0.22);run(Bk[i],Bk[i+1],0.22)}for(let i=0;i<N;i++)run(F[i],Bk[i],0.42)}
  // the porch: from the front wall out to posts along the deck's edge (clear of the steps), and along the posts
  const deck=K.items.find(P=>!P.lvl&&P.kind==='deck');
  if(deck){const [cx,cz,hx,hz,,dy]=deck.box,zw=cz-hz+0.14,ze=cz+hz-0.18,st=Math.max(0,...K.items.filter(P=>P.kind==='platform').map(P=>P.box[2]))+0.4,pt=dy+2.95,wy=dy+3.5;
    const X=[-hx+0.25,-(hx+st)/2,-st,st,(hx+st)/2,hx-0.25].map(x=>cx+x),P=X.map(x=>[x,pt,ze]);
    for(const x of X)pole(x,dy,ze,pt-dy);for(let i=0;i<P.length;i++){run([X[i],wy,zw],P[i],0.3);if(i)run(P[i-1],P[i],0.2)}
    bar.deck=[cx,cz,dy]}
  // bulbs every couple of feet along each string, hanging a little under it
  const pts=[],wire=[];for(const [a,b,sag] of runs){const len=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]),n=Math.max(2,Math.round(len/0.6)),at=t=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t-sag*4*t*(1-t),a[2]+(b[2]-a[2])*t];
    for(let i=0;i<n;i++){const p=at(i/n),q=at((i+1)/n);wire.push(...p,...q);if(i)pts.push(p)}}
  const o=new THREE.Object3D();
  {const I=new THREE.InstancedMesh(new THREE.SphereGeometry(0.034,8,6),bfLtMat('#ffd9a0',true),pts.length);pts.forEach((p,i)=>{o.position.set(p[0],p[1]-0.05,p[2]);o.scale.set(1,1.25,1);o.updateMatrix();I.setMatrixAt(i,o.matrix)});I.frustumCulled=false;g.add(I)}
  {const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.Float32BufferAttribute(wire,3));const Ls=new THREE.LineSegments(G,new THREE.LineBasicMaterial({color:0x17181a}));Ls.frustumCulled=false;g.add(Ls)}
  {const I=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.03,0.03,1,8).translate(0,0.5,0),barMat(0x1b1c1f,0.55,0.7),poles.length);poles.forEach((p,i)=>{o.position.set(p[0],p[1],p[2]);o.scale.set(1,p[3],1);o.updateMatrix();I.setMatrixAt(i,o.matrix)});I.castShadow=true;I.frustumCulled=false;g.add(I)}
  // real light under them, a few of the building's own (the pool takes the nearest; forgetown.js bfLightTick)
  if(!K.barLt){K.barLt=1;const add=(x,y,z,r)=>K.lights.push({id:'bar'+K.lights.length,p:new THREE.Vector3(x,y,z),d:null,col:new THREE.Color('#ffcf8f'),k:1.25,lvl:1,r,ang:0.78,auto:true,out:true});
    add((x0*3+x1)/4,fy+3.0,(z0+z1)/2+1,9);add((x0+x1*3)/4-2,fy+3.0,(z0+z1)/2+1,9);if(bar.deck){add(bar.deck[0]-5,bar.deck[2]+2.9,bar.deck[1],8);add(bar.deck[0]+5,bar.deck[2]+2.9,bar.deck[1],8)}bfLt.dirty=1}
  // the band's corner, at the back of the roof beside the stairs: two stools, two microphones and a small amplifier
  const bx=x1-3.1,bz=z0+1.15;bar.bsp=[[bx-0.95,bz,-0.3],[bx+0.95,bz,-0.5]].map(([x,z,yw],i)=>({lx:x,lz:z,ly:fy,lyaw:yw,x:0,z:0,y:0,yaw:0,sit:1,staff:1,band:i+1,up:1,bf:1,dy:0.3}));
  const wood=barMat(0x4a3220,0.6),blk=barMat(0x141517,0.5,0.6),K2=[];
  const part=(geo,mat,x,y,z,rx,ry,rz)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx||0,ry||0,rz||0);m.castShadow=true;g.add(m);return m};
  for(const s of bar.bsp){part(new THREE.CylinderGeometry(0.17,0.17,0.045,20),wood,s.lx,fy+0.74,s.lz);
    for(let k=0;k<4;k++){const a=k*Math.PI/2+0.78;part(new THREE.CylinderGeometry(0.014,0.014,0.74,6),blk,s.lx+Math.cos(a)*0.15,fy+0.37,s.lz+Math.sin(a)*0.15,Math.sin(a)*0.07,0,-Math.cos(a)*0.07)}
    part(new THREE.TorusGeometry(0.16,0.01,6,20),blk,s.lx,fy+0.28,s.lz,Math.PI/2);
    // a microphone on its stand before each
    const mx=s.lx+Math.sin(s.lyaw)*0.55,mz=s.lz+Math.cos(s.lyaw)*0.55;part(new THREE.CylinderGeometry(0.13,0.14,0.025,18),blk,mx,fy+0.013,mz);part(new THREE.CylinderGeometry(0.011,0.011,1.2,8),blk,mx,fy+0.6,mz);
    part(new THREE.CylinderGeometry(0.022,0.018,0.15,10),blk,mx-Math.sin(s.lyaw)*0.05,fy+1.22,mz-Math.cos(s.lyaw)*0.05,0.9,s.lyaw);
    part(new THREE.SphereGeometry(0.03,10,8),barMat(0x8d9096,0.4,0.8),mx-Math.sin(s.lyaw)*0.1,fy+1.27,mz-Math.cos(s.lyaw)*0.1)}
  {const ax=bx,az=z0+0.3;part(new THREE.BoxGeometry(0.52,0.46,0.26),blk,ax,fy+0.23,az);part(new THREE.PlaneGeometry(0.46,0.34),barMat(0x5a5246,0.9),ax,fy+0.21,az+0.132);part(new THREE.BoxGeometry(0.46,0.03,0.2),barMat(0x9a9da1,0.35,0.8),ax,fy+0.47,az)}
  bar.stage=[bx,fy+1.1,bz]}
// a guitar: the body's two bouts, the sound hole, the neck and the head (its neck along +x, its top facing +z)
function barGuitar(dark){const g=new THREE.Group(),top=barMat(dark?0x7a4a22:0xc9955a,0.42),side=barMat(dark?0x3a2212:0x5b3a1e,0.5),blk=barMat(0x1a1310,0.6);
  const disc=(r,x,m,d)=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d,28),m);c.rotation.x=Math.PI/2;c.position.x=x;c.castShadow=true;g.add(c);return c};
  disc(0.19,-0.12,side,0.1);disc(0.145,0.11,side,0.1);disc(0.135,0,side,0.1);
  disc(0.186,-0.12,top,0.004).position.z=0.051;disc(0.141,0.11,top,0.004).position.z=0.051;disc(0.131,0,top,0.004).position.z=0.051;
  disc(0.048,0.05,blk,0.003).position.z=0.054;
  const box=(w,h,d,m,x,y,z)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(x,y,z);b.castShadow=true;g.add(b)};
  box(0.5,0.05,0.022,blk,0.47,0,0.045);box(0.14,0.07,0.018,side,0.78,0,0.04);box(0.09,0.03,0.012,blk,-0.15,0,0.058);return g}
// once a second: the building found (built again when the town comes back), the band's seats where the building
// stands, the band there on its nights
function barSlow(){const L=bf.lots.find(l=>l.id===BAR_ID&&l.b);
  if(!L){bar.L=null;bar.g=null;return}
  if(L!==bar.L||bar.g&&bar.g.parent!==L.b.g){bar.band.forEach(p=>p&&tfDrop(p));bar.band=[null,null];bar.g=null;barSetup(L)}
  const B=L.b,R=B.gameR;if(!bar.g)return;B.g.updateMatrixWorld();
  for(const s of bar.bsp){bar.v.set(s.lx,s.ly,s.lz).applyMatrix4(B.g.matrixWorld);s.x=bar.v.x;s.z=bar.v.z;s.y=bar.v.y+s.dy;s.yaw=B.g.rotation.y+s.lyaw}
  const on=barBandOn()&&B.g.visible&&R&&R.bfOn&&tf.on&&tf.load===2,d=Math.hypot(camera.position.x-B.g.position.x,camera.position.z-B.g.position.z);
  bar.bsp.forEach((s,i)=>{let p=bar.band[i];if(p&&(p.dead||tf.people.indexOf(p)<0)){if(s.who===p)s.who=null;p=bar.band[i]=null;if(on)s.gone=fuelDayNo()}
    if(p&&(!on||d>TF_RFAR)){if(d>TF_RFAR||!tfSeen(p.x,p.z,1.5)||!barBandOn()&&townHour()>=22.5||!R.bfOn){tfDrop(p);s.who=null;bar.band[i]=null}return}
    if(p){p.x=s.x;p.z=s.z;p.y=s.y;return}
    if(on&&d<TF_RNEAR&&s.gone!==fuelDayNo()&&tfShopLeft()>0){p=tfPerson({room:R,spot:s,x:s.x,z:s.z,yaw:s.yaw,sit:1,t:30,look:0,s:0});p.y=s.y;s.who=p;R.n++;
      const ci=tf.chars.findIndex(c=>c.id===(i?'f25_capri':'m25_hoodie'));if(ci>=0&&ci!==p.ci){tf.use[p.ci]--;p.ci=ci;p.body=tf.chars[ci].id;tf.use[ci]++;p.sc=1;tfTwin(p,1)}
      bar.band[i]=p;if(!bar.told&&d<45){bar.told=1;toast(say('barBand'),'',4200)}}})}
function barBandOn(){const n=Math.round(TU.barBand??2);if(n<=0)return false;const h=townHour();return h>=19&&h<22&&[5,6,4,0,3,2,1].slice(0,n).includes(townDow())}
// ---------- every frame ----------
function barTick(dt){if(typeof bf==='undefined')return;
  if((bar.t1-=dt)<=0){bar.t1=1;barSlow()}
  if(bar.buzz>0)bar.buzz=Math.max(0,bar.buzz-dt/(TU.barBuzzTime||240));
  if(bar.sipT>=0){const a=bar.sipT;bar.sipT+=dt/1.5;if(a<0.5&&bar.sipT>=0.5)barSwallow();if(bar.sipT>=1)bar.sipT=-1}
  if(bar.seat&&(mode!=='walk'||wk.inside||bench.on))barStand(true);
  // he drinks it by himself too, a sip every so often
  if(bar.drink&&bar.sipT<0&&mode==='walk'&&!wk.inside&&(bar.autoT=(bar.autoT??12)-dt)<=0){bar.autoT=9+Math.random()*9;bar.sipT=0}
  const g=bar.g,B=bar.L&&bar.L.b;
  if(g&&B){const d=Math.hypot(camera.position.x-B.g.position.x,camera.position.z-B.g.position.z);g.visible=d<170;
    // the guitars on the band's knees
    bar.band.forEach((p,i)=>{let G=bar.gtr[i];if(!p||d>90){if(G)G.visible=false;return}if(!G){G=bar.gtr[i]=barGuitar(i);scene.add(G)}
      const c=Math.cos(p.yaw),n=Math.sin(p.yaw),sc=p.sc||1,lx=-0.05,ly=0.74,lz=0.24;G.visible=true;G.position.set(p.x+(lx*c+lz*n)*sc,p.y+ly*sc,p.z+(lz*c-lx*n)*sc);G.rotation.set(0,p.yaw,0);G.rotateZ(0.32);G.rotateX(-0.2);G.scale.setScalar(sc)})}
  else for(const G of bar.gtr)if(G)G.visible=false;
  barSndTick(dt)}
// ---------- a drink in your hand ----------
function barDrink(item,kind){const had=bar.drink;bar.drink={n:item,k:kind,left:1};bar.sipT=-1;toast(say(had?'barSwap':'barGot',{item}),'good',had?3200:5600);barGlass()}
function barGlass(){if(bar.glass)return bar.glass;const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CylinderGeometry(0.039,0.031,1,16).translate(0,0.5,0),new THREE.MeshStandardMaterial({color:0xc8861c,roughness:0.12,envMap:skyEnv,envMapIntensity:0.7}));
  const foam=new THREE.Mesh(new THREE.CylinderGeometry(0.039,0.039,0.02,16).translate(0,0.01,0),new THREE.MeshStandardMaterial({color:0xf2e8cf,roughness:0.85}));
  const shell=new THREE.Mesh(new THREE.CylinderGeometry(0.043,0.034,0.158,16,1,true).translate(0,0.079,0),new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.05,transparent:true,opacity:0.22,envMap:skyEnv,envMapIntensity:1,depthWrite:false,side:THREE.DoubleSide}));
  const base=new THREE.Mesh(new THREE.CylinderGeometry(0.034,0.034,0.008,16).translate(0,0.004,0),shell.material);
  g.add(body,foam,shell,base);g.userData={body,foam};g.visible=false;scene.add(g);return bar.glass=g}
function barSip(){if(!bar.drink||bar.sipT>=0)return;bar.sipT=0;bar.autoT=10+Math.random()*8;started()}
function barSwallow(){const D=bar.drink;if(!D)return;D.left=Math.max(0,D.left-0.2);if(D.left>0.01)return;bar.drink=null;
  if(D.k==='beer'){bar.buzz=Math.min(3,bar.buzz+1);if(bar.buzz>=2&&!bar.buzzTold){bar.buzzTold=1;toast(say('barBuzz'),'',4200);return}}else town.pep=Math.max(town.pep,(TU.pepTime||180)/2);
  toast(say('barDone',{item:D.n}),'',2800)}
// after the camera is placed (main.js): the glass where it is now (on the table before a seat, in his hand, at his
// lips), and the sway of a few beers
function barPlace(){
  if(bar.buzz>1&&TU.barBuzz>0&&!bench.on){const k=(bar.buzz-1)*0.5*TU.barBuzz,t=performance.now()/1000;camera.rotateZ(Math.sin(t*0.83)*0.022*k+Math.sin(t*0.31)*0.012*k);camera.rotateX(Math.sin(t*0.57+1)*0.008*k)}
  const D=bar.drink,g=bar.glass;if(!g)return;
  if(!D||mode!=='walk'||wk.inside||wk.swim||bench.on||gunHas()||fistUp()||pbS.hold){g.visible=false;return}
  g.visible=true;const U=g.userData,h=0.012+0.128*D.left;U.body.scale.y=h;U.body.material.color.setHex(D.k==='beer'?(/Stout|Porter/.test(D.n)?0x2a1608:/Wheat|Hazy|Kolsch|Helles|Lemon/.test(D.n)?0xe0b040:/Amber|Sour/.test(D.n)?0xa84a1c:0xc8861c):/Lemon/.test(D.n)?0xe8dc8a:0x3a1c0c);
  U.foam.position.y=h;U.foam.visible=D.k==='beer'&&D.left>0.05;
  const s=bar.sipT>=0?Math.sin(Math.PI*Math.min(1,bar.sipT)):0,S=bar.seat,v=bar.v;
  if(S&&S.sp.tf&&s<0.02){const sp=S.sp;g.position.set(sp.x+Math.sin(sp.yaw)*sp.tf+Math.cos(sp.yaw)*-0.14,sp.y-(sp.dy||0)+sp.th,sp.z+Math.cos(sp.yaw)*sp.tf-Math.sin(sp.yaw)*-0.14);g.rotation.set(0,0,0);return}
  if(camMode==='cab'){camera.updateMatrixWorld();v.set(0.25-0.2*s,-0.24+0.13*s,-0.56+0.24*s).applyMatrix4(camera.matrixWorld);g.position.copy(v);g.quaternion.copy(camera.quaternion);g.rotateX(-fpl.pitch*(1-s)+0.75*s);g.position.y-=0.08*(1-s);return}
  const c=Math.cos(wk.yaw),n=Math.sin(wk.yaw),lx=-0.25+0.17*s,ly=(S?0.98:1.02)+0.5*s,lz=0.26-0.06*s;
  g.position.set(wk.x+lx*c+lz*n,walker.position.y+ly,wk.z+lz*c-lx*n);g.rotation.set(0.7*s,wk.yaw,0)}
// ---------- a seat ----------
// the free seat at hand: a chair or a stool of a bar's room (a Daylight seat, or the game's own), on his floor
function barSeatNear(){let best=null,bd=1.25;
  for(const R of TF_ROOMS){if(R.home||R.grp||R.off||Math.hypot(R.x-wk.x,R.z-wk.z)>(R.r||10)+26)continue;tfShopW(R);if(R.vk!=='pm')continue;
    for(const sp of R.spots){if(!sp.sit||sp.staff||sp.who||sp.path)continue;const d=Math.hypot(sp.x-wk.x,sp.z-wk.z);if(d<bd&&Math.abs(sp.y-(sp.dy||0)-wk.y)<0.7){bd=d;best={sp,R}}}}
  return best}
function barSitDown(){const S=barSeatNear();if(!S)return;if(gun.eq)gunEquip(false,true);fist.on=false;
  bar.seat={sp:S.sp,R:S.R,px:wk.x,pz:wk.z,py:wk.y,x:S.sp.x,z:S.sp.z};S.sp.who=bar.me;wk.sit=1;
  Object.assign(wk,{x:S.sp.x,z:S.sp.z,y:S.sp.y-0.34,vy:0,yaw:S.sp.yaw,view:S.sp.yaw,spd:0,ground:true});if(camMode!=='cab')orbitYaw=0;
  if(!bar.satTold){bar.satTold=1;toast(say('barSat'),'',4200)}started()}
// up again, back to where he sat down from (quiet: the game took him elsewhere, so only the seat is let go)
function barStand(quiet){const S=bar.seat;if(!S)return;bar.seat=null;wk.sit=0;if(S.sp.who===bar.me)S.sp.who=null;
  if(!quiet){wk.x=S.px;wk.z=S.pz;wk.y=S.py;wk.vy=0;wk.ground=true}}
// walker.js, each frame he is seated: true while he stays (posed on the seat), false once he is up
function barSit(dt,mx,mz){const S=bar.seat;if(!S){wk.sit=0;return false}const sp=S.sp;
  if(sp.who!==bar.me||Math.abs(sp.x-S.x)+Math.abs(sp.z-S.z)>0.05){barStand(true);return false}
  if(Math.hypot(mx,mz)>0.6||wk.jumpQ>0){wk.jumpQ=0;barStand();return false}
  const stool=sp.dy>0,sip=bar.sipT>=0?Math.sin(Math.PI*bar.sipT):0;
  wk.x=sp.x;wk.z=sp.z;wk.y=sp.y-0.34;wk.yaw=sp.yaw;wk.spd=0;wk.vy=0;wkBody.position.y=0;wkBody.rotation.x=0.04;wkHead.rotation.x=0;
  for(let s=0;s<2;s++){wkLegs[s].top.rotation.x=stool?-1.15:-1.45;wkLegs[s].low.rotation.x=stool?1.25:1.4;wkArms[s].top.rotation.x=-0.55-(s?0:0.9*sip);wkArms[s].low.rotation.x=-0.75-(s?0:0.9*sip)}
  walker.position.set(wk.x,wk.y,wk.z);walker.rotation.y=wk.yaw;walker.visible=!(camMode==='cab'&&!gunHas()&&!fistUp());return true}
// what Use does about the bar (ctx.js): seated, a sip or up; on his feet with nothing else at hand, a seat or a sip
function barCtx(seated,seatOnly){const sip=()=>bar.drink&&bar.sipT<0?{lbl:say('barSip'),run:barSip}:null;
  if(seated)return sip()||{lbl:say('barStand'),run:()=>barStand()};
  if(typeof tf!=='undefined'&&tf.on&&barSeatNear())return {lbl:say('barSit'),run:barSitDown};
  return seatOnly?null:sip()}
// ---------- the sound of the place ----------
// a plucked string (Karplus and Strong): a burst of noise going round a delay one period long, softened each time
// round; added into out from sample `at` on, wrapping at its end so the buffer loops
function barPluck(out,at,f,len,amp,bright,sr){const N=Math.max(2,Math.round(sr/f)),d=new Float32Array(N),L=out.length,n=Math.round(len*sr),rel=Math.round(0.04*sr);let lp=0,m=0;
  for(let i=0;i<N;i++){lp+=((Math.random()*2-1)-lp)*bright;d[i]=lp;m+=lp}m/=N;let pk=1e-6;for(let i=0;i<N;i++){d[i]-=m;pk=Math.max(pk,Math.abs(d[i]))}
  const a=amp/pk,dec=0.9965;let k=0,j=at%L;
  for(let i=0;i<n;i++){const v=d[k],k2=k+1===N?0:k+1;d[k]=(v+d[k2])*0.5*dec;out[j]+=v*a*(i<32?i/32:i>n-rel?(n-i)/rel:1);k=k2;if(++j===L)j=0}}
const barHz=m=>440*Math.pow(2,(m-69)/12);
// chords for the picking hand: [bass, the other bass, three strings above them]
const BAR_CH={G:[43,50,55,59,62],Em:[40,47,52,55,59],C:[48,43,52,55,60],D:[50,45,57,62,66],Am:[45,40,52,57,60],F:[41,48,53,57,60],A:[45,52,57,61,64],Bm:[47,42,54,59,62],E:[40,47,52,56,59]};
const BAR_SONGS=[{bpm:104,ch:['G','G','Em','Em','C','C','D','D']},{bpm:92,ch:['C','Am','F','G','C','Am','F','G']},{bpm:112,ch:['D','A','Bm','G','D','A','G','A']},{bpm:96,ch:['Em','C','G','D','Em','C','D','D']}];
// a song's notes: a thumb going between the two basses on the beats, fingers between them, a second guitar brushing the
// chord on two and four; [seconds, Hz, length, loudness, brightness]
function barNotes(S){const e=30/S.bpm,N=[],H=()=>(Math.random()-0.5)*0.014;
  S.ch.forEach((c,b)=>{const C=BAR_CH[c],t0=b*8*e,alt=b%2,F=alt?[3,2,4,2]:[2,4,3,4];
    for(let k=0;k<8;k++){const t=t0+k*e;
      if(k%2===0)N.push([t+H(),barHz(C[k%4===0?0:1]),e*3.2,0.5,0.38]);else N.push([t+H(),barHz(C[F[(k-1)/2]]),e*2.6,0.3*(0.85+0.3*Math.random()),0.55]);
      if(k===0||alt&&k===4)N.push([t+H(),barHz(C[4]+(k?0:12)),e*3,0.26,0.6]);
      if(k===2||k===6)for(let j=0;j<3;j++)N.push([t+0.013*j+H(),barHz(C[2+j]),e*1.6,0.13,0.3])}});
  return {N,len:S.ch.length*8*e}}
// the room's murmur: a couple of dozen voices, each a pulse at its own pitch through two moving vowel resonances, in
// phrases with pauses between them (at half the sound card's rate: there is nothing up high in it)
function barVoice(out,sr){const L=out.length,man=Math.random()<0.55,f0=man?92+Math.random()*45:165+Math.random()*70,lvl=0.35+0.65*Math.random(),end=L/sr;let t=Math.random()*2;
  while(t<end){const syl=3+((Math.random()*8)|0);let f=f0*(1.05+0.12*Math.random());
    for(let q=0;q<syl&&t<end;q++){const dur=0.1+Math.random()*0.16,n=Math.round(dur*sr),F1=(man?270:310)+Math.random()*480,F2=(man?850:1000)+Math.random()*1300;f*=0.97+0.04*Math.random();
      const r1=Math.exp(-Math.PI*90/sr),r2=Math.exp(-Math.PI*140/sr),c1=2*r1*Math.cos(2*Math.PI*F1/sr),c2=2*r2*Math.cos(2*Math.PI*F2/sr),q1=r1*r1,q2=r2*r2;let a1=0,b1=0,a2=0,b2=0,ph=Math.random(),xp=0,j=Math.round(t*sr)%L;
      const g1=(1-r1)*2,g2=(1-r2)*2.4,df=f/sr,nc=Math.random()<0.5?Math.round(n*0.15):0,na=n*0.2,nr=n*0.4;
      for(let i=0;i<n;i++){ph+=df;if(ph>=1)ph-=1;
        // the breath through the cords: opening slowly, shut at once (which is what gives a voice its edge)
        let x=ph<0.45?ph*ph*4.94:0;if(i<nc)x+=(Math.random()-0.5)*0.5;const e=x-xp;xp=x;
        const y1=g1*e+c1*a1-q1*b1;b1=a1;a1=y1;const y2=g2*e+c2*a2-q2*b2;b2=a2;a2=y2;
        out[j]+=(y1+y2)*lvl*(i<na?i/na:i>n-nr?(n-i)/nr:1);if(++j===L)j=0}
      t+=dur+0.015+Math.random()*0.05}
    t+=0.5+Math.random()*2.8}}
function barBuf(a,sr,rms){let s=0,pk=0;for(let i=0;i<a.length;i++){s+=a[i]*a[i];pk=Math.max(pk,Math.abs(a[i]))}const k=Math.min(rms/Math.sqrt(s/a.length||1e-9),0.95/(pk||1));for(let i=0;i<a.length;i++)a[i]*=k;
  const b=actx.createBuffer(1,a.length,sr);b.getChannelData(0).set(a);return b}
// worked out a little each frame, so it never holds one up: the murmur first, then each song as its turn comes
function barRender(){const sr=actx.sampleRate;let J=bar.job;
  if(!J){if(!bar.crowdBuf)J=bar.job={k:'crowd',a:new Float32Array(Math.round(sr/2*11)),i:0,n:24};
    else{const i=bar.song%BAR_SONGS.length;if(bar.songs[i]||!barBandOn())return;const S=barNotes(BAR_SONGS[i]);J=bar.job={k:'song',si:i,a:new Float32Array(Math.round(sr*S.len)),i:0,N:S.N}}}
  const t0=performance.now();
  if(J.k==='crowd'){while(J.i<J.n&&performance.now()-t0<3){barVoice(J.a,sr/2);J.i++}if(J.i>=J.n){bar.crowdBuf=barBuf(J.a,sr/2,0.11);bar.job=null}}
  else{while(J.i<J.N.length&&performance.now()-t0<3){const [t,f,len,amp,br]=J.N[J.i++];barPluck(J.a,Math.max(0,Math.round(t*sr)),f,len,amp,br,sr)}if(J.i>=J.N.length){bar.songs[J.si]=barBuf(J.a,sr,0.1);bar.job=null}}}
function barChan(send){const f=sndFilter('lowpass',6000,0.5),g=sndGain(0),pan=actx.createStereoPanner?actx.createStereoPanner():null;f.connect(g);if(pan){g.connect(pan);pan.connect(snd.amb);if(send)pan.connect(snd.ambSend)}else{g.connect(snd.amb);if(send)g.connect(snd.ambSend)}return {f,g,pan,src:null}}
// a channel heard from (x, y, z): quieter and duller with distance (ref: how far it carries), on the side it is on
function barHear(C,x,y,z,vol,ref,lp,t){sndR.setFromMatrixColumn(camera.matrixWorld,0);const dx=x-camera.position.x,dy=y-camera.position.y,dz=z-camera.position.z,d=Math.hypot(dx,dy,dz)||1;
  C.g.gain.setTargetAtTime(vol/(1+(d/ref)*(d/ref)),t,0.2);C.f.frequency.setTargetAtTime(Math.max(500,lp/(1+d/(ref*1.6))),t,0.25);if(C.pan)C.pan.pan.setTargetAtTime(d>1.5?clamp((dx*sndR.x+dz*sndR.z)/d*0.75,-0.75,0.75):0,t,0.12)}
function barSndTick(dt){if(typeof snd==='undefined'||!snd||!snd.ready||!actx||actx.state!=='running'||!snd.amb)return;const B=bar.L&&bar.L.b,S=bar.snd,t=actx.currentTime;
  const stop=C=>{if(C&&C.src){try{C.src.stop()}catch(e){}C.src.disconnect();C.src=null;C.g.gain.setTargetAtTime(0,t,0.05)}};
  if(!B||!B.g.visible||!bar.g||bench.on||!sndCfg.on){if(S){stop(S.crowd);stop(S.music)}return}
  const cx=B.g.position.x,cz=B.g.position.z,d=Math.hypot(camera.position.x-cx,camera.position.z-cz);
  if(d>220){if(S){stop(S.crowd);stop(S.music)}return}
  barRender();const V=bar.snd||(bar.snd={crowd:barChan(true),music:barChan(true)});
  // the murmur: by how many are in, from the middle of the building at the height of whichever floor you are nearer
  const R=B.gameR,n=R&&R.bfOn?R.n||0:0,cv=(TU.barCrowd??0.6)*Math.pow(Math.min(1,n/16),0.7);
  if(bar.crowdBuf&&cv>0.01&&d<120){if(!V.crowd.src){const s=actx.createBufferSource();s.buffer=bar.crowdBuf;s.loop=true;s.connect(V.crowd.f);s.start(t,Math.random()*5);V.crowd.src=s}
    const y=B.g.position.y+(camera.position.y>B.g.position.y+5?8.5:1.8);barHear(V.crowd,cx,y,cz,cv*1.6,9,5200,t);
    // a glass set down, a clink
    if((bar.clinkT-=dt)<=0){bar.clinkT=3+Math.random()*9;const f=1900+Math.random()*900,g=sndGain(0,V.crowd.f);g.gain.setValueAtTime(0.05+0.05*Math.random(),t);g.gain.exponentialRampToValueAtTime(0.0005,t+0.3);
      for(const m of [1,1.52,2.31]){const o=actx.createOscillator();o.type='sine';o.frequency.value=f*m;o.connect(g);o.start(t);o.stop(t+0.32);if(m===1)o.onended=()=>g.disconnect()}}}
  else stop(V.crowd);
  // the band: a song round a few times, a breath, the next
  const mv=TU.barMusic??0.7,on=barBandOn()&&mv>0.01&&bar.stage;
  if(!on){stop(V.music);return}
  if(V.music.src&&t>bar.songEnd){stop(V.music);bar.song++;bar.nextT=t+5+Math.random()*4}
  if(!V.music.src&&t>=bar.nextT){const b=bar.songs[bar.song%BAR_SONGS.length];if(b){const s=actx.createBufferSource();s.buffer=b;s.loop=true;s.connect(V.music.f);s.start(t+0.1);V.music.src=s;bar.songEnd=t+b.duration*(3+((Math.random()*2)|0))-0.05}}
  bar.v.set(bar.stage[0],bar.stage[1],bar.stage[2]).applyMatrix4(B.g.matrixWorld);barHear(V.music,bar.v.x,bar.v.y,bar.v.z,mv*2.2,16,9000,t)}
