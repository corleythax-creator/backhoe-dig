// Corley's Island: shared helpers, renderer, scene, sky, camera, lights and the flat-shaded material maker M().
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const $=s=>document.querySelector(s);
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- renderer / scene ----------
const canvas=$('#view');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
// GPU memory: WebGL never says how much the GPU really uses, so this counts what the game asks it to hold: every
// texture level (and mip chain), vertex and index buffer and render buffer as it is made, resized or deleted, plus the
// screen's own buffers. The Graphics panel shows it (gfx.js) as an estimate
const gpuMem=(function(){const gl=renderer.getContext(),tex=new Map(),buf=new Map(),rb=new Map(),bound=new Map(),units=new Map();
  const tot={tex:0,buf:0,rb:0};let unit=0,bBuf=new Map(),bRb=null;
  const CUBE=gl.TEXTURE_CUBE_MAP,bpp=(fmt,type)=>type===gl.FLOAT?16:type===gl.HALF_FLOAT||type===0x8D61?8:fmt===gl.DEPTH_COMPONENT||fmt===0x81A6||fmt===0x88F0?4:4;
  const tgt=t=>t>=gl.TEXTURE_CUBE_MAP_POSITIVE_X&&t<=gl.TEXTURE_CUBE_MAP_POSITIVE_X+5?CUBE:t;
  const cur=t=>(units.get(unit)||{})[tgt(t)];
  const setLevel=(t,key,b)=>{const o=cur(t);if(!o)return;const e=tex.get(o)||{};tot.tex+=b-(e[key]||0);e[key]=b;tex.set(o,e)};
  const w=(name,f)=>{const g=gl[name];if(g)gl[name]=function(){f.apply(null,arguments);return g.apply(gl,arguments)}};
  w('activeTexture',u=>{unit=u});
  w('bindTexture',(t,o)=>{const u=units.get(unit)||{};u[t]=o;units.set(unit,u)});
  w('texImage2D',function(t,l,ifmt){const a=arguments;let W,H,fmt,type;
    if(a.length>=8){W=a[3];H=a[4];fmt=a[6];type=a[7]}else{const src=a[5]||{};W=src.naturalWidth||src.videoWidth||src.width||0;H=src.naturalHeight||src.videoHeight||src.height||0;fmt=a[3];type=a[4]}
    setLevel(t,t+':'+l,W*H*bpp(fmt,type))});
  w('texStorage2D',(t,levels,ifmt,W,H)=>{let b=0;for(let l=0;l<levels;l++)b+=Math.max(1,W>>l)*Math.max(1,H>>l)*(ifmt===0x881A?8:ifmt===0x8814?16:4);setLevel(t,'store',b*(t===CUBE?6:1))});
  w('generateMipmap',t=>{const o=cur(t),e=o&&tex.get(o);if(!e)return;let b0=0;for(const k in e)if(/:0$/.test(k))b0+=e[k];setLevel(t,'mip',Math.round(b0/3))});
  w('deleteTexture',o=>{const e=tex.get(o);if(e){for(const k in e)tot.tex-=e[k];tex.delete(o)}});
  w('bindBuffer',(t,o)=>{bBuf.set(t,o)});
  w('bufferData',(t,d)=>{const o=bBuf.get(t);if(!o)return;const b=typeof d==='number'?d:d?d.byteLength:0;tot.buf+=b-(buf.get(o)||0);buf.set(o,b)});
  w('deleteBuffer',o=>{tot.buf-=buf.get(o)||0;buf.delete(o)});
  w('bindRenderbuffer',(t,o)=>{bRb=o});
  w('renderbufferStorage',(t,f,W,H)=>{if(!bRb)return;const b=W*H*4;tot.rb+=b-(rb.get(bRb)||0);rb.set(bRb,b)});
  w('renderbufferStorageMultisample',(t,s,f,W,H)=>{if(!bRb)return;const b=W*H*4*Math.max(1,s);tot.rb+=b-(rb.get(bRb)||0);rb.set(bRb,b)});
  w('deleteRenderbuffer',o=>{tot.rb-=rb.get(o)||0;rb.delete(o)});
  // the screen: front and back colour, depth, and with antialiasing a 4x multisampled colour and depth copy
  const screen=()=>{const W=gl.drawingBufferWidth,H=gl.drawingBufferHeight,aa=gl.getContextAttributes().antialias;return W*H*(4+4+4+(aa?4*8:0))};
  return ()=>({textures:tot.tex,geometry:tot.buf,targets:tot.rb,screen:screen(),texCount:tex.size,bufCount:buf.size})})();
// phones (touch-first, short side 1000 CSS px or less) are held back by pixels, not triangles (speed test, Oct 17: 43 fps
// at 1x scene load and still 39 at three times the triangles): cap them at 1.5x and give them cheaper shadows
const PHONE=matchMedia('(pointer: coarse)').matches&&Math.min(screen.width,screen.height)<=1000;
// gfx.js sets these from the Graphics setting (Low, Medium, High); these are the defaults until it loads
let maxPR=Math.min(devicePixelRatio||1,PHONE?1.5:2),gfxDetail=1,gfxBase=1,gfxFov=0,gfxFog=1,texOn=false;let pr=maxPR,lowN=0,hiN=0,prHold=0,viewDirty=false;
renderer.setPixelRatio(pr);
// resizing the canvas wipes it, so resolution changes and window resizes only set viewDirty; the frame loop applies them
// just before it draws (applying them after a draw left that frame black, which flashed on phones)
// a phone short on memory can reset the graphics, which shows black; say so, and keep a count for the speed test
let glResets=0;try{glResets=+localStorage.getItem('bhd_glresets')||0}catch(e){}
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();glResets++;try{localStorage.setItem('bhd_glresets',glResets)}catch(e){}
  if(typeof toast==='function')toast(say('glReset'),'bad',4500)});
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFShadowMap;
// lighting is done in linear space and tone mapped like a camera; colours stay written as the sRGB values they were
// picked as, and the patched chunks below turn them linear before lighting
renderer.outputColorSpace=THREE.SRGBColorSpace;THREE.ColorManagement.enabled=false;
// three.js lights are in physical units (since r155); LI turns the intensities the game was tuned with into them
const LI=Math.PI;
// an instanced mesh is culled and ray-picked by a sphere round all its copies, worked out once; work it out again
// whenever the copies move or their number changes (trees, boulders and things placed in the map editor)
Object.defineProperty(THREE.InstancedMesh.prototype,'boundingSphere',{configurable:true,
  get(){const k=this.instanceMatrix.version+'/'+this.count;if(this._bsK!==k){this._bsK=k;this._bs=null}return this._bs},
  set(v){this._bs=v;this._bsK=this.instanceMatrix?this.instanceMatrix.version+'/'+this.count:''}});
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=0.8;
(function(){
  const lin=c=>`${c}=mix(${c}/12.92,pow((${c}+0.055)/1.055,vec3(2.4)),step(vec3(0.04045),${c}));`;
  const C=THREE.ShaderChunk;
  C.color_fragment+='\n'+lin('diffuseColor.rgb');
  C.emissivemap_fragment+='\n'+lin('totalEmissiveRadiance');
  // a corner whose triangles cancel out (a fold or a sliver) has a zero normal, which normalize turns into NaN and
  // bloom smears into a black blot: face it at the camera instead
  C.normal_fragment_begin=C.normal_fragment_begin.replace('vec3 normal = normalize( vNormal );',
    'vec3 normal = dot( vNormal, vNormal ) > 1e-12 ? normalize( vNormal ) : vec3( 0.0, 0.0, 1.0 );');
  // Phong reflections follow Fresnel: faint face-on, strong at grazing angles, as on paint, glass and water
  const ph=THREE.ShaderLib.phong;
  ph.fragmentShader=ph.fragmentShader.replace('#include <envmap_fragment>',C.envmap_fragment.replace(/specularStrength \* reflectivity/g,
    'specularStrength*reflectivity*(0.12+0.88*pow(1.0-clamp(dot(normal,normalize(vViewPosition)),0.0,1.0),5.0))'));
  // soft sun shadows (Ultra, gfx.js shSoft): a shadow radius of 1000 or more asks for contact-hardening shadows, sharp
  // where a thing meets the ground and softer the farther the shadow falls from it. The blockers round the point are found
  // at three heights above it (the map only answers nearer or farther, so each test asks "farther by this much?"), their
  // mean distance sets the blur, and an 8-tap spiral blurs by it. (radius-1000)/1e4 is the blur in map widths per unit of
  // shadow depth (post.js works it out from the shadow area and the Softness tuning); smaller radii draw as before
  const pf='float radius = shadowRadius * texelSize.x;';
  if(C.shadowmap_pars_fragment.includes(pf))C.shadowmap_pars_fragment=C.shadowmap_pars_fragment.replace(pf,pf+`
				if ( shadowRadius >= 1000.0 ) {
					float q = ( shadowRadius - 1000.0 ) * 1e-4, ph = interleavedGradientNoise( gl_FragCoord.xy ) * PI2, oc = 0.0, dd = 0.0;
					for ( int i = 0; i < 6; i ++ ) {
						vec2 o = shadowCoord.xy + vogelDiskSample( i, 6, ph ) * q * 0.06;
						float a = 1.0 - texture( shadowMap, vec3( o, shadowCoord.z ) ), b = 1.0 - texture( shadowMap, vec3( o, shadowCoord.z - 0.008 ) ), c = 1.0 - texture( shadowMap, vec3( o, shadowCoord.z - 0.03 ) );
						oc += a; dd += ( a + b ) * 0.004 + ( b + c ) * 0.011 + c * 0.015;
					}
					if ( oc < 0.01 ) return 1.0;
					float rr = max( 1.25 * texelSize.x, q * dd / oc ), s = 0.0;
					for ( int i = 0; i < 8; i ++ ) s += texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( i, 8, ph + 1.3 ) * rr, shadowCoord.z ) );
					return mix( 1.0, s * 0.125, shadowIntensity );
				}`);
  // cascaded shadows: with the far sun on (sunFar, below), the sun's shadow is the near map's inside it and fades into
  // the far map's over the last 6% of the near map toward its edges; the far map fades out the same way at its own.
  // The far sun gives no light, so its own pass through the light loop skips its shadow
  C.shadowmap_pars_fragment+=`
#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 1
	float csmFar( float s0 ) {
		vec3 c0 = vDirectionalShadowCoord[ 0 ].xyz / vDirectionalShadowCoord[ 0 ].w;
		vec2 e0 = min( c0.xy, 1.0 - c0.xy );
		float w0 = c0.z > 1.0 ? 0.0 : smoothstep( 0.0, 0.06, min( e0.x, e0.y ) );
		if ( w0 >= 1.0 ) return s0;
		DirectionalLightShadow f = directionalLightShadows[ 1 ];
		vec3 c1 = vDirectionalShadowCoord[ 1 ].xyz / vDirectionalShadowCoord[ 1 ].w;
		vec2 e1 = min( c1.xy, 1.0 - c1.xy );
		float s1 = mix( 1.0, getShadow( directionalShadowMap[ 1 ], f.shadowMapSize, f.shadowIntensity, f.shadowBias, f.shadowRadius, vDirectionalShadowCoord[ 1 ] ), smoothstep( 0.0, 0.06, min( e1.x, e1.y ) ) );
		return mix( s1, s0, w0 );
	}
#else
	#define csmFar( s ) ( s )
#endif
`;
  const ds='directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;';
  if(C.lights_fragment_begin.includes(ds))C.lights_fragment_begin=C.lights_fragment_begin.replace(ds,
    '#if UNROLLED_LOOP_INDEX == 0\n\t\t'+ds.replace('? getShadow(','? csmFar( getShadow(').replace(' : 1.0;',' ) : 1.0;')+'\n\t\t#endif');
})();
// cloud shadows (storm.js): the sun's light dims under the clouds on every lit material. Their numbers are shared by all
// of them (CS_U): uCSMap the clouds' cover map, uCSA (its offset x and z in m, 1 / its size in m, the shadow's strength;
// 0 is no shadows), uCSB (the sun's slant in x and z per m of height, the clouds' middle height, where cover starts),
// uCSW how soft the edge of the cover is. Every material's own onBeforeCompile still runs; the shared numbers are added
// after it to any shader with lights
const CS_U={uCSMap:{value:null},uCSA:{value:new THREE.Vector4()},uCSB:{value:new THREE.Vector4()},uCSW:{value:0.1}};
// the haze (every Graphics level): it thickens with the true distance from the camera (not the depth along the view, which
// thinned it at the screen's sides and shifted it as the camera turned), lies thicker low over the lake than up high,
// and toward the sun takes the sun's light, the same glow the sky has round the sun (so far ground meets the sky behind
// it) and a broader warm sheen at the tuning's strength, as the sky's own haze round the sun (skyLut) has. HZ_U,
// shared by every material with haze (post.js hazeTick):
// uHzSun the way to the sun and the sheen's strength, uHzSunC the sun's light in the haze (dark at night and under
// cloud), uHzLow the lake's height, 1 / the height in m over which the haze thins, and how much it thins
const HZ_U={uHzSun:{value:new THREE.Vector4(0,1,0,1)},uHzSunC:{value:new THREE.Color(0)},uHzLow:{value:new THREE.Vector3(-7.3,1/60,0.6)}};
(function(){const C=THREE.ShaderChunk;
  C.fog_pars_vertex+='\n#ifdef USE_FOG\n\tvarying vec3 vFogPos;\n#endif';
  C.fog_vertex+='\n#ifdef USE_FOG\n\tvFogPos = mvPosition.xyz;\n#endif';
  C.fog_pars_fragment+='\n#ifdef USE_FOG\n\tvarying vec3 vFogPos;\n\tuniform vec4 uHzSun;\n\tuniform vec3 uHzSunC, uHzLow;\n#endif';
  C.fog_fragment=`#ifdef USE_FOG
	vec3 hzW = transpose( mat3( viewMatrix ) ) * vFogPos;
	float hzD = length( hzW );
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * hzD * hzD );
	#else
		float hzT = max( hzD - fogNear, 0.0 ) / max( fogFar - fogNear, 1.0 );
		float hzY = cameraPosition.y + 0.5 * hzW.y - uHzLow.x;
		hzT *= mix( 1.0, exp( - max( hzY, 0.0 ) * uHzLow.y ), uHzLow.z );
		float fogFactor = max( 1.0 - exp( - 2.8 * hzT * hzT ), smoothstep( 0.8 * fogFar, fogFar, hzD ) );
	#endif
	float hzS = max( dot( hzW / max( hzD, 1e-4 ), uHzSun.xyz ), 0.0 );
	vec3 hzColor = fogColor + uHzSunC * ( 0.32 * pow( hzS, 10.0 ) + 0.22 * uHzSun.w * hzS * hzS * hzS );
	gl_FragColor.rgb = mix( gl_FragColor.rgb, hzColor, fogFactor );
#endif`;
})();
(function(){const C=THREE.ShaderChunk,P=THREE.Material.prototype,base=P.onBeforeCompile,K=Symbol('obc');
  C.lights_pars_begin+='\nuniform sampler2D uCSMap;uniform vec4 uCSA,uCSB;uniform float uCSW;\n'+
    'float csShade(vec3 gp){if(uCSA.w<=0.0)return 1.0;vec3 w=transpose(mat3(viewMatrix))*(gp-viewMatrix[3].xyz);\n'+
    '  float c=texture(uCSMap,(w.xz+uCSB.xy*(uCSB.z-w.y)+uCSA.xy)*uCSA.z).r;return 1.0-uCSA.w*smoothstep(uCSB.w,uCSB.w+uCSW,c);}\n';
  const dl='getDirectionalLightInfo( directionalLight, directLight );';
  if(C.lights_fragment_begin.includes(dl))C.lights_fragment_begin=C.lights_fragment_begin.replace(dl,dl+'\n\t\tdirectLight.color *= csShade( geometryPosition );');
  const use=sh=>{if(sh.fragmentShader.includes('lights_pars_begin'))Object.assign(sh.uniforms,CS_U);if(sh.fragmentShader.includes('fog_pars_fragment'))Object.assign(sh.uniforms,HZ_U)};
  const def=function(sh){use(sh)};def.toString=()=>base.toString();
  Object.defineProperty(P,'onBeforeCompile',{configurable:true,get(){return this[K]||def},
    set(f){if(!f){this[K]=null;return}const w=function(sh,r){f.call(this,sh,r);use(sh)};w.toString=()=>String(f);this[K]=w}});
})();
const scene=new THREE.Scene();
scene.background=new THREE.Color(0xbfd2dd);
scene.fog=new THREE.Fog(0xbfd2dd,90,760);
// gradient sky dome and a hazy mountain ring past the fog
// where the sun is (a unit vector toward it): set every frame from the clock by daynight.js, which also sets LIGHT_DIR,
// the way the shadow-casting light shines from (the sun by day, the moon at night, never quite flat along the ground)
const SUN_DIR=new THREE.Vector3(13,15,9).normalize(),LIGHT_DIR=SUN_DIR.clone();
// dayKU: how much sunlight there is (0 at night, 1 by day), for the light through leaves and grass blades
const dayKU={value:1};
// things that keep the rain off (roofs, cabs, buildings, bridges, props, blocks) are also on this layer: rain.js draws
// them from above into its shelter map
const RAIN_LAYER=3;
// skySunVis: how much of the sun disc shows (rain.js clouds it over)
const skySunVis={value:1};
// the sky's colours, sun, moon and stars (daynight.js sets them): uTop and uHor the gradient, uGlow the twilight glow on
// the sun's side of the horizon, uCel turns the view into the star sphere's frame, uMet a shooting star
const skyU={uSun:{value:SUN_DIR},uSunVis:skySunVis,uTop:{value:new THREE.Color(0x4f86bd)},uHor:{value:new THREE.Color(0xbfd2dd)},
  uGlow:{value:new THREE.Color(0)},uSunC:{value:new THREE.Color(1,0.86,0.62)},uMoon:{value:new THREE.Vector3(0,-1,0)},uMoonV:{value:0},
  uStars:{value:0},uCel:{value:new THREE.Matrix3()},uGNP:{value:new THREE.Vector3(0,0,1)},uSkyT:{value:0},
  uMetA:{value:new THREE.Vector3(0,1,0)},uMetB:{value:new THREE.Vector3(0,1,0)},uMetT:{value:-1}};
// the sky's colour worked out from sunlight scattered in the air: the blue overhead from the air itself (Rayleigh),
// the white haze round the sun from dust and droplets (Mie), and the sun's own light reddened by the long way through
// the air at dawn and dusk, with the earth's shadow at twilight and the ozone that keeps dusk blue rather than green. One sample of the light scattered once, with the view's
// own dimming eased to stand in for the light scattered many times (vx), so the horizon stays a pale blue. Worked out
// on the computer into skyLut (32 directions round from the sun by 16 heights, as the screen shows it) whenever the sun
// has moved; the dome reads it, by day, over the old colours (skyU.uPhysK, daynight.js), on every graphics level
const SKY_AT={R:6371e3,A:6471e3,HR:8e3,HM:1.2e3,bR:[5.8e-6,13.5e-6,33.1e-6],bM:5e-6,g:0.76,I:20,vx:0.45,oz:6,bO:[0.65e-6,1.881e-6,0.085e-6]};
function skyScatter(dx,dy,dz,sx,sy,sz,out){const R=SKY_AT.R,A=SKY_AT.A,oy=R+2,b=oy*dy,c=oy*oy-A*A,t1=-b+Math.sqrt(b*b-c),N=12,M=4,ds=t1/N;
  let odR=0,odM=0,sR0=0,sR1=0,sR2=0,sM0=0,sM1=0,sM2=0;
  for(let i=0;i<N;i++){const t=(i+0.5)*ds,px=dx*t,py=oy+dy*t,pz=dz*t,pp=px*px+py*py+pz*pz,h=Math.sqrt(pp)-R;if(h<0)break;
    const hr=Math.exp(-h/SKY_AT.HR)*ds,hm=Math.exp(-h/SKY_AT.HM)*ds;odR+=hr;odM+=hm;
    const lb=px*sx+py*sy+pz*sz,sh=lb*lb-(pp-R*R);if(lb<0&&sh>0)continue;
    const lt=-lb+Math.sqrt(lb*lb-(pp-A*A)),ls=lt/M;let lR=0,lM=0,ok=true;
    for(let j=0;j<M;j++){const u=(j+0.5)*ls,qx=px+sx*u,qy=py+sy*u,qz=pz+sz*u,h2=Math.sqrt(qx*qx+qy*qy+qz*qz)-R;if(h2<0){ok=false;break}lR+=Math.exp(-h2/SKY_AT.HR)*ls;lM+=Math.exp(-h2/SKY_AT.HM)*ls}
    if(!ok)continue;const m=SKY_AT.bM*1.1*(odM*SKY_AT.vx+lM),r=odR*SKY_AT.vx+lR;
    const o=r*SKY_AT.oz,a0=Math.exp(-(SKY_AT.bR[0]*r+m+SKY_AT.bO[0]*o)),a1=Math.exp(-(SKY_AT.bR[1]*r+m+SKY_AT.bO[1]*o)),a2=Math.exp(-(SKY_AT.bR[2]*r+m+SKY_AT.bO[2]*o));
    sR0+=a0*hr;sR1+=a1*hr;sR2+=a2*hr;sM0+=a0*hm;sM1+=a1*hm;sM2+=a2*hm}
  const mu=dx*sx+dy*sy+dz*sz,g=SKY_AT.g,pR=3/(16*Math.PI)*(1+mu*mu),pM=3/(8*Math.PI)*((1-g*g)*(1+mu*mu))/((2+g*g)*Math.pow(1+g*g-2*g*mu,1.5));
  out[0]=SKY_AT.I*(pR*SKY_AT.bR[0]*sR0+pM*SKY_AT.bM*sM0);out[1]=SKY_AT.I*(pR*SKY_AT.bR[1]*sR1+pM*SKY_AT.bM*sM1);out[2]=SKY_AT.I*(pR*SKY_AT.bR[2]*sR2+pM*SKY_AT.bM*sM2);return out}
const SKY_LW=32,SKY_LH=16,skyLutD=new Uint8Array(SKY_LW*SKY_LH*4),skyLut=new THREE.DataTexture(skyLutD,SKY_LW,SKY_LH);
skyLut.magFilter=skyLut.minFilter=THREE.LinearFilter;skyLut.needsUpdate=true;
skyU.uLut={value:skyLut};skyU.uPhysK={value:0};
// zen, hor (side on to the sun), sunH (on the horizon under the sun): the colours the haze and the clouds' light take
const skyAtm={el:-999,zen:new THREE.Color(),hor:new THREE.Color(),sunH:new THREE.Color(),E:1.6};
// rows j0 to j1 of the table for the sun el degrees up; the colours are read off once the last row is done
function skyLutBuild(el,j0=0,j1=SKY_LH){const se=el*Math.PI/180,sx=Math.cos(se),sy=Math.sin(se),o=[0,0,0],E=skyAtm.E,d=skyLutD;
  for(let j=j0;j<j1;j++){const v=j/(SKY_LH-1),e=Math.max(0.05,v*v*Math.PI/2),ce=Math.cos(e),ye=Math.sin(e);
    for(let i=0;i<SKY_LW;i++){const az=i/(SKY_LW-1)*Math.PI;skyScatter(ce*Math.cos(az),ye,ce*Math.sin(az),sx,sy,0,o);const k=(j*SKY_LW+i)*4;
      for(let c=0;c<3;c++)d[k+c]=Math.round(255*Math.pow(1-Math.exp(-o[c]*E),1/2.2));d[k+3]=255}}
  if(j1<SKY_LH)return;skyAtm.el=el;
  const at=(i,j,c)=>{const k=(j*SKY_LW+i)*4;return c.setRGB(d[k]/255,d[k+1]/255,d[k+2]/255)};
  at(0,SKY_LH-1,skyAtm.zen);at(SKY_LW>>1,0,skyAtm.hor);at(0,0,skyAtm.sunH);skyLut.needsUpdate=true}
// a few rows a frame once the sun has moved a sixth of a degree, so working it out never holds a frame up
let skyLutJob=null;
function skyLutTick(el){if(skyAtm.el<-900){skyLutBuild(el);return}
  if(!skyLutJob){if(Math.abs(el-skyAtm.el)<0.15)return;skyLutJob={el,j:0}}
  const j=skyLutJob.j;skyLutBuild(skyLutJob.el,j,Math.min(SKY_LH,j+2));skyLutJob.j+=2;if(skyLutJob.j>=SKY_LH)skyLutJob=null}
const sky=(function(){
  const g=new THREE.SphereGeometry(1300,64,32);
  const mat=new THREE.MeshBasicMaterial({side:THREE.BackSide,fog:false,depthWrite:false,toneMapped:false});
  // gradient, sun disc and glow, moon with its phase, stars and the Milky Way, drawn per pixel
  mat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,skyU);
    sh.vertexShader='varying vec3 vDir;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvDir=position;');
    sh.fragmentShader='uniform vec3 uSun,uTop,uHor,uGlow,uSunC,uMoon,uGNP,uMetA,uMetB;uniform float uSunVis,uMoonV,uStars,uSkyT,uMetT,uPhysK;uniform sampler2D uLut;uniform mat3 uCel;\nvarying vec3 vDir;\n'+
      'float skH(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}\n'+
      'float skN(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(skH(i),skH(i+vec3(1,0,0)),f.x),mix(skH(i+vec3(0,1,0)),skH(i+vec3(1,1,0)),f.x),f.y),mix(mix(skH(i+vec3(0,0,1)),skH(i+vec3(1,0,1)),f.x),mix(skH(i+vec3(0,1,1)),skH(i+1.0),f.x),f.y),f.z);}\n'+
      sh.fragmentShader.replace('#include <color_fragment>',
      'vec3 sd=normalize(vDir);float cs=max(0.0,dot(sd,uSun));\n'+
      'float gt=clamp(sd.y*2.4,0.0,1.0);float az=0.5+0.5*dot(normalize(uSun.xz+1e-5),normalize(sd.xz+1e-5));\n'+
      'vec3 skc=mix(uHor,uTop,pow(gt,0.8))+uGlow*(0.25+0.75*az*az*az)*(1.0-smoothstep(0.0,0.5,sd.y));\n'+
      'if(uPhysK>0.001){float la=acos(clamp(2.0*az-1.0,-1.0,1.0))/3.14159265,lv=sqrt(asin(clamp(sd.y,0.0,1.0))/1.5707963);skc=mix(skc,texture2D(uLut,vec2(la,lv)).rgb,uPhysK);}\n'+
      'diffuseColor.rgb*=skc;\n'+
      '#include <color_fragment>\n'+
      'float up=smoothstep(-0.03,0.02,sd.y);\n'+
      'diffuseColor.rgb+=uSunVis*uSunC*(0.32*pow(cs,10.0)+0.5*pow(cs,180.0))*(0.6+0.4*smoothstep(0.0,0.3,sd.y))*up+uSunVis*uSunC*vec3(12.0,12.2,13.7)*smoothstep(0.99955,0.9997,cs)*up;\n'+
      // stars on the turning star sphere, more of them along the Milky Way, twinkling
      'if(uStars>0.001){vec3 cel=uCel*sd;float gb=dot(cel,uGNP),band=exp(-gb*gb*14.0);vec3 p=cel*130.0,id=floor(p),f=fract(p);float hh=skH(id);float s=0.0;\n'+
      '  if(hh>0.9-0.06*band){vec3 o=vec3(skH(id+1.7),skH(id+3.1),skH(id+5.3))*0.6+0.2;float b=pow((hh-0.84)/0.16,3.0);s=b*smoothstep(0.17,0.0,length(f-o))*(0.7+0.3*sin(uSkyT*(2.0+3.0*hh)+hh*90.0));}\n'+
      '  float mw=band*smoothstep(0.35,0.85,skN(cel*7.0)*0.6+skN(cel*19.0)*0.4)*0.05;\n'+
      '  diffuseColor.rgb+=(s*vec3(1.0,0.96,0.9)*1.6+mw*vec3(0.7,0.76,0.95))*uStars*uSunVis*smoothstep(0.0,0.12,sd.y);\n'+
      '  if(uMetT>0.0){vec3 ab=uMetB-uMetA;float q=clamp(dot(sd-uMetA,ab)/dot(ab,ab),0.0,uMetT),d=length(sd-uMetA-ab*q),tl=q/uMetT;\n'+
      '    diffuseColor.rgb+=vec3(1.0,0.95,0.85)*2.5*smoothstep(0.0016,0.0,d)*tl*tl*(1.0-smoothstep(0.75,1.0,uMetT))*uStars*uSunVis;}}\n'+
      // the moon: a disc lit on the side toward the sun, so it shows its real phase, with a faint glow round it
      'float cm=dot(sd,uMoon);if(uMoonV>0.001&&cm>0.99){const float R=0.0095;vec3 o=sd-uMoon*cm;float r=length(o)/R;\n'+
      '  diffuseColor.rgb+=vec3(0.55,0.6,0.7)*0.05*uMoonV*pow(max(0.0,(cm-0.99)/0.01),40.0)*uSunVis*up;\n'+
      '  if(r<1.0){vec3 n=o/R-uMoon*sqrt(1.0-r*r);float lit=smoothstep(-0.06,0.1,dot(n,uSun));float mare=0.82+0.18*skN(o/R*3.0+4.0);\n'+
      '    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(1.0,0.97,0.9)*(0.03+1.4*lit*mare)+diffuseColor.rgb*0.4,smoothstep(1.0,0.9,r)*uMoonV*uSunVis*up);}}\n'+
      'diffuseColor.rgb*=1.0-0.25*smoothstep(0.0,-0.08,sd.y);')};
  const m=new THREE.Mesh(g,mat);
  m.renderOrder=-1;scene.add(m);return m;
})();

const camera=new THREE.PerspectiveCamera(60,1,0.05,2400);
// warm sun as the key, a cooler and much dimmer sky fill, so shade reads blue-grey and lit faces stand out
scene.add(new THREE.HemisphereLight(0xb8d0ea,0x5b5a3c,0.5*LI));
const sun=new THREE.DirectionalLight(0xfff0dc,1.6*LI);
sun.castShadow=true; sun.shadow.mapSize.set(PHONE?1024:2048,PHONE?1024:2048);
// the shadow box's half width is the Graphics setting shR (gfx.js); the sun sits SUN_D m back so tall things at its edges still cast
const SUN_D=80;Object.assign(sun.shadow.camera,{left:-14,right:14,top:14,bottom:-14,near:1,far:SUN_D+90});
sun.shadow.bias=-0.0004; sun.shadow.normalBias=0.02;
scene.add(sun); scene.add(sun.target);
// far shadows (gfx.js csm, High and Ultra): a second sun that gives no light (intensity 0) and only casts, into a coarser
// map spread wide round you and ahead of the camera, so hills, cliffs, buildings and trees past the near map still throw
// shadows. Lit materials take the near map where it reaches and fade into this one past its edges (the cascade patch
// above, csmFar); it must come after the sun in the scene, so it is the second directional light the shaders see.
// sunFarTick moves it and draws its map again every few frames
const sunFar=new THREE.DirectionalLight(0xffffff,0);sunFar.castShadow=false;sunFar.visible=false;
Object.assign(sunFar.shadow.camera,{left:-160,right:160,top:160,bottom:-160,near:1,far:840});
sunFar.shadow.bias=-0.0005;sunFar.shadow.normalBias=0.15;sunFar.shadow.autoUpdate=false;
scene.add(sunFar);scene.add(sunFar.target);
const sunFarC=new THREE.Vector3(),sunFarV=new THREE.Vector3(),sunFarX=new THREE.Vector3(),sunFarY=new THREE.Vector3(),sunFarL=new THREE.Vector3();let sunFarN=0,sunFarScanT=0;
// small instanced things (grass, tufts, pebbles: under 6 ft across) cast into the near map only; in the far one they
// would be a few texels and cost as much as the rest of it. Looked for every 3 s, as scattering adds more
function sunFarSmall(o){if(o.userData.csmSm||!o.isInstancedMesh||!o.castShadow)return;const g=o.geometry;if(!g.boundingSphere)g.computeBoundingSphere();
  o.userData.csmSm=1;if(g.boundingSphere.radius>=1)return;const b=o.onBeforeShadow,a=o.onAfterShadow;
  o.onBeforeShadow=function(r,ob,c,sc,ge,dm,gr){if(sc===sunFar.shadow.camera){this.userData.csmN=this.count;this.count=0}else b.call(this,r,ob,c,sc,ge,dm,gr)};
  o.onAfterShadow=function(r,ob,c,sc,ge,dm,gr){if(sc===sunFar.shadow.camera)this.count=this.userData.csmN;else a.call(this,r,ob,c,sc,ge,dm,gr)}}
function sunFarTick(){if(!sunFar.visible)return;
  const now=performance.now();if(now>sunFarScanT){sunFarScanT=now+3000;scene.traverse(sunFarSmall)}
  const fc=sunFar.shadow.camera,R=fc.right,turn=sunFarL.distanceToSquared(LIGHT_DIR)>4e-6;
  if(!turn&&++sunFarN<TU.csmEvery)return;sunFarN=0;sunFarL.copy(LIGHT_DIR);
  // the middle: where the near map is, pushed ahead along the camera's view, where most of what you see lies
  camera.getWorldDirection(sunFarV);sunFarV.y=0;if(sunFarV.lengthSq()>1e-6)sunFarV.normalize();
  sunFarC.copy(sun.target.position).addScaledVector(sunFarV,R*0.45);
  // held to the map's own texel grid (the shadow camera's sideways and up axes), so its edges don't crawl as you move
  sunFarX.set(0,1,0).cross(LIGHT_DIR).normalize();sunFarY.copy(LIGHT_DIR).cross(sunFarX);
  const t=2*R/sunFar.shadow.mapSize.x,ax=sunFarC.dot(sunFarX),ay=sunFarC.dot(sunFarY);
  sunFarC.addScaledVector(sunFarX,Math.round(ax/t)*t-ax).addScaledVector(sunFarY,Math.round(ay/t)*t-ay);
  sunFar.target.position.copy(sunFarC);sunFar.position.copy(sunFarC).addScaledVector(LIGHT_DIR,fc.far/2);
  sunFar.updateMatrixWorld();sunFar.target.updateMatrixWorld();sunFar.shadow.needsUpdate=true}
// sky reflections: the dome over a dull ground, caught into a small cube map for glass, paint, chrome and water; daynight.js
// catches it again as the sky changes (skyEnvUpdate), from a scene of its own that holds only the dome and the ground
const skyEnvRT=new THREE.WebGLCubeRenderTarget(64,{generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter}),skyEnv=skyEnvRT.texture;
const skyEnvScene=new THREE.Scene(),skyEnvCam=new THREE.CubeCamera(1,2000,skyEnvRT),skyEnvGnd=new THREE.MeshBasicMaterial({color:0x4a4a32,fog:false,toneMapped:false});
{const gnd=new THREE.Mesh(new THREE.CircleGeometry(900,24).rotateX(-Math.PI/2),skyEnvGnd);gnd.position.y=-12;skyEnvScene.add(gnd,new THREE.Mesh(sky.geometry,sky.material))}
// k: how bright the ground under the sky is (1 by day)
// skyEnvTint: the light the ground under it takes from the sun (Ultra's sky lighting, post.js; white otherwise)
const skyEnvTint=new THREE.Color(1,1,1);let skyEnvK=1;
// three.js makes its blurred copy of the cube (PMREM) the first time a shiny material is drawn after the cube changes,
// in the middle of drawing the frame. In a headset that frame is drawn eye by eye, and the copy's own renders switch the
// render target and viewport between the eyes' draws, so the rest of that eye drew wrong for a frame: the screen
// flashed, whenever the sky had moved enough to be caught again (every few minutes, at no time you could see coming).
// skyEnvBake makes the copy at once instead, by drawing one shiny speck into a 1 px target with the headset off
const skyEnvBakeS=new THREE.Scene(),skyEnvBakeC=new THREE.PerspectiveCamera(),skyEnvBakeRT=new THREE.WebGLRenderTarget(1,1);
{const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshStandardMaterial({envMap:skyEnv}));m.position.z=-2;skyEnvBakeS.add(m,skyEnvBakeC)}
function skyEnvBake(){const xr=renderer.xr.enabled,t=renderer.getRenderTarget(),f=renderer.getActiveCubeFace(),l=renderer.getActiveMipmapLevel();
  renderer.xr.enabled=false;renderer.setRenderTarget(skyEnvBakeRT);renderer.render(skyEnvBakeS,skyEnvBakeC);renderer.setRenderTarget(t,f,l);renderer.xr.enabled=xr}
function skyEnvUpdate(k){skyEnvK=k;skyEnvGnd.color.setHex(0x4a4a32).multiplyScalar(k).multiply(skyEnvTint);skyEnvScene.background=scene.background;skyEnvCam.update(renderer,skyEnvScene);skyEnv.needsPMREMUpdate=true;skyEnvBake()}
skyEnvUpdate(1);
// the map's size in pixels a side: 64, or 256 for Ultra's sky lighting (post.js), sharp enough to show the clouds in
// paint and glass. The cube keeps its texture object (every material holds it); its GPU copies are made again. three.js
// keeps the blurred copy it makes for physically based materials (PMREM) and fills it again when the cube is caught,
// whatever its size: one that no longer fits the cube is thrown away here and a new one made
{const P=THREE.PMREMGenerator.prototype,f=P._fromTexture;
  P._fromTexture=function(e,t){if(t&&e.isCubeTexture&&e.image[0]&&t.height!==4*Math.pow(2,Math.floor(Math.log2(e.image[0].width)))){t.dispose();t=null}return f.call(this,e,t)}}
function skyEnvSize(n){if(skyEnvRT.width===n)return;skyEnv.image[0].width=skyEnv.image[0].height=n;skyEnvRT.width=skyEnvRT.height=n;
  skyEnvRT.viewport.set(0,0,n,n);skyEnvRT.scissor.set(0,0,n,n);skyEnvRT.dispose();skyEnv.dispose();skyEnvUpdate(skyEnvK)}
// straight-up normals for flat-shaded ground: lighting takes its slope from the faces, but the shadow lookup needs a
// real normal (an all-zero one gives no shadow at all)
function upNormals(n){const a=new Float32Array(n);for(let i=1;i<n;i+=3)a[i]=1;return a}
const M=(c,o)=>new THREE.MeshPhongMaterial(Object.assign({color:c,flatShading:true,shininess:6,specular:0x111111},o||{}));
