// Corley's Island: the lake. The swells are the same three waves lakeY (walker.js) rides, so boats and the swimmer
// keep to the surface; on top of them the drawn water has fine wind ripples from a generated slope map (lkNrm, two
// layers drifting different ways, a third close up on High and Ultra), sky reflections that grow at a slant (Fresnel),
// a glitter of sun, colour from how deep it is (the lake bed baked from baseHeight into lkBed, so the sand shows
// faintly through the murky shallows and the deep water dark teal), foam lapping the waterline with the swells, and rain rings while
// it rains. What it costs is the Graphics setting lakeQ (0 Low: two ripple layers, no rain rings); the water itself,
// where it stands and what floats on it, is the same on every device.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// ---------- lake ----------
// the slope map: 256 px a side, tiling; r and g the surface's slope east and south (wind waves, most from the
// south-west), b a soft noise for the foam's lace
const lkNrm=(function(){const N=256,d=new Uint8Array(N*N*4),sx=new Float32Array(N*N),sz=new Float32Array(N*N),fo=new Float32Array(N*N);
  let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
  const W=[];for(let n=0;n<44;n++){const k=2+Math.pow(rnd(),1.6)*26,a=(rnd()-0.5)*2.4+(rnd()<0.15?Math.PI:0)+0.7,
    kx=Math.round(Math.cos(a)*k),kz=Math.round(Math.sin(a)*k);if(!kx&&!kz)continue;const m=Math.hypot(kx,kz);W.push([kx,kz,Math.pow(m,-0.9),rnd()*6.283])}
  const F=[];for(let n=0;n<10;n++)F.push([Math.round((rnd()-0.5)*14),Math.round((rnd()-0.5)*14),rnd()*6.283]);
  let mx=0;for(let j=0;j<N;j++)for(let i=0;i<N;i++){const u=i/N*6.283,v=j/N*6.283,o=j*N+i;let a=0,b=0,f=0;
    for(const [kx,kz,A,p] of W){const c=A*Math.cos(kx*u+kz*v+p);a+=c*kx;b+=c*kz}
    for(const [kx,kz,p] of F)f+=Math.cos(kx*u+kz*v+p);
    sx[o]=a;sz[o]=b;fo[o]=f;mx=Math.max(mx,Math.abs(a),Math.abs(b))}
  for(let o=0;o<N*N;o++){d[o*4]=128+127*sx[o]/mx;d[o*4+1]=128+127*sz[o]/mx;d[o*4+2]=Math.max(0,Math.min(255,128+fo[o]*32));d[o*4+3]=255}
  const t=new THREE.DataTexture(d,N,N);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;
  t.generateMipmaps=true;t.anisotropy=8;t.needsUpdate=true;return t})();
// the lake bed: one byte a cell, 2 m cells over the whole lake round the islands (LK_BOX: x0, z0, width, depth), the
// bed's height from LK_TOP (just above the water) down 12.75 m; outside the box it is deep. Baked a few rows a frame
// (lkBedTick) once the game is up, and the map editor's changes again (lkBedEdit)
const LK_BOX=[-512,-640,1024,1536],LK_C=2,LK_NX=LK_BOX[2]/LK_C,LK_NZ=LK_BOX[3]/LK_C,LK_TOP=WATER+1;
const lkBedA=new Uint8Array(LK_NX*LK_NZ).fill(255),lkBed=new THREE.DataTexture(lkBedA,LK_NX,LK_NZ,THREE.RedFormat);
lkBed.magFilter=lkBed.minFilter=THREE.LinearFilter;lkBed.needsUpdate=true;
// the rows still to bake: [i0, i1, j0, j1, next row]
const lkBedJobs=[[0,LK_NX-1,0,LK_NZ-1,0]];
function lkBedEdit(x0,x1,z0,z1){const i0=Math.max(0,Math.floor((x0-LK_BOX[0])/LK_C)-1),i1=Math.min(LK_NX-1,Math.ceil((x1-LK_BOX[0])/LK_C)+1),
  j0=Math.max(0,Math.floor((z0-LK_BOX[1])/LK_C)-1),j1=Math.min(LK_NZ-1,Math.ceil((z1-LK_BOX[1])/LK_C)+1);if(i0<=i1&&j0<=j1)lkBedJobs.push([i0,i1,j0,j1,j0])}
function lkBedTick(ms){if(!lkBedJobs.length)return;const until=performance.now()+ms;
  while(lkBedJobs.length){const b=lkBedJobs[0];
    for(;b[4]<=b[3];b[4]++){if(performance.now()>until){lkBed.needsUpdate=true;return}const j=b[4],z=LK_BOX[1]+(j+0.5)*LK_C;
      for(let i=b[0];i<=b[1];i++){const h=baseHeight(LK_BOX[0]+(i+0.5)*LK_C,z);lkBedA[j*LK_NX+i]=Math.max(0,Math.min(255,Math.round((LK_TOP-h)*20)))}}
    lkBedJobs.shift()}
  lkBed.needsUpdate=true}
const lkU={uTime:timeU,uNrm:{value:lkNrm},uBed:{value:lkBed},uBedBox:{value:new THREE.Vector4(LK_BOX[0],LK_BOX[1],1/LK_BOX[2],1/LK_BOX[3])},
  uChop:{value:1},uRain:{value:0}};
const lkMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.05,metalness:0,envMap:skyEnv,transparent:true,
  blending:THREE.CustomBlending,blendSrc:THREE.OneFactor,blendDst:THREE.OneMinusSrcAlphaFactor});
lkMat.defines={LAKE_Q:2,LK_TOP:LK_TOP.toFixed(3)};
lkMat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,lkU);
  // the swells (as lakeY) and their slope, which the ripples ride on
  sh.vertexShader='uniform float uTime;\nvarying vec3 vWP;\nvarying vec2 vSl;\n'+sh.vertexShader
    .replace('#include <beginnormal_vertex>',`vec4 wp0=modelMatrix*vec4(position,1.0);
      float sa=wp0.x*0.09+uTime*1.1,sb=wp0.z*0.11+uTime*0.8,sc=(wp0.x+wp0.z)*0.23+uTime*1.7;
      vSl=vec2(0.0144*cos(sa)+0.0138*cos(sc),-0.0143*sin(sb)+0.0138*cos(sc));
      vec3 objectNormal=normalize(vec3(-vSl.x,1.0,-vSl.y));`)
    .replace('#include <begin_vertex>',`vec3 transformed=vec3(position);
      transformed.y+=sin(sa)*0.16+cos(sb)*0.13+sin(sc)*0.06;vWP=(modelMatrix*vec4(transformed,1.0)).xyz;`);
  sh.fragmentShader=`uniform float uTime,uChop,uRain;uniform sampler2D uNrm,uBed;uniform vec4 uBedBox;
varying vec3 vWP;varying vec2 vSl;
float lkD,lkFoam,lkF,lkDist;vec3 lkN;
vec2 lkS(vec2 p){return texture2D(uNrm,p).xy*2.0-1.0;}
#if LAKE_Q>0
// rings spreading from raindrops: a drop in each cell of a 0.6 m grid, each at its own time
vec2 lkRain(vec2 p,float t){vec2 s=vec2(0.0);p*=1.6;vec2 c=floor(p);
  for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 g=c+vec2(float(i),float(j));
    vec3 h=fract(sin(vec3(dot(g,vec2(127.1,311.7)),dot(g,vec2(269.5,183.3)),dot(g,vec2(419.2,371.9))))*43758.5453);
    float ph=fract(t*0.9+h.z);vec2 d=p-g-h.xy;float r=length(d),w=r-ph*1.3;
    s+=d/(r+1e-3)*sin(w*30.0)*exp(-w*w*60.0)*(1.0-ph)*(1.0-ph);}
  return s*0.5;}
#endif
`+sh.fragmentShader
    .replace('#include <color_fragment>',`#include <color_fragment>
      lkDist=length(cameraPosition-vWP);vec3 lkV=(cameraPosition-vWP)/lkDist;
      vec2 bu=(vWP.xz-uBedBox.xy)*uBedBox.zw;
      float bed=(bu.x<0.0||bu.y<0.0||bu.x>1.0||bu.y>1.0)?-99.0:LK_TOP-12.75*texture2D(uBed,bu).r;
      lkD=max(vWP.y-bed,0.0);
      // ripples: fainter far off, where they would only sparkle; calmer on the last foot of the shallows
      float near=1.0-0.75*smoothstep(20.0,450.0,lkDist),calm=0.35+0.65*smoothstep(0.0,0.6,lkD);
      // seen at a slant the ripples flatten out (they would only tip the reflection below the horizon)
      near*=mix(0.3,1.0,smoothstep(0.02,0.3,lkV.y));
      vec2 s=vSl;
      s+=lkS(vWP.xz/37.0+vec2(0.009,0.004)*uTime)*0.07*uChop*near;
      s+=lkS(mat2(0.8,-0.6,0.6,0.8)*vWP.xz/13.0+vec2(-0.005,0.016)*uTime)*0.06*uChop*near*calm;
      #if LAKE_Q>1
      s+=lkS(mat2(0.28,0.96,-0.96,0.28)*vWP.xz/4.1+vec2(0.021,-0.013)*uTime)*0.05*uChop*calm*(1.0-smoothstep(8.0,70.0,lkDist))*near;
      #endif
      #if LAKE_Q>0
      if(uRain>0.01&&lkDist<45.0)s+=lkRain(vWP.xz,uTime)*uRain*(1.0-lkDist/45.0);
      #endif
      lkN=normalize(vec3(-s.x,1.0,-s.y));
      // light through the water: the path down to the bed and back (bent at the surface) dims it, a lake's green
      // murk hiding the bed within a few feet; the shallows take a silty green, the deep water dark teal
      float cv=max(dot(lkV,lkN),0.02),ct=sqrt(1.0-(1.0-cv*cv)/1.78),T=exp(-lkD/ct*0.95);
      diffuseColor.rgb=mix(vec3(0.085,0.13,0.085),vec3(0.014,0.048,0.05),smoothstep(0.2,4.0,lkD));
      diffuseColor.a=1.0-T;
      // foam lapping the waterline (it rides the swells, since lkD does), in lace from the noise
      float fn=texture2D(uNrm,vWP.xz/9.0+vec2(0.0,0.006)*uTime).b;
      lkFoam=(1.0-smoothstep(0.0,0.16,lkD))*smoothstep(0.5,0.8,fn+0.3*sin(lkD*40.0-uTime*1.9+fn*4.0))*0.75+(1.0-smoothstep(0.0,0.035,lkD))*0.45;
      lkFoam=clamp(lkFoam,0.0,1.0);
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.6),lkFoam);diffuseColor.a=max(diffuseColor.a,lkFoam);
      lkF=0.02+0.98*pow(1.0-cv,5.0);`)
    .replace('#include <roughnessmap_fragment>',`float roughnessFactor=mix(0.04,0.15,smoothstep(15.0,700.0,lkDist))+lkFoam*0.6;`)
    .replace('#include <normal_fragment_maps>',`normal=normalize((viewMatrix*vec4(lkN,0.0)).xyz);`)
    // the water's own light is let through by alpha, its reflection on top; the bed shows through what is left
    .replace('#include <opaque_fragment>',`vec3 lkDf=reflectedLight.directDiffuse+reflectedLight.indirectDiffuse,lkSp=reflectedLight.directSpecular+reflectedLight.indirectSpecular;
      float lkA=diffuseColor.a+(1.0-diffuseColor.a)*lkF*(1.0-lkFoam);
      gl_FragColor=vec4(lkDf*diffuseColor.a+lkSp*(1.0-0.7*lkFoam),lkA);`)
    .replace('#include <fog_fragment>',THREE.ShaderChunk.fog_fragment.replace('hzColor, fogFactor','hzColor*gl_FragColor.a, fogFactor'))};
const lake=new THREE.Mesh(new THREE.PlaneGeometry(3400,3400,150,150).rotateX(-Math.PI/2),lkMat);
lake.position.y=WATER;lake.receiveShadow=true;lake.renderOrder=-1;scene.add(lake);
// the Graphics setting (gfx.js)
function lakeGfx(q){if(lkMat.defines.LAKE_Q!==q){lkMat.defines.LAKE_Q=q;lkMat.needsUpdate=true}}
// every frame: more of the bed, and the wind's chop and the rain on the water
function lakeTick(dt){lkBedTick(4);
  const g=typeof amb!=='undefined'&&amb?amb.gust:0.5,r=weather.r;
  lkU.uChop.value+=(0.75+0.35*g+0.9*ss(0.1,1,r)-lkU.uChop.value)*Math.min(1,dt*0.5);lkU.uRain.value=ss(0.02,0.6,r)}
