// Corley's Island: the panels over the game (How to play, Controls, Keys, Graphics, Stats, Sound, Sync and the site map) as one stack.
// Opening one puts it on top; Esc and controller B (goBack, controls.js) close the top one only, and go back to where it
// was opened from: the ☰ menu (on the tab it was on), or the panel it replaced (Controls, for Keys). Each panel keeps its
// own show function; it is wrapped here, so every way of opening or closing it counts.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const PANELS=[['howBox','showHow'],['ctrlsBox','showCtrls'],['keysBox','showKeys'],['gfxBox','showGfx'],['statBox','showStats'],['sndBox','showSound'],['syncBox','showSync'],['bigmap','toggleMap']];
const panelStack=[],panelFrom={};let panelShut=null;
const panelFn=id=>PANELS.find(p=>p[0]===id)[1];
// after a show function ran: put the panel on the stack or take it off, noting what it was opened from
function panelSync(id){const open=!document.getElementById(id).hidden,i=panelStack.findIndex(p=>p.id===id),now=performance.now();
  if(open&&i<0){const pj=panelShut&&now-panelShut.t<400&&panelShut.t>=menuShutT,from=!$('#menu').hidden?'menu':pj?panelShut.id:now-menuShutT<400?'menu':null;panelStack.push({id,from})}
  else if(!open&&i>=0){panelFrom[id]=panelStack[i].from;panelStack.splice(i,1);panelShut={id,t:now}}}
for(const [id,fn] of PANELS){const f=window[fn];window[fn]=function(...a){const r=f.apply(this,a);panelSync(id);return r}}
// close the top panel and go back where it came from; false if no panel was open
function panelBack(){const p=panelStack[panelStack.length-1];if(!p)return false;
  window[panelFn(p.id)](false);if(!document.getElementById(p.id).hidden){panelStack.pop()}
  if(p.from==='menu')showMenu(true);
  else if(p.from){window[panelFn(p.from)](true);const q=panelStack[panelStack.length-1];if(q&&q.id===p.from)q.from=panelFrom[p.from]==='menu'?'menu':null}
  return true}
$('#mapBtn').onclick=()=>{toggleMap(true);showMenu(false)};
