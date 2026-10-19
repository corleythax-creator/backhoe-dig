// Corley's Island: the trees. Five species built from bark tubes and photo foliage cards (textures from OpenAI GPT
// Image, made by tools/trees_tex.py): a spruce and a red pine (the map editor's "pine"), and an oak, a sugar maple and a
// birch clump (its "leafy"). Which species a tree is comes from where it stands (treeSpecies), so saves and maps keep
// their {t:'pine'|'leafy'} shape. Every island hands its trees in as a group (treeGroup) and they all share one set of
// instance meshes: each species has a full-detail model (about 2,500 to 4,500 triangles) for the trees within the
// Graphics setting's tree distance (treeNearR) and a light one (a few hundred) beyond, re-sorted as the camera moves.
// Shadows come from a solid hull per species (the meshes in treeIMs, never drawn; shadowproxy.js casts the near ones),
// which maps.js also reads for the minimap. The leaves are grey in the texture and take each tree's tint (ASSET_LT).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const treeIMs=[];
// the editor trees' tints: pines (near white, slight shifts) and leaf trees (autumn golds and oranges to greens), by c
const ASSET_PT=[[1,1,1],[0.85,0.95,1.06],[1.08,1.04,0.82],[0.92,0.98,0.9]],ASSET_LT=[[0.98,0.78,0.26],[0.93,0.52,0.2],[0.56,0.64,0.3],[0.78,0.32,0.18],[0.46,0.6,0.28],[0.95,0.85,0.4]];
// the atlas boxes of textures/tree_leaves.jpg as [u0, v0, u1, v1] (v up); tools/trees_tex.py BOX has them in pixels
const FOL_UV={spruce:[0,0,0.3125,1],leaves:[0.3125,0.5,0.8125,1],needles:[0.3125,0,0.8125,0.5]};
// full-detail distance (m), set by the Graphics setting (gfx.js); the breeze clock for the sway
let treeNearR=PHONE?40:140,treeLodX=1e9,treeLodZ=1e9,treeLodDirty=true;
const treeWindU={value:0},treeSwayU={value:1};
const treeTex=(()=>{const L=new THREE.TextureLoader(),T=(n,wrap)=>{const t=L.load(`textures/${n}.jpg`);if(wrap)t.wrapS=t.wrapT=THREE.RepeatWrapping;
    t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return t};
  // read as they are, like the game's other textures (no sRGB decode), so they sit with the rest of the scene
  return{bark:T('tree_bark',1),birch:T('tree_birch',1),fol:T('tree_leaves'),folA:T('tree_leaves_a'),barkN:null,birchN:null}})();
// the breeze: the whole tree leans and the leaf cards flutter, more the higher up (the wood leans with them)
function treeSwayShader(mat,flutter){mat.onBeforeCompile=sh=>{sh.uniforms.uWind=treeWindU;sh.uniforms.uSway=treeSwayU;
  sh.vertexShader='uniform float uWind;\nuniform float uSway;\n'+sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
#ifdef USE_INSTANCING
  float twPh=uWind+dot(instanceMatrix[3].xz,vec2(0.37,0.23)),twH=max(transformed.y-1.0,0.0)*uSway;
  transformed.x+=(sin(twPh*1.3)+0.4*sin(twPh*2.9))*0.011*twH*twH*0.25;transformed.z+=cos(twPh*1.1)*0.008*twH*twH*0.25;
  ${flutter?'transformed.xyz+=uSway*0.03*min(twH,1.0)*vec3(sin(twPh*4.3+position.x*2.1+position.y*1.3),0.5*sin(twPh*5.1+position.y*1.9),sin(twPh*3.9+position.z*2.3));':''}
#endif`);
  // light through the leaves: a little of their own colour glows, so a crown against the sun isn't a black cut-out
  if(flutter)sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n  totalEmissiveRadiance+=diffuseColor.rgb*0.22;')}}
const treeMats=(()=>{
  const wood=map=>{const m=new THREE.MeshPhongMaterial({map,shininess:4,specular:0x080808});treeSwayShader(m,false);return m};
  const fol=new THREE.MeshLambertMaterial({map:treeTex.fol,alphaMap:treeTex.folA,alphaTest:0.45,vertexColors:true});treeSwayShader(fol,true);
  return{bark:wood(treeTex.bark),birch:wood(treeTex.birch),fol}})();
// bark relief on High graphics (the pbr setting), its normal map fetched the first time
function treePbr(on){for(const [k,n] of [['bark','tree_bark_n'],['birch','tree_birch_n']]){const m=treeMats[k];
  if(on&&!treeTex[k+'N']){const t=new THREE.TextureLoader().load(`textures/${n}.jpg`);t.wrapS=t.wrapT=THREE.RepeatWrapping;treeTex[k+'N']=t}
  const want=on?treeTex[k+'N']:null;if(m.normalMap!==want){m.normalMap=want;m.normalScale.set(1.2,1.2);m.needsUpdate=true}}}

// ---------- building a model ----------
// a model is two parts: wood (bark tubes) and foliage (double-faced cards with their own normals and shade)
function treeKit(seed){let sd=seed;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
  const W={p:[],n:[],u:[],i:[]},F={p:[],n:[],u:[],c:[],i:[]},V=THREE.Vector3;
  // a bark tube through pts (Vector3s) with radii rs; bark repeats about every 0.55 m
  function tube(pts,rs,seg,uRep){const b=W.p.length/3,up=new V(0,1,0);let N=null,len=0;uRep=uRep||Math.max(1,Math.round(rs[0]*2*Math.PI/0.55));
    for(let k=0;k<pts.length;k++){const T=(k<pts.length-1?pts[k+1].clone().sub(pts[k]):pts[k].clone().sub(pts[k-1])).normalize();
      if(!N){N=Math.abs(T.y)>0.9?new V(1,0,0):up.clone();N.sub(T.clone().multiplyScalar(N.dot(T))).normalize()}else{N.sub(T.clone().multiplyScalar(N.dot(T))).normalize()}
      const B=new V().crossVectors(T,N);if(k)len+=pts[k].distanceTo(pts[k-1]);
      for(let j=0;j<=seg;j++){const a=j/seg*Math.PI*2,d=N.clone().multiplyScalar(Math.cos(a)).add(B.clone().multiplyScalar(Math.sin(a)));
        W.p.push(pts[k].x+d.x*rs[k],pts[k].y+d.y*rs[k],pts[k].z+d.z*rs[k]);W.n.push(d.x,d.y,d.z);W.u.push(j/seg*uRep,len/0.55)}}
    for(let k=0;k<pts.length-1;k++)for(let j=0;j<seg;j++){const a=b+k*(seg+1)+j,c=a+seg+1;W.i.push(a,c,a+1,a+1,c,c+1)}}
  // a foliage card: from base point o along ay (length h, drooping by droop at its tip) and across ax (width w), in
  // segs steps; uv box bx, normal nrm, shade k0 at the base to k1 at the tip; both faces share the vertices
  function card(o,ax,ay,w,h,bx,nrm,k0,k1,segs,droop,tint){const b=F.p.length/3;tint=tint||[1,1,1];
    for(let s=0;s<=segs;s++){const t=s/segs,dy=droop*t*t,k=k0+(k1-k0)*t;
      for(let e=0;e<2;e++){const x=o.x+ay.x*h*t+ax.x*w*(e-0.5),y=o.y+ay.y*h*t-dy+ax.y*w*(e-0.5),z=o.z+ay.z*h*t+ax.z*w*(e-0.5);
        F.p.push(x,y,z);F.n.push(nrm.x,nrm.y,nrm.z);F.u.push(bx[0]+(bx[2]-bx[0])*e,bx[1]+(bx[3]-bx[1])*t);F.c.push(k*tint[0],k*tint[1],k*tint[2])}}
    for(let s=0;s<segs;s++){const a=b+s*2;F.i.push(a,a+1,a+2,a+1,a+3,a+2, a,a+2,a+1,a+1,a+2,a+3)}}
  // a card centred on c, turned by random angles (a leaf clump or needle tuft)
  function clump(c,size,bx,nrm,k,tint){const ay=new V(rnd()-0.5,rnd()*0.8-0.2,rnd()-0.5).normalize(),ax=new V().crossVectors(ay,new V(rnd()-0.5,rnd()-0.5,rnd()-0.5)).normalize();
    if(!isFinite(ax.x)||ax.lengthSq()<0.5)ax.set(1,0,0);
    card(c.clone().sub(ay.clone().multiplyScalar(size/2)),ax,ay,size,size,bx,nrm,k*0.9,k,1,0,tint)}
  function geo(P){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(P.n,3));
    g.setAttribute('uv',new THREE.Float32BufferAttribute(P.u,2));if(P.c)g.setAttribute('color',new THREE.Float32BufferAttribute(P.c,3));g.setIndex(P.i);g.computeBoundingSphere();return g}
  return{rnd,tube,card,clump,V,done:()=>({wood:geo(W),fol:geo(F)})}}
// a bent line from a toward a + dir*len in n steps, curling by bend (a vector added along the way, growing with t^2)
function treeLine(K,a,dir,len,n,bend,wob){const P=[];for(let k=0;k<=n;k++){const t=k/n;
  P.push(a.clone().add(dir.clone().multiplyScalar(len*t)).add(bend.clone().multiplyScalar(t*t)).add(new K.V((K.rnd()-0.5)*wob,(K.rnd()-0.5)*wob*0.5,(K.rnd()-0.5)*wob).multiplyScalar(k&&k<n?1:0)))}return P}
// spruce: a straight trunk and whorls of drooping branch cards all the way down, narrowing to a leader
function treeSpruce(hi){const K=treeKit(hi?101:102),V=K.V,up=new V(0,1,0),H=8.4,R=2.0,Y0=0.55;
  const tp=[],tr=[];for(let k=0,n=hi?9:3;k<=n;k++){const t=k/n;tp.push(new V((K.rnd()-0.5)*0.04*t,H*t,(K.rnd()-0.5)*0.04*t));tr.push(0.21*(1-t)+0.025)}
  K.tube(tp,tr,hi?12:6);
  const dy=hi?0.27:0.6;
  for(let y=Y0;y<H-0.45;y+=dy*(0.85+0.3*K.rnd())){const f=(y-Y0)/(H-0.45-Y0),L=R*Math.pow(1-f,0.92)*(0.85+0.3*K.rnd())+0.3,nb=hi?5+Math.floor(K.rnd()*3):4,y0=K.rnd()*6.28;
    for(let b=0;b<nb;b++){const a=y0+b*6.283/nb+(K.rnd()-0.5)*0.7,d=new V(Math.cos(a),0,Math.sin(a)),p=-0.32+0.62*f+(K.rnd()-0.5)*0.15;
      const ay=d.clone().multiplyScalar(Math.cos(p)).add(up.clone().multiplyScalar(Math.sin(p))),ax=new V().crossVectors(ay,up).normalize(),au=new V().crossVectors(ax,ay);
      const nrm=d.clone().multiplyScalar(0.75).add(up.clone().multiplyScalar(0.7)).normalize(),dk=0.62+0.38*f,o=new V(d.x*0.06,y,d.z*0.06),w=L*(hi?0.44:0.62);
      K.card(o,ax,ay,w,L,FOL_UV.spruce,nrm,0.45*dk,1.0*dk,hi?3:1,L*0.2*(1-f));
      const a2=hi?1.1:1.3,ax2=ax.clone().multiplyScalar(Math.cos(a2)).add(au.clone().multiplyScalar(Math.sin(a2)));
      K.card(o,ax2,ay,w*0.85,L*0.95,FOL_UV.spruce,nrm,0.4*dk,0.92*dk,hi?3:1,L*0.2*(1-f))}}
  for(let k=0;k<2;k++){const a=k*Math.PI/2,ax=new V(Math.cos(a),0,Math.sin(a));K.card(new V(0,H-0.75,0),ax,up,0.42,1.1,FOL_UV.spruce,up,0.9,1.05,hi?2:1,0)}
  return K.done()}
// red pine: a tall clean trunk, a few dead stubs, and an open crown of upswept limbs ending in needle tufts
function treeRedPine(hi){const K=treeKit(hi?201:202),V=K.V,up=new V(0,1,0),H=10.2,C0=H*0.5,lean=new V(0.25,0,0.1);
  const tp=[],tr=[];for(let k=0,n=hi?10:4;k<=n;k++){const t=k/n;tp.push(new V(lean.x*t*t+(K.rnd()-0.5)*0.05*t,H*t,lean.z*t*t+(K.rnd()-0.5)*0.05*t));tr.push(0.25*(1-t)*(1-0.3*t)+0.03)}
  K.tube(tp,tr,hi?12:6);
  const at=y=>{const t=y/H;return new V(lean.x*t*t,y,lean.z*t*t)};
  if(hi)for(let k=0;k<7;k++){const y=1.8+K.rnd()*(C0-2.2),a=K.rnd()*6.28,d=new V(Math.cos(a),-0.1,Math.sin(a)).normalize();K.tube(treeLine(K,at(y),d,0.25+K.rnd()*0.3,1,new V(0,0,0),0),[0.035,0.012],4,1)}
  const tuft=(c,s,n)=>{const out=c.clone().sub(at(c.y)).setY(0),nrm=out.normalize().multiplyScalar(0.7).add(up.clone().multiplyScalar(0.75)).normalize(),k=0.52+0.33*(c.y-C0)/(H-C0);
    for(let j=0;j<n;j++)K.clump(c.clone().add(new V((K.rnd()-0.5)*0.3,(K.rnd()-0.5)*0.2,(K.rnd()-0.5)*0.3)),s*(0.85+0.3*K.rnd()),FOL_UV.needles,nrm,k)};
  const nl=hi?11:7;
  for(let b=0;b<nl;b++){const f=b/(nl-1),y=C0+f*(H-1.3-C0),a=b*2.4+K.rnd()*0.5,d=new V(Math.cos(a),0.45+0.6*f+K.rnd()*0.25,Math.sin(a)).normalize(),L=(2.3-1.3*f)*(0.85+0.3*K.rnd());
    const pts=treeLine(K,at(y),d,L,hi?3:2,new V(0,0.35,0),0.08);K.tube(pts,pts.map((p,k)=>0.075*(1-k/pts.length)+0.015),hi?6:4,1);
    const tip=pts[pts.length-1];tuft(tip,1.25,hi?5:2);
    if(hi){tuft(pts[1].clone().lerp(tip,0.5),1.0,3);
      for(let s=0;s<3;s++){const sa=a+(s-1)*0.9+0.3,sd=new V(Math.cos(sa),0.5,Math.sin(sa)).normalize(),sp=pts[1].clone().lerp(tip,0.4),st=treeLine(K,sp,sd,L*0.45,2,new V(0,0.15,0),0.04);
        K.tube(st,[0.035,0.025,0.012],4,1);tuft(st[2],1.05,3);tuft(st[1],0.9,2)}}
    else tuft(pts[1].clone().lerp(tip,0.5),1.4,1)}
  tuft(at(H-0.3),1.1,hi?4:2);
  return K.done()}
// broadleaf: a trunk splitting into limbs, then branches and twigs, with leaf clumps at the twig ends and over the
// crown's shell, shaded darker inside and underneath. o: trunk height, rad base radius, crown centre cy and radii
// rx, ry, limb count and spread, wob how crooked, clumps (full detail) and clump size, stems for a clump of trunks
function treeBroad(hi,o){const K=treeKit(hi?o.seed:o.seed+1),V=K.V,up=new V(0,1,0),C=new V(0,o.cy,0),ends=[];
  // the light model leaves out the twigs (their ends still place the clumps)
  const limb=(a,d,len,r0,depth)=>{if(!hi&&depth<=0){ends.push(a.clone().add(d.clone().multiplyScalar(len)));return}
    const n=hi&&r0>0.06?4:2,pts=treeLine(K,a,d,len,n,new V(d.x*0.15*len,o.lift*len,d.z*0.15*len),o.wob*len*0.15);
    K.tube(pts,pts.map((p,k)=>r0*(1-0.6*k/n)),r0>0.1?(hi?10:5):r0>0.05?(hi?6:4):(hi?4:3),1);
    const e=pts[n];if(depth<=0||r0<0.03){ends.push(e);return}
    const nc=depth>1?o.limbs-1:2+(K.rnd()<0.5?1:0);
    for(let c=0;c<nc;c++){const a=K.rnd()*6.28,s=new V(Math.cos(a),0,Math.sin(a)),nd=d.clone().add(s.multiplyScalar(o.spread)).add(up.clone().multiplyScalar(0.25)).normalize();
      limb(c===0&&depth>1?pts[n-1].clone().lerp(e,0.5):e,nd,len*(0.55+0.15*K.rnd()),r0*0.58,depth-1)}};
  for(let s=0;s<o.stems;s++){const sa=s*2.4+0.5,sl=o.stems>1?new V(Math.cos(sa)*0.18,1,Math.sin(sa)*0.18).normalize():up,base=new V(o.stems>1?Math.cos(sa)*0.18:0,0,o.stems>1?Math.sin(sa)*0.18:0);
    const tp=treeLine(K,base,sl,o.trunk,hi?6:2,new V(0,0,0),o.wob*0.25);K.tube(tp,tp.map((p,k)=>o.rad*(1-0.3*k/tp.length)),hi?12:6);
    const top=tp[tp.length-1];
    for(let l=0;l<o.limbs;l++){const a=l*6.283/o.limbs+s*1.1+K.rnd()*0.6,d=new V(Math.cos(a)*o.out,1,Math.sin(a)*o.out).normalize();
      limb(tp[Math.max(1,tp.length-1-(l%2))].clone().lerp(top,0.5),d,o.limbLen*(0.85+0.3*K.rnd()),o.rad*0.62,hi?3:2)}
    if(o.leader)limb(top,sl,o.limbLen*1.1,o.rad*0.5,hi?3:2)}
  const pts=ends.slice();
  for(let k=0,n=(hi?o.clumps:Math.round(o.clumps*0.22))-ends.length;k<n;k++){let x,y,z,r;do{x=K.rnd()*2-1;y=K.rnd()*2-1;z=K.rnd()*2-1;r=x*x+y*y+z*z}while(r>1||r<0.35);
    pts.push(new V(x*o.rx,o.cy+y*o.ry,z*o.rx))}
  const step=hi?1:Math.max(1,Math.round(pts.length/(o.clumps*0.22)));
  for(let k=0;k<pts.length;k+=step){const p=pts[k],q=p.clone().sub(C),nrm=new V(q.x/o.rx,q.y/o.ry*0.8+0.25,q.z/o.rx);const outer=Math.min(1,nrm.length());nrm.normalize();
    const kk=(0.45+0.35*outer)*(0.8+0.25*Math.max(-1,Math.min(1,q.y/o.ry))),v=0.94+0.12*K.rnd(),tint=[v,v*(0.97+0.06*K.rnd()),v*(0.9+0.15*K.rnd())];
    for(let j=0,n=hi?3:2;j<n;j++)K.clump(p.clone().add(new V((K.rnd()-0.5)*0.4,(K.rnd()-0.5)*0.3,(K.rnd()-0.5)*0.4)),o.size*(hi?1:1.7)*(0.8+0.4*K.rnd()),FOL_UV.leaves,nrm,kk,tint)}
  return K.done()}
const TREE_BROAD={
  oak:{seed:301,trunk:2.3,rad:0.33,limbs:4,limbLen:2.6,out:1.35,spread:0.9,lift:0.05,wob:0.9,cy:4.7,rx:3.5,ry:2.3,clumps:150,size:1.35,stems:1,leader:false},
  maple:{seed:401,trunk:2.8,rad:0.27,limbs:4,limbLen:2.7,out:0.7,spread:0.6,lift:0.2,wob:0.5,cy:5.2,rx:2.8,ry:2.9,clumps:180,size:1.35,stems:1,leader:true},
  birch:{seed:501,trunk:4.2,rad:0.14,limbs:3,limbLen:2.0,out:0.55,spread:0.55,lift:0.12,wob:0.35,cy:5.9,rx:1.9,ry:2.7,clumps:160,size:1.1,stems:2,leader:true}};
// the species: name, which editor kind it stands for, its wood, and its shadow hull (cone or ellipsoid, a little inside
// the foliage so the sunny side of the crown stays lit)
const TREE_SP=[
  {id:'spruce',name:'spruce',t:'pine',wood:'bark',build:treeSpruce,hull:['cone',1.55,0.8,8.2],h:8.4},
  {id:'redpine',name:'red pine',t:'pine',wood:'bark',build:treeRedPine,hull:['ball',1.6,1.6,7.6],h:10.2},
  {id:'oak',name:'oak',t:'leafy',wood:'bark',build:hi=>treeBroad(hi,TREE_BROAD.oak),hull:['ball',2.7,1.8,4.7],h:7.0},
  {id:'maple',name:'sugar maple',t:'leafy',wood:'bark',build:hi=>treeBroad(hi,TREE_BROAD.maple),hull:['ball',2.2,2.3,5.2],h:8.1},
  {id:'birch',name:'birch',t:'leafy',wood:'birch',build:hi=>treeBroad(hi,TREE_BROAD.birch),hull:['ball',1.4,2.1,5.9],h:8.5}];
// which species a tree at x, z is: pines are 60% spruce, leafy trees a third each
function treeSpecies(t,x,z){const w=hash(x*0.731+5.1,z*0.917-2.3);return t==='pine'?(w<0.6?0:1):w<0.36?2:w<0.7?3:4}
function treeHeight(t,x,z){return TREE_SP[treeSpecies(t,x,z)].h}
// ---------- how old and how big a tree really is ----------
// Each game species stands for a real one of the north-eastern woods, and its drawn height is a real height (the model's
// metres times the tree's size). Age comes from the species' height-for-age curve, a Chapman-Richards growth curve
// H = hmax(1 - e^(-k age))^p of the kind foresters fit to measured trees (medium ground, trees growing in the open or
// the edge of a stand); the numbers are tuned to published site-index figures (white spruce about 14 m at 50 yr,
// red pine 19 m, red oak 17 m, sugar maple 15 m, paper birch 17 m). hmax: tallest the species gets (m); life: the age
// it can reach (yr); dmax: trunk diameter at breast height (1.3 m) when that tall (cm); crown: crown spread (m) per
// cm of trunk; form: how much of a cylinder the stem fills; dens: green wood density (kg/m³)
const TREE_BIO={
  spruce:{real:'white spruce',lat:'Picea glauca',hmax:34,k:0.0150,p:1.40,life:250,dmax:60,crown:0.15,form:0.42,dens:420},
  redpine:{real:'red pine',lat:'Pinus resinosa',hmax:36,k:0.0175,p:1.30,life:300,dmax:70,crown:0.13,form:0.42,dens:450},
  oak:{real:'northern red oak',lat:'Quercus rubra',hmax:34,k:0.0140,p:1.20,life:300,dmax:85,crown:0.24,form:0.40,dens:700},
  maple:{real:'sugar maple',lat:'Acer saccharum',hmax:33,k:0.0120,p:1.25,life:350,dmax:80,crown:0.21,form:0.40,dens:650},
  birch:{real:'paper birch',lat:'Betula papyrifera',hmax:28,k:0.0300,p:1.20,life:110,dmax:50,crown:0.17,form:0.38,dens:610}};
const TREE_STAGES=['Sapling','Young','Mature','Old','Veteran'],TREE_STAGE_AT=[0.08,0.25,0.55,0.85];
const treeHeightAt=(b,age)=>b.hmax*Math.pow(1-Math.exp(-b.k*age),b.p);
const treeAgeAt=(b,H)=>Math.max(1,Math.round(-Math.log(1-Math.pow(Math.min(0.985,Math.max(0.001,H/b.hmax)),1/b.p))/b.k));
// everything worked out for species index k at H metres tall: age (yr, also its growth rings), trunk diameter at breast
// height (cm), crown spread (m), stem wood (m³), carbon dioxide held in the whole tree (kg), growth now (cm of height a
// year), and how far through its life it is (0 to 1, and stage: an index into TREE_STAGES)
function treeVitals(k,H){const b=TREE_BIO[TREE_SP[k].id],age=treeAgeAt(b,H),D=H<1.3?0:b.dmax*Math.pow((H-1.3)/(b.hmax-1.3),0.85),
  vol=b.form*Math.PI/4*Math.pow(D/100,2)*H,life=age/b.life,st=life<TREE_STAGE_AT[0]?0:life<TREE_STAGE_AT[1]?1:life<TREE_STAGE_AT[2]?2:life<TREE_STAGE_AT[3]?3:4;
  return{age,D,H,crown:Math.max(0.4,b.crown*D),vol,co2:vol*b.dens*1.6*0.5*3.667,grow:(treeHeightAt(b,age+1)-treeHeightAt(b,age))*100,life,st}}
// a standing tree of a group (as treeEntry makes them) or an editor asset: its species index and vitals
function treeHeightOf(a,k){return TREE_SP[k].h*a.s*(a.sy===undefined?treeSy(a.t,a.x,a.z):(a.sy||1))}
function treeSy(t,x,z){const w=hash(x*1.3+0.7,z*2.1+0.3);return t==='pine'?0.92+0.25*w:0.95+0.12*w}
function treeVitalsOf(a){const k=treeSpecies(a.t,a.x,a.z);return Object.assign({k},treeVitals(k,treeHeightOf(a,k)))}
// all the standing trees (only one group if named), added up by species: n, ages (sum, oldest, youngest), heights (sum,
// tallest), thickest trunk, crown area (m²), stem wood (m³), CO₂ (kg), and how many are at each life stage and age
// bracket (TREE_AGE_BRACKETS); T.places has each group's count and age sum, T.felled the ones lying down
const TREE_AGE_BRACKETS=[10,25,50,100];
function treeCensus(only){const sp=TREE_SP.map(()=>({n:0,age:0,old:0,young:1e9,H:0,tall:0,thick:0,area:0,vol:0,co2:0,st:[0,0,0,0,0],br:[0,0,0,0,0]})),
  T={sp,n:0,age:0,H:0,area:0,vol:0,co2:0,felled:0,places:{},st:[0,0,0,0,0],br:[0,0,0,0,0],old:null,tall:null,thick:null};
  for(const g in treeGroups){if(only&&g!==only)continue;const P=T.places[g]={n:0,age:0};
    for(const a of treeGroups[g]){if(treeFallen.has(treeKey(a.x,a.z))){T.felled++;continue}
      const v=treeVitalsOf(a),S=sp[v.k],br=TREE_AGE_BRACKETS.findIndex(m=>v.age<m),bi=br<0?TREE_AGE_BRACKETS.length:br,ar=Math.PI*v.crown*v.crown/4;
      S.n++;S.age+=v.age;S.H+=v.H;S.area+=ar;S.vol+=v.vol;S.co2+=v.co2;S.st[v.st]++;S.br[bi]++;
      if(v.age>S.old)S.old=v.age;if(v.age<S.young)S.young=v.age;if(v.H>S.tall)S.tall=v.H;if(v.D>S.thick)S.thick=v.D;
      T.n++;T.age+=v.age;T.H+=v.H;T.area+=ar;T.vol+=v.vol;T.co2+=v.co2;T.st[v.st]++;T.br[bi]++;P.n++;P.age+=v.age;
      if(!T.old||v.age>T.old.age)T.old=v;if(!T.tall||v.H>T.tall.H)T.tall=v;if(!T.thick||v.D>T.thick.D)T.thick=v}}
  return T}
function treeHull(h){const g=new THREE.BufferGeometry(),P=[],add=s=>{const n=s.index?s.toNonIndexed():s;P.push(...n.attributes.position.array)};
  const tr=new THREE.CylinderGeometry(0.12,0.2,h[3]*0.6,6);tr.translate(0,h[3]*0.3,0);add(tr);
  if(h[0]==='cone'){const c=new THREE.ConeGeometry(h[1],h[3]-h[2],10);c.translate(0,h[2]+(h[3]-h[2])/2,0);add(c)}
  else{const s=new THREE.IcosahedronGeometry(1,1);s.scale(h[1],h[2],h[1]);s.translate(0,h[3],0);add(s)}
  g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.computeBoundingSphere();return g}
// the instance meshes: per species, full and light wood and foliage (drawn) and the hull (all of that species' trees)
const TREE_CAP=2400,treeGroups={},treeDraw=[];
// trees knocked over by digging (digtiles.js), by treeKey: left out of the groups, drawn lying down
const treeFallen=new Map(),treeKey=(x,z)=>Math.round(x*100)+','+Math.round(z*100);
(function(){const hullMat=new THREE.MeshBasicMaterial();
  for(const sp of TREE_SP){const H=sp.build(true),L=sp.build(false),mk=(g,m,col)=>{const im=new THREE.InstancedMesh(g,m,TREE_CAP);im.count=0;im.frustumCulled=false;
      im.receiveShadow=true;im.castShadow=false;if(col)im.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(TREE_CAP*3),3);scene.add(im);treeDraw.push(im);return im};
    sp.hi=[mk(H.wood,treeMats[sp.wood],false),mk(H.fol,treeMats.fol,true)];sp.lo=[mk(L.wood,treeMats[sp.wood],false),mk(L.fol,treeMats.fol,true)];
    sp.all=new THREE.InstancedMesh(treeHull(sp.hull),hullMat,TREE_CAP);sp.all.count=0;sp.all.castShadow=true;sp.col=new Float32Array(TREE_CAP*3);treeIMs.push(sp.all);
    sp.tris=[H.wood,H.fol,L.wood,L.fol].map(g=>g.index.count/3)}})();
// one island's trees: [{t:'pine'|'leafy', x, z, y (ground), yaw, s, sy (height scale), c:[r,g,b] foliage tint}]
function treeGroup(name,list){treeGroups[name]=list;
  const o=new THREE.Object3D(),n=TREE_SP.map(()=>0);
  for(const sp of TREE_SP)sp.all.count=0;
  for(const g in treeGroups)for(const a of treeGroups[g]){if(treeFallen.size&&treeFallen.has(treeKey(a.x,a.z)))continue;const k=treeSpecies(a.t,a.x,a.z),sp=TREE_SP[k];if(n[k]>=TREE_CAP)continue;
    const w=hash(a.x*1.3+0.7,a.z*2.1+0.3),w2=hash(a.z*1.7,a.x*0.9);
    o.position.set(a.x,a.y-0.05,a.z);o.rotation.set((w-0.5)*0.06,a.yaw,(w2-0.5)*0.06);o.scale.set(a.s,a.s*(a.sy||1),a.s);o.updateMatrix();
    sp.all.setMatrixAt(n[k],o.matrix);sp.col.set(a.c,n[k]*3);n[k]++}
  TREE_SP.forEach((sp,k)=>{sp.all.count=n[k];sp.all.instanceMatrix.needsUpdate=true});treeLodDirty=true}
// the tint and height of a tree from the old per-island colour schemes
function treeEntry(t,x,z,yaw,s,c,sy){const w=hash(x*1.3+0.7,z*2.1+0.3),w2=hash(z*1.7,x*0.9),k=treeSpecies(t,x,z);let col;
  if(t==='pine'){const p=ASSET_PT[(c|0)%4],v=0.9+0.2*w2;col=[p[0]*v,p[1]*v,p[2]*v]}
  else{const p=ASSET_LT[(c|0)%6],v=0.9+0.2*w2;col=k===4?[p[0]*v*1.05,(p[1]*0.8+0.2)*v,p[2]*v*0.85]:[p[0]*v,p[1]*v,p[2]*v]}
  return{t,x,z,y:baseHeight(x,z),yaw,s,sy:sy||treeSy(t,x,z),c:col}}
// every frame: the breeze, and when the camera has moved a few metres, which trees get the full model
function treesTick(dt){const sw=TU.treeSway===undefined?1:TU.treeSway;treeWindU.value+=dt*(0.6+0.4*Math.min(2,sw));treeSwayU.value=sw;
  const cx=camera.position.x,cz=camera.position.z;if(!treeLodDirty&&Math.hypot(cx-treeLodX,cz-treeLodZ)<Math.max(4,treeNearR*0.06))return;
  treeLodDirty=false;treeLodX=cx;treeLodZ=cz;const R2=treeNearR*treeNearR;
  for(const sp of TREE_SP){const A=sp.all.instanceMatrix.array,C=sp.col,parts=[[sp.hi,0],[sp.lo,0]];
    for(let i=0;i<sp.all.count;i++){const dx=A[i*16+12]-cx,dz=A[i*16+14]-cz,P=parts[dx*dx+dz*dz<R2?0:1],j=P[1]++;
      for(const im of P[0])im.instanceMatrix.array.set(A.subarray(i*16,i*16+16),j*16);P[0][1].instanceColor.array.set(C.subarray(i*3,i*3+3),j*3)}
    for(const [ims,n] of parts)for(const im of ims){im.count=n;im.instanceMatrix.updateRange.count=n*16;im.instanceMatrix.needsUpdate=true;
      if(im.instanceColor){im.instanceColor.updateRange.count=n*3;im.instanceColor.needsUpdate=true}}}}
