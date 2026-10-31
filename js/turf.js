// Corley's Island: the town's lawns up close (Harbor Square's green, the lawns round it and the houses' yards). The
// ground there is a deep, photo-scanned lawn (groundColor, scenery.js; textures/ground grass); on it stand instanced
// clumps of lawn grass, thicker and taller along the paths, walks and kerbs, with clover in drifts (white heads),
// dandelion and plantain rosettes by the edges, and fallen autumn leaves scattered in drifts and blown up against the
// edges. The grass sways in the wind and leans away from the worker; in the wet (soakAt, mud.js) it all darkens.
// Built lazily in 24 m squares as the camera comes near (from the ground and the things on it as they are: baseHeight,
// padAt, roads and SOLIDS), dropped when far behind, and rebuilt where the map editor changes things (turfEdRefresh).
// How thick it grows and how far it reaches is the Graphics setting's Town lawns (turf, gfx.js); the phone gets a light
// scatter close round you. Only drawing: nothing here changes what the ground does.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// the area (x0, x1, z0, z1) and the squares' size (m)
const TURF_BOX=[-192,192,544,784],TURF_W=24,TURF_NX=(TURF_BOX[1]-TURF_BOX[0])/TURF_W,TURF_NZ=(TURF_BOX[3]-TURF_BOX[2])/TURF_W,TURF_C=0.5;
// the kinds: lawn grass, dandelion, clover, plantain (tuft shapes, scenery.js) and fallen leaves (their own)
const TURF_TUFT=[0,1,2,4],TURF_KINDS=5,TURF_SWAY=[5,2.5,2.5,2,0],TURF_KR=[0.35,0.55,0.55,0.55,0.7];
const turf={sq:new Map(),q:-1,t:0,wetT:0};
// fallen leaves: five flat leaves bent along the midrib and curling up a little at the edges, scattered over 0.45 m;
// near white with a little mottling, the clump's own colour tints them
function turfLeafGeo(){let s=77;const R=()=>{s=(s*16807)%2147483647;return s/2147483647},P=[],C=[],A=[];
  for(let l=0;l<5;l++){const r=Math.sqrt(R())*0.22,a=R()*6.28,cx=Math.cos(a)*r,cz=Math.sin(a)*r,yw=R()*6.28,L=0.09+R()*0.06,W=L*(0.45+R()*0.25),
      c=Math.cos(yw),sn=Math.sin(yw),y0=0.006+l*0.0015,sh=0.75+R()*0.35;
    const at=(u,v,y)=>[cx+u*c-v*sn,y0+y,cz+u*sn+v*c];
    const B=at(-L/2,0,0),T=at(L/2,0,0.004),M=at(0,0,0.002),Lf=at(-L*0.05,W/2,0.012),Rt=at(-L*0.05,-W/2,0.01);
    for(const [p,q,w] of [[B,M,Lf],[M,T,Lf],[B,Rt,M],[M,Rt,T]])for(const v of [p,q,w]){P.push(...v);
      const k=sh*(v===M||v===B?0.85:1);C.push(k,k*(0.96+0.06*R()),k*0.95);A.push(0)}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));
  g.setAttribute('aHead',new THREE.Float32BufferAttribute(A,1));g.computeVertexNormals();return g}
const TURF_LEAF=turfLeafGeo();
// a step simpler than the Grass quality setting's shapes (there are many more of them here)
const turfQ=()=>Math.max(0,tuftQ-1),turfGeo=k=>k<4?(TUFT_GQ[turfQ()]||(TUFT_GQ[turfQ()]=tuftGeos(turfQ())))[TURF_TUFT[k]]:TURF_LEAF;
// one material per kind: thinned with distance by rank like the field's clumps (scenery.js), swaying in the same gusts,
// leaning from the worker and the machines (lawnPush, mower.js), seed and flower heads from aTuft, and the light
// through the blades looking toward the sun
const turfMats=TURF_SWAY.map(sw=>{const mat=M(0xffffff,{side:THREE.DoubleSide,vertexColors:true}),thin={value:new THREE.Vector4(1,25,60,0)};mat.userData.thin=thin;
  mat.onBeforeCompile=sh=>{sh.uniforms.uSway={value:sw};sh.uniforms.uTime=timeU;sh.uniforms.uDayK=dayKU;sh.uniforms.uThin=thin;sh.uniforms.uSun={value:SUN_DIR};sh.uniforms.uPush=lawnPush;
    sh.vertexShader='uniform float uTime;\nuniform float uSway;\nuniform vec4 uThin;\nuniform vec4 uPush[5];\nattribute vec4 aTuft;\nattribute float aHead;\nvarying vec3 vLW;\nvarying float vTip;\n'+sh.vertexShader
      .replace('#include <color_vertex>','vColor=vec4(1.0);\n#ifdef USE_COLOR\nvColor.rgb*=color;\n#endif\n#ifdef USE_INSTANCING_COLOR\nvColor.rgb*=mix(instanceColor,aTuft.yzw,step(0.5,aHead)*step(aHead,1.5));\n#endif')
      .replace('#include <project_vertex>',
      'vec3 root=instanceMatrix[3].xyz;\n'+
      'float fs=uThin.x*(1.0-smoothstep(uThin.y,uThin.z,distance(root,cameraPosition)));\n'+
      'vec4 mvPosition=instanceMatrix*vec4(transformed*clamp((fs-aTuft.x)/0.08,0.0,1.0)*(1.0+0.5*(1.0-fs/max(uThin.x,0.001)))*(1.0-step(0.5,aHead)*step(aTuft.y,-0.5)),1.0);\n'+
      'float hg=max(0.0,mvPosition.y-root.y);vec2 wd=vec2(0.8,0.6);\n'+
      'float gust=pow(0.5+0.5*sin(dot(root.xz,wd)*0.42-uTime*1.9+1.5*sin(dot(root.xz,vec2(-0.6,0.8))*0.11+uTime*0.23)),3.0);\n'+
      'float fl=sin(uTime*5.3+root.x*2.1+root.z*1.7)*0.5+sin(uTime*3.1+root.x*1.7-root.z*1.1)*0.5;\n'+
      'mvPosition.xz+=wd*hg*hg*uSway*(0.25+1.1*gust+0.25*fl);mvPosition.y-=hg*hg*uSway*0.3*gust;\n'+
      'for(int m=0;m<5;m++){vec2 d=root.xz-uPush[m].xy;float l=length(d),f=1.0-smoothstep(uPush[m].z*0.55,uPush[m].z+0.35,l);\n'+
      'if(f>0.0){mvPosition.xz+=d/max(l,0.05)*hg*0.9*f;mvPosition.y-=hg*0.6*f;}}\n'+
      'vColor.rgb*=1.0+0.15*gust*smoothstep(0.03,0.15,hg);\n'+
      'vLW=mvPosition.xyz;vTip=smoothstep(0.02,0.15,hg);\n'+
      'mvPosition=modelViewMatrix*mvPosition;\ngl_Position=projectionMatrix*mvPosition;');
    sh.fragmentShader='uniform vec3 uSun;\nuniform float uDayK;\nvarying vec3 vLW;\nvarying float vTip;\n'+sh.fragmentShader.replace('#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\nfloat bl=pow(max(0.0,dot(normalize(vLW-cameraPosition),uSun)),3.0);\ntotalEmissiveRadiance+=diffuseColor.rgb*vec3(1.0,1.15,0.4)*bl*vTip*0.7*uDayK;')};
  return mat});
const turfGroup=new THREE.Group();scene.add(turfGroup);
// the ground mesh's own height at x, z (the town's 4 m mesh, 1 m where the causeway lands: scenery.js), so the clumps
// and leaves sit on the drawn ground, not the smooth one under it
function turfY(x,z){const f=MAIN_FINE[1],fine=x>=f[0]&&x<=f[1]&&z>=f[2]&&z<=f[3],C=fine?1:4,X0=fine?f[0]:MAIN_TOWN[0],Z0=fine?f[2]:MAIN_TOWN[2];
  const i=Math.floor((x-X0)/C),j=Math.floor((z-Z0)/C),u=(x-X0)/C-i,v=(z-Z0)/C-j,x0=X0+i*C,z0=Z0+j*C;
  if(u+v<1){const h=baseHeight(x0,z0);return h+(baseHeight(x0+C,z0)-h)*u+(baseHeight(x0,z0+C)-h)*v}
  const h=baseHeight(x0+C,z0+C);return h+(baseHeight(x0,z0+C)-h)*(1-u)+(baseHeight(x0+C,z0)-h)*(1-v)}
// whether x, z is open lawn: on the mainland's ground above the water, under no walk, road, building or thing
function turfLawn(x,z,sol){if(baseHeight(x,z)<WATER+0.4||padAt(x,z)>-1e8||roadAmt(x,z)>0.08)return false;
  for(const s of sol){let dx=x-s.x,dz=z-s.z,hx=s.hx,hz=s.hz;if(s.sn!==undefined){const a=dx*s.cs-dz*s.sn;dz=dx*s.sn+dz*s.cs;dx=a;hx=s.lx;hz=s.lz}
    if(Math.abs(dx)<hx+0.1&&Math.abs(dz)<hz+0.1)return false}
  return true}
// one square's clumps, from a seed of its own so a rebuild comes out the same
function turfBuild(si,sj){const X0=TURF_BOX[0]+si*TURF_W,Z0=TURF_BOX[2]+sj*TURF_W,B=2,NX=TURF_W/TURF_C+2*B,cx=X0+TURF_W/2,cz=Z0+TURF_W/2;
  let s=(si*7919+sj*104729+1)|0;const R=()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
  const r=TURF_W*0.75,sol=SOLIDS.filter(o=>Math.abs(o.x-cx)<r+Math.max(o.hx,o.hz,o.lx||0,o.lz||0)&&Math.abs(o.z-cz)<r+Math.max(o.hx,o.hz,o.lx||0,o.lz||0));
  // the lawn on a 0.5 m grid, two cells past the square each way, then how near each cell is to the lawn's edge
  const g=new Uint8Array(NX*NX);let any=false;
  for(let j=0;j<NX;j++)for(let i=0;i<NX;i++){const x=X0+(i-B+0.5)*TURF_C,z=Z0+(j-B+0.5)*TURF_C;if(turfLawn(x,z,sol)){g[j*NX+i]=1;any=true}}
  const S={si,sj,cx,cz,meshes:[],cols:[],soak:0};if(!any)return S;
  const P=[[],[],[],[],[]],o=new THREE.Object3D();
  const add=(k,x,z,sc,sy,col,head,yaw)=>{o.position.set(x,turfY(x,z)+(k===4?0.003:-0.015),z);o.rotation.set(k===4?0:(R()-0.5)*0.2,yaw===undefined?R()*6.28:yaw,k===4?0:(R()-0.5)*0.2);
    o.scale.set(sc,sy,sc);o.updateMatrix();P[k].push([o.matrix.clone(),col,head])};
  const LEAVES=[[0.86,0.42,0.12],[0.66,0.26,0.09],[0.5,0.32,0.15],[0.88,0.64,0.2],[0.72,0.2,0.08],[0.42,0.27,0.13]];
  for(let j=B;j<NX-B;j++)for(let i=B;i<NX-B;i++){if(!g[j*NX+i])continue;
    let e=0;for(let dj=-2;dj<=2&&e<1;dj++)for(let di=-2;di<=2;di++)if(!g[(j+dj)*NX+i+di]){e=Math.max(e,Math.max(Math.abs(di),Math.abs(dj))===1?1:0.5);if(e===1)break}
    const bx=X0+(i-B)*TURF_C,bz=Z0+(j-B)*TURF_C,J=()=>[bx+R()*TURF_C,bz+R()*TURF_C];
    // the lawn's green, deeper in the lush drifts and toward the edges, yellower in the worn and dry ones
    const lu=tuftNoise(bx*0.09+17,bz*0.09+41),dr=ss(0.6,0.85,tuftNoise(bx*0.05+60,bz*0.05+9)),cl=ss(0.5,0.78,tuftNoise(bx*0.18+150,bz*0.18+33)),
      lv=ss(0.42,0.8,tuftNoise(bx*0.07+300,bz*0.07+70));
    const gc=()=>{const v=0.9+0.3*R(),d=dr*0.6*R();return [(0.22+0.07*lu+0.2*d)*v,(0.38+0.06*lu+0.04*d)*v*(1+0.06*e),(0.12+0.04*lu+0.03*d)*v]};
    // small upright tufts, two or three to a cell and more along the edges, where they grow taller and some go to seed
    const ng=2+(R()<0.5?1:0)+(R()<e?2:0);
    for(let m=0;m<ng;m++){const [x,z]=J(),tall=e>0&&R()<0.6*e,sc=0.3+0.16*R();
      add(0,x,z,sc,sc*(tall?1.5+0.6*R():0.9+0.4*R())*(1+0.15*lu),gc(),tall&&R()<0.3?[0.72+0.1*R(),0.66,0.42]:null)}
    if(R()<0.04+0.45*cl+0.2*e){const [x,z]=J();add(2,x,z,0.9+0.4*R(),0.8+0.5*R(),[0.18+0.04*R(),0.36+0.05*R(),0.15],R()<0.6?(R()<0.85?[1,0.97,0.94]:[0.95,0.72,0.82]):null)}
    if(R()<0.015+0.18*e){const [x,z]=J();add(1,x,z,0.6+0.4*R(),0.5+0.3*R(),[0.19,0.36,0.14],R()<0.15?[1,0.82,0.16]:null)}
    if(R()<0.01+0.2*e){const [x,z]=J();add(3,x,z,0.6+0.4*R(),0.45+0.3*R(),[0.22,0.37,0.15],R()<0.4?[0.5,0.42,0.28]:null)}
    if(R()<0.03+0.22*lv+0.45*e){const [x,z]=J();const c=LEAVES[Math.floor(R()*LEAVES.length)],v=0.8+0.3*R();add(4,x,z,0.8+0.5*R(),1,[c[0]*v,c[1]*v,c[2]*v],null)}}
  for(let k=0;k<TURF_KINDS;k++){const L=P[k];if(!L.length){S.meshes.push(null);S.cols.push(null);continue}
    // shuffled, so the ranks thin out evenly
    for(let a=L.length-1;a>0;a--){const b=Math.floor(R()*(a+1));[L[a],L[b]]=[L[b],L[a]]}
    const G=turfGeo(k),geo=new THREE.BufferGeometry();for(const a of ['position','color','normal','aHead'])geo.setAttribute(a,G.attributes[a]);if(G.index)geo.setIndex(G.index);
    const n=L.length,at=new Float32Array(n*4),col=new Float32Array(n*3);geo.setAttribute('aTuft',new THREE.InstancedBufferAttribute(at,4));
    const im=new THREE.InstancedMesh(geo,turfMats[k],n);im.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(n*3),3);
    L.forEach(([mx,c,h],q)=>{im.setMatrixAt(q,mx);at[q*4]=(q+0.5)/n;at[q*4+1]=h?h[0]:-1;at[q*4+2]=h?h[1]:0;at[q*4+3]=h?h[2]:0;col[q*3]=c[0];col[q*3+1]=c[1];col[q*3+2]=c[2]});
    im.instanceColor.array.set(col);im.receiveShadow=true;im.frustumCulled=true;
    const y=baseHeight(cx,cz);geo.boundingSphere=new THREE.Sphere(new THREE.Vector3(cx,y,cz),TURF_W*0.75+3);
    im.userData.n=n;im.userData.k=k;S.meshes.push(im);S.cols.push(col);turfGroup.add(im)}
  turfWet(S,true);return S}
function turfDrop(S){for(const im of S.meshes)if(im){turfGroup.remove(im);im.geometry.dispose();im.dispose()}}
// in the wet the lawn and the leaves darken, the grass toward a deeper green (soakAt: the soil water, mud.js)
function turfWet(S,force){let w=0;for(const [dx,dz] of [[0,0],[-8,-8],[8,-8],[-8,8],[8,8]])w+=soakAt(S.cx+dx,S.cz+dz);w/=5;
  if(!force&&Math.abs(w-S.soak)<0.04)return;S.soak=w;
  S.meshes.forEach((im,k)=>{if(!im)return;const c=S.cols[k],a=im.instanceColor.array,d=1-0.4*w,dg=1-0.3*w;
    for(let q=0;q<a.length;q+=3){a[q]=c[q]*d;a[q+1]=c[q+1]*dg;a[q+2]=c[q+2]*d}im.instanceColor.needsUpdate=true})}
// every frame: build the nearest missing square within reach (one a frame), drop the far ones, and thin each square's
// clumps with distance from the Graphics setting's Town lawns (turf, the share drawn) and its distance (turfR, m)
function turfLod(){const G=typeof gfxCur!=='undefined'&&gfxCur.turf!=null?gfxCur:{turf:1,turfR:60},g=[G.turf,G.turfR*0.45,G.turfR],cx=camera.position.x,cz=camera.position.z;
  const on=g[0]>0&&cz>TURF_BOX[2]-g[2]&&cz<TURF_BOX[3]+g[2]&&cx>TURF_BOX[0]-g[2]&&cx<TURF_BOX[1]+g[2];turfGroup.visible=on;
  for(let k=0;k<TURF_KINDS;k++)turfMats[k].userData.thin.value.set(g[0],g[1]*TURF_KR[k],g[2]*TURF_KR[k],0);
  if(turf.q!==turfQ()){turf.q=turfQ();for(const S of turf.sq.values())S.meshes.forEach((im,k)=>{if(!im||k>3)return;const G=turfGeo(k);
    for(const a of ['position','color','normal','aHead'])im.geometry.setAttribute(a,G.attributes[a]);im.geometry.setIndex(G.index)})}
  if(!on)return;
  const dq=(si,sj)=>Math.hypot(Math.max(0,Math.abs(cx-(TURF_BOX[0]+(si+0.5)*TURF_W))-TURF_W/2),Math.max(0,Math.abs(cz-(TURF_BOX[2]+(sj+0.5)*TURF_W))-TURF_W/2));
  let best=null,bd=g[2]+4;
  for(let sj=0;sj<TURF_NZ;sj++)for(let si=0;si<TURF_NX;si++){const key=sj*TURF_NX+si,d=dq(si,sj);if(!turf.sq.has(key)&&d<bd){bd=d;best=[si,sj,key]}}
  if(best)turf.sq.set(best[2],turfBuild(best[0],best[1]));
  const wet=(turf.wetT+=1)%90===0;
  for(const [key,S] of turf.sq){const d=dq(S.si,S.sj);if(d>g[2]+60){turfDrop(S);turf.sq.delete(key);continue}
    if(wet&&d<g[2])turfWet(S);
    for(const im of S.meshes){if(!im)continue;const k=im.userData.k,n=im.userData.n,f=g[0]*(1-ss(g[1]*TURF_KR[k],g[2]*TURF_KR[k],d));
      im.count=Math.min(n,Math.ceil(f*n)+1);im.visible=f>0.002}}}
// after the map editor lays a road or places or moves a thing in an area (metres): its squares are built again
function turfEdRefresh(x0,x1,z0,z1){for(const [key,S] of turf.sq){const X0=TURF_BOX[0]+S.si*TURF_W,Z0=TURF_BOX[2]+S.sj*TURF_W;
  if(x1>X0-2&&x0<X0+TURF_W+2&&z1>Z0-2&&z0<Z0+TURF_W+2){turfDrop(S);turf.sq.delete(key)}}}
