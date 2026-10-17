// Backhoe Dig: key bindings: every keyboard action with its default keys, the player's own keys (saved on this device)
// and the Keys panel (☰ menu) that lists what each key does and lets any of them be changed.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// ---------- actions ----------
// g: group in the panel, n: name, d: what it does in each mode, k: default keys (up to two), s: where it works ('walk' on
// foot, 'ride' in a machine, otherwise everywhere). One key can do one job on foot and another in a machine
const KEY_ACTIONS=[
  {id:'lUp',g:'Sticks',n:'Left stick up',d:'Stick out · drive forward · gas · left lap bar forward · walk forward',k:['KeyW','ArrowUp']},
  {id:'lDown',g:'Sticks',n:'Left stick down',d:'Stick in · drive back · brake and reverse · left lap bar back · walk back',k:['KeyS','ArrowDown']},
  {id:'lLeft',g:'Sticks',n:'Left stick left',d:'Swing left · turn left · steer left · spin left · step left',k:['KeyA','ArrowLeft']},
  {id:'lRight',g:'Sticks',n:'Left stick right',d:'Swing right · turn right · steer right · spin right · step right',k:['KeyD','ArrowRight']},
  {id:'rUp',g:'Sticks',n:'Right stick up',d:'Boom down · bed up · right lap bar forward · look up',k:['KeyI']},
  {id:'rDown',g:'Sticks',n:'Right stick down',d:'Boom up · bed down · right lap bar back · look down',k:['KeyK']},
  {id:'rLeft',g:'Sticks',n:'Right stick left',d:'Curl the bucket in (scoop) · turn left on foot',k:['KeyJ']},
  {id:'rRight',g:'Sticks',n:'Right stick right',d:'Dump the bucket · turn right on foot',k:['KeyL']},
  {id:'fine',g:'Sticks',n:'Fine control',d:'Hold for slow, careful moves in a machine',k:['ShiftLeft','ShiftRight'],s:'ride'},
  {id:'dig',g:'Modes',n:'Dig',d:'Run the excavator arm',k:['Digit1']},
  {id:'drive',g:'Modes',n:'Drive',d:'Drive the excavator on its tracks',k:['Digit2']},
  {id:'truck',g:'Modes',n:'Truck',d:'Drive the dump truck',k:['Digit3']},
  {id:'mow',g:'Modes',n:'Mow',d:'Drive the mower',k:['Digit4']},
  {id:'walk',g:'Modes',n:'Walk',d:'Get out and walk',k:['Digit5']},
  {id:'nextMode',g:'Modes',n:'Next mode',d:'With Shift held, the one before',k:['Tab']},
  {id:'enter',g:'On foot',n:'Get in / get out',d:'Climb into the machine you are standing next to; press again to climb out',k:['KeyF']},
  {id:'jump',g:'On foot',n:'Jump',d:'About 6 ft: onto blocks and up stacks',k:['Space'],s:'walk'},
  {id:'sprint',g:'On foot',n:'Sprint',d:'Hold to run flat out, about 12 mph',k:['ShiftLeft','ShiftRight'],s:'walk'},
  {id:'blocks',g:'Blocks',n:'Blocks on / off',d:'Show the block bar and the outline where one lands',k:['KeyB']},
  {id:'place',g:'Blocks',n:'Place block',d:'Under the bucket, or in front of you on foot',k:['KeyE']},
  {id:'lift',g:'Blocks',n:'Lift block',d:'The top block under the bucket, or the one in front of you',k:['KeyX']},
  {id:'size',g:'Blocks',n:'Block size',d:'1×1, 2×2, 3×3 ft',k:['KeyV']},
  {id:'box',g:'Site',n:'Trench box',d:'Hook it to the bucket, or set it down',k:['KeyT']},
  {id:'pump',g:'Site',n:'Pump',d:'Dewater a flooded hole',k:['KeyP']},
  {id:'cam',g:'View',n:'Cab view',d:'Switch between the cab (or your own eyes) and the chase camera',k:['KeyC']},
  {id:'map',g:'View',n:'Big map',d:'Open or close the site map',k:['KeyM']},
  {id:'sound',g:'View',n:'Sound',d:'Sound on or off',k:['KeyN']},
  {id:'help',g:'View',n:'How to play',d:'Open or close the help card',k:['KeyH']}];
const KEY_BY={};for(const a of KEY_ACTIONS)KEY_BY[a.id]=a;
// the player's keys: action id -> [key code or '', key code or '']
const keyBind={};
function keyDefaults(){for(const a of KEY_ACTIONS)keyBind[a.id]=[a.k[0]||'',a.k[1]||'']}
function keySave(){try{localStorage.setItem('bhd_keys',JSON.stringify(keyBind))}catch(e){}}
keyDefaults();
try{const s=JSON.parse(localStorage.getItem('bhd_keys')||'null');if(s)for(const id in s)if(KEY_BY[id]&&Array.isArray(s[id]))keyBind[id]=[s[id][0]||'',s[id][1]||'']}catch(e){}
// actions a key code runs (a key belongs to one action at a time)
function keyActs(code){const out=[];for(const id in keyBind)if(keyBind[id].includes(code))out.push(id);return out}
function keyIs(code,id){return !!code&&keyBind[id].includes(code)}
// readable key names: KeyW -> W, ArrowUp -> ↑, ShiftLeft -> Left Shift
function keyName(c){if(!c)return '—';
  const n={Space:'Space',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',ShiftLeft:'Left Shift',ShiftRight:'Right Shift',ControlLeft:'Left Ctrl',ControlRight:'Right Ctrl',
    AltLeft:'Left Alt',AltRight:'Right Alt',Enter:'Enter',Tab:'Tab',Backquote:'`',Minus:'-',Equal:'=',BracketLeft:'[',BracketRight:']',Backslash:'\\',Semicolon:';',Quote:"'",
    Comma:',',Period:'.',Slash:'/',CapsLock:'Caps Lock',Backspace:'Backspace',Delete:'Delete',Insert:'Insert',Home:'Home',End:'End',PageUp:'Page Up',PageDown:'Page Down'}[c];
  if(n)return n;if(/^Key[A-Z]$/.test(c))return c.slice(3);if(/^Digit\d$/.test(c))return c.slice(5);if(/^Numpad/.test(c))return 'Num '+c.slice(6);return c}
// the first key bound to an action, for captions and tips
function keyLabel(id){const b=keyBind[id];return keyName(b[0]||b[1])}
// two actions clash on a key unless one only works on foot and the other only in a machine
function keyClash(a,b){const x=KEY_BY[a].s,y=KEY_BY[b].s;return !x||!y||x===y}
// give a key to an action (taking it from any other it would clash with); returns the name of the action it came from, if any
function keyAssign(id,slot,code){let from='';
  if(code)for(const o in keyBind){const i=keyBind[o].indexOf(code);if(i>=0&&!(o===id&&i===slot)&&keyClash(o,id)){keyBind[o][i]='';from=KEY_BY[o].n}}
  keyBind[id][slot]=code;keySave();return from}
// ---------- Keys panel ----------
const keysBox=$('#keysBox');let keyCap=null;
function keysDraw(){const L=$('#keysList');let h='',g='';
  for(const a of KEY_ACTIONS){if(a.g!==g){g=a.g;h+=`<h2>${g}</h2>`}
    h+=`<div class="krow"><div class="kname">${a.n}<small>${a.d}</small></div>`+[0,1].map(s=>{const c=keyBind[a.id][s],cap=keyCap&&keyCap.id===a.id&&keyCap.slot===s;
      return `<button class="kbtn${cap?' cap':''}${c?'':' none'}" data-id="${a.id}" data-s="${s}" aria-label="${a.n}, key ${s+1}: ${cap?'press a key':keyName(c)}">${cap?'Press a key':keyName(c)}</button>`}).join('')+'</div>'}
  L.innerHTML=h}
function showKeys(on){keysBox.hidden=!on;keyCap=null;if(on)keysDraw();setCaps()}
$('#keysList').addEventListener('click',e=>{const b=e.target.closest('.kbtn');if(!b)return;
  const id=b.dataset.id,s=+b.dataset.s;keyCap=keyCap&&keyCap.id===id&&keyCap.slot===s?null:{id,slot:s};keysDraw();
  $('#keysNote').textContent=keyCap?`Press the key for “${KEY_BY[id].n}”. Backspace clears it, Esc cancels.`:''});
// while a box waits for a key, that key goes to the panel and nowhere else
addEventListener('keydown',e=>{if(!keyCap||keysBox.hidden)return;e.preventDefault();e.stopImmediatePropagation();
  const c=e.code,{id,slot}=keyCap;keyCap=null;
  if(c==='Escape'){$('#keysNote').textContent='';keysDraw();return}
  const from=c==='Backspace'||c==='Delete'?keyAssign(id,slot,''):keyAssign(id,slot,c);
  $('#keysNote').textContent=c==='Backspace'||c==='Delete'?`Cleared a key from “${KEY_BY[id].n}”.`:from&&from!==KEY_BY[id].n?`${keyName(c)} now does “${KEY_BY[id].n}”. It was on “${from}”, which no longer has it.`:`${keyName(c)} now does “${KEY_BY[id].n}”.`;
  keysDraw()},{capture:true});
$('#keysDone').onclick=()=>showKeys(false);
$('#keysReset').onclick=()=>{keyDefaults();keySave();keyCap=null;$('#keysNote').textContent='Back to the standard keys.';keysDraw()};
keysBox.addEventListener('pointerdown',e=>{if(e.target===keysBox)showKeys(false)});
addEventListener('keydown',e=>{if(e.code==='Escape'&&!keysBox.hidden)showKeys(false)});
