/* Human Forge runtime: puts Forge people (rigged, animated GLBs from human-forge) into any three.js game, r128 to r186.
 * No GLTFLoader needed: it reads the Forge files itself. Two ways to draw people:
 *   hero  - one skinned person with an AnimationMixer: cross-fades, props in hand, three LODs (four with { ultra: true }
 *           for people built with the ultra tier: the whole mesh smoothed, 100-150k triangles). For the few near the camera.
 *   crowd - any number of one character as a single InstancedMesh, skinned on the GPU from a baked bone texture; each
 *           instance has its own clip, phase and speed. One draw call per character (plus one for its shadow).
 * Classic script: sets window.HumanForge. ES module: import './human-forge.js' then use window.HumanForge (or
 * globalThis.HumanForge).
 *
 *   const forge = await HumanForge.load(THREE, 'models/people/');        // reads library.json and anims.glb
 *   const bob = await forge.hero('fan_olemiss_03'); scene.add(bob.object); bob.play('walk');
 *   const fans = await forge.crowd('fan_olemiss_03', {max: 400, clips: ['sit', 'sit_clap', 'sit_cheer']});
 *   scene.add(fans.object); const h = fans.add({x, y, z, heading, clip: 'sit_clap'});
 *   every frame: forge.update(dt)   (heroes' mixers and every crowd's clock)
 * Coordinates: metres, y up, a person faces +z at heading 0 (heading in radians, turning left is +).
 * Clothes (1.5): heroes built with fabrics are shaded by them (weave, roughness, the fibres' sheen; fabric_a.webp and
 * fabric_b.webp beside library.json). load(THREE, base, { cloth: false }) leaves them plain; { clothRelief: false }
 * drops the weave's relief (phones). HumanForge.cloth(THREE, material, { fabric: 'denim', a, b, unit }) shades a
 * game's own garment the same way; HumanForge.fabrics lists them.
 * Peach fuzz (1.6): heroes packed since carry it (_FUZZ per vertex, extras.forge.fuzz): a sheen of light skimming or
 * behind the skin and a rim on every LOD, and on the ultra tier the fine hairs themselves close up.
 * load(THREE, base, { fuzz: false }) leaves it off; { fuzzStrands: false } keeps the sheen without the hairs.
 * Hair (1.6): lamps (point and spot lights) light it as the sun does, highlights and all, not only the directional and
 * hemisphere lights.
 * Clip packs (1.7): more clips beside anims.glb (the motion capture pack, mocap.glb): load(THREE, base, { packs:
 * ['mocap'] }) or await forge.pack('mocap'); forge.packs lists what library.json offers. Seated pack clips carry the
 * seat they were fitted to (forge.clips[name].seat, metres; origin on the floor under the seat's middle, as sit).
 */
(function (root) {
  'use strict';
  const VERSION = '1.7.0';

  // ------------------------------------------------------------------ GLB reading
  const CT = { 5126: Float32Array, 5121: Uint8Array, 5123: Uint16Array, 5125: Uint32Array, 5122: Int16Array, 5120: Int8Array };
  const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

  function parseGLB(buf) {
    const dv = new DataView(buf);
    if (dv.getUint32(0, true) !== 0x46546c67) throw new Error('not a GLB');
    let off = 12, json = null, bin = null;
    while (off < buf.byteLength) {
      const len = dv.getUint32(off, true), type = dv.getUint32(off + 4, true);
      if (type === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, off + 8, len)));
      else if (type === 0x004e4942) bin = buf.slice(off + 8, off + 8 + len);
      off += 8 + len;
    }
    const acc = (i) => {
      const a = json.accessors[i], v = json.bufferViews[a.bufferView], T = CT[a.componentType], nc = NC[a.type];
      const base = (v.byteOffset || 0) + (a.byteOffset || 0), st = v.byteStride || 0;
      if (!st || st === nc * T.BYTES_PER_ELEMENT) return new T(bin, base, a.count * nc);
      // interleaved vertex data (byteStride): copy each element out into a packed array
      const out = new T(a.count * nc);
      for (let k = 0; k < a.count; k++) out.set(new T(bin, base + k * st, nc), k * nc);
      return out;
    };
    const view = (i) => { const v = json.bufferViews[i]; return new Uint8Array(bin, v.byteOffset || 0, v.byteLength); };
    return { json, acc, view };
  }

  async function fetchBuf(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error('Human Forge: ' + url + ' ' + r.status);
    return r.arrayBuffer();
  }

  // (Corley's Island's copy: decoded off the main thread as an ImageBitmap where the browser can, so uploading a close-up
  // person's 2048 maps doesn't also decode them in the frame; every texture made from one keeps flipY false, which is
  // how glTF pictures are laid out, and the tiling micro and weave maps don't care)
  function loadImage(bytes, mime) {
    if (typeof createImageBitmap === 'function') return createImageBitmap(new Blob([bytes], { type: mime }), { premultiplyAlpha: 'none', colorSpaceConversion: 'none' }).catch(() => loadImg(bytes, mime));
    return loadImg(bytes, mime);
  }
  function loadImg(bytes, mime) {
    const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
    return new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => { URL.revokeObjectURL(url); res(im); };
      im.onerror = rej;
      im.src = url;
    });
  }

  // ------------------------------------------------------------------ hair
  /* Hair shaded as hair, not painted plastic: two highlights that run across the strands (Kajiya-Kay, as film and games
   * shade hair cards: a near-white one, and a broader one in the hair's own colour shifted down the strand), each strand
   * catching them a little differently, light through the hair when it is lit from behind, and alpha kept up in the
   * smaller mipmaps so thin hair does not wear away with distance. The strand direction comes from the texture: strands
   * run along v (axis 0) or u (axis 1).
   *   o.rect   the hair's part of the texture [u0, v0, u1, v1] (default: all of it)
   *   o.axis   0 or 1;  o.lum: the hair's mean linear brightness, its strands are told apart by it (default 0.1)
   *   o.size   the texture's size in pixels (the mipmap level is worked out from it)
   *   o.shine  0..2, how glossy (default 1)
   *   o.grey   the texture is grey (forge_morph.py's _g.webp, brightness over the mean, / 1.8): tint it with
   *            material.userData.hfHair.tint (a linear THREE.Color)
   * Works on a MeshStandardMaterial already patched or not; returns it. */
  const GLSL_HAIR_PARS = `
    uniform vec4 hfHairRect;
    uniform float hfHairAxis, hfHairLum, hfHairShine, hfHairGrey, hfHairSalt, hfTexSize, hfLightK, hfLegacy;
    // a lamp's light falling off with distance, as three has it (before r155 its own way)
    float hfAtt(float d, float cut, float decay) {
      if (hfLegacy > 0.5) return (cut > 0.0 && decay > 0.0) ? pow(clamp(1.0 - d / cut, 0.0, 1.0), decay) : 1.0;
      float a = 1.0 / max(pow(d, decay), 0.01);
      if (cut > 0.0) a *= pow2(clamp(1.0 - pow4(d / cut), 0.0, 1.0));
      return a;
    }
    uniform vec3 hfHairTint;
    float hfInHair() { vec2 u = HF_UV; return step(hfHairRect.x, u.x) * step(u.x, hfHairRect.z) * step(hfHairRect.y, u.y) * step(u.y, hfHairRect.w); }
    varying vec3 vHfStrand;
    float hfStrand(vec3 T, vec3 H, float e) { float th = dot(T, H); return pow(max(1.0 - th * th, 0.0), e); }
    vec3 hfHairLight(vec3 L, vec3 col, vec3 N, vec3 V, vec3 T1, vec3 T2, vec3 hc, float gl) {
      vec3 H = normalize(L + V);
      float wrap = clamp(dot(N, L) * 0.6 + 0.4, 0.0, 1.0);
      vec3 s = mix(vec3(1.0), hc / max(max(hc.r, max(hc.g, hc.b)), 1e-3), 0.45) * hfStrand(T1, H, 70.0) * 0.1 + hc * hfStrand(T2, H, 14.0) * gl;
      vec3 through = hc * pow(clamp(dot(-L, V), 0.0, 1.0), 6.0) * 0.5;
      return col * (s * wrap * hfHairShine + through) * hfLightK;
    }
  `;
  const GLSL_HAIR_TINT = `
    // salt and pepper's strands across the texture, and how many of them a pixel spans (out here: derivatives need the whole quad)
    float hfAc = (hfHairAxis < 0.5 ? HF_UV.x : HF_UV.y) * 1000.0, hfAl = hfHairAxis < 0.5 ? HF_UV.y : HF_UV.x;
    float hfSw = fwidth(hfAc);
    if (hfHairGrey > 0.5 && hfInHair() > 0.5) {
      // grey hair texture: brightness over the hair's mean; darker parts deeper and richer, lighter ones paler (hair's
      // own scattering), not one colour scaled
      float k = diffuseColor.r * 1.8;
      vec3 W = vec3(0.2126, 0.7152, 0.0722);
      float l = max(dot(hfHairTint, W), 1e-4);
      vec3 q = pow(max(hfHairTint / l, vec3(1e-4)), vec3(clamp(1.0 + 0.35 * (1.0 - k), 0.75, 1.4)));
      diffuseColor.rgb = q / max(dot(q, W), 1e-4) * l * k;
      if (hfHairSalt > 0.0) {
        // salt and pepper: a share of the strands white, the rest a little duller (forge_pack.py's salt(), the same sum)
        float h = fract(floor(hfAc + 3.0 * sin(hfAl * 23.0)) * 0.1031); h *= h + 33.33; h *= h + h; h = fract(h);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(dot(diffuseColor.rgb, W)), 0.15 * hfHairSalt);
        vec3 hfWh = vec3(0.3, 0.29, 0.275) * min(k, 1.5);  // unpigmented hair: silvery, its brightness the strand's own
        // a strand thinner than a pixel: the share of white, evenly (no shimmer as it moves)
        float hfW = mix(step(h, hfHairSalt), hfHairSalt, smoothstep(0.35, 0.9, hfSw));
        diffuseColor.rgb = mix(diffuseColor.rgb, hfWh, hfW);
      }
    }
  `;
  const GLSL_HAIR_ALPHA = `
    { vec2 t = HF_UV * hfTexSize; vec2 dx = dFdx(t), dy = dFdy(t);
      diffuseColor.a *= 1.0 + max(0.0, 0.5 * log2(max(dot(dx, dx), dot(dy, dy)))) * 0.25; }
  `;
  const GLSL_HAIR_LIGHT = `
    vec3 hfP = -vViewPosition;
    vec3 dpx = dFdx(hfP), dpy = dFdy(hfP);
    vec2 dux = dFdx(HF_UV), duy = dFdy(HF_UV);  // outside the branch: derivatives need the whole pixel quad
    // scaled up to about 1 (the direction is the same): a pixel's steps are tiny, their products under mediump's range
    float hfSp = max(max(length(dpx), length(dpy)), 1e-20), hfSu = max(max(length(dux), length(duy)), 1e-20);
    dpx /= hfSp; dpy /= hfSp; dux /= hfSu; duy /= hfSu;
    if (hfInHair() > 0.5) {
      // the strand: smooth, from the mesh (strands()); else this triangle's own, from the UVs' screen-space steps
      vec3 hfT = dot(vHfStrand, vHfStrand) > 1e-8 ? vHfStrand : hfHairAxis < 0.5 ? dux.x * dpy - duy.x * dpx : duy.y * dpx - dux.y * dpy;
      vec3 hfN = normal;
      hfT = hfT - hfN * dot(hfT, hfN);
      if (dot(hfT, hfT) > 1e-6) {
        hfT = normalize(hfT);
        vec3 hfV = normalize(vViewPosition);
        vec3 hc = diffuseColor.rgb;
        float g = clamp(dot(hc, vec3(0.2126, 0.7152, 0.0722)) / max(hfHairLum, 1e-3), 0.0, 2.0);
        float j = (g - 1.0) * 0.25;
        vec3 T1 = normalize(hfT + hfN * (0.1 + j)), T2 = normalize(hfT + hfN * (-0.15 + j));
        vec3 hs = vec3(0.0);
        float gl = 0.4 + 0.6 * g;
        #if NUM_DIR_LIGHTS > 0
          #pragma unroll_loop_start
          for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
            hs += hfHairLight(directionalLights[ i ].direction, directionalLights[ i ].color, hfN, hfV, T1, T2, hc, gl);
          }
          #pragma unroll_loop_end
        #endif
        #if NUM_HEMI_LIGHTS > 0
          #pragma unroll_loop_start
          for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
            hs += 0.35 * hfHairLight(hemisphereLights[ i ].direction, hemisphereLights[ i ].skyColor, hfN, hfV, T1, T2, hc, gl);
          }
          #pragma unroll_loop_end
        #endif
        // lamps: point and spot lights (a room at night), each falling off as three's do
        #if NUM_POINT_LIGHTS > 0
          #pragma unroll_loop_start
          for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
            { vec3 lv = pointLights[ i ].position - hfP; float d = length(lv);
              hs += hfHairLight(lv / max(d, 1e-4), pointLights[ i ].color * hfAtt(d, pointLights[ i ].distance, pointLights[ i ].decay), hfN, hfV, T1, T2, hc, gl); }
          }
          #pragma unroll_loop_end
        #endif
        #if NUM_SPOT_LIGHTS > 0
          #pragma unroll_loop_start
          for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
            { vec3 lv = spotLights[ i ].position - hfP; float d = length(lv); vec3 L = lv / max(d, 1e-4);
              float cone = smoothstep(spotLights[ i ].coneCos, spotLights[ i ].penumbraCos, dot(L, spotLights[ i ].direction));
              hs += hfHairLight(L, spotLights[ i ].color * hfAtt(d, spotLights[ i ].distance, spotLights[ i ].decay) * cone, hfN, hfV, T1, T2, hc, gl); }
          }
          #pragma unroll_loop_end
        #endif
        reflectedLight.directSpecular += hs * diffuseColor.a;
      }
    }
  `;
  const GLSL_HAIR_VPARS = `
    attribute vec3 hfStrand;
    varying vec3 vHfStrand;
  `;
  const GLSL_HAIR_VERTEX = `
    {
      vec3 hfS = hfStrand;
      #ifdef HF_CROWD
        hfS = mat3(hfM) * hfS;
      #endif
      #ifdef USE_SKINNING
        hfS = (skinMatrix * vec4(hfS, 0.0)).xyz;
      #endif
      #ifdef USE_INSTANCING
        hfS = mat3(instanceMatrix) * hfS;
      #endif
      vHfStrand = mat3(modelViewMatrix) * hfS;
    }
  `;
  /* each vertex's strand direction (along the hair texture's v, or u with axis 1), smoothed over its triangles, as the
   * geometry's hfStrand attribute: the hair shader's highlights follow it. Only triangles inside o.rect count. */
  function strands(THREE, g, o) {
    o = o || {};
    const P = g.attributes.position.array, UV = g.attributes.uv.array, n = P.length / 3;
    const I = g.index ? g.index.array : null, nt = (I ? I.length : n) / 3;
    const r = o.rect || [0, 0, 1, 1], ax = o.axis || 0;
    let a = g.attributes.hfStrand;
    if (!a || a.count !== n) { a = new THREE.BufferAttribute(new Float32Array(n * 3), 3); g.setAttribute('hfStrand', a); }
    const S = a.array;
    S.fill(0);
    for (let t = 0; t < nt; t++) {
      const i0 = I ? I[t * 3] : t * 3, i1 = I ? I[t * 3 + 1] : t * 3 + 1, i2 = I ? I[t * 3 + 2] : t * 3 + 2;
      const u0 = UV[i0 * 2], v0 = UV[i0 * 2 + 1], du1 = UV[i1 * 2] - u0, dv1 = UV[i1 * 2 + 1] - v0, du2 = UV[i2 * 2] - u0, dv2 = UV[i2 * 2 + 1] - v0;
      const cu = u0 + (du1 + du2) / 3, cv = v0 + (dv1 + dv2) / 3;
      if (cu < r[0] || cu > r[2] || cv < r[1] || cv > r[3]) continue;
      const det = du1 * dv2 - du2 * dv1;
      if (!det) continue;
      // dp/du = (e1 dv2 - e2 dv1) / det, dp/dv = (e2 du1 - e1 du2) / det
      const ka = ax ? dv2 : -du2, kb = ax ? -dv1 : du1;
      let x = 0, y = 0, z = 0;
      for (let c = 0; c < 3; c++) {
        const e1 = P[i1 * 3 + c] - P[i0 * 3 + c], e2 = P[i2 * 3 + c] - P[i0 * 3 + c], d = (e1 * ka + e2 * kb) / det;
        if (c === 0) x = d; else if (c === 1) y = d; else z = d;
      }
      const l = Math.hypot(x, y, z);
      if (!l) continue;
      x /= l; y /= l; z /= l;
      for (const i of [i0, i1, i2]) { S[i * 3] += x; S[i * 3 + 1] += y; S[i * 3 + 2] += z; }
    }
    for (let i = 0; i < n; i++) {
      const l = Math.hypot(S[i * 3], S[i * 3 + 1], S[i * 3 + 2]);
      if (l) { S[i * 3] /= l; S[i * 3 + 1] /= l; S[i * 3 + 2] /= l; }
    }
    a.needsUpdate = true;
    return g;
  }
  function hair(THREE, mat, o) {
    o = o || {};
    const U = {
      hfHairRect: { value: new THREE.Vector4().fromArray(o.rect || [0, 0, 1, 1]) },
      hfHairAxis: { value: o.axis || 0 }, hfHairLum: { value: o.lum || 0.1 }, hfHairShine: { value: o.shine === undefined ? 1 : o.shine },
      hfHairGrey: { value: o.grey ? 1 : 0 }, hfHairSalt: { value: +o.salt || 0 }, hfHairTint: { value: new THREE.Color(1, 1, 1) },
      hfTexSize: { value: o.size || 1024 }, hfLightK: { value: 1 }, hfLegacy: { value: 0 }
    };
    mat.userData.hfHair = { uniforms: U, tint: U.hfHairTint.value };
    if (mat.extensions) mat.extensions.derivatives = true;  // WebGL 1 on three before r151
    const prev = mat.onBeforeCompile;
    mat.onBeforeCompile = function (sh, r) {
      if (prev) prev.call(this, sh, r);
      // the lights' units: before r155 (or with legacy lights) a light's colour is already times pi
      const legacy = 'useLegacyLights' in sh ? sh.useLegacyLights : 'physicallyCorrectLights' in sh ? !sh.physicallyCorrectLights : parseInt(THREE.REVISION, 10) < 155;
      U.hfLightK.value = legacy ? 1 : 1 / Math.PI; U.hfLegacy.value = legacy ? 1 : 0;
      Object.assign(sh.uniforms, U);
      // the map's UVs: vMapUv from r151, vUv before
      const uv = /vMapUv/.test(THREE.ShaderChunk.uv_pars_fragment) ? 'vMapUv' : 'vUv';
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\n' + GLSL_HAIR_VPARS)
        .replace('#include <defaultnormal_vertex>', '#include <defaultnormal_vertex>\n' + GLSL_HAIR_VERTEX);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <uv_pars_fragment>', '#include <uv_pars_fragment>\n#define HF_UV ' + uv + '\n' + GLSL_HAIR_PARS)
        .replace('#include <map_fragment>', '#include <map_fragment>\n' + GLSL_HAIR_TINT)
        .replace('#include <alphatest_fragment>', GLSL_HAIR_ALPHA + '#include <alphatest_fragment>')
        .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n' + GLSL_HAIR_LIGHT);
    };
    const key = mat.customProgramCacheKey;
    mat.customProgramCacheKey = function () { return 'hfHair' + (key ? key.call(this) : ''); };
    mat.needsUpdate = true;
    return mat;
  }

  /* the ultra tier's skin (from 1.4; people built since carry _SKIN per vertex: pores, ridges, creases, and 1 on skin):
     the fine relief from the library's micro map (skin_micro.webp, laid over the skin in the body's own space, so pores
     keep their size in mm and stay put as it moves), bumped through the screen's derivatives and faded out once a pixel
     is wider than about half a millimetre; and light through the skin, the diffuse light wrapped round past the
     terminator, further in red than in blue, off the normal without the fine relief. The designer's (designer.js) sums.
     o: { micro (texture, repeating), tileMm, smooth (0..1), age (years), matte (0..1, foundation), sss (0..1) } */
  const SKIN_PARS = `
uniform sampler2D hfSkMicro;
uniform vec4 hfSkSet;     // mm per unit, the micro map's square (mm), the light through the skin, the fine lines' depth
uniform vec2 hfSkSoft;    // smoothness, foundation
varying vec4 vHfSkin;
varying vec3 vHfSkP, vHfSkN;
vec3 hfDN;
float hfMicroH(vec3 p, vec3 w, vec4 amp) {
  vec3 q = p * hfSkSet.x / hfSkSet.y;
  vec4 a = texture2D(hfSkMicro, q.yz + vec2(0.31, 0.17)) * w.x + texture2D(hfSkMicro, q.xz + vec2(0.57, 0.83)) * w.y + texture2D(hfSkMicro, q.xy) * w.z;
  return dot(a * 2.0 - 1.0, amp);
}
vec3 hfBumpS(vec3 pos, vec3 n, vec2 dH, float fd) {
  vec3 sx = dFdx(pos), sy = dFdy(pos), r1 = cross(sy, n), r2 = cross(n, sx);
  float det = dot(sx, r1) * fd;
  return normalize(abs(det) * n - sign(det) * (dH.x * r1 + dH.y * r2));
}
vec3 hfSkinNL(vec3 L, vec3 n) {
  if (vHfSkin.a < 0.5) return vec3(clamp(dot(n, L), 0.0, 1.0));
  float nl = dot(normalize(mix(hfDN, n, 0.35)), L);
  vec3 w = hfSkSet.z * vec3(0.5, 0.2, 0.12);
  return pow(clamp((nl + w) / (1.0 + w), 0.0, 1.0), vec3(1.0) + w);
}
`;
  const SKIN_NORMAL = `
  hfDN = normal;
  if (vHfSkin.a > 0.5) {
    float fp = length(fwidth(vHfSkP)) * hfSkSet.x;
    float fade = 1.0 - smoothstep(0.35, 1.2, fp);
    float sm = hfSkSoft.x, keep = 1.0 - 0.55 * hfSkSoft.y * step(0.3, vHfSkin.r);
    vec4 amp = vec4(0.06 * vHfSkin.r * (1.0 - 0.35 * sm), 0.04 * smoothstep(0.3, 1.0, vHfSkin.b) * hfSkSet.w * (1.0 - 0.6 * sm) + 0.005 * hfSkSet.w,
      0.05 * vHfSkin.g, 0.1 * smoothstep(0.4, 1.0, vHfSkin.r) * (1.0 - 0.35 * sm)) * keep;
    if (fade > 0.0) {
      vec3 w = pow(abs(normalize(vHfSkN)), vec3(4.0)); w /= w.x + w.y + w.z;
      vec3 px = dFdx(vHfSkP), py = dFdy(vHfSkP);
      float h0 = hfMicroH(vHfSkP, w, amp);
      vec2 dH = vec2(hfMicroH(vHfSkP + px, w, amp) - h0, hfMicroH(vHfSkP + py, w, amp) - h0) * 0.001 * fade;
      normal = hfBumpS(-vViewPosition, normal, dH, gl_FrontFacing ? 1.0 : -1.0);
      float pit = clamp(-h0 / 0.04, 0.0, 1.0) * fade;
      diffuseColor.rgb *= 1.0 - 0.1 * pit;
      roughnessFactor = min(1.0, roughnessFactor + 0.18 * pit);
    }
  }
`;
  function skinLight(chunk) {
    return chunk
      .replace(/float dotNL = saturate\( dot\( ([\w.]+), directLight\.direction \) \);/, (m, n) => m + '\n\tvec3 hfIrrD = hfSkinNL( directLight.direction, ' + n + ' ) * directLight.color;')
      .replace(/irradiance \*= PI;/, 'irradiance *= PI; hfIrrD *= PI;')
      .replace(/reflectedLight\.directDiffuse \+= ([^;]*?)irradiance \* BRDF_/, 'reflectedLight.directDiffuse += $1hfIrrD * BRDF_');
  }
  function skin(THREE, mat, o) {
    o = o || {};
    const U = {
      hfSkMicro: { value: o.micro },
      hfSkSet: { value: new THREE.Vector4(1000 * (o.unit || 1), o.tileMm || 16, o.sss === undefined ? 1 : o.sss, 0.7 + Math.min(1.3, Math.max(0, ((o.age || 30) - 18) / 40))) },
      hfSkSoft: { value: new THREE.Vector2(o.smooth || 0, o.matte || 0) }
    };
    mat.userData.hfSkin = { uniforms: U };
    if (mat.extensions) mat.extensions.derivatives = true;  // WebGL 1 on three before r151
    const prev = mat.onBeforeCompile, key = mat.customProgramCacheKey;
    mat.onBeforeCompile = function (sh, r) {
      if (prev) prev.call(this, sh, r);
      Object.assign(sh.uniforms, U);
      sh.vertexShader = 'attribute vec4 hfSkin;\nvarying vec4 vHfSkin;\nvarying vec3 vHfSkP, vHfSkN;\n' +
        sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvHfSkin = hfSkin; vHfSkP = position; vHfSkN = normal;');
      sh.fragmentShader = SKIN_PARS + sh.fragmentShader
        .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + SKIN_NORMAL)
        .replace('#include <lights_physical_pars_fragment>', skinLight(THREE.ShaderChunk.lights_physical_pars_fragment));
    };
    mat.customProgramCacheKey = function () { return (key ? key.call(this) : '') + '|hfskin'; };
    mat.needsUpdate = true;
    return mat;
  }

  /* peach fuzz (from 1.6; people packed since carry _FUZZ per vertex: how much shows there, laid down by foundation, and
     the way the hairs lie, from tools/forge_skin.py's skin_fuzz.webp; extras.forge.fuzz gives how much on the whole and
     the hairs' colour): fine hairs standing off the skin catch light skimming it and light from behind (a sheen into
     three's direct light: Charlie, Estevez and Kulla 2017, with Neubelt and Pettineo's visibility) and brighten the
     ambient light where the skin turns away (a rim), on every LOD for a few instructions a light; with strands (the ultra
     tier) the hairs themselves once a pixel is under about a fifth of a millimetre: pale, about 25 microns thick, 0.6 to
     1.3 mm long, each in its own cell of the skin's surface at rest. The designer's (designer.js) sums.
     fuzz(THREE, mat, o): o { amount (0..1), color ([r, g, b] linear), strands (true: the hairs), unit (mm per unit of
     position; 1000 for metres) } */
  const FUZZ_PARS = `
uniform vec4 hfFzU;       // how much (spec.face.fuzz), the hairs' colour (linear)
varying vec4 vHfFz;       // how much shows here, the way the hairs lie (x, y, z as 0..1)
float hfFzAmt() { return vHfFz.x * hfFzU.x; }
vec3 hfFuzzSheen(vec3 L, vec3 n, vec3 V) {
  float a = hfFzAmt();
  if (a <= 0.0) return vec3(0.0);
  vec3 H = normalize(L + V);
  float nl = clamp(dot(n, L), 0.0, 1.0), nv = clamp(abs(dot(n, V)), 1e-3, 1.0), nh = clamp(dot(n, H), 0.0, 1.0);
  float D = 4.5 * pow(max(1.0 - nh * nh, 1e-4), 1.25) / 6.2831853;   // sheen roughness 0.4
  float vis = 1.0 / (4.0 * (nl + nv - nl * nv) + 1e-3);
  return hfFzU.yzw * (0.4 * a * D * vis);
}
#ifdef HF_FZ_STRANDS
uniform float hfFzUnit;
varying vec3 vHfFzP, vHfFzN;
// one fuzz hair's cover of this point (p in mm on the body at rest, n its normal, t the way the hairs lie, px mm a pixel)
float hfFzStrand(vec3 p, vec3 n, vec3 t, float dens, float px) {
  vec3 b = normalize(cross(n, t));
  vec2 q = vec2(dot(p, b) / 0.32, dot(p, t) / 1.4);
  vec2 ci = floor(q), f = fract(q);
  vec3 h = fract(sin(vec3(dot(ci, vec2(127.1, 311.7)), dot(ci, vec2(269.5, 183.3)), dot(ci, vec2(419.2, 371.9)))) * 43758.5453);
  if (h.z > dens) return 0.0;
  float len = 0.45 + 0.5 * h.y;
  float along = smoothstep(0.0, 0.06, f.y) * (1.0 - smoothstep(len - 0.2, len, f.y));
  float d = abs(f.x - 0.2 - 0.6 * h.x - (h.y - 0.5) * 0.6 * f.y) * 0.32;   // mm from the hair, a little slanted
  float r = 0.013 * (1.0 - 0.6 * f.y / len);                                // its radius, tapering to the tip
  float aa = max(r, 0.5 * px);
  return along * (1.0 - smoothstep(0.0, aa, d)) * min(1.0, r / aa * 1.5);
}
#endif
`;
  const FUZZ_STRANDS = `
#ifdef HF_FZ_STRANDS
  {
    float fzP = length(fwidth(vHfFzP)) * hfFzUnit;   // mm a pixel (outside the branch: derivatives need the whole quad)
    float fzFade = 1.0 - smoothstep(0.06, 0.2, fzP);
    if (fzFade > 0.0 && hfFzAmt() > 0.0) {
      vec3 fn = normalize(vHfFzN), ft = vHfFz.yzw * 2.0 - 1.0;
      ft = ft - fn * dot(ft, fn);
      if (dot(ft, ft) > 1e-4) {
        float cov = hfFzStrand(vHfFzP * hfFzUnit, fn, normalize(ft), vHfFz.x * min(1.0, hfFzU.x * 1.4), fzP) * fzFade;
        diffuseColor.rgb = mix(diffuseColor.rgb, hfFzU.yzw, 0.55 * cov);
        roughnessFactor = mix(roughnessFactor, 0.45, 0.5 * cov);
      }
    }
  }
#endif
`;
  // the rim: brighter ambient light where the skin turns away (the hairs stand off it against the view)
  const FUZZ_RIM = `
  {
    float hfFzR = hfFzAmt();
    if (hfFzR > 0.0) {
      float hfNvR = clamp(abs(dot(normal, normalize(vViewPosition))), 0.0, 1.0);
      reflectedLight.indirectDiffuse *= 1.0 + 0.55 * hfFzR * pow(1.0 - hfNvR, 4.0);
    }
  }
`;
  // the sheen into three's direct light, after its diffuse (r128 to r186 have these lines)
  function fuzzLight(s) {
    return s.replace(/(float dotNL = saturate\( dot\( ([\w.]+), directLight\.direction \) \);[\s\S]*?reflectedLight\.directDiffuse \+=[^;]*;)/,
      (m, all, n) => all + '\n\treflectedLight.directSpecular += irradiance * hfFuzzSheen( directLight.direction, ' + n + ', normalize( vViewPosition ) );');
  }
  function fuzz(THREE, mat, o) {
    o = o || {};
    const c = o.color || [0.45, 0.37, 0.27], st = !!o.strands;
    const U = { hfFzU: { value: new THREE.Vector4(o.amount === undefined ? 0.6 : o.amount, c[0], c[1], c[2]) }, hfFzUnit: { value: o.unit || 1000 } };
    mat.userData.hfFuzz = { uniforms: U };
    if (mat.extensions) mat.extensions.derivatives = true;  // WebGL 1 on three before r151
    const prev = mat.onBeforeCompile, key = mat.customProgramCacheKey;
    const def = st ? '#define HF_FZ_STRANDS\n' : '';
    mat.onBeforeCompile = function (sh, r) {
      if (prev) prev.call(this, sh, r);
      Object.assign(sh.uniforms, U);
      sh.vertexShader = 'attribute vec4 hfFuzz;\nvarying vec4 vHfFz;\n' + (st ? 'varying vec3 vHfFzP, vHfFzN;\n' : '') +
        sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvHfFz = hfFuzz;' + (st ? ' vHfFzP = position; vHfFzN = normal;' : ''));
      let f = sh.fragmentShader;
      if (f.indexOf('#include <lights_physical_pars_fragment>') >= 0) f = f.replace('#include <lights_physical_pars_fragment>', THREE.ShaderChunk.lights_physical_pars_fragment);
      sh.fragmentShader = def + FUZZ_PARS + fuzzLight(f)
        .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + FUZZ_STRANDS)
        .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n' + FUZZ_RIM);
    };
    mat.customProgramCacheKey = function () { return (key ? key.call(this) : '') + '|hffuzz' + (st ? 's' : ''); };
    mat.needsUpdate = true;
    return mat;
  }

  /* cloth (from 1.5): how each fabric takes the light (data/fabrics.json; the weaves baked by tools/forge_fabric.py into
     fabric_a.webp and fabric_b.webp, which repeat). The weave laid over the cloth in its own space (warp up the body, so
     threads keep their size in mm and stay put as it moves; three ways round, blended by the normal), bumped through the
     screen's derivatives and faded out once a thread is narrower than a pixel or so, the colour shaded by it (valleys
     darker, denim's white weft in them, slubs and dye streaks along the warp); roughness per fabric, peaks a little
     shinier; and the fibres' sheen: a soft highlight of light skimming the cloth (Charlie, Estevez and Kulla 2017, with
     Neubelt and Pettineo's visibility), from the cloth's own colour to white, plus brighter ambient light at grazing
     angles (velvety). The designer (designer.js), the private page's own layers and the built people (forge_pack.py's
     _CLOTH: the fabric's place in the table plus 1 on each garment's vertices, 0 on skin) all use this.
     cloth(THREE, mat, o): o { fabric (name), a, b (the two weave maps), unit (mm per unit of the cloth's positions; 1000
     for metres), at (the attribute that holds them, default position), relief (false: no weave bump, for phones),
     rough (false: leave the material's roughness), table (true: the fabric per vertex from hfCloth, for one material
     over skin and clothes) }. Returns { set(fabric) }. */
  const FAB = /* FABRICS */{"patterns":["plain","twill","jersey","rib","satin","grain","fuzz","basket"],"fabrics":{"cotton":{"label":"Cotton (woven)","pattern":"plain","tile":5,"relief":0.45,"rough":0.84,"sheen":0.45,"sheen_rough":0.5,"sheen_white":0.2,"rim":0.15,"tone":0.22,"fleck":0.0,"mottle":0.15,"nap":0.15},"jersey":{"label":"Cotton jersey","pattern":"jersey","tile":10,"relief":0.55,"rough":0.9,"sheen":0.6,"sheen_rough":0.45,"sheen_white":0.25,"rim":0.2,"tone":0.3,"fleck":0.0,"mottle":0.2,"nap":0.2},"rib":{"label":"Ribbed cotton","pattern":"rib","tile":16,"relief":0.9,"rough":0.9,"sheen":0.55,"sheen_rough":0.45,"sheen_white":0.25,"rim":0.2,"tone":0.4,"fleck":0.0,"mottle":0.15,"nap":0.15},"denim":{"label":"Denim","pattern":"twill","tile":13,"relief":0.8,"rough":0.88,"sheen":0.35,"sheen_rough":0.55,"sheen_white":0.15,"rim":0.1,"tone":0.45,"fleck":0.55,"mottle":0.55,"nap":0.1},"twill":{"label":"Cotton twill","pattern":"twill","tile":8,"relief":0.5,"rough":0.82,"sheen":0.35,"sheen_rough":0.5,"sheen_white":0.2,"rim":0.12,"tone":0.25,"fleck":0.12,"mottle":0.2,"nap":0.1},"wool":{"label":"Wool suiting","pattern":"twill","tile":5,"relief":0.35,"rough":0.76,"sheen":0.6,"sheen_rough":0.4,"sheen_white":0.3,"rim":0.25,"tone":0.18,"fleck":0.05,"mottle":0.15,"nap":0.3},"flannel":{"label":"Flannel","pattern":"plain","tile":7,"relief":0.25,"rough":0.95,"sheen":0.85,"sheen_rough":0.35,"sheen_white":0.3,"rim":0.4,"tone":0.12,"fleck":0.0,"mottle":0.25,"nap":0.7},"knit":{"label":"Knitted wool","pattern":"jersey","tile":64,"relief":1.0,"rough":0.95,"sheen":0.75,"sheen_rough":0.4,"sheen_white":0.3,"rim":0.4,"tone":0.5,"fleck":0.0,"mottle":0.2,"nap":0.45},"fleece":{"label":"Fleece","pattern":"fuzz","tile":20,"relief":0.4,"rough":0.96,"sheen":0.9,"sheen_rough":0.3,"sheen_white":0.25,"rim":0.5,"tone":0.15,"fleck":0.0,"mottle":0.15,"nap":0.6},"terry":{"label":"Terry towelling","pattern":"fuzz","tile":12,"relief":1.0,"rough":0.98,"sheen":0.7,"sheen_rough":0.35,"sheen_white":0.2,"rim":0.45,"tone":0.45,"fleck":0.0,"mottle":0.1,"nap":0.5},"satin":{"label":"Satin","pattern":"satin","tile":5,"relief":0.3,"rough":0.28,"sheen":0.35,"sheen_rough":0.6,"sheen_white":0.6,"rim":0.05,"tone":0.08,"fleck":0.0,"mottle":0.05,"nap":0.0},"silk":{"label":"Silk","pattern":"satin","tile":4,"relief":0.2,"rough":0.22,"sheen":0.45,"sheen_rough":0.55,"sheen_white":0.5,"rim":0.1,"tone":0.06,"fleck":0.0,"mottle":0.12,"nap":0.0},"lace":{"label":"Lace","pattern":"plain","tile":8,"relief":0.5,"rough":0.7,"sheen":0.45,"sheen_rough":0.5,"sheen_white":0.35,"rim":0.1,"tone":0.2,"fleck":0.0,"mottle":0.05,"nap":0.0},"sheer":{"label":"Sheer nylon","pattern":"jersey","tile":3,"relief":0.25,"rough":0.4,"sheen":0.6,"sheen_rough":0.5,"sheen_white":0.35,"rim":0.15,"tone":0.1,"fleck":0.0,"mottle":0.05,"nap":0.0},"spandex":{"label":"Spandex","pattern":"jersey","tile":4,"relief":0.25,"rough":0.44,"sheen":0.55,"sheen_rough":0.5,"sheen_white":0.35,"rim":0.1,"tone":0.12,"fleck":0.0,"mottle":0.05,"nap":0.0},"micro":{"label":"Microfibre","pattern":"jersey","tile":3,"relief":0.2,"rough":0.55,"sheen":0.5,"sheen_rough":0.45,"sheen_white":0.3,"rim":0.12,"tone":0.1,"fleck":0.0,"mottle":0.05,"nap":0.0},"nylon":{"label":"Nylon (ripstop)","pattern":"basket","tile":6,"relief":0.3,"rough":0.48,"sheen":0.2,"sheen_rough":0.5,"sheen_white":0.4,"rim":0.05,"tone":0.12,"fleck":0.0,"mottle":0.05,"nap":0.0},"canvas":{"label":"Canvas","pattern":"basket","tile":14,"relief":0.7,"rough":0.9,"sheen":0.3,"sheen_rough":0.55,"sheen_white":0.2,"rim":0.1,"tone":0.3,"fleck":0.1,"mottle":0.2,"nap":0.15},"leather":{"label":"Leather","pattern":"grain","tile":14,"relief":0.6,"rough":0.42,"sheen":0.1,"sheen_rough":0.6,"sheen_white":0.4,"rim":0.0,"tone":0.2,"fleck":0.0,"mottle":0.25,"nap":0.0},"suede":{"label":"Suede","pattern":"fuzz","tile":6,"relief":0.25,"rough":1.0,"sheen":1.0,"sheen_rough":0.3,"sheen_white":0.2,"rim":0.5,"tone":0.15,"fleck":0.0,"mottle":0.3,"nap":0.5},"felt":{"label":"Wool felt","pattern":"fuzz","tile":8,"relief":0.2,"rough":0.95,"sheen":0.7,"sheen_rough":0.35,"sheen_white":0.25,"rim":0.35,"tone":0.1,"fleck":0.0,"mottle":0.2,"nap":0.4},"latex":{"label":"Latex","pattern":"none","tile":8,"relief":0.0,"rough":0.1,"sheen":0.0,"sheen_rough":0.5,"sheen_white":0.5,"rim":0.0,"tone":0.0,"fleck":0.0,"mottle":0.0,"nap":0.0},"plastic":{"label":"Plastic","pattern":"none","tile":8,"relief":0.0,"rough":0.32,"sheen":0.0,"sheen_rough":0.5,"sheen_white":0.5,"rim":0.0,"tone":0.0,"fleck":0.0,"mottle":0.0,"nap":0.0}},"guess":[["plastic",["glass","sunglass","helmet","visor","headset"]],["lace",["lace_panty","lace_thong"]],["satin",["camisole1","babydoll","french_lingerie","bow_front","bow_bottom","bandeau"]],["spandex",["sport_bra","sport_briefs"]],["jersey",["socks","t-shirt","tshirt","tee","tank","v_neck","camisole_top","bra","panties","panty","briefs","thong","bootyshorts","polo","sportsuit"]],["leather",["boots","oxford","shoes0","gloves"]],["canvas",["sneakers"]],["nylon",["running_shoes","tactical","swim"]],["denim",["jean"]],["twill",["cargo","coverall","worksuit","emt_","patrol_cap","newsboy","fishing_hat","casualsuit","girly_shorts"]],["knit",["sweater","beanie"]],["fleece",["hooded","sweat"]],["felt",["fedora"]],["cotton",["shirt","blouse","chef","dress"]],["wool",["suit","trouser","wool","skirt","pants"]]]}/* /FABRICS */;
  const FAB_NAMES = Object.keys(FAB.fabrics || {});
  // the fabric a garment is made of: its own, else from the words in its asset's name (data/fabrics.json guess)
  function fabricOf(asset, own) {
    if (own && FAB.fabrics[own]) return own;
    const n = String(asset || '').toLowerCase();
    for (const [f, words] of FAB.guess || []) if (words.some((w) => n.indexOf(w) >= 0)) return f;
    return 'cotton';
  }
  // a fabric as the shader's three vec4s: (weave, tile mm, relief, rough), (sheen, its roughness, its whiteness, rim),
  // (tone, fleck, mottle, nap); none: all 0
  function fabricVec(name) {
    const f = FAB.fabrics && FAB.fabrics[name];
    if (!f) return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    return [FAB.patterns.indexOf(f.pattern), f.tile, f.relief, f.rough, f.sheen, f.sheen_rough, f.sheen_white, f.rim, f.tone, f.fleck, f.mottle, f.nap];
  }
  const CLOTH_VPARS = `
#ifdef HF_FB_TABLE
attribute float hfCloth;
uniform vec4 hfFbT[HF_FB_N];
#else
uniform vec4 hfFb[3];
#endif
varying vec4 vHfFb0, vHfFb1, vHfFb2;
varying vec3 vHfFbP, vHfFbN;
`;
  const CLOTH_VERT = `
  vHfFbP = HF_FB_AT; vHfFbN = normal;
#ifdef HF_FB_TABLE
  {
    int k = int(hfCloth + 0.5) - 1;
    if (k < 0) { vHfFb0 = vec4(0.0); vHfFb1 = vec4(0.0); vHfFb2 = vec4(0.0); }
    else { vHfFb0 = hfFbT[k * 3]; vHfFb1 = hfFbT[k * 3 + 1]; vHfFb2 = hfFbT[k * 3 + 2]; }
  }
#else
  vHfFb0 = hfFb[0]; vHfFb1 = hfFb[1]; vHfFb2 = hfFb[2];
#endif
`;
  const CLOTH_PARS = `
uniform sampler2D hfFbA, hfFbB;
uniform float hfFbUnit;
varying vec4 vHfFb0, vHfFb1, vHfFb2;
varying vec3 vHfFbP, vHfFbN;
// the weave's height at q (in tiles): its own channel, and the nap (fuzz) over it
float hfFbS(vec2 q) {
  float p = vHfFb0.x, nap = vHfFb2.w;
  vec4 b = texture2D(hfFbB, q);
  float h = dot(b, vec4(equal(vec4(p), vec4(4.0, 5.0, 6.0, 7.0))));
  if (p < 3.5) h = dot(texture2D(hfFbA, q), vec4(equal(vec4(p), vec4(0.0, 1.0, 2.0, 3.0))));
  return mix(h, b.b, nap * 0.5);
}
// three ways round, warp (the maps' v) up the body: from the side (z, y), from the front (x, y), from above (x, z)
float hfFbH(vec3 q, vec3 w) { return hfFbS(q.zy) * w.x + hfFbS(q.xy) * w.z + hfFbS(q.xz) * w.y; }
vec3 hfFbBump(vec3 pos, vec3 n, vec2 dH, float fd) {
  vec3 sx = dFdx(pos), sy = dFdy(pos), r1 = cross(sy, n), r2 = cross(n, sx);
  float det = dot(sx, r1) * fd;
  return normalize(abs(det) * n - sign(det) * (dH.x * r1 + dH.y * r2));
}
// the fibres' sheen for one light (times its irradiance, so n.l is in it)
vec3 hfFbSheen(vec3 L, vec3 n, vec3 base) {
  if (vHfFb0.y <= 0.0 || vHfFb1.x <= 0.0) return vec3(0.0);
  vec3 V = normalize(vViewPosition), H = normalize(L + V);
  float nl = clamp(dot(n, L), 0.0, 1.0), nv = clamp(abs(dot(n, V)), 1e-3, 1.0), nh = clamp(dot(n, H), 0.0, 1.0);
  float inv = 1.0 / max(vHfFb1.y, 0.07);
  float D = (2.0 + inv) * pow(max(1.0 - nh * nh, 1e-4), inv * 0.5) / (2.0 * PI);
  float vis = 1.0 / (4.0 * (nl + nv - nl * nv) + 1e-3);
  return mix(sqrt(max(base, vec3(0.0))), vec3(1.0), vHfFb1.z) * (0.6 * vHfFb1.x * D * vis);
}
`;
  const CLOTH_NORMAL = `
  if (vHfFb0.y > 0.0) {
    float tile = vHfFb0.y, relief = vHfFb0.z;
    vec3 q = vHfFbP * hfFbUnit / tile;
    vec3 w = pow(abs(normalize(vHfFbN)), vec3(6.0)); w /= w.x + w.y + w.z;
    // a thread is a 16th of the tile: the weave fades out between 5 and 1.7 pixels a thread (finer, it would sparkle)
    float fp = length(fwidth(vHfFbP)) * hfFbUnit * 16.0 / tile;
    float fade = 1.0 - smoothstep(0.2, 0.6, fp);
    float h = 0.5;
    if (vHfFb0.x > -0.5 && hfFbM > 0.5) {
      h = hfFbH(q, w);
#ifndef HF_FB_FLAT
      if (fade > 0.0 && relief > 0.0) {
        // a thread stands about a third of its width: the height in metres, across a pixel each way
        vec3 px = dFdx(q), py = dFdy(q);
        vec2 dH = vec2(hfFbH(q + px, w) - h, hfFbH(q + py, w) - h) * relief * tile * 0.02 * 0.001 * fade;
        normal = hfFbBump(-vViewPosition, normal, dH, gl_FrontFacing ? 1.0 : -1.0);
      }
#endif
      h = mix(0.5, h, fade);
    }
    vec3 c = diffuseColor.rgb;
    c *= mix(1.0, 0.55 + 0.9 * h, vHfFb2.x);
    // denim's white weft in the valleys; from further off, a little paler all over
    float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = mix(c, vec3(lum * 0.6 + 0.45) * vec3(0.96, 0.97, 1.0), vHfFb2.y * mix(0.1, 0.55 * smoothstep(0.55, 0.15, h), fade));
    // slubs and dye streaks, long along the warp
    if (vHfFb2.z > 0.0 && hfFbM > 0.5) {
      vec3 m = q * vec3(0.07, 0.015, 0.07);
      float s = texture2D(hfFbB, m.zy).b * w.x + texture2D(hfFbB, m.xy).b * w.z + texture2D(hfFbB, m.xz).b * w.y;
      c *= 1.0 + vHfFb2.z * 0.45 * (s - 0.5);
    }
    diffuseColor.rgb = c;
#ifdef HF_FB_TABLE
    roughnessFactor = vHfFb0.w;
#endif
    roughnessFactor = clamp(roughnessFactor * (1.0 + 0.3 * relief * (0.5 - h)), 0.04, 1.0);
  }
`;
  // the rim: brighter ambient light where the cloth turns away (fibres standing off it catch the light)
  const CLOTH_RIM = `
  if (vHfFb0.y > 0.0 && vHfFb1.w > 0.0) {
    float nvR = clamp(abs(dot(normal, normalize(vViewPosition))), 0.0, 1.0);
    reflectedLight.indirectDiffuse *= 1.0 + vHfFb1.w * 2.0 * pow(1.0 - nvR, 3.0);
  }
`;
  // the sheen into three's direct light, after its diffuse (r128 to r186 have these lines)
  function clothLight(s) {
    return s.replace(/(float dotNL = saturate\( dot\( ([\w.]+), directLight\.direction \) \);[\s\S]*?reflectedLight\.directDiffuse \+=[^;]*;)/,
      (m, all, n) => all + '\n\treflectedLight.directSpecular += irradiance * hfFbSheen( directLight.direction, ' + n + ', material.diffuseColor );');
  }
  function cloth(THREE, mat, o) {
    o = o || {};
    const table = !!o.table, n = FAB_NAMES.length;
    const U = { hfFbA: { value: o.a || null }, hfFbB: { value: o.b || null }, hfFbUnit: { value: o.unit || 1000 }, hfFbM: { value: o.a && o.b ? 1 : 0 } };
    if (table) {
      const v = [];
      FAB_NAMES.forEach((f) => { const a = fabricVec(f); for (let i = 0; i < 3; i++) v.push(new THREE.Vector4(a[i * 4], a[i * 4 + 1], a[i * 4 + 2], a[i * 4 + 3])); });
      U.hfFbT = { value: v };
    } else U.hfFb = { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] };
    const h = {
      uniforms: U, fabric: null,
      set(name) {
        h.fabric = FAB.fabrics[name] ? name : null;
        if (table) return h;
        const a = fabricVec(h.fabric);
        for (let i = 0; i < 3; i++) U.hfFb.value[i].set(a[i * 4], a[i * 4 + 1], a[i * 4 + 2], a[i * 4 + 3]);
        if (o.rough !== false && h.fabric) mat.roughness = FAB.fabrics[h.fabric].rough;
        return h;
      }
    };
    h.set(o.fabric);
    mat.userData.hfCloth = h;
    if (mat.extensions) mat.extensions.derivatives = true;  // WebGL 1 on three before r151
    const prev = mat.onBeforeCompile, key = mat.customProgramCacheKey;
    const defs = '#define HF_FB_AT ' + (o.at || 'position') + '\n' + (table ? '#define HF_FB_TABLE\n#define HF_FB_N ' + n * 3 + '\n' : '') +
      (o.relief === false ? '#define HF_FB_FLAT\n' : '');
    mat.onBeforeCompile = function (sh, r) {
      if (prev) prev.call(this, sh, r);
      Object.assign(sh.uniforms, U);
      sh.vertexShader = defs + CLOTH_VPARS + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + CLOTH_VERT);
      let f = sh.fragmentShader;
      if (f.indexOf('#include <lights_physical_pars_fragment>') >= 0) f = f.replace('#include <lights_physical_pars_fragment>', THREE.ShaderChunk.lights_physical_pars_fragment);
      f = clothLight(f)
        .replace('#include <common>', '#include <common>\nuniform float hfFbM;\n' + CLOTH_PARS)
        .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + CLOTH_NORMAL)
        .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n' + CLOTH_RIM);
      sh.fragmentShader = defs + f;
    };
    mat.customProgramCacheKey = function () { return (key ? key.call(this) : '') + '|hfcloth' + (table ? 't' : '') + (o.relief === false ? 'f' : '') + (o.at || ''); };
    mat.needsUpdate = true;
    return h;
  }

  // ------------------------------------------------------------------ the forge
  async function load(THREE, base, opts) {
    opts = opts || {};
    base = base.endsWith('/') ? base : base + '/';
    const lr = await fetch(base + 'library.json');
    if (!lr.ok) throw new Error('Human Forge: ' + base + 'library.json ' + lr.status);
    const lib = await lr.json();
    const ag = parseGLB(await fetchBuf(base + (lib.anims && lib.anims.file || 'anims.glb')));
    const info = {};
    (lib.anims && lib.anims.clips || []).forEach((c) => { info[c.name] = c; });
    const refHip = lib.anims && (lib.anims.ref_pelvis || lib.anims.ref_hip) || 0.95;
    // the clips, by node name (bone names are the same in every Forge person); each keeps the pelvis height its pelvis
    // track was made for (a pack's own ref_pelvis)
    function rawOf(g, ref) {
      return (g.json.animations || []).map((an) => {
        const tracks = an.channels.map((ch) => {
          const s = an.samplers[ch.sampler], node = g.json.nodes[ch.target.node].name;
          const times = Array.from(g.acc(s.input)), oa = g.json.accessors[s.output];
          // packs store rotations as normalised integers (glTF core allows it for animation output): back to -1..1
          const unit = oa.normalized ? { 5120: 127, 5121: 255, 5122: 32767, 5123: 65535 }[oa.componentType] : 0;
          const vals = Array.from(g.acc(s.output), unit ? (x) => Math.max(x / unit, -1) : undefined);
          return { node, path: ch.target.path, times, vals };
        });
        return { name: an.name, tracks, ref, duration: Math.max(...tracks.map((t) => t.times[t.times.length - 1])) };
      });
    }
    const rawClips = rawOf(ag, refHip);
    const linear = 'colorSpace' in new THREE.Texture();
    const types = {}, heroes = new Set(), crowds = new Set(), loaded = [];

    function clipOf(c, hip) {
      const k = hip / c.ref;
      return new THREE.AnimationClip(c.name, c.duration, c.tracks.map((t) => {
        if (t.path === 'rotation') return new THREE.QuaternionKeyframeTrack(t.node + '.quaternion', t.times, t.vals);
        const v = t.node === 'pelvis' ? t.vals.map((x) => x * k) : t.vals;
        return new THREE.VectorKeyframeTrack(t.node + '.position', t.times, v);
      }));
    }
    function clipsFor(hip) { return rawClips.map((c) => clipOf(c, hip)); }

    // clip packs (1.7): more clips beside anims.glb, listed in library.json's packs ({ name: { file, clips, ... } },
    // tools/forge_mocap.py); opt-in, as they cost a download: load(THREE, base, { packs: ['mocap'] }) or later
    // await forge.pack('mocap'). A pack's clips join forge.clips and every person, hero and crowd made after; heroes
    // already out get them too, crowds keep the clips they were baked with. A name anims.glb already has stays its own.
    const packs = {};
    function pack(name) {
      if (packs[name]) return packs[name];
      const P = lib.packs && lib.packs[name];
      if (!P) return Promise.reject(new Error('Human Forge: no pack ' + name + ' in library.json'));
      packs[name] = fetchBuf(base + (P.file || name + '.glb')).then((buf) => {
        const raw = rawOf(parseGLB(buf), P.ref_pelvis || P.ref_hip || refHip).filter((c) => {
          if (info[c.name] && info[c.name].pack !== name) { console.warn('Human Forge: pack ' + name + ' clip ' + c.name + ' left out (taken)'); return false; }
          return true;
        });
        (P.clips || []).forEach((c) => { if (raw.some((r) => r.name === c.name)) info[c.name] = Object.assign({ pack: name }, c); });
        raw.forEach((c) => rawClips.push(c));
        loaded.forEach((t) => raw.forEach((c) => t.clips.push(clipOf(c, t.hip))));
        heroes.forEach((h) => h.type.clips.forEach((c) => { if (!h.actions[c.name]) h.actions[c.name] = h.mixer.clipAction(c); }));
        return raw.map((c) => c.name);
      });
      return packs[name];
    }

    async function texOf(g, i, data) {
      const img = g.json.images[i || 0];
      const tex = new THREE.Texture(await loadImage(g.view(img.bufferView), img.mimeType));
      tex.flipY = false;
      if (data) { if (linear) tex.colorSpace = ''; }  // normal and roughness maps: numbers, not colours
      else if (linear) tex.colorSpace = opts.linearTextures ? 'srgb-linear' : 'srgb';
      else if (!opts.linearTextures && THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
      tex.anisotropy = 4;
      tex.needsUpdate = true;
      return tex;
    }

    function meshesOf(g) {
      const J = g.json, lods = {};
      J.nodes.filter((n) => n.mesh !== undefined).forEach((n) => {
        const pr = J.meshes[n.mesh].primitives[0], a = pr.attributes;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(g.acc(a.POSITION), 3));
        geo.setAttribute('normal', new THREE.BufferAttribute(g.acc(a.NORMAL), 3));
        geo.setAttribute('uv', new THREE.BufferAttribute(g.acc(a.TEXCOORD_0), 2));
        geo.setAttribute('skinIndex', new THREE.BufferAttribute(g.acc(a.JOINTS_0), 4));
        geo.setAttribute('skinWeight', new THREE.BufferAttribute(g.acc(a.WEIGHTS_0), 4, true));
        if (a._SKIN !== undefined) geo.setAttribute('hfSkin', new THREE.BufferAttribute(g.acc(a._SKIN), 4, true));  // the ultra tier's skin (1.4)
        if (a._CLOTH !== undefined) geo.setAttribute('hfCloth', new THREE.BufferAttribute(g.acc(a._CLOTH), 4));  // each garment's fabric (1.5)
        if (a._FUZZ !== undefined) geo.setAttribute('hfFuzz', new THREE.BufferAttribute(g.acc(a._FUZZ), 4, true));  // peach fuzz (1.6)
        geo.setIndex(new THREE.BufferAttribute(g.acc(pr.indices), 1));
        geo.computeBoundingSphere();
        lods[n.name.replace('body_', '')] = geo;
      });
      return lods;
    }

    // the skin's micro map (library.json's skin), shared by every ultra person
    let micro = null;
    function microOf() {
      if (!micro) micro = fetchBuf(base + lib.skin.micro).then((b) => loadImage(new Uint8Array(b), 'image/webp')).then((im) => {
        const t = new THREE.Texture(im); t.flipY = false;
        t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.needsUpdate = true;
        return t;
      });
      return micro;
    }

    // the weaves (library.json's fabric, tools/forge_fabric.py), shared by every person built with fabrics; null if the
    // library has none (the cloth is then shaded without its weave)
    let fabMaps = null;
    function fabricsOf() {
      if (!fabMaps) {
        const f = lib.fabric || { a: 'fabric_a.webp', b: 'fabric_b.webp' };
        const one = (file) => fetchBuf(base + file).then((b) => loadImage(new Uint8Array(b), 'image/webp')).then((im) => {
          const t = new THREE.Texture(im); t.flipY = false;
          t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.needsUpdate = true;
          return t;
        });
        fabMaps = Promise.all([one(f.a), one(f.b)]).catch(() => null);
      }
      return fabMaps;
    }

    /* the ultra tier (built with forge.py build --ultra): its own file, the whole mesh smoothed, a 2048 texture */
    function ultra(t) {
      const u = t.meta.ultra;
      if (!u) return Promise.resolve(null);
      // ultra files live in R2 (library.json's ultraBase, forge.py publish), not beside the library; a game's own copy wins
      const at = opts.ultraBase || (u.local ? base : lib.ultraBase || base);
      if (!t.ultra) t.ultra = fetchBuf(at + u.file).then(async (buf) => {
        const g = parseGLB(buf), M = g.json.materials[0], P = M.pbrMetallicRoughness || {};
        const img = (ref) => ref && g.json.textures[ref.index].extensions.EXT_texture_webp.source;
        const out = { geo: meshesOf(g).ultra, tex: await texOf(g, img(P.baseColorTexture)) };
        // its own hair: the ultra atlas is laid out for its own pieces
        const fx = (g.json.nodes.find((n) => n.extras && n.extras.forge) || {}).extras;
        out.hair = fx && fx.forge.hair;
        if (out.hair) strands(THREE, out.geo, out.hair);
        if (M.normalTexture) out.normal = await texOf(g, img(M.normalTexture), true);
        if (P.metallicRoughnessTexture) out.rough = await texOf(g, img(P.metallicRoughnessTexture), true);
        out.skin = fx && fx.forge.skin;  // smoothness, age, foundation (forge_pack.py)
        out.fuzz = fx && fx.forge.fuzz;  // peach fuzz: how much, its colour (1.6)
        if (out.geo.attributes.hfSkin && lib.skin && opts.skin !== false) out.micro = await microOf().catch(() => null);
        return out;
      });
      return t.ultra;
    }

    async function type(id) {
      if (types[id]) return types[id];
      const p = (async () => {
        const g = parseGLB(await fetchBuf(base + id + '.glb'));
        const J = g.json;
        const tex = await texOf(g);
        const skin = J.skins[0];
        const joints = skin.joints.map((n) => J.nodes[n]);
        const parent = {};
        J.nodes.forEach((n, i) => (n.children || []).forEach((c) => { parent[c] = i; }));
        const ibm = g.acc(skin.inverseBindMatrices);
        const lods = meshesOf(g);
        const forge = (J.nodes.find((n) => n.extras && n.extras.forge) || {}).extras;
        if (forge && forge.forge.hair) Object.keys(lods).forEach((k) => strands(THREE, lods[k], forge.forge.hair));
        const meta = lib.people.find((q) => q.id === id) || {};
        // the pelvis' rest height (world y of its head, from its inverse bind matrix): walk clips scale to it
        const pj = skin.joints.findIndex((n) => J.nodes[n].name === 'pelvis');
        const pm = pj >= 0 ? new THREE.Matrix4().fromArray(ibm, pj * 16).invert ? new THREE.Matrix4().fromArray(ibm, pj * 16).invert() : new THREE.Matrix4().getInverse(new THREE.Matrix4().fromArray(ibm, pj * 16)) : null;
        const t = { id, J, joints, jointIdx: skin.joints, parent, ibm, lods, tex, meta, height: (forge && forge.forge.height) || meta.height || 1.75,
          hair: forge && forge.forge.hair, fuzz: forge && forge.forge.fuzz };
        // clothes with their fabrics (people built since 1.5): the weaves, once
        t.cloth = Object.keys(lods).some((k) => lods[k].attributes.hfCloth);
        if (t.cloth && opts.cloth !== false) t.fab = await fabricsOf();
        t.hip = pm ? pm.elements[13] : refHip;
        t.clips = clipsFor(t.hip);
        loaded.push(t);
        return t;
      })();
      types[id] = p;
      return p;
    }

    function rig(t) {
      // bones from the GLB's nodes, the person's group holding them and the prop node
      const group = new THREE.Group();
      group.name = t.id;
      const byNode = {};
      t.jointIdx.forEach((ni) => {
        const n = t.J.nodes[ni], b = new THREE.Bone();
        b.name = n.name;
        if (n.translation) b.position.fromArray(n.translation);
        if (n.rotation) b.quaternion.fromArray(n.rotation);
        byNode[ni] = b;
      });
      t.jointIdx.forEach((ni) => { const p = t.parent[ni]; if (byNode[p]) byNode[p].add(byNode[ni]); else group.add(byNode[ni]); });
      const bones = t.jointIdx.map((ni) => byNode[ni]);
      const inv = bones.map((b, i) => new THREE.Matrix4().fromArray(t.ibm, i * 16));
      const prop = new THREE.Object3D();
      prop.name = 'prop';
      group.add(prop);
      return { group, bones, skeleton: new THREE.Skeleton(bones, inv), prop };
    }

    function material(t, extra, u) {
      const m = new THREE.MeshStandardMaterial(Object.assign({ map: t.tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.85, metalness: 0 }, extra || {}));
      // the hair's part of the texture and its strand direction (forge_pack.py, from 1.3): shaded as hair
      const h = u ? u.hair : t.hair;
      if (h && opts.hair !== false) hair(THREE, m, Object.assign({ size: (u ? u.tex : t.tex).image.width }, h));
      return m;
    }
    const OLD_SKINNING = 'skinning' in new THREE.MeshStandardMaterial(); // three before r129 wants skinning: true on the material
    // the ultra normal maps point green up the image (MakeHuman's, OpenGL style) and the atlas runs v down it: three
    // (r128 to r186 alike, tested) reads green along +v, so flip it
    const NORMAL_Y = -1;
    function heroMaterial(t, u) {
      const m = material(t, u ? Object.assign({ map: u.tex }, u.normal ? { normalMap: u.normal, normalScale: new THREE.Vector2(1, NORMAL_Y) } : {},
        u.rough ? { roughnessMap: u.rough, roughness: 1 } : {}) : null, u);
      if (OLD_SKINNING) m.skinning = true;
      if (u && u.micro) skin(THREE, m, Object.assign({ micro: u.micro, tileMm: lib.skin.tile_mm }, u.skin || {}));
      // peach fuzz (1.6): the sheen and rim on every LOD, the hairs themselves on the ultra tier
      const gf = u ? u.geo : t.lods.hi || t.lods[Object.keys(t.lods)[0]], fz = u ? u.fuzz : t.fuzz;
      if (gf && gf.attributes.hfFuzz && fz && opts.fuzz !== false) fuzz(THREE, m, Object.assign({ unit: 1000, strands: !!u && opts.fuzzStrands !== false }, fz));
      // the clothes by their fabrics (1.5): each garment's own, per vertex; opts.cloth false leaves them plain,
      // opts.clothRelief false keeps the sheen and roughness without the weave (phones)
      const g = u ? u.geo : t.lods.hi || t.lods[Object.keys(t.lods)[0]];
      if (g && g.attributes.hfCloth && opts.cloth !== false) {
        const f = t.fab || null;
        cloth(THREE, m, { table: true, a: f && f[0], b: f && f[1], unit: 1000, relief: opts.clothRelief !== false });
      }
      return m;
    }

    // ---------------------------------------------------------------- heroes
    async function hero(id, o) {
      o = o || {};
      const t = await type(id);
      const r = rig(t);
      const mat = o.material || heroMaterial(t);
      if (o.material && OLD_SKINNING) o.material.skinning = true;
      const meshes = {};
      const u = o.ultra ? await ultra(t) : null;
      const geos = Object.assign({}, t.lods, u ? { ultra: u.geo } : {});
      Object.keys(geos).forEach((k) => {
        const m = new THREE.SkinnedMesh(geos[k], k === 'ultra' && !o.material ? heroMaterial(t, u) : mat);
        m.name = 'body_' + k;
        m.castShadow = o.castShadow !== false;
        m.receiveShadow = !!o.receiveShadow;
        m.frustumCulled = false; // the bounds are the rest pose's; a seated person leaves them
        r.group.add(m);
        m.bind(r.skeleton, new THREE.Matrix4());
        meshes[k] = m;
      });
      const mixer = new THREE.AnimationMixer(r.group);
      const actions = {};
      t.clips.forEach((c) => { actions[c.name] = mixer.clipAction(c); });
      let cur = null, lod = null;
      const h = {
        id, object: r.group, prop: r.prop, mixer, actions, type: t, clip: null,
        lod(k) {
          if (k === lod || !meshes[k]) return h;
          lod = k;
          Object.keys(meshes).forEach((q) => { meshes[q].visible = q === k; });
          return h;
        },
        play(name, p) {
          p = p || {};
          const a = actions[name];
          if (!a) throw new Error('Human Forge: no clip ' + name);
          if (cur === a && !p.restart) { if (p.speed) a.setEffectiveTimeScale(p.speed); return h; }
          a.reset();
          a.setEffectiveTimeScale(p.speed || 1);
          if (p.time !== undefined) a.time = p.time; else if (p.phase !== undefined) a.time = p.phase * a.getClip().duration;
          a.play();
          if (cur && cur !== a && (p.fade === undefined ? 0.25 : p.fade) > 0) cur.crossFadeTo(a, p.fade === undefined ? 0.25 : p.fade, false);
          else if (cur && cur !== a) cur.stop();  // restarting the clip that plays must not stop it (before 1.7 it did)
          cur = a;
          h.clip = name;
          r.prop.visible = !!(info[name] && info[name].prop);
          return h;
        },
        /* walking speed (m/s) to the clip's own playback rate, so feet do not slide */
        pace(speed) {
          const c = info[h.clip];
          if (cur && c && c.speed) cur.setEffectiveTimeScale(speed / (c.speed * (t.hip / refHip) * h.object.scale.y));
          return h;
        },
        update(dt) { mixer.update(dt); return h; },
        dispose() { heroes.delete(h); r.group.removeFromParent && r.group.removeFromParent(); mixer.stopAllAction(); },
        auto: o.autoLod !== false,
        ultra: !!u
      };
      h.lod(o.lod || (u ? 'ultra' : 'hi'));
      h.play(o.clip || 'idle', { fade: 0, phase: o.phase !== undefined ? o.phase : Math.random() });
      heroes.add(h);
      return h;
    }

    // ---------------------------------------------------------------- crowds
    const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);

    function bake(t, names, fps) {
      // every clip's bone matrices, frame by frame, into one float texture: a row per frame, 4 texels per bone
      const r = rig(t);
      const m = new THREE.SkinnedMesh(t.lods.lo || t.lods.md, new THREE.MeshBasicMaterial());
      r.group.add(m);
      m.bind(r.skeleton, new THREE.Matrix4());
      const mixer = new THREE.AnimationMixer(r.group);
      const nb = r.bones.length, cols = nb * 4 + 4; // the last 4 texels: the prop's matrix
      const clips = names.map((n) => t.clips.find((c) => c.name === n)).filter(Boolean);
      const at = {};
      let rows = 0;
      clips.forEach((c) => { const n = Math.max(2, Math.round(c.duration * fps)); at[c.name] = { start: rows, frames: n, fps: n / c.duration, duration: c.duration }; rows += n; });
      const data = new Float32Array(cols * 4 * rows);
      const propM = new Float32Array(16 * rows);
      clips.forEach((c) => {
        const a = mixer.clipAction(c);
        mixer.stopAllAction();
        a.play();
        const A = at[c.name];
        for (let f = 0; f < A.frames; f++) {
          a.time = (f / A.frames) * c.duration;
          mixer.update(0);
          r.group.updateMatrixWorld(true);
          r.skeleton.update();
          data.set(r.skeleton.boneMatrices, (A.start + f) * cols * 4);
          r.prop.matrixWorld.toArray(propM, (A.start + f) * 16);
          data.set(r.prop.matrixWorld.elements, (A.start + f) * cols * 4 + nb * 16);
        }
      });
      const tex = new THREE.DataTexture(data, cols, rows, THREE.RGBAFormat, THREE.FloatType);
      tex.magFilter = tex.minFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;
      tex.flipY = false;
      tex.needsUpdate = true;
      return { tex, at, cols, rows, nb, propM };
    }

    const GLSL_PARS = `
      #define HF_CROWD
      uniform sampler2D hfBones; uniform float hfTime;
      attribute vec4 hfAnim; // first row, frames, frames per second, time offset (s)
      attribute float hfRate;
      #ifndef USE_SKINNING
      attribute vec4 skinIndex; attribute vec4 skinWeight;
      #endif
      mat4 hfBone(int row, float j) {
        int c = int(j) * 4;
        return mat4(texelFetch(hfBones, ivec2(c, row), 0), texelFetch(hfBones, ivec2(c + 1, row), 0),
                    texelFetch(hfBones, ivec2(c + 2, row), 0), texelFetch(hfBones, ivec2(c + 3, row), 0));
      }
      mat4 hfSkin(int row) {
        return skinWeight.x * hfBone(row, skinIndex.x) + skinWeight.y * hfBone(row, skinIndex.y)
             + skinWeight.z * hfBone(row, skinIndex.z) + skinWeight.w * hfBone(row, skinIndex.w);
      }
    `;
    // the skin matrix, blended between the two baked frames either side of now; worked out once at the top of main()
    const GLSL_SKIN = `
      mat4 hfM;
      mat4 hfMat() {
        float hfF = (hfTime * hfRate + hfAnim.w) * hfAnim.z;
        float hfI = floor(hfF);
        float hfK = hfF - hfI;
        int hfA = int(hfAnim.x + mod(hfI, hfAnim.y));
        int hfB = int(hfAnim.x + mod(hfI + 1.0, hfAnim.y));
        return hfSkin(hfA) * (1.0 - hfK) + hfSkin(hfB) * hfK;
      }
    `;

    function patch(mat, U) {
      const prev = mat.onBeforeCompile;
      mat.onBeforeCompile = function (sh, r) {
        if (prev) prev.call(this, sh, r);
        sh.uniforms.hfBones = U.hfBones;
        sh.uniforms.hfTime = U.hfTime;
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', '#include <common>\n' + GLSL_PARS + GLSL_SKIN)
          .replace(/void\s+main\s*\(\s*\)\s*\{/, 'void main() {\n  hfM = hfMat();')
          .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nobjectNormal = normalize(mat3(hfM) * objectNormal);')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed = (hfM * vec4(transformed, 1.0)).xyz;');
      };
      const key = mat.customProgramCacheKey;
      mat.customProgramCacheKey = function () { return 'hf1' + (key ? key.call(this) : ''); };
      return mat;
    }

    async function crowd(id, o) {
      o = o || {};
      const t = await type(id);
      const names = o.clips || Object.keys(info);
      const fps = o.fps || 15;
      t.bakes = t.bakes || {};
      const bk = names.join(',') + '@' + fps;
      const B = t.bakes[bk] || (t.bakes[bk] = bake(t, names, fps));
      const max = o.max || 256;
      const geo = t.lods[o.lod || 'md'].clone();
      const anim = new THREE.InstancedBufferAttribute(new Float32Array(max * 4), 4);
      const rate = new THREE.InstancedBufferAttribute(new Float32Array(max).fill(1), 1);
      geo.setAttribute('hfAnim', anim);
      geo.setAttribute('hfRate', rate);
      const U = { hfBones: { value: B.tex }, hfTime: { value: 0 } };
      const mat = patch(o.material || material(t), U);
      const mesh = new THREE.InstancedMesh(geo, mat, max);
      mesh.name = 'forge_crowd_' + id;
      mesh.frustumCulled = false;
      mesh.castShadow = !!o.castShadow;
      mesh.receiveShadow = !!o.receiveShadow;
      if (mesh.castShadow) mesh.customDepthMaterial = patch(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: t.tex, alphaTest: 0.5 }), U);
      mesh.count = 0;
      // every instance starts white, so tint() works whenever it is first called
      if (o.tint !== false) { mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3).fill(1), 3); }
      const slots = [];
      const free = [];
      const scales = new Float32Array(max).fill(1);
      const _c = new THREE.Color();
      // playback rate: speed as given (0 stands still), or pace (m/s) over the clip's ground speed for this person's size
      const rateOf = (i, name, p) => {
        if (p.pace !== undefined && info[name] && info[name].speed) return p.pace / (info[name].speed * (t.hip / refHip) * scales[i]);
        return p.speed !== undefined ? p.speed : 1;
      };
      const c = {
        id, object: mesh, type: t, max, clips: B.at,
        get count() { return mesh.count; },
        /* add a person; returns a handle (a number) or -1 when full */
        add(p) {
          let i = free.length ? free.pop() : mesh.count < max ? mesh.count++ : -1;
          if (i < 0) return -1;
          slots[i] = true;
          c.place(i, p || {});
          c.anim(i, (p && p.clip) || names[0], p);
          return i;
        },
        remove(i) {
          slots[i] = false;
          _m.makeScale(0, 0, 0);
          mesh.setMatrixAt(i, _m);
          mesh.instanceMatrix.needsUpdate = true;
          free.push(i);
          // trailing free slots leave the draw altogether
          while (mesh.count > 0 && !slots[mesh.count - 1]) { const k = free.indexOf(mesh.count - 1); if (k >= 0) free.splice(k, 1); mesh.count--; }
        },
        /* everyone out at once (for games that repack who is in view every frame: clear(), then add() each) */
        clear() { slots.length = 0; free.length = 0; mesh.count = 0; },
        /* p: x, y, z, heading (about +y), scale; tilt (radians about the person's own left-right axis: -PI/2 lays them
           on their back), roll (about their facing); or matrix (a Matrix4, used as is) */
        place(i, p) {
          if (p.matrix) { mesh.setMatrixAt(i, p.matrix); scales[i] = p.scale || new THREE.Vector3().setFromMatrixScale(p.matrix).y; mesh.instanceMatrix.needsUpdate = true; return; }
          const sc = p.scale || 1;
          scales[i] = sc;
          _q.setFromAxisAngle(_up, p.heading || 0);
          if (p.tilt || p.roll) _q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(p.tilt || 0, 0, p.roll || 0, 'XYZ')));
          _p.set(p.x || 0, p.y || 0, p.z || 0);
          _s.set(sc, sc, sc);
          _m.compose(_p, _q, _s);
          mesh.setMatrixAt(i, _m);
          mesh.instanceMatrix.needsUpdate = true;
        },
        /* a colour multiplied over person i (a THREE.Color, hex number or css string; white clears it) */
        tint(i, col) {
          if (!mesh.instanceColor) return;
          _c.set(col);
          mesh.setColorAt(i, _c);
          mesh.instanceColor.needsUpdate = true;
        },
        /* clip by name; p.phase 0..1 or p.offset seconds, p.speed playback rate (or p.pace in m/s for walk / run) */
        anim(i, name, p) {
          p = p || {};
          const A = B.at[name];
          if (!A) throw new Error('Human Forge: crowd ' + id + ' has no clip ' + name + ' (baked: ' + names.join(', ') + ')');
          const sp = rateOf(i, name, p);
          // restart: the clip's first frame now; otherwise a phase (0..1) or an offset (s), random by default
          const off = p.restart ? -U.hfTime.value * sp : p.offset !== undefined ? p.offset : (p.phase !== undefined ? p.phase : Math.random()) * A.duration;
          anim.setXYZW(i, A.start, A.frames, A.fps, off);
          rate.setX(i, sp);
          anim.needsUpdate = rate.needsUpdate = true;
        },
        /* a new playback rate (or pace, m/s) for person i, keeping their place in the clip */
        rate(i, p) {
          const n = c.clipOf(i);
          const sp = rateOf(i, n, p);
          const old = rate.getX(i);
          if (Math.abs(old - sp) < 1e-3) return;
          anim.setW(i, anim.getW(i) + U.hfTime.value * (old - sp));
          rate.setX(i, sp);
          anim.needsUpdate = rate.needsUpdate = true;
        },
        /* the clip person i is playing */
        clipOf(i) { const s0 = anim.getX(i); for (const n in B.at) if (B.at[n].start === s0) return n; return null; },
        /* the prop's world matrix for person i (a shovel or bag the game draws), into out (a Matrix4) */
        propAt(i, out) {
          const row = Math.floor(anim.getX(i) + ((U.hfTime.value * rate.getX(i) + anim.getW(i)) * anim.getZ(i)) % anim.getY(i));
          out.fromArray(B.propM, row * 16);
          mesh.getMatrixAt(i, _m);
          return out.premultiply(_m).premultiply(mesh.matrixWorld);
        },
        time: 0,
        update(dt) { U.hfTime.value += dt; },
        dispose() { crowds.delete(c); geo.dispose(); mat.dispose(); mesh.removeFromParent && mesh.removeFromParent(); }
      };
      crowds.add(c);
      return c;
    }

    // the LOD for every hero, by distance from the camera (metres)
    const lodAt = Object.assign({ ultra: 6, hi: 12, md: 35 }, opts.lodAt);
    const _w = new THREE.Vector3();
    function update(dt, camera) {
      heroes.forEach((h) => {
        h.update(dt);
        if (camera && h.auto) {
          h.object.getWorldPosition(_w);
          const d = _w.distanceTo(camera.position);
          h.lod(h.ultra && d < lodAt.ultra ? 'ultra' : d < lodAt.hi ? 'hi' : d < lodAt.md ? 'md' : 'lo');
        }
      });
      crowds.forEach((c) => c.update(dt));
    }

    if (opts.packs) await Promise.all((opts.packs === true ? Object.keys(lib.packs || {}) : opts.packs).map(pack));

    return {
      version: VERSION, library: lib, base, clips: info, people: lib.people,
      ids(tag) { return lib.people.filter((p) => !tag || (p.tags || []).indexOf(tag) >= 0).map((p) => p.id); },
      preload: (ids) => Promise.all(ids.map(type)),
      /* a person's texture, for a game that builds its own material (pass it as { material } to hero or crowd) */
      texture: async (id) => (await type(id)).tex,
      hero, crowd, update,
      /* clip packs (1.7): the names library.json offers, and pack(name) to load one (resolves to its clip names) */
      packs: Object.keys(lib.packs || {}), pack,
      /* where the drive clip's hands are: the steering wheel's middle, radius and tilt from a seated person's origin */
      wheel: lib.anims && lib.anims.wheel, bars: lib.anims && lib.anims.bars, seat: lib.anims && lib.anims.seat,
      driveSeat: (lib.anims && lib.anims.drive_seat) || 0.36
    };
  }

  const HF = { load, parseGLB, hair, strands, skin, cloth, fuzz, fabricOf, fabrics: FAB, version: VERSION };
  root.HumanForge = HF;
  if (typeof module !== 'undefined' && module.exports) module.exports = HF;
})(typeof window !== 'undefined' ? window : globalThis);
