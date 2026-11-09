// Corley's Island: pebbles, stones and fallen sticks lying about on the natural ground round the camera (the island, the
// Family Island, the field and woods; not the town south of PEB_TOWN_Z): thicker on
// the roads, yards and dug dirt than in the grass, in drifts, sticks mostly in the grass. Placed from a hash of each
// 4 ft cell, so the same ones are always in the same place; set again as the camera moves and every couple of seconds,
// reading the ground as it is (hAt), so they ride dug, dumped and edited ground. Not on painted materials, pads, decks
// or under water. Only how the ground looks, never what it does (CLAUDE.md); how many is the Graphics setting (peb).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const PEB={k:gfxCur.peb||0,cx:1e9,cz:1e9,t:0,stones:[],stick:null},PEB_R=28,PEB_C=1.2,PEB_TOWN_Z=480,PEB_MAX=1500;
(function(){
  // no photo textures: on these balls their coordinates pinch at the poles and draw black, and at this size a speckle
  // per corner reads the same (stone), with each one's own tint (instance colour)
  const rockM=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.85,envMap:skyEnv,envMapIntensity:0.4});
  const stickM=new THREE.MeshStandardMaterial({color:0x5a4634,roughness:0.95});
  // (they cast no shadow: the shadow map's texels are as big as they are, so they would only shade themselves black)
  // three lumpy stone shapes: a ball pushed in and out per corner, flattened as stones lie
  const stone=(seed,det)=>{const g=new THREE.IcosahedronGeometry(1,det),p=g.attributes.position;
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=0.72+0.5*hash(x*3.1+y*1.3+seed,z*2.7+y*1.9);p.setXYZ(i,x*k,y*k*0.55,z*k*0.82)}
    // rounded: each corner's normal leans from its face's toward straight out from the middle, as worn stones are
    g.computeVertexNormals();const nm=g.attributes.normal,o=new THREE.Vector3(),f=new THREE.Vector3();
    for(let i=0;i<p.count;i++){o.set(p.getX(i),p.getY(i)/0.55,p.getZ(i)/0.82).normalize();f.fromBufferAttribute(nm,i);f.multiplyScalar(0.35).addScaledVector(o,0.65).normalize();nm.setXYZ(i,f.x,f.y,f.z)}
    const C=new Float32Array(p.count*3);
    for(let i=0;i<p.count;i++){const v=0.42+0.3*hash(p.getX(i)*7.3+seed,p.getZ(i)*5.1+p.getY(i)*3.7);C[i*3]=v*1.04;C[i*3+1]=v;C[i*3+2]=v*0.93}
    g.setAttribute('color',new THREE.BufferAttribute(C,3));return g};
  const mk=(g,m)=>{const im=new THREE.InstancedMesh(g,m,PEB_MAX);im.count=0;im.frustumCulled=false;im.receiveShadow=true;
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(im);return im};
  PEB.stones=[mk(stone(1,0),rockM),mk(stone(2,1),rockM),mk(stone(3,1),rockM)];
  const sg=new THREE.CylinderGeometry(0.6,1,1,5,1);sg.rotateZ(Math.PI/2);PEB.stick=mk(sg,stickM);
  for(const im of [...PEB.stones,PEB.stick])im.setColorAt(0,new THREE.Color());
})();
const pebM=new THREE.Matrix4(),pebQ=new THREE.Quaternion(),pebE=new THREE.Euler(),pebP=new THREE.Vector3(),pebS=new THREE.Vector3(),pebCol=new THREE.Color();
function pebPlace(cx,cz){const all=[...PEB.stones,PEB.stick],n=all.map(()=>0),R=PEB_R,C=PEB_C,dens=PEB.k*TU.pebN;
  const i0=Math.floor((cx-R)/C),i1=Math.floor((cx+R)/C),j0=Math.floor((cz-R)/C),j1=Math.floor((cz+R)/C);
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const x0=i*C,z0=j*C;if(z0>PEB_TOWN_Z)continue;
    const dc=Math.hypot(x0-cx,z0-cz);if(dc>R)continue;
    const dirt=Math.max(roadAmt(x0,z0),yardAt(x0,z0)),cnt=Math.floor(dens*(0.15+3.5*dirt)*(0.3+1.2*vnoise(x0,z0,9))+hash(i*1.37,j*2.11));
    for(let q=0;q<cnt;q++){const hx=hash(i+q*7.1,j*1.9),hz=hash(i*2.3,j+q*5.3),x=x0+hx*C,z=z0+hz*C;
      if(paintAt(x,z))continue;const y=hAt(x,z);if(y<WATER+0.15||padAt(x,z)>y-0.3||deckAt(x,z)>y-0.3)continue;
      const r=hash(x*3.7,z*5.1),stick=r<0.14*(1-dirt),kind=stick?3:Math.floor(hash(z*1.3,x*0.7)*3);if(n[kind]>=PEB_MAX)continue;
      // mostly small, a few fist-sized; they shrink away near the edge of the ring so none pops in
      const fade=1-ss(R-5,R,Math.hypot(x-cx,z-cz)),hs=hash(x*0.9,z*1.7);
      if(stick){const len=(0.25+0.45*hs)*fade,rad=0.008+0.012*hash(z,x);pebS.set(len,rad,rad);pebE.set(0,r*40,(hs-0.5)*0.15);pebP.set(x,y+rad*0.6,z);
        pebCol.setRGB(0.75+0.25*hs,0.7+0.25*hs,0.65+0.2*hs)}
      else{const s=(0.03+0.13*hs*hs)*fade;pebS.set(s,s,s);pebE.set((hz-0.5)*0.4,r*60,(hx-0.5)*0.4);pebP.set(x,y-s*0.15,z);
        const g=0.55+0.4*hash(z*4.1,x*2.9),w=hash(x,z*3.3);pebCol.setRGB(g*(0.95+0.12*w),g*(0.92+0.06*w),g*(0.88-0.04*w))}
      pebM.compose(pebP,pebQ.setFromEuler(pebE),pebS);const im=all[kind];im.setMatrixAt(n[kind],pebM);im.setColorAt(n[kind],pebCol);n[kind]++}}
  all.forEach((im,k)=>{im.count=n[k];im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true})}
// gfx.js: the share drawn (0 none)
function pebGfx(k){PEB.k=k||0;PEB.cx=1e9;if(!PEB.k)for(const im of [...PEB.stones,PEB.stick])im.count=0}
// every frame (main.js): set again when the camera has moved a few feet, or every two seconds (digging); none from high above
function pebTick(dt){if(!PEB.k)return;PEB.t+=dt;const c=camera.position,hi=c.y-hAt(c.x,c.z)>60;
  for(const im of [...PEB.stones,PEB.stick])im.visible=!hi;if(hi)return;
  if(Math.hypot(c.x-PEB.cx,c.z-PEB.cz)>2.5||PEB.t>2){PEB.t=0;PEB.cx=c.x;PEB.cz=c.z;pebPlace(c.x,c.z)}}
