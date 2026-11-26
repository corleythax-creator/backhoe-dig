// Corley's Island: undergrowth, the leafy shrubs and young growth round the trees, so a wood's edge reads as a thicket
// and not trunks on a lawn. They are built from the trees' own photo leaf cards (trees.js) in three shapes, a low
// mound, a round shrub and a tall leggy one, share the leaf texture, sway from the ground up in the same wind, and take an autumn tint near
// their tree's. Where they go comes from each tree's spot (a hash), so every device puts the same ones in the same
// places, and they are laid out again whenever the trees are (treeLayout, which the map editor calls on edits). Only
// natural ground gets them: not on painted materials, roads, steep drops or water. The Graphics setting's Undergrowth
// draws a share of them (brushK), and only those within its Undergrowth distance of the camera (brR, brushLod: the
// meshes hold the near ones, shrinking away over the last fifth of it; all of them in the map editor). How it looks
// only, nothing walks into them.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const BRUSH_CAP=7000;let brushK=1;
// every shrub laid out (its matrix, colour, shape and spot), and what brushLod last filled the meshes from
const brM=new Float32Array(BRUSH_CAP*3*16),brC=new Float32Array(BRUSH_CAP*3*3),brKd=new Uint8Array(BRUSH_CAP*3),brX=new Float32Array(BRUSH_CAP*3),brZ=new Float32Array(BRUSH_CAP*3);
let brN=0,brR=150,brDirty=true,brRNow=-1,brCX=0,brCZ=0;
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
function brushLayout(){const o=new THREE.Object3D(),n=[0,0,0],col=new THREE.Color();brN=0;
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
      o.matrix.toArray(brM,brN*16);brKd[brN]=k;brX[brN]=x;brZ[brN]=z;
      // an undergrowth colour (greens, olive, autumn gold and rust), drawn a little toward a leafy tree's own tint
      const p=BRUSH_TINT[Math.floor(hash(x*1.9,z*2.6)*BRUSH_TINT.length)],v=0.85+0.25*h3,lt=a.t==='leafy'?0.3:0;
      col.setRGB((p[0]*(1-lt)+a.c[0]*lt)*v,(p[1]*(1-lt)+a.c[1]*lt)*v,(p[2]*(1-lt)+a.c[2]*lt)*v);
      col.toArray(brC,brN*3);brN++;n[k]++}}
  brDirty=true}
// every frame (main.js): the meshes are filled again with the shrubs near the camera once it has moved a few metres
function brushLod(){const R=edOn?1e9:brR,cx=camera.position.x,cz=camera.position.z;
  if(!brDirty&&R===brRNow&&Math.hypot(cx-brCX,cz-brCZ)<Math.min(8,R*0.05))return;
  brDirty=false;brRNow=R;brCX=cx;brCZ=cz;const n=[0,0,0],R0=R*0.8;
  for(let i=0;i<brN;i++){const d=Math.hypot(brX[i]-cx,brZ[i]-cz);if(d>=R)continue;
    const k=brKd[i],im=brushIMs[k],a=im.instanceMatrix.array,o=n[k]*16,b=i*16,sc=1-ss(R0,R,d);
    for(let j=0;j<12;j++)a[o+j]=brM[b+j]*sc;for(let j=12;j<16;j++)a[o+j]=brM[b+j];
    const c=im.instanceColor.array,q=n[k]*3;c[q]=brC[i*3];c[q+1]=brC[i*3+1];c[q+2]=brC[i*3+2];n[k]++}
  brushIMs.forEach((im,k)=>{im.count=n[k];im.visible=n[k]>0;
    for(const [at,w] of [[im.instanceMatrix,16],[im.instanceColor,3]]){at.clearUpdateRanges();at.addUpdateRange(0,n[k]*w);at.needsUpdate=true}})}
// gfx.js: the share of the undergrowth drawn
function brushGfx(k,r){if(r)brR=r;if(typeof fmGrassK==='function')fmGrassK(k);if(k===brushK)return;brushK=k;brushLayout()}
