// The map editor's paved streets: a road with pv set (the road card's Paved, or New street) is drawn in the library's
// asphalt like Main Street (mainland.js), with a double yellow centre line (cl), and when asked a 6 in concrete curb and
// gutter each side (cb) and a broom-finish sidewalk sw metres wide scored every 5 ft. Curbs and sidewalks are walk pads
// (feet and wheels step up onto them, tag 'street'). Where a street runs into another, its curbs, gutters, sidewalks
// and line stop at the other's edge, so crossings and T-junctions open up by themselves. Built on baseHeight, so it is
// rebuilt after every road change (roadsBuild) and by edRefresh over a street (streetsEdRefresh). A street's surface (sf)
// can instead be brick or cobblestone with real relief (ST_SURF)
const ST={grp:null,curb:0.15,top:0.17,lift:0.035,gut:0.4,joint:1.524,box:null,pbr:false};
// the street surfaces besides asphalt (sf on a street: 1 brick, 2 cobblestone, 3 fan cobbles, 4 old brick): CC0 photo-scanned paving
// (tools/street_tex.py, CREDITS.md) laid in the street's own frame, its rows straight across the street; ft the tile's
// size, dep how far the bricks stand up out of their joints at 100% (metres, the Street paving relief tuning), c the
// mean colour until the picture is in. Low and Medium draw the colour only; with Material relief (High) a parallax march
// through the height map raises every brick and sett, shades the joints on its far side from the sun, and reads the
// scan's normals, roughness and ambient occlusion where the eye's ray meets the paving (ST_POM)
const ST_SURF=[null,{id:'brick',n:'Brick',ft:5.09,dep:0.022,c:[0.604,0.534,0.523]},{id:'cobble',n:'Cobblestone',ft:3.77,dep:0.03,c:[0.479,0.470,0.409]},
  {id:'fan',n:'Fan cobbles',ft:17.7,dep:0.016,c:[0.426,0.397,0.355]},{id:'oldbrick',n:'Old brick',ft:6.73,dep:0.022,c:[0.421,0.392,0.371]}];
// the relief: from where the eye's ray enters the top of the paving it steps down through the height map (B of the _m
// map, 1 on top of a brick) to where it meets a brick or a joint, and from there a few steps toward the sun (shaded if a
// brick is in the way); dep in texture units, fading out by 130 ft so far paving stays calm and cheap
const ST_POM=`uniform float uStRel;
float stH(vec2 p,vec2 dx,vec2 dy){return textureGrad(roughnessMap,p,dx,dy).b;}
vec2 stPom(vec2 uv,vec3 V,vec3 L,float dep,out float sh){sh=1.0;if(dep<1e-5||V.z<=0.0)return uv;
  vec2 dx=dFdx(uv),dy=dFdy(uv),p=uv,pp=uv;float n=floor(mix(24.0,8.0,V.z)),st=1.0/n,l=0.0,h=1.0-stH(uv,dx,dy),hp=h;vec2 d=-V.xy/max(V.z,0.2)*dep*st;
  for(int i=0;i<24;i++){if(l>=h||float(i)>=n)break;pp=p;hp=h;p+=d;l+=st;h=1.0-stH(p,dx,dy);}
  float a=h-l,b=hp-l+st;p=mix(p,pp,clamp(a/min(a-b,-1e-5),0.0,1.0));
  float hd=1.0-stH(p,dx,dy);if(L.z>0.02&&hd>0.02){vec2 e=L.xy/max(L.z,0.15)*dep*hd/6.0;float o=0.0;
    for(int j=1;j<=6;j++){float f=float(j)/6.0;o=max(o,hd*(1.0-f)-1.0+stH(p+e*float(j),dx,dy));}
    sh=1.0-0.8*smoothstep(0.0,0.3,o);}
  return p;}
`;
const ST_POM_ON='defined(USE_NORMALMAP_TANGENTSPACE)&&defined(USE_ROUGHNESSMAP)';
function stPomPatch(sh){sh.uniforms.uStRel=this.userData.relU;
  sh.fragmentShader=sh.fragmentShader.replace('void main() {',`#if ${ST_POM_ON}\n${ST_POM}#endif\nvoid main() {`)
    .replace('#include <map_fragment>',`#if ${ST_POM_ON}
float stSh=1.0;vec2 stUv=vNormalMapUv;
{mat3 sT=getTangentFrame(-vViewPosition,normalize(vNormal),vNormalMapUv);vec3 sL=vec3(0.0,0.0,-1.0);
#if NUM_DIR_LIGHTS>0
sL=directionalLights[0].direction*sT;
#endif
stUv=stPom(vNormalMapUv,normalize(vViewPosition)*sT,sL,uStRel*(1.0-smoothstep(25.0,40.0,length(vViewPosition))),stSh);}
#define vMapUv stUv
#define vRoughnessMapUv stUv
#define vAoMapUv stUv
#endif
#include <map_fragment>`)
    .replace('#include <normal_fragment_begin>',`#include <normal_fragment_begin>\n#if ${ST_POM_ON}\n#define vNormalMapUv stUv\n#endif`)
    .replace('#include <lights_fragment_begin>',`#include <lights_fragment_begin>\n#if ${ST_POM_ON}\nreflectedLight.directDiffuse*=stSh;reflectedLight.directSpecular*=stSh;\n#endif`)}
// a surface's material, made the first time a street uses it; its relief maps load the first time relief is on
function stSurfMat(f){const d=ST_SURF[f];if(d.m)return d.m;
  const m=d.m=new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.8,envMap:skyEnv,envMapIntensity:0.5,aoMapIntensity:0.6});
  m.color.setRGB(d.c[0],d.c[1],d.c[2]);m.userData.lib='street_'+d.id;m.userData.relU={value:0};m.onBeforeCompile=stPomPatch;
  new THREE.TextureLoader().load(`textures/street_${d.id}.jpg`,t=>{stTex(t);t.colorSpace=THREE.SRGBColorSpace;m.map=t;m.color.setScalar(1);m.needsUpdate=true});
  if(typeof wetPatch==='function')wetPatch(m);stSurfPbr(m);return m}
function stTex(t){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t}
function stSurfPbr(m){const on=ST.pbr,u=m.userData;
  if(on&&u.n===undefined){u.n=null;let k=0;const L=s=>stTex(new THREE.TextureLoader().load(`textures/${u.lib}${s}.jpg`,()=>{if(++k===2){u.n=n;u.r=r;stSurfPbr(m)}})),n=L('_n'),r=L('_m');return}
  const p=on&&!!u.n;if(!!m.normalMap===p)return;m.normalMap=p?u.n:null;m.roughnessMap=m.aoMap=p?u.r:null;m.roughness=p?1:0.8;m.needsUpdate=true}
// relief on (High graphics, Material relief) or off: gfx.js
function stPbr(on){ST.pbr=!!on;for(const d of ST_SURF)if(d&&d.m)stSurfPbr(d.m)}
// each frame a surface is drawn: its relief depth in texture units from the tuning
function stRelSync(){for(const d of ST_SURF)if(d&&d.m)d.m.userData.relU.value=d.dep*TU.stRelief/(d.ft*0.3048)}
// the paved roads' centreline segments, each with whether its ends are the road's ends (cut flat there, not rounded)
function stSegs(){const L=[];for(const r of ROADS){if(!r.pv||r.pts.length<2)continue;const n=r.pts.length,cl=stClosed(r);
    for(let k=0;k<n-1;k++){const a=r.pts[k],b=r.pts[k+1],dx=b[0]-a[0],dz=b[1]-a[1],l2=dx*dx+dz*dz;if(l2<1e-6)continue;
      L.push({r,ax:a[0],az:a[1],dx,dz,il:1/l2,hw:r.w/2,e0:!cl&&k===0,e1:!cl&&k===n-2})}}
  return L}
const stClosed=r=>r.pts.length>3&&Math.hypot(r.pts[0][0]-r.pts[r.pts.length-1][0],r.pts[0][1]-r.pts[r.pts.length-1][1])<0.3;
// whether x, z is on the carriageway of a paved street other than r (m metres of margin)
function stIn(L,r,x,z,m){for(const q of L){if(q.r===r)continue;const t=((x-q.ax)*q.dx+(z-q.az)*q.dz)*q.il;
    if(t<0&&q.e0||t>1&&q.e1)continue;const u=t<0?0:t>1?1:t;if(Math.hypot(x-q.ax-q.dx*u,z-q.az-q.dz*u)<q.hw+m)return true}
  return false}
// how far a paved street's edge reaches out from its centreline: curb and sidewalk
const stReach=r=>r.w/2+(r.cb?ST.curb:0)+(r.sw||0);
// a road's frame: its points, the left normal mitred at each point (so offsets stay parallel round the bends)
function stFrame(r){const P=r.pts.filter((q,i)=>!i||Math.hypot(q[0]-r.pts[i-1][0],q[1]-r.pts[i-1][1])>1e-3),n=P.length,cl=stClosed(r),N=[],M=[];
  for(let i=0;i<n-1;i++){const dx=P[i+1][0]-P[i][0],dz=P[i+1][1]-P[i][1],l=Math.hypot(dx,dz);N.push([-dz/l,dx/l,dx/l,dz/l,l])}
  for(let i=0;i<n;i++){const a=i>0?N[i-1]:cl?N[n-2]:N[0],b=i<n-1?N[i]:cl?N[0]:N[n-2];let mx=a[0]+b[0],mz=a[1]+b[1];const ml=Math.hypot(mx,mz)||1;mx/=ml;mz/=ml;
    const c=Math.max(0.4,mx*a[0]+mz*a[1]);M.push([mx/c,mz/c])}
  return {P,N,M,n}}
function streetsBuild(){const G=baseHeight;
  if(ST.grp){scene.remove(ST.grp);ST.grp.traverse(o=>{if(o.geometry)o.geometry.dispose()});ST.grp=null}
  ST.dirty=0;walkPadsDrop('street');const L=stSegs();ST.box=null;if(!L.length)return;
  if(typeof shopLoad==='function')shopLoad();
  const K=shopKit(),SF=[],asph=shopLib('asphalt'),walk=shopLib('concrete_broom'),conc=shopLib('concrete'),
    joint=ST.jm||(ST.jm=shopStd(0x6a6862,0,0.95)),yel=ST.ym||(ST.ym=shopStd(0xd8b024,0,0.6));
  ROADS.forEach((r,ri)=>{if(!r.pv||r.pts.length<2)return;const F=stFrame(r);if(F.n<2)return;const hw=r.w/2,lift=ST.lift+0.002*(ri%5);
    for(const q of F.P){const e=stReach(r)+1;ST.box=edUnionBox(ST.box,[q[0]-e,q[0]+e,q[1]-e,q[1]+e])}
    const at=(i,t,s)=>{const a=F.P[i],b=F.P[i+1],ma=F.M[i],mb=F.M[i+1],x=a[0]+ma[0]*s+(b[0]+mb[0]*s-a[0]-ma[0]*s)*t,z=a[1]+ma[1]*s+(b[1]+mb[1]*s-a[1]-ma[1]*s)*t;return [x,z]};
    // a band from offset s0 to s1 (left of the centreline is +), lifted y0 at s0 and y1 at s1 over the ground (a wall when
    // s0 = s1), facing up or, for a wall, toward side f; cut: leave out the pieces on another street; pad: lay walk pads
    // sf: a brick or cobble surface's collector instead, which takes the triangles with texture coordinates in each
    // segment's own frame (u across, v along from the street's start), so the rows meet the next segment's at the mitre
    const band=(mat,s0,y0,s1,y1,f,cut,pad,sf)=>{const Pos=[],wall=Math.abs(s1-s0)<1e-4,na=wall?1:Math.max(1,Math.ceil(Math.abs(s1-s0)/1.0));let v0=0;
      for(let i=0;i<F.n-1;v0+=F.N[i][4],i++){const [nx,nz,ux,uz,len]=F.N[i],nl=Math.max(1,Math.ceil(len/1.5)),o0=F.P[i];
        for(let k=0;k<nl;k++){const t0=k/nl,t1=(k+1)/nl;
          if(cut){const [mx,mz]=at(i,(t0+t1)/2,(s0+s1)/2);if(stIn(L,r,mx,mz,0.05))continue}
          for(let a=0;a<na;a++){const sa=s0+(s1-s0)*a/na,sb=s0+(s1-s0)*(a+1)/na,ya=y0+(y1-y0)*a/na,yb=y0+(y1-y0)*(a+1)/na;
            const v=(t,s,y)=>{const [x,z]=at(i,t,s);return [x,(wall?G(x,z):G(x,z))+y,z]};
            const A=v(t0,sa,ya),B=v(t0,sb,yb),C=v(t1,sa,ya),D=v(t1,sb,yb);
            const tri=(p,q,o)=>{const e1=[q[0]-p[0],q[1]-p[1],q[2]-p[2]],e2=[o[0]-p[0],o[1]-p[1],o[2]-p[2]],cx=e1[1]*e2[2]-e1[2]*e2[1],cy=e1[2]*e2[0]-e1[0]*e2[2],cz=e1[0]*e2[1]-e1[1]*e2[0];
              const d=wall?(cx*nx+cz*nz)*f:cy;if(d<0)[q,o]=[o,q];Pos.push(...p,...q,...o);
              if(sf)for(const w of [p,q,o])sf.U.push(((w[0]-o0[0])*nx+(w[2]-o0[1])*nz)*sf.t,(v0+(w[0]-o0[0])*ux+(w[2]-o0[1])*uz)*sf.t)};
            tri(A,C,B);tri(B,C,D)}
          if(pad){const [mx,mz]=at(i,(t0+t1)/2,(s0+s1)/2);walkPad(mx,mz,Math.abs(s1-s0)/2,len/nl/2+0.02,Math.atan2(ux,uz),0,{l:y0,tag:'street'})}}}
      if(!Pos.length)return;if(sf){sf.P.push(...Pos);return}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(Pos,3));K.put(mat,g)};
    const sd=ST_SURF[r.sf];if(sd){const c=SF[r.sf]||(SF[r.sf]={P:[],U:[],t:1/(sd.ft*0.3048)});band(null,-hw,lift,hw,lift,0,false,false,c)}
    else band(asph,-hw,lift,hw,lift,0,false,false);
    if(r.cl&&r.w>=4.2)for(const o of [-0.12,0.12])band(yel,o-0.05,lift+0.006,o+0.05,lift+0.006,0,true,false);
    const sw=r.sw||0,top=r.cb?ST.top:lift+0.03,a=hw+(r.cb?ST.curb:0),b=a+sw;
    for(const s of [-1,1]){const S=(o)=>o*s,lo=(p,q)=>[Math.min(S(p),S(q)),Math.max(S(p),S(q))];
      if(r.cb){const [g0,g1]=lo(hw-ST.gut,hw);band(conc,g0,lift+0.004,g1,lift+0.004,0,true,false);
        const [c0,c1]=lo(hw,hw+ST.curb);band(conc,c0,top,c1,top,0,true,!sw);band(conc,S(hw),lift,S(hw),top,-s,true,false);
        if(!sw)band(conc,S(hw+ST.curb),top,S(hw+ST.curb),-0.05,s,true,false)}
      if(sw>0){const [w0,w1]=lo(a,b);band(walk,w0,top,w1,top,0,true,top>0.08);band(conc,S(b),top,S(b),-0.05,s,true,false);
        if(!r.cb)band(conc,S(a),lift,S(a),top,-s,true,false);
        // the joints scored across the sidewalk every 5 ft
        let d=0;for(let i=0;i<F.n-1;i++){const len=F.N[i][4];for(let u=ST.joint-d%ST.joint;u<len;u+=ST.joint){const t=u/len,dt=0.012/len,[mx,mz]=at(i,t,S((a+b)/2));
            if(stIn(L,r,mx,mz,0.05))continue;const P=[],v=(tt,ss)=>{const [x,z]=at(i,tt,ss);return [x,G(x,z)+top+0.004,z]},A=v(t-dt,w0),B=v(t-dt,w1),C=v(t+dt,w0),D=v(t+dt,w1);
            for(const [p,q,o] of [[A,C,B],[B,C,D]]){const cy=(q[2]-p[2])*(o[0]-p[0])-(q[0]-p[0])*(o[2]-p[2]);if(cy<0)P.push(...p,...o,...q);else P.push(...p,...q,...o)}
            const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));K.put(joint,g)}d+=len}}}});
  ST.grp=new THREE.Group();ST.grp.name='streets';K.add(ST.grp);
  SF.forEach((c,f)=>{if(!c||!c.P.length)return;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(c.P,3));
    g.setAttribute('uv',new THREE.Float32BufferAttribute(c.U,2));g.computeVertexNormals();g.computeBoundingSphere();
    const m=new THREE.Mesh(g,stSurfMat(f));m.receiveShadow=true;m.layers.enable(RAIN_LAYER);m.onBeforeRender=stRelSync;ST.grp.add(m)});
  scene.add(ST.grp)}
const edUnionBox=(a,b)=>!a?b:!b?a:[Math.min(a[0],b[0]),Math.max(a[1],b[1]),Math.min(a[2],b[2]),Math.max(a[3],b[3])];
// edRefresh: the ground moved under x0..x1, z0..z1; rebuild the streets if one is there
// (after a road change, ST.dirty; else at the end of a stroke or drag)
function streetsEdRefresh(x0,x1,z0,z1,full){const b=ST.box;if(ST.dirty||full&&b&&x1>b[0]&&x0<b[1]&&z1>b[2]&&z0<b[3])streetsBuild()}
// the spots along a street for a row of things: every gap metres, on side 'both', 'left', 'right' or 'stagger', at off
// metres out from the centreline, each facing the street; none on another street's carriageway
function stAlong(r,gap,side,off){const F=stFrame(r),L=stSegs(),out=[];if(F.n<2)return out;let d=gap/2,n=0;
  for(let i=0;i<F.n-1;i++){const [nx,nz,ux,uz,len]=F.N[i];
    for(;d<len;d+=gap,n++){const sides=side==='left'?[1]:side==='right'?[-1]:side==='stagger'?[n%2?-1:1]:[1,-1];
      for(const s of sides){const px=F.P[i][0]+ux*d+nx*off*s,pz=F.P[i][1]+uz*d+nz*off*s;if(stIn(L,r,px,pz,1))continue;
        out.push({x:px,z:pz,yaw:Math.atan2(-nx*s,-nz*s)})}}
    d-=len}
  return out}
streetsBuild();
