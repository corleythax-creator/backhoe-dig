// Corley's Island: the screen effects of the Ultra graphics (gfx.js): soft shade where things meet and in hollows
// (ambient occlusion, from the depth of what was drawn), a glow round bright light (bloom), and a camera-like colour
// grade with a vignette. With any of them on, the scene draws as before into an off-screen picture with its depth and
// these work on that picture on the way to the screen; with all off, or in VR, it draws straight to the screen.
// Strengths are the Screen effects tunings in TUNE (TU). Only how things look, never what they do (CLAUDE.md).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const POST={ao:false,bloom:false,grade:false};
let postRT=null,postAO=null,postAOB=null,postBl=[];
const postCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1),postScene=new THREE.Scene(),postSz=new THREE.Vector2();
// one triangle over the whole screen
const postTri=(function(){const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,2,0,0,2],2));
  const m=new THREE.Mesh(g);m.frustumCulled=false;postScene.add(m);return m})();
const POST_VS='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}';
const postMat=(fs,u,add)=>new THREE.ShaderMaterial({uniforms:u,vertexShader:POST_VS,fragmentShader:fs,depthTest:false,depthWrite:false,
  blending:add?THREE.AdditiveBlending:THREE.NoBlending,transparent:!!add});
const POST_HASH='float pHash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}\n';
// ambient occlusion at half size: each pixel's place is rebuilt from the depth, its facing from the depths beside it
// (the nearer side each way, so edges stay sharp), then 12 nearby points in a turning spiral each shade it by how
// far they rise above its surface within the radius; it fades out with distance into the haze
const postAOMat=postMat('#include <packing>\nuniform sampler2D tDepth;uniform vec2 uTexel,uTan;uniform float uNear,uFar,uR;varying vec2 vUv;\n'+POST_HASH+
  'float pZ(vec2 uv){return perspectiveDepthToViewZ(texture2D(tDepth,uv).x,uNear,uFar);}\n'+
  'vec3 pP(vec2 uv,float z){return vec3((uv*2.0-1.0)*uTan*-z,z);}\n'+
  'void main(){float d=texture2D(tDepth,vUv).x;if(d>=1.0){gl_FragColor=vec4(1.0);return;}\n'+
  ' float z=perspectiveDepthToViewZ(d,uNear,uFar);vec3 p=pP(vUv,z);\n'+
  ' vec2 dx=vec2(uTexel.x,0.0),dy=vec2(0.0,uTexel.y);\n'+
  ' vec3 x1=pP(vUv+dx,pZ(vUv+dx))-p,x0=p-pP(vUv-dx,pZ(vUv-dx)),y1=pP(vUv+dy,pZ(vUv+dy))-p,y0=p-pP(vUv-dy,pZ(vUv-dy));\n'+
  ' vec3 n=normalize(cross(abs(x1.z)<abs(x0.z)?x1:x0,abs(y1.z)<abs(y0.z)?y1:y0));if(dot(n,p)>0.0)n=-n;\n'+
  ' vec2 rs=min(0.5*uR/-z,0.12)/uTan;float a=pHash(gl_FragCoord.xy)*6.2832,o=0.0;\n'+
  ' for(int i=0;i<12;i++){float t=(float(i)+pHash(gl_FragCoord.yx+float(i)))/12.0;a+=2.39996;vec2 su=vUv+vec2(cos(a),sin(a))*t*rs;\n'+
  '  vec3 v=pP(su,pZ(su))-p;float l=length(v);o+=max(dot(v/max(l,1e-4),n)-0.15,0.0)*(1.0-smoothstep(0.5*uR,uR,l));}\n'+
  ' o=o/12.0*(1.0-smoothstep(70.0,180.0,-z));gl_FragColor=vec4(vec3(1.0-min(o*2.6,1.0)),1.0);}',
  {tDepth:{value:null},uTexel:{value:new THREE.Vector2()},uTan:{value:new THREE.Vector2()},uNear:{value:0.05},uFar:{value:2400},uR:{value:1}});
// a 4 by 4 blur of the shade that keeps to one surface (taps much nearer or farther than the pixel count less)
const postAOBlur=postMat('#include <packing>\nuniform sampler2D tAO,tDepth;uniform vec2 uTexel;uniform float uNear,uFar;varying vec2 vUv;\n'+
  'void main(){float z=perspectiveDepthToViewZ(texture2D(tDepth,vUv).x,uNear,uFar),s=0.0,w=0.0;\n'+
  ' for(int i=0;i<4;i++)for(int j=0;j<4;j++){vec2 uv=vUv+(vec2(i,j)-1.5)*uTexel;float zz=perspectiveDepthToViewZ(texture2D(tDepth,uv).x,uNear,uFar);\n'+
  '  float k=1.0/(1e-3+abs(zz-z)/(0.02*-z+0.05));k=min(k,1.0);s+=texture2D(tAO,uv).r*k;w+=k;}\n'+
  ' gl_FragColor=vec4(vec3(s/max(w,1e-4)),1.0);}',
  {tAO:{value:null},tDepth:{value:null},uTexel:{value:new THREE.Vector2()},uNear:{value:0.05},uFar:{value:2400}});
// bloom: the light above the threshold (set as shown on screen, worked in linear) at half size, then halved four more times and added back up (dual Kawase blur)
const postBright=postMat('uniform sampler2D tSrc;uniform vec2 uTexel;uniform float uThr;varying vec2 vUv;\n'+
  'void main(){vec3 c=0.25*(texture2D(tSrc,vUv+uTexel*vec2(-0.5,-0.5)).rgb+texture2D(tSrc,vUv+uTexel*vec2(0.5,-0.5)).rgb+texture2D(tSrc,vUv+uTexel*vec2(-0.5,0.5)).rgb+texture2D(tSrc,vUv+uTexel*vec2(0.5,0.5)).rgb);\n'+
  ' float l=max(c.r,max(c.g,c.b));gl_FragColor=vec4(c*max(l-uThr,0.0)/max(l*(1.0-uThr),1e-4),1.0);}',
  {tSrc:{value:null},uTexel:{value:new THREE.Vector2()},uThr:{value:0.8}});
const postDown=postMat('uniform sampler2D tSrc;uniform vec2 uTexel;varying vec2 vUv;\n'+
  'void main(){vec2 h=uTexel;gl_FragColor=vec4((4.0*texture2D(tSrc,vUv).rgb+texture2D(tSrc,vUv-h).rgb+texture2D(tSrc,vUv+h).rgb+texture2D(tSrc,vUv+vec2(h.x,-h.y)).rgb+texture2D(tSrc,vUv-vec2(h.x,-h.y)).rgb)/8.0,1.0);}',
  {tSrc:{value:null},uTexel:{value:new THREE.Vector2()}});
const postUp=postMat('uniform sampler2D tSrc;uniform vec2 uTexel;varying vec2 vUv;\n'+
  'void main(){vec2 h=uTexel;vec3 s=texture2D(tSrc,vUv+vec2(-2.0*h.x,0.0)).rgb+texture2D(tSrc,vUv+vec2(2.0*h.x,0.0)).rgb+texture2D(tSrc,vUv+vec2(0.0,-2.0*h.y)).rgb+texture2D(tSrc,vUv+vec2(0.0,2.0*h.y)).rgb\n'+
  ' +2.0*(texture2D(tSrc,vUv+h).rgb+texture2D(tSrc,vUv-h).rgb+texture2D(tSrc,vUv+vec2(h.x,-h.y)).rgb+texture2D(tSrc,vUv-vec2(h.x,-h.y)).rgb);gl_FragColor=vec4(s/12.0,1.0);}',
  {tSrc:{value:null},uTexel:{value:new THREE.Vector2()}},true);
// onto the screen: the picture with its shade and glow, turned into screen colours, then the grade (a gentle S curve,
// saturation, vignette) on the colours as shown, and a little dither against banding
const postOut=postMat('uniform sampler2D tScene,tAO,tBloom;uniform float uAO,uBloom,uCon,uSat,uVig,uGrade;varying vec2 vUv;\n'+POST_HASH+
  'void main(){vec3 c=texture2D(tScene,vUv).rgb;\n'+
  ' c*=mix(1.0,texture2D(tAO,vUv).r,uAO);c+=texture2D(tBloom,vUv).rgb*uBloom;c=clamp(c,0.0,1.0);\n'+
  ' c=mix(c*12.92,1.055*pow(c,vec3(1.0/2.4))-0.055,step(vec3(0.0031308),c));\n'+
  ' if(uGrade>0.5){c=mix(c,c*c*(3.0-2.0*c),uCon);float l=dot(c,vec3(0.2126,0.7152,0.0722));c=max(mix(vec3(l),c,uSat),0.0);\n'+
  '  vec2 q=vUv-0.5;c*=1.0-uVig*smoothstep(0.1,0.8,dot(q,q)*2.0);}\n'+
  ' gl_FragColor=vec4(c+(pHash(gl_FragCoord.xy)-0.5)/255.0,1.0);}',
  {tScene:{value:null},tAO:{value:null},tBloom:{value:null},uAO:{value:0},uBloom:{value:0},uCon:{value:0},uSat:{value:1},uVig:{value:0},uGrade:{value:0}});
// a blank for the shade or glow when that effect is off
const postWhite=new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1),postBlack=new THREE.DataTexture(new Uint8Array([0,0,0,255]),1,1);
postWhite.needsUpdate=postBlack.needsUpdate=true;
function postPass(mat,target){postTri.material=mat;renderer.setRenderTarget(target);renderer.render(postScene,postCam)}
// the off-screen pictures, made or remade at the drawing size; the scene's is multisampled like the screen and holds
// the tone-mapped colours still linear (postSize marks the target so three.js tone maps into it, as it does the screen), in half floats where the GPU can draw
// them so dark colours don't band; the last pass turns them into screen colours
function postSize(w,h){if(postRT&&postRT.width===w&&postRT.height===h)return;
  for(const t of [postRT,postAO,postAOB,...postBl])if(t)t.dispose();if(postRT)postRT.depthTexture.dispose();
  const ty=renderer.extensions.has('EXT_color_buffer_float')?THREE.HalfFloatType:THREE.UnsignedByteType;
  postRT=new THREE.WebGLRenderTarget(w,h,{samples:4,type:ty});
  // the picture is tone mapped as it is drawn, as on screen (three.js does that only for the screen and the headset)
  postRT.isXRRenderTarget=true;postRT.texture.colorSpace=THREE.LinearSRGBColorSpace;
  postRT.depthTexture=new THREE.DepthTexture(w,h);
  const o={depthBuffer:false,type:ty};postAO=new THREE.WebGLRenderTarget(w>>1,h>>1,o);postAOB=new THREE.WebGLRenderTarget(w>>1,h>>1,o);
  postBl=[];for(let i=1;i<=5;i++)postBl.push(new THREE.WebGLRenderTarget(Math.max(1,w>>i),Math.max(1,h>>i),o))}
function postOn(){return (POST.ao||POST.bloom||POST.grade)&&!renderer.xr.isPresenting}
// draws the frame: straight to the screen, or through the effects
function postRender(){ultraTick();if(!postOn()){renderer.render(scene,camera);return}
  renderer.getDrawingBufferSize(postSz);postSize(postSz.x,postSz.y);
  renderer.setRenderTarget(postRT);renderer.render(scene,camera);
  // the effects' own few draws don't count toward the frame's triangles and draws (fps counter, speed test)
  const ar=renderer.info.autoReset;renderer.info.autoReset=false;
  const W=postRT.width,H=postRT.height,ty=Math.tan(camera.fov*Math.PI/360)/camera.zoom;
  if(POST.ao){const u=postAOMat.uniforms;u.tDepth.value=postRT.depthTexture;u.uTexel.value.set(1/W,1/H);u.uTan.value.set(ty*camera.aspect,ty);
    u.uNear.value=camera.near;u.uFar.value=camera.far;u.uR.value=TU.fxAoR;postPass(postAOMat,postAO);
    const b=postAOBlur.uniforms;b.tAO.value=postAO.texture;b.tDepth.value=postRT.depthTexture;b.uTexel.value.set(1/postAO.width,1/postAO.height);
    b.uNear.value=camera.near;b.uFar.value=camera.far;postPass(postAOBlur,postAOB)}
  if(POST.bloom){const br=postBright.uniforms;br.tSrc.value=postRT.texture;br.uTexel.value.set(1/W,1/H);br.uThr.value=Math.pow(Math.min(TU.fxBloomThr,0.99),2.2);postPass(postBright,postBl[0]);
    for(let i=1;i<postBl.length;i++){const s=postBl[i-1];postDown.uniforms.tSrc.value=s.texture;postDown.uniforms.uTexel.value.set(1/s.width,1/s.height);postPass(postDown,postBl[i])}
    const ac=renderer.autoClear;renderer.autoClear=false;
    for(let i=postBl.length-1;i>0;i--){const s=postBl[i];postUp.uniforms.tSrc.value=s.texture;postUp.uniforms.uTexel.value.set(0.5/s.width,0.5/s.height);postPass(postUp,postBl[i-1])}
    renderer.autoClear=ac}
  const u=postOut.uniforms;u.tScene.value=postRT.texture;u.tAO.value=POST.ao?postAOB.texture:postWhite;u.tBloom.value=POST.bloom?postBl[0].texture:postBlack;
  u.uAO.value=POST.ao?TU.fxAo:0;u.uBloom.value=POST.bloom?TU.fxBloom:0;u.uGrade.value=POST.grade?1:0;u.uCon.value=TU.fxCon;u.uSat.value=TU.fxSat;u.uVig.value=TU.fxVig;
  postPass(postOut,null);renderer.info.autoReset=ar}
// gfx.js: which effects the Graphics setting has on; with none, the off-screen pictures are let go
function postGfx(ao,bloom,grade){POST.ao=!!ao;POST.bloom=!!bloom;POST.grade=!!grade;
  if(!(ao||bloom||grade)&&postRT){for(const t of [postRT,postAO,postAOB,...postBl])t.dispose();postRT.depthTexture.dispose();postRT=postAO=postAOB=null;postBl=[]}}

// ---------- Ultra lighting (gfx.js skyLight, shSoft, wetDrops) ----------
// Sky lighting: the sky fill (the hemisphere light daynight.js sets each frame) takes the colour of the sky as it is
// against the clear noon sky it was tuned under (only its colour: how bright it is stays daynight.js's and rain.js's),
// and the ground's bounce takes the sun's colour and strength, in the light and in the reflections' ground (skyEnvTint,
// core.js), so the shade turns warm at sunset, blue at dusk and grey under rain. Soft sun shadows: the shadow radius
// asks the patched shadow chunk (core.js) for contact-hardening shadows, its blur per metre of fall worked out for the
// shadow area in use (shR). Rain on the machines: rain.js (wetDropsSet). Strengths are the Ultra tunings (TU)
const ULTRA={sky:false,pcss:false,drops:false};
const ulSky=new THREE.Color(),ulRef=new THREE.Color(),ulC=new THREE.Color(),ulG=new THREE.Color();
function ulMean(top,hor,glow,out){return out.copy(top).multiplyScalar(0.55).add(ulC.copy(hor).multiplyScalar(0.45)).add(ulG.copy(glow).multiplyScalar(0.12))}
// a colour's hue and saturation only (its mean channel 1)
function ulHue(c){const m=Math.max(1e-4,(c.r+c.g+c.b)/3);return c.multiplyScalar(1/m)}
ulHue(ulMean(new THREE.Color(0x4f86bd),new THREE.Color(0xbfd2dd),new THREE.Color(0),ulRef));
function ulMix(c,k,lo,hi){c.r=1+(Math.min(hi,Math.max(lo,c.r))-1)*k;c.g=1+(Math.min(hi,Math.max(lo,c.g))-1)*k;c.b=1+(Math.min(hi,Math.max(lo,c.b))-1)*k;return c}
function ultraGfx(sky,pcss,drops){ULTRA.sky=!!sky;ULTRA.pcss=!!pcss;ULTRA.drops=!!drops;if(!sky)skyEnvTint.setRGB(1,1,1);wetDropsSet(drops)}
// every frame before the scene is drawn (postRender)
function ultraTick(){
  if(ULTRA.sky&&hemiL0){const k=TU.ultraSky;
    ulHue(ulMean(skyU.uTop.value,skyU.uHor.value,skyU.uGlow.value,ulSky).multiply(sky.material.color));
    ulSky.r/=ulRef.r;ulSky.g/=ulRef.g;ulSky.b/=ulRef.b;hemiL0.color.multiply(ulMix(ulSky,k,0.45,2.2));
    const sk=Math.min(1,sun.intensity/(1.6*LI))*Math.min(1,Math.max(0,LIGHT_DIR.y*2.5));
    ulHue(ulG.copy(sun.color));ulMix(ulG,0.6*k,0.5,1.8).multiplyScalar(1+(0.4*sk-0.15)*Math.min(k,1.5));
    hemiL0.groundColor.multiply(ulG);skyEnvTint.copy(ulG)}
  if(ULTRA.pcss){const c=sun.shadow.camera,q=TU.ultraShSoft*(c.far-c.near)/(2*c.right);sun.shadow.radius=1000+Math.min(q,0.5)*1e4}}
