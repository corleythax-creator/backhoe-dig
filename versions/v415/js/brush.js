// Corley's Island: undergrowth, the leafy shrubs and young growth round the trees, so a wood's edge reads as a thicket
// and not trunks on a lawn. They are built from the trees' own photo leaf cards (trees.js) in three shapes, a low
// mound, a round shrub and a tall leggy one, share the leaf texture, sway from the ground up in the same wind, and take an autumn tint near
// their tree's. Where they go comes from each tree's spot (a hash), so every device puts the same ones in the same
// places, and they are laid out again whenever the trees are (treeLayout, which the map editor calls on edits). Only
// natural ground gets them: not on painted materials, roads, steep drops or water. The Graphics setting's Undergrowth
// draws a share of them (brushK). How it looks only, nothing walks into them.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const BRUSH_CAP=7000;let brushK=1;
// the leaf texture is grey and takes these as [r, g, b] multipliers, as the trees' tints are
const BRUSH_TINT=[[0.55,0.72,0.28],[0.42,0.6,0.25],[0.7,0.7,0.3],[0.95,0.72,0.25],[0.85,0.42,0.18],[0.6,0.66,0.26]];
// the leaf material swaying from just above the ground, leaning more and fluttering harder than a tree's crown
const brushMat=treeFolMat(0.08,7,0.05);
const brushIMs=(function(){const out=[];
  // [seed, clumps, radius across, height, card size, needles share]
  for(const [seed,n,R,H,sz,nd] of [[901,22,0.85,0.55,0.55,0],[902,30,0.75,1.05,0.6,0.15],[903,26,0.55,1.6,0.55,0.3]]){
    const K=treeKit(seed),V=K.V,c=new V(0,H*0.45,0);
    for(let i=0;i<n;i++){const a=K.rnd()*Math.PI*2,r=Math.sqrt(K.rnd()),h=Math.pow(K.rnd(),0.8);
      const p=new V(Math.cos(a)*R*r,0.12+h*H*(1-0.35*r*r),Math.sin(a)*R*r),nrm=p.clone().sub(c).setY((p.y-c.y)*0.6+0.25).normalize();
      K.clump(p,sz*(0.75+0.5*K.rnd())*(1-0.25*h),K.rnd()<nd?FOL_UV.needles:FOL_UV.leaves,nrm,0.55+0.45*h)}
    const g=K.done().fol,im=new THREE.InstancedMesh(g,brushMat,BRUSH_CAP);im.count=0;im.frustumCulled=false;im.receiveShadow=true;im.castShadow=false;
    im.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(BRUSH_CAP*3),3);scene.add(im);out.push(im)}
  return out})();
// the undergrowth round every tree that stands, from the tree groups (trees.js)
function brushLayout(){const o=new THREE.Object3D(),n=[0,0,0],col=new THREE.Color();
  for(const g in treeGroups)for(const a of treeGroups[g]){if(treeFallen.size&&treeFallen.has(treeKey(a.x,a.z)))continue;
    const cnt=Math.floor(hash(a.x*2.7+1.1,a.z*1.9-0.4)*4.6);
    for(let i=0;i<cnt;i++){const h1=hash(a.x*3.1+i*7.3,a.z*2.3-i*1.7),h2=hash(a.z*4.1-i*2.9,a.x*1.7+i*5.1),h3=hash(a.x*0.61+i,a.z*0.83-i);
      if(h3>brushK)continue;
      // out at the crown's edge and beyond, where the light gets in
      const an=h1*Math.PI*2,d=(2.0+3.2*h2)*Math.max(0.7,a.s),x=a.x+Math.cos(an)*d,z=a.z+Math.sin(an)*d;
      if(paintAt(x,z))continue;roadAt(x,z);if(RD_o<1.2||RD_gd<RD_gw/2+1.2)continue;
      const y=baseHeight(x,z);if(Math.abs(y-a.y)>1.2)continue;
      const k=h2<0.45?0:h2<0.8?1:2;if(n[k]>=BRUSH_CAP)continue;
      o.position.set(x,y-0.06,z);o.rotation.set(0,h1*40,0);const s=0.9+0.8*h3;o.scale.set(s,s*(0.85+0.3*h1),s);o.updateMatrix();
      brushIMs[k].setMatrixAt(n[k],o.matrix);
      // an undergrowth colour (greens, olive, autumn gold and rust), drawn a little toward a leafy tree's own tint
      const p=BRUSH_TINT[Math.floor(hash(x*1.9,z*2.6)*BRUSH_TINT.length)],v=0.85+0.25*h3,lt=a.t==='leafy'?0.3:0;
      col.setRGB((p[0]*(1-lt)+a.c[0]*lt)*v,(p[1]*(1-lt)+a.c[1]*lt)*v,(p[2]*(1-lt)+a.c[2]*lt)*v);
      brushIMs[k].setColorAt(n[k],col);n[k]++}}
  brushIMs.forEach((im,k)=>{im.count=n[k];im.instanceMatrix.needsUpdate=true;im.instanceColor.needsUpdate=true})}
// gfx.js: the share of the undergrowth drawn
function brushGfx(k){if(typeof fmGrassK==='function')fmGrassK(k);if(k===brushK)return;brushK=k;brushLayout()}
