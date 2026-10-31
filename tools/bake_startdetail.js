// Bakes the start screen's close-up map (shots/startdet/d<i>_<j>.jpg): the same ground as shots/startmap.jpg at 5 pixels
// a metre in SPICK.det's tiles (js/start.js), with the detail that only shows zoomed in: the paved streets with their
// lines, the sidewalks, porches and slabs (the game's raised floors, raiseAt), roofs with a ridge and a shadow, every
// tree's crown, the bridges' railings and decking. The start screen loads only the tiles in view once you have tapped
// to zoom. Run after changing the ground, roads or buildings, with tools/bake_startmap.js (about half an hour):
//   NODE_PATH=$(npm root -g) node tools/play.js --gfx low --steps tools/bake_startdetail.js
const fs=require('fs'),path=require('path');
module.exports=async p=>{const dir=path.join(__dirname,'..','shots','startdet');fs.mkdirSync(dir,{recursive:true});
  const D=await p.evaluate(()=>SPICK.det);let n=0;
  const only=process.env.ONLY;   // e.g. ONLY=3_5,4_5 for just those tiles
  for(let j=0;j<D.n[1];j++)for(let i=0;i<D.n[0];i++){if(only&&!only.split(",").includes(i+"_"+j))continue;
    const u=await p.evaluate(([i,j])=>{const D=SPICK.det,I=SPICK.img,k=D.k,tx=(I[1]-I[0])/D.n[0],tz=(I[3]-I[2])/D.n[1],
      x0=I[0]+i*tx,z0=I[2]+j*tz,W=Math.round(tx*k),H=Math.round(tz*k),st=1/k,E=W+2,c=[0,0,0,0];
      const cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d'),img=g.createImageData(W,H),d=img.data;
      const hs=new Float32Array(E*(H+2));for(let b=0;b<H+2;b++)for(let a=0;a<E;a++)hs[b*E+a]=baseHeight(x0+(a-0.5)*st,z0+(b-0.5)*st);
      // the ground (as the map's tiles colour it), its hills shaded from the north-west, a little grain, and the raised
      // floors (sidewalks, porches, slabs) in concrete
      for(let py=0;py<H;py++)for(let px=0;px<W;px++){const q=(py+1)*E+px+1,h=hs[q],hx=hs[q+1]-hs[q-1],hz=hs[q+E]-hs[q-E],o=(py*W+px)*4,x=x0+(px+0.5)*st,z=z0+(py+0.5)*st;let r,gg,b;
        if(h<WATER){const dp=ss(0,3.5,WATER-h),sh=ss(WATER-0.9,WATER,h),w=0.97+0.05*hash(Math.floor(x*0.7),Math.floor(z*2.1));
          r=(0.27-0.17*dp+0.22*sh)*w;gg=(0.52-0.24*dp+0.18*sh)*w;b=(0.58-0.17*dp+0.1*sh)*w}
        else{const sd=Math.max(0.6,Math.min(1.3,1+(-hx-hz)*0.22/st)),gr=0.95+0.1*hash(x*3.7,z*5.3);
          if(raiseAt(x,z)>0.05){const v=(0.74+0.04*hash(Math.floor(x/1.5),Math.floor(z/1.5)))*sd;r=v;gg=v*0.98;b=v*0.93}
          else{groundColor(x,z,h,c);r=c[0]*sd*gr;gg=c[1]*sd*gr;b=c[2]*sd*gr}}
        d[o]=Math.min(255,r*255);d[o+1]=Math.min(255,gg*255);d[o+2]=Math.min(255,b*255);d[o+3]=255}
      g.putImageData(img,0,0);
      const X=x=>(x-x0)*k,Y=z=>(z-z0)*k,inT=(x,z,m)=>x>x0-m&&x<x0+tx+m&&z>z0-m&&z<z0+tz+m,line=(pts,w,col,dash)=>{g.strokeStyle=col;g.lineWidth=w*k;g.setLineDash(dash?dash.map(v=>v*k):[]);
        g.beginPath();pts.forEach((q,m)=>m?g.lineTo(X(q[0]),Y(q[1])):g.moveTo(X(q[0]),Y(q[1])));g.stroke();g.setLineDash([])};
      g.lineCap='butt';g.lineJoin='round';
      // the town's paved streets (mainStreets, mainland.js): asphalt, a double yellow line on Main and the cross street,
      // white crosswalks at the four-way stop
      for(const r of ISLAND_ROADS){if(r.mid||r.pts.some(q=>q[1]<550))continue;if(!r.pts.some(q=>inT(q[0],q[1],200)))continue;
        line(r.pts,r.w,'#3b3d40');line(r.pts,r.w*0.9,'#45474a');
        if(r.w>=6){const o=0.12;line(r.pts.map(q=>r.pts[0][0]===r.pts[1][0]?[q[0]-o,q[1]]:[q[0],q[1]-o]),0.1,'#e8b923');line(r.pts.map(q=>r.pts[0][0]===r.pts[1][0]?[q[0]+o,q[1]]:[q[0],q[1]+o]),0.1,'#e8b923')}}
      if(inT(0,MST.cz,20)){g.fillStyle='#45474a';g.fillRect(X(-MST.x),Y(MST.cz-MST.cw),2*MST.x*k,2*MST.cw*k);g.fillStyle='#ecebe6';
        for(let s=-MST.x+0.3;s<MST.x-0.3;s+=0.9){g.fillRect(X(s),Y(MST.cz-MST.cw-2.6),0.45*k,2.2*k);g.fillRect(X(s),Y(MST.cz+MST.cw+0.4),0.45*k,2.2*k)}
        for(let s=-MST.cw+0.3;s<MST.cw-0.3;s+=0.9){g.fillRect(X(-MST.x-2.6),Y(s+MST.cz),2.2*k,0.45*k);g.fillRect(X(MST.x+0.4),Y(s+MST.cz),2.2*k,0.45*k)}}
      // causeways and bridges: the deck, its edges or railings, and boards on the timber ones
      for(const b of CAUSEWAYS.concat(BRIDGES)){if(!inT((b.x0+b.x1)/2,(b.z0+b.z1)/2,b.len/2+20))continue;const cw=CAUSEWAYS.includes(b),tim=b.temp||b.dock,ft=b.foot;
        g.save();g.translate(X(b.x0),Y(b.z0));g.rotate(Math.atan2(b.uz,b.ux));const L=b.len*k,hw=b.hw*k;
        g.fillStyle='rgba(0,0,0,.35)';g.fillRect(1.2*k,-hw+1.2*k,L,2*hw+0.8*k);
        g.fillStyle=cw?'#7d7a72':tim?'#5e4630':ft?'#8a2f24':'#5b5f62';g.fillRect(0,-hw-0.5*k,L,2*hw+k);
        g.fillStyle=cw?'#a49a86':tim?'#9c7c56':ft?'#b9563f':'#9a9c9e';g.fillRect(0,-hw,L,2*hw);
        if(tim){g.fillStyle='rgba(40,26,14,.35)';for(let s=0;s<b.len;s+=0.3)g.fillRect(s*k,-hw,0.06*k,2*hw)}
        else if(!cw){g.fillStyle='rgba(255,255,255,.1)';g.fillRect(0,-hw*0.15,L,hw*0.3)}
        g.fillStyle=cw?'#5d5a54':'#e2e0da';g.fillRect(0,-hw-0.5*k,L,0.25*k);g.fillRect(0,hw+0.25*k,L,0.25*k);
        if(!cw){g.fillStyle='#2d2f31';for(let s=0;s<b.len;s+=2.4){g.fillRect(s*k,-hw-0.55*k,0.25*k,0.35*k);g.fillRect(s*k,hw+0.2*k,0.25*k,0.35*k)}}
        g.restore()}
      // walls, fences and railings, then the furniture, then the roofs over the buildings with their shadows
      const S=SOLIDS.filter(s=>inT(s.x,s.z,30)),dim=s=>s.sn!==undefined?[s.lx,s.lz]:[s.hx,s.hz],place=s=>{g.translate(X(s.x),Y(s.z));if(s.sn!==undefined)g.rotate(Math.atan2(s.sn,s.cs))};
      const big=s=>{const [hx,hz]=dim(s);return !(Math.min(hx,hz)<0.5||hx<1.4&&hz<1.4)},FT=S.filter(s=>s.foot);
      // one roof a building: the parts of one you can go into lie inside its footprint (foot) and go under its roof
      const under=s=>!s.foot&&FT.some(f=>Math.abs(s.x-f.x)<f.hx&&Math.abs(s.z-f.z)<f.hz),roof=s=>big(s)&&!under(s);
      g.save();g.filter=`blur(${0.8*k}px)`;g.fillStyle='rgba(6,10,4,.42)';for(const s of S){if(!roof(s))continue;const [hx,hz]=dim(s);g.save();place(s);g.translate(1.6*k,1.6*k);g.fillRect(-hx*k,-hz*k,2*hx*k,2*hz*k);g.restore()}g.restore();
      for(const s of S){if(big(s)||under(s))continue;const [hx,hz]=dim(s);g.save();place(s);g.fillStyle=Math.min(hx,hz)<0.5?'#5a4a3a':'#3a3632';g.fillRect(-hx*k,-hz*k,Math.max(1,2*hx*k),Math.max(1,2*hz*k));g.restore()}
      const ROOFS=[[78,82,88],[96,74,58],[122,64,52],[70,88,102],[64,84,68],[108,104,98],[58,60,64],[140,96,70]];
      for(const s of S){if(!roof(s))continue;const [hx,hz]=dim(s),cl=ROOFS[Math.floor(hash(s.x*0.37,s.z*0.53)*ROOFS.length)],rgb=(f)=>`rgb(${cl.map(v=>Math.round(v*f)).join(',')})`;
        g.save();place(s);const A=hx*k,B=hz*k;
        if(hx>=hz){g.fillStyle=rgb(1.18);g.fillRect(-A,-B,2*A,B);g.fillStyle=rgb(0.82);g.fillRect(-A,0,2*A,B);g.fillStyle='rgba(0,0,0,.08)';for(let y=-B;y<B;y+=0.45*k)g.fillRect(-A,y,2*A,0.07*k);g.fillStyle=rgb(1.35);g.fillRect(-A,-0.12*k,2*A,0.24*k)}
        else{g.fillStyle=rgb(1.18);g.fillRect(-A,-B,A,2*B);g.fillStyle=rgb(0.82);g.fillRect(0,-B,A,2*B);g.fillStyle='rgba(0,0,0,.08)';for(let x=-A;x<A;x+=0.45*k)g.fillRect(x,-B,0.07*k,2*B);g.fillStyle=rgb(1.35);g.fillRect(-0.12*k,-B,0.24*k,2*B)}
        g.strokeStyle='rgba(20,16,12,.7)';g.lineWidth=0.18*k;g.strokeRect(-A,-B,2*A,2*B);g.restore()}
      // the trees: a soft shadow to the south-east, then a crown of leafy clumps lit from the north-west
      const T=mapTrees().filter(t=>inT(t[0],t[1],t[2]+4));
      g.save();g.filter=`blur(${0.6*k}px)`;g.fillStyle='rgba(8,16,6,.4)';for(const [x,z,rr] of T){g.beginPath();g.ellipse(X(x+rr*0.55),Y(z+rr*0.55),rr*k,rr*0.9*k,0.6,0,7);g.fill()}g.restore();
      for(const [x,z,rr,nn] of T){const R=rr*k,v=nn*22|0,cx=X(x),cy=Y(z),dark=`rgb(${24+v},${48+v},${20})`,lite=`rgb(${96+v},${136+v},${60+v/2})`;
        g.fillStyle=dark;g.beginPath();g.arc(cx,cy,R,0,7);g.fill();
        const m=5+(nn*4|0);for(let q=0;q<m;q++){const a=q/m*6.283+nn*9,rq=R*(0.42+0.12*hash(q,nn*50)),dx=Math.cos(a)*R*0.48,dy=Math.sin(a)*R*0.48;
          const gr=g.createRadialGradient(cx+dx-rq*0.4,cy+dy-rq*0.4,rq*0.1,cx+dx,cy+dy,rq);gr.addColorStop(0,lite);gr.addColorStop(1,dark);g.fillStyle=gr;g.beginPath();g.arc(cx+dx,cy+dy,rq,0,7);g.fill()}
        const gr=g.createRadialGradient(cx-R*0.3,cy-R*0.3,R*0.05,cx,cy,R*0.55);gr.addColorStop(0,lite);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.beginPath();g.arc(cx,cy,R*0.55,0,7);g.fill()}
      // the lake's edges fade into its own blue, as on the whole map's picture
      const F=30;for(const [a,s] of [[I[0],1],[I[1],-1]]){if(Math.abs(a-x0)>F+tx&&Math.abs(a-x0-tx)>F+tx)continue;const gr=g.createLinearGradient(X(a),0,X(a+s*F),0);gr.addColorStop(0,SPICK.lake);gr.addColorStop(1,SPICK.lake+'00');
        g.fillStyle=gr;g.fillRect(Math.min(X(a),X(a+s*F)),0,F*k,Y(SPICK.shore-8))}
      return cv.toDataURL('image/jpeg',0.78)},[i,j]);
    fs.writeFileSync(path.join(dir,`d${i}_${j}.jpg`),Buffer.from(u.split(',')[1],'base64'));n++}
  return n+' close-up tiles'};
