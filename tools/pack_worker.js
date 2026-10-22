#!/usr/bin/env node
// Packs the worker that tools/build_worker.py writes from Blender into models/worker.glb for the game: textures down to
// 1024 px (JPEG where there is no see-through, PNG for the hair, eyebrows and eyelashes), materials solid or cut out
// instead of blended (so they sort and cast shadows), and the vertices welded and quantized.
//   NODE_PATH=<dir with @gltf-transform/core, functions, extensions and sharp> node tools/pack_worker.js <in.glb> models/worker.glb
const {NodeIO}=require('@gltf-transform/core');
const {ALL_EXTENSIONS}=require('@gltf-transform/extensions');
const {textureCompress,weld,quantize,prune,dedup}=require('@gltf-transform/functions');
const sharp=require('sharp');
const [src,out]=process.argv.slice(2);
const CUT=/eyebrow|eyelash|short02/i;
(async()=>{const io=new NodeIO().registerExtensions(ALL_EXTENSIONS),doc=await io.read(src);
  for(const m of doc.getRoot().listMaterials()){
    if(CUT.test(m.getName())){m.setAlphaMode('MASK');m.setAlphaCutoff(/short02/i.test(m.getName())?0.45:0.3);m.setDoubleSided(true)}
    else{m.setAlphaMode('OPAQUE');m.setDoubleSided(/casualsuit/i.test(m.getName()))}}
  const cut=new Set();for(const m of doc.getRoot().listMaterials())if(CUT.test(m.getName())){const t=m.getBaseColorTexture();if(t)cut.add(t.getName())}
  await doc.transform(dedup(),weld(),
    textureCompress({encoder:sharp,targetFormat:'jpeg',quality:84,resize:[1024,1024],pattern:new RegExp('^(?!('+[...cut].join('|')+')$)')}),
    textureCompress({encoder:sharp,targetFormat:'png',resize:[512,512],pattern:new RegExp('^('+[...cut].join('|')+')$')}),
    quantize({quantizePosition:14,quantizeNormal:10,quantizeTexcoord:12}),prune());
  await io.write(out,doc);console.log('wrote',out,require('fs').statSync(out).size)})();
