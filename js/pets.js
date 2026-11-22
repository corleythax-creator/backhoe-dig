// Corley's Island: the bar's cats. Milo (a tuxedo cat) and a Maine coon live outside Harbor Light Brewing Co. by the
// lake: they wander the lawn and the car park's edge round the building, sit, wash, stretch, loaf and sleep, come over
// to the worker on foot for a look, and get out of a machine's way. They are Forge Studio's own animals, drawn by its
// Animal Forge runtime (forge-studio animal/runtime/animal-forge.js, loaded from its live site with the library, the
// way the town's buildings are): rigged, with their own clips, three levels of detail by distance, fur on Medium
// graphics and up. Loaded the first time the camera comes within PET_NEAR of the bar; nothing is drawn or moved
// beyond it. They are scenery: not saved, the same on every device only in who they are, not where they stand.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const PET_SITE='https://corley-forge-studio.vercel.app/animal/',PET_NEAR=170;
// the bar (marina.js: its middle and half sizes) and how far out from its walls the cats keep
const PET_HOME={x:93,z:572,hx:7.5,hz:5,out:10};
const PET_CATS=[{id:'cat_tuxedo_01',n:'Milo'},{id:'maine_coon_brown_tabby_01',n:'the Maine coon'}];
// what a cat does standing still: [clip, weight, shortest and longest seconds]
const PET_REST=[['idle',3,4,9],['sit',4,8,20],['groom',3,7,14],['graze',2,5,8],['stretch',1,5,5],['lie',2,10,25],['loaf',2,12,30],['lounge',2,12,30],['curl',1,12,25],['sleep',1,25,60]];
const pets={zoo:null,st:0,cats:[]};
// is x, z a place a cat can be: in the ring round the bar, off the water, out of every solid, on ground or a low floor
function petOk(x,z){const H=PET_HOME,dx=Math.abs(x-H.x)-H.hx,dz=Math.abs(z-H.z)-H.hz;if(Math.max(dx,dz)>H.out||(dx<0.6&&dz<0.6))return false;
  const y=surfAt(x,z);if(y<WATER+0.25||y-baseHeight(x,z)>0.5)return false;
  for(const s of SOLIDS)if(Math.abs(s.x-x)<s.hx+0.4&&Math.abs(s.z-z)<s.hz+0.4&&solidOut(s,x,z,0.3))return false;return true}
// a straight walk from a to b a cat can make: every half metre of it a place it can be, with no step over 10 in
function petWay(ax,az,bx,bz){const n=Math.max(1,Math.ceil(Math.hypot(bx-ax,bz-az)/0.5));let y0=surfAt(ax,az);
  for(let i=1;i<=n;i++){const x=ax+(bx-ax)*i/n,z=az+(bz-az)*i/n;if(!petOk(x,z))return false;const y=surfAt(x,z);if(Math.abs(y-y0)>0.25)return false;y0=y}return true}
function petSpot(c){const H=PET_HOME;for(let k=0;k<30;k++){const x=H.x+(Math.random()*2-1)*(H.hx+H.out),z=H.z+(Math.random()*2-1)*(H.hz+H.out);
    if(petOk(x,z)&&(!c||petWay(c.x,c.z,x,z)))return {x,z}}return null}
function petRest(c,clip){const R=clip?PET_REST.find(r=>r[0]===clip):(()=>{let t=0;for(const r of PET_REST)t+=r[1];let q=Math.random()*t;for(const r of PET_REST)if((q-=r[1])<=0)return r;return PET_REST[0]})();
  c.goal=null;c.t=R[2]+Math.random()*(R[3]-R[2]);c.a.play(R[0])}
function petGo(c,g,gait){c.goal=g;c.gait=gait||'walk';c.a.play(c.gait);c.v=pets.zoo.gaitSpeed(c.id,c.gait)}
async function petsLoad(){pets.st=1;
  try{if(!window.AnimalForge)await new Promise((ok,no)=>{const s=document.createElement('script');s.src=PET_SITE+'runtime/animal-forge.js';s.onload=ok;s.onerror=no;document.head.appendChild(s)});
    const zoo=await AnimalForge.load(THREE,PET_SITE+'library/',{fur:typeof gfxDetail!=='undefined'&&gfxDetail?3:0,contact:0.45});
    for(const d of PET_CATS){const a=await zoo.animal(d.id),p=petSpot()||{x:PET_HOME.x,z:PET_HOME.z+PET_HOME.hz+3},c={id:d.id,n:d.n,a,x:p.x,z:p.z,h:Math.random()*6.28,goal:null,t:0,v:1,gait:'walk',shy:0};
      a.object.traverse(o=>{if(o.isMesh){o.castShadow=true;o.frustumCulled=false}});scene.add(a.object);petRest(c);pets.cats.push(c)}
    pets.zoo=zoo;pets.st=2}
  catch(e){console.warn('The cats did not load',e);pets.st=3}}
// every frame (main.js): load when the camera first comes near; then each cat rests or walks to a spot of its choosing
function petsTick(dt){const H=PET_HOME,far=Math.hypot(camera.position.x-H.x,camera.position.z-H.z)>PET_NEAR;
  if(!pets.st){if(!far)petsLoad();return}
  if(pets.st!==2)return;for(const c of pets.cats)c.a.object.visible=!far;if(far)return;
  // who is about: the worker on foot (a cat may come over), or whatever machine he is in (a cat gets out of its way)
  const foot=mode==='walk',px=foot?wk.x:camera.position.x,pz=foot?wk.z:camera.position.z;
  for(const c of pets.cats){const dp=Math.hypot(px-c.x,pz-c.z);c.shy=Math.max(0,c.shy-dt);
    if(!foot&&dp<7&&c.gait!=='trot'){// a machine close by: trot off to a spot on the far side of it
      let best=null,bd=0;for(let k=0;k<8;k++){const p=petSpot(c);if(p){const d=Math.hypot(p.x-px,p.z-pz);if(d>bd){bd=d;best=p}}}if(best&&bd>dp+2)petGo(c,best,'trot')}
    if(c.goal){const dx=c.goal.x-c.x,dz=c.goal.z-c.z,d=Math.hypot(dx,dz),want=Math.atan2(dx,dz);let dh=want-c.h;dh-=Math.round(dh/6.2832)*6.2832;
      c.h+=Math.sign(dh)*Math.min(Math.abs(dh),dt*(c.gait==='trot'?5:3));const step=Math.min(d,c.v*dt*(Math.abs(dh)>1?0.3:1));
      if(d<0.15){if(c.meet){c.meet=0;c.shy=40;petRest(c,Math.random()<0.6?'sit':'idle')}else petRest(c)}
      else{const nx=c.x+Math.sin(c.h)*step,nz=c.z+Math.cos(c.h)*step;if(petOk(nx,nz)){c.x=nx;c.z=nz}else petRest(c,'idle')}}
    else if((c.t-=dt)<=0){
      // the worker standing near: come and sit by him, now and then; else a walk to somewhere new
      const p=foot&&dp<9&&dp>1.6&&!c.shy&&Math.random()<0.5?{x:px+(c.x-px)/dp*0.9,z:pz+(c.z-pz)/dp*0.9}:null;
      if(p&&petOk(p.x,p.z)&&petWay(c.x,c.z,p.x,p.z)){c.meet=1;petGo(c,p,'walk')}else{const g=petSpot(c);if(g)petGo(c,g,Math.random()<0.12?'trot':'walk');else petRest(c)}}
    const o=c.a.object;o.position.set(c.x,surfAt(c.x,c.z),c.z);o.rotation.y=c.h}
  pets.zoo.update(dt,camera)}
