// Corley's Island: the small rides. Jessica's golf cart, parked by her paths, and a go-kart on each of Corley's, Dexter's
// and Jessica's islands. They are heavy.js machines that drive like the four-wheeler (hvCar, with their own Tuning keys:
// gc for the golf cart, gk for the go-karts) and seat the worker where you can see him (hvRider, K.seat). They join
// hvs after every other machine, so the saved machine slots (hv0 and on) keep pointing at the same machines
// a four-seat golf cart: 8 ft long, a 65 in wheelbase, 18 in tyres, with a roof
HV_KINDS.golf={n:'golf cart',x:174.4,z:246.7,yaw:1.11,C:[0.55,-0.55],R:0.72,P:[[-0.62,1.2],[0.62,1.2],[-0.62,-1.2],[0.62,-1.2]],hw:0.5,af:0.82,ab:-0.82,wb:1.65,
  eye:[0.25,1.42,-0.2,0,-0.25,10],lamp:[0,0.7,1.2,0,-1,10],cam:0.6,col:'#f2ead8',len:2.4,wid:1.25,car:'gc',snd:'',acc:3,brake:6,rider:true,
  seat:[0.25,0.06,-0.32],legs:[-1.45,1.45],lean:0}
// a rental go-kart: 6 ft long, a 41 in wheelbase, 11 in tyres, the seat a hand's width off the ground
HV_KINDS.kart={n:'go-kart',x:190.1,z:247.9,yaw:2.45,C:[0.4,-0.4],R:0.62,P:[[-0.6,1.0],[0.6,1.0],[-0.6,-0.95],[0.6,-0.95]],hw:0.52,af:0.52,ab:-0.53,wb:1.05,
  eye:[0,0.95,-0.3,0,-0.15,10],lamp:[0,0.3,1.0,0,-1,8],cam:0.45,col:'#e8731a',len:1.9,wid:1.25,car:'gk',snd:'at',acc:6,brake:9,rider:true,
  seat:[0,-0.6,-0.3],legs:[-1.5,0.25],lean:-0.25}
function cartGolf(h){const CREAM=0xf2ead8,RED=0x8e3b2c,TRIM=0x1b1c1e,TAN=0xc9a77a,b=hvKit();
  for(const sx of [-0.5,0.5])for(const sz of [0.82,-0.82])b.wheel(0.23,0.2,sx,0.23,sz,0xc8ccd0);
  // the frame, the body and its cowl, the floor and the bench seats front and back
  b.box(1.0,0.12,2.2,TRIM,0,0.3,0);b.box(1.18,0.3,0.62,CREAM,0,0.55,0.92);b.box(1.12,0.22,0.3,CREAM,0,0.78,0.72,-0.4);
  b.box(1.1,0.06,0.9,TRIM,0,0.4,0.3);for(const sx of [-0.6,0.6])b.box(0.06,0.22,2.3,CREAM,sx,0.5,0);
  b.box(1.1,0.36,0.62,CREAM,0,0.6,-0.4);b.box(1.06,0.12,0.56,TAN,0,0.84,-0.38);b.box(1.06,0.46,0.1,TAN,0,1.12,-0.66,-0.15);
  b.box(1.1,0.3,0.5,CREAM,0,0.6,-0.98);b.box(1.06,0.1,0.46,TAN,0,0.8,-0.98);b.box(1.06,0.36,0.08,TAN,0,1.0,-0.74,0.15);
  // the roof on its four posts, the windscreen, the wheel and the lamps
  for(const sx of [-0.55,0.55]){b.box(0.05,1.08,0.05,TRIM,sx,1.38,0.56,-0.12);b.box(0.05,1.0,0.05,TRIM,sx,1.36,-0.72)}
  b.box(1.24,0.07,1.75,RED,0,1.9,-0.1);b.box(1.06,0.66,0.02,DEX_GLASS,0,1.44,0.6,-0.12);
  b.cyl(0.025,0.025,0.5,6,TRIM,0.25,0.9,0.42,-0.7);b.cyl(0.17,0.17,0.03,14,TRIM,0.25,1.12,0.26,-1.0);
  for(const sx of [-0.4,0.4])b.box(0.14,0.08,0.03,0xfff6d8,sx,0.62,1.24);for(const sx of [-0.45,0.45])b.box(0.12,0.08,0.03,0xb3262c,sx,0.55,-1.24);
  hvMesh(b,h.g)}
function cartKart(h,col){const TRIM=0x1b1c1e,STEEL=0x7a7e82,b=hvKit();
  for(const sx of [-0.52,0.52]){b.wheel(0.14,0.17,sx,0.14,0.52,0xd9d9d9);b.wheel(0.15,0.24,sx,0.15,-0.53,0xd9d9d9)}
  // the tube frame and floor pan, the nose and side pods, the bumpers
  b.box(0.72,0.04,1.5,STEEL,0,0.09,0);b.box(1.02,0.04,0.04,STEEL,0,0.14,0.52);b.box(1.02,0.04,0.04,STEEL,0,0.14,-0.53);
  b.box(0.66,0.14,0.42,col,0,0.18,0.82,-0.18);b.box(0.5,0.08,0.3,0xf4f4f4,0,0.28,0.84,-0.18);
  for(const sx of [-0.45,0.45])b.box(0.18,0.14,0.62,col,sx,0.18,0);
  b.box(0.92,0.05,0.05,STEEL,0,0.13,1.04);b.box(1.28,0.12,0.1,TRIM,0,0.2,-0.9);
  // the bucket seat, the engine beside it, the column and the wheel
  b.box(0.42,0.06,0.42,TRIM,0,0.14,-0.28);b.box(0.42,0.46,0.07,TRIM,0,0.38,-0.5,-0.3);for(const sx of [-0.21,0.21])b.box(0.05,0.3,0.4,TRIM,sx,0.26,-0.3);
  b.box(0.26,0.26,0.26,0x3a3c40,0.36,0.3,-0.48);b.cyl(0.05,0.05,0.24,8,STEEL,0.36,0.5,-0.48);
  b.cyl(0.018,0.018,0.42,6,STEEL,0,0.3,0.28,-1.05);b.cyl(0.14,0.14,0.03,14,TRIM,0,0.44,0.14,-1.15);
  hvMesh(b,h.g)}
// where they park: the golf cart inside the arch where her path leaves the bridge and a go-kart further along it, the
// others beside the four-wheelers
const CARTS=[['golf',174.4,246.7,1.11,'jessica'],['kart',190.1,247.9,2.45,'jessica',0xc0392b],['kart',49,-4,Math.PI/2,'corley',0xe8731a],['kart',-196,262,0,'dexter',DEX_Y]];
for(const [k,x,z,yaw,island,col] of CARTS){const h=hvMake(k,{x,z,yaw,island}),i=hvs.indexOf(h);if(k==='golf')cartGolf(h);else cartKart(h,col);
  WK_RIDES['hv'+i]={o:h,c:h.K.C,r:h.K.R,m:'heavy',n:h.K.n,pick(){hvI=i}};hvReset(h)}
