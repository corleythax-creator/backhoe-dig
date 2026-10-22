// Corley's Island: key bindings: every keyboard action with its default keys, the player's own keys (saved on this device)
// and the Keys panel (☰ menu) that lists what each key does and lets any of them be changed.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// ---------- actions ----------
// g: group in the panel, n: name, d: what it does in each mode, k: default keys (up to two), s: where it works ('walk' on
// foot, 'ride' in a machine, otherwise everywhere). One key can do one job on foot and another in a machine
const KEY_ACTIONS=[
  {id:'lUp',g:'Sticks',n:'Left stick up',d:'Stick out · drive forward · gas · mower straight ahead · walk forward',k:['KeyW','ArrowUp']},
  {id:'lDown',g:'Sticks',n:'Left stick down',d:'Stick in · drive back · brake and reverse · mower straight back · walk back',k:['KeyS','ArrowDown']},
  {id:'lLeft',g:'Sticks',n:'Left stick left',d:'Swing left · turn left · steer left · spin left · step left',k:['KeyA','ArrowLeft']},
  {id:'lRight',g:'Sticks',n:'Left stick right',d:'Swing right · turn right · steer right · spin right · step right',k:['KeyD','ArrowRight']},
  {id:'rUp',g:'Sticks',n:'Right stick up',d:'Boom down · bed up · look up',k:['KeyI']},
  {id:'rDown',g:'Sticks',n:'Right stick down',d:'Boom up · bed down · look down',k:['KeyK']},
  {id:'rLeft',g:'Sticks',n:'Right stick left',d:'Curl the bucket in (scoop) · turn left on foot',k:['KeyJ']},
  {id:'rRight',g:'Sticks',n:'Right stick right',d:'Dump the bucket · turn right on foot',k:['KeyL']},
  {id:'fine',g:'Sticks',n:'Fine control',d:'Hold for slow, careful moves in a machine',k:['ShiftLeft','ShiftRight'],s:'ride'},
  {id:'mwFwd',g:'Mower',n:'Straight ahead',d:'Both lap bars forward',k:['Numpad8'],s:'ride'},
  {id:'mwBack',g:'Mower',n:'Straight back',d:'Both lap bars back',k:['Numpad2'],s:'ride'},
  {id:'mwSpinL',g:'Mower',n:'Spin left',d:'Left bar back, right bar forward: turns in place',k:['Numpad4'],s:'ride'},
  {id:'mwSpinR',g:'Mower',n:'Spin right',d:'Left bar forward, right bar back: turns in place',k:['Numpad6'],s:'ride'},
  {id:'mwLF',g:'Mower',n:'Left lap bar forward',d:'Left wheel only: pivots right',k:['Numpad7'],s:'ride'},
  {id:'mwLB',g:'Mower',n:'Left lap bar back',d:'Left wheel only, in reverse',k:['Numpad1'],s:'ride'},
  {id:'mwRF',g:'Mower',n:'Right lap bar forward',d:'Right wheel only: pivots left',k:['Numpad9'],s:'ride'},
  {id:'mwRB',g:'Mower',n:'Right lap bar back',d:'Right wheel only, in reverse',k:['Numpad3'],s:'ride'},
  {id:'dig',g:'Modes',n:'Dig',d:'Run the excavator arm',k:['Digit1']},
  {id:'drive',g:'Modes',n:'Drive',d:'Drive the excavator on its tracks',k:['Digit2']},
  {id:'exSwap',g:'Modes',n:'Drive / Dig',d:'In the excavator: switch between driving the tracks and running the arm',k:['Enter'],s:'ride'},
  {id:'truck',g:'Modes',n:'Truck',d:'Drive the dump truck',k:['Digit3']},
  {id:'mow',g:'Modes',n:'Mow',d:'Drive the mower',k:['Digit4']},
  {id:'skid',g:'Modes',n:'Skid steer',d:'Drive Dexter\'s skid steer',k:['Digit6']},
  {id:'walk',g:'Modes',n:'Walk',d:'Get out and walk',k:['Digit5']},
  {id:'nextMode',g:'Modes',n:'Next mode',d:'With Shift held, the one before',k:['Tab']},
  {id:'enter',g:'On foot',n:'Get in / get out',d:'Climb into the machine you are standing next to (or sit down at a game table on the pavilion); press again to climb out',k:['KeyF']},
  {id:'jump',g:'On foot',n:'Jump',d:'About 6 ft: onto blocks and up stacks',k:['Space'],s:'walk'},
  {id:'sprint',g:'On foot',n:'Sprint',d:'Hold to run flat out, about 12 mph',k:['ShiftLeft','ShiftRight'],s:'walk'},
  {id:'plant',g:'On foot',n:'Plant a tree',d:'A sapling of the chosen kind in front of you (next to one of yours: dig it up). Slide ☰ Time, Date ahead to see it grow',k:['Digit7'],s:'walk'},
  {id:'trim',g:'On foot',n:'String trimmer',d:'Take out or put away the string trimmer: it cuts the grass and weeds it swings over (a fresh spool each time you put it away)',k:['Digit9'],s:'walk'},
  {id:'trimBump',g:'On foot',n:'Bump the trimmer line',d:'Taps the head on the ground to feed more line off the spool when it wears short',k:['Digit0'],s:'walk'},
  {id:'plantKind',g:'On foot',n:'Tree to plant',d:'Steps through spruce, red pine, oak, sugar maple and birch',k:['Digit8'],s:'walk'},
  {id:'blocks',g:'Blocks',n:'Blocks on / off',d:'Show the block bar and the outline where one lands',k:['KeyB']},
  {id:'place',g:'Blocks',n:'Place block',d:'Under the bucket, in front of you on foot, or at the dot in first person',k:['KeyE']},
  {id:'lift',g:'Blocks',n:'Lift block',d:'The top block under the bucket, the one in front of you, or the one at the dot',k:['KeyX']},
  {id:'size',g:'Blocks',n:'Block size',d:'Steps through cubes, 1 to 10 ft (the block bar sets wide, long and tall one by one, down to 1 in)',k:['KeyV']},
  {id:'blkTurn',g:'Blocks',n:'Turn block',d:'A quarter turn: wide and long swap',k:['KeyQ']},
  {id:'blkLock',g:'Blocks',n:'Block snap',d:'Grid, grid plus flush against nearby blocks, nearby blocks only, or free (exactly where you aim)',k:['Backslash']},
  {id:'blkMat',g:'Blocks',n:'Block material',d:'Next material: plain concrete, then the library',k:['KeyY']},
  {id:'blkFar',g:'Blocks',n:'Reach farther',d:'In first person on foot, push the block out from you (the mouse wheel does too)',k:['BracketRight']},
  {id:'blkNear',g:'Blocks',n:'Reach nearer',d:'In first person on foot, pull the block back toward you',k:['BracketLeft']},
  {id:'box',g:'Site',n:'Trench box',d:'Hook it to the bucket, or set it down',k:['KeyT']},
  {id:'coupler',g:'Site',n:'Quick coupler',d:'In Dig: set the attachment down, or pick up the one the coupler is lowered onto (bucket, thumb, hammer, auger)',k:['Period'],s:'ride'},
  {id:'grip',g:'Site',n:'Thumb grip',d:'With the thumb on: grip the block between its jaws, or let it go',k:['Comma'],s:'ride'},
  {id:'pump',g:'Site',n:'Pump',d:'Dewater a flooded hole',k:['KeyP']},
  {id:'wipers',g:'Site',n:'Wipers',d:'Turn the windscreen wipers on or off in the excavator and the truck',k:['Space'],s:'ride'},
  {id:'cam',g:'View',n:'Cab view',d:'Switch between the cab (or your own eyes) and the chase camera',k:['KeyC']},
  {id:'lookAhead',g:'View',n:'Look ahead',d:'In cab view, turn your head back to straight ahead and zoom out',k:['KeyR']},
  {id:'zoom',g:'View',n:'Zoom',d:'Hold to zoom in, in cab view (the mouse wheel or a pinch zooms too, but on foot with blocks on the wheel sets their reach)',k:['KeyZ']},
  {id:'map',g:'View',n:'Big map',d:'Open or close the site map',k:['KeyM']},
  {id:'sound',g:'View',n:'Sound',d:'Sound on or off',k:['KeyN']},
  {id:'help',g:'View',n:'How to play',d:'Open or close the help card',k:['KeyH']},
  {id:'stats',g:'View',n:'Stats',d:'Open or close your stats: grass mowed, distance walked and driven, dirt moved',k:['KeyO']},
  {id:'heat',g:'View',n:'Lawn heatmap',d:'Show the lawn heatmap; press again to change what it shows, then to hide it',k:['KeyU']}];
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
// ---------- Controls panel ----------
// every input at a glance: the keyboard tab lists the player's own keys (changed in the Keys panel), the others the
// mouse, touch and controller inputs, which are fixed (controls.js: the pointer handlers and padButton)
const CTRL_MOUSE=[['Mouse',[['Drag the scene','Turns the camera round the machine; in cab view, looks around'],
    ['Click the scene (cab view, PC)','Takes the mouse for mouse look; Esc lets it go'],
    ['Wheel','Camera nearer or farther; in cab view, zooms; on foot in first person with blocks on, pushes the block out or pulls it back'],
    ['Left click (blocks on)','Places a block (Dig or Walk mode)'],['Right click (mouse taken, blocks on)','Lifts the block the dot is on']]],
  ['Touch',[['Left stick','Drives, or walks on foot'],['Right stick','Works the boom, bed or blade; on foot, turns and looks'],
    ['Drag the scene','Turns the camera; in cab view, looks around'],['Pinch (cab view)','Zooms'],
    ['Buttons','Blocks, Drive, Controls, Chase / Cab, Get in or out, Sprint, Jump']]]];
const CTRL_PAD=[['Sticks and triggers',[['Left stick','Drives, or walks on foot'],['Right stick','Works the boom, bed or blade; on foot, turns and looks'],
    ['Right trigger / left trigger','Gas / reverse (Drive, Truck, Skid)'],['Left stick click','Sprint on foot'],['Right stick click','Look straight ahead and reset the zoom']]],
  ['Buttons',[['A','Jump on foot; places a block in a machine'],['B','Gets in or out; closes the map or help'],['X','Places a block on foot; hooks the box in a machine'],
    ['Y','Chase / cab view'],['LB / RB','Previous / next machine']]],
  ['D-pad and menu',[['D-pad up','Blocks on or off'],['D-pad down','Lifts a block'],['D-pad left / right','Block size smaller / bigger'],
    ['View (Back)','Map'],['Menu (Start)','How to play']]]];
let ctrlsTab='kb';
function ctrlsDraw(){let h='';
  const rows=(g,list)=>`<h2>${g}</h2>`+list.map(([k,d])=>`<div class="krow"><div class="kname">${k}<small>${d}</small></div></div>`).join('');
  if(ctrlsTab==='kb'){let g='';for(const a of KEY_ACTIONS){if(a.g!==g){g=a.g;h+=`<h2>${g}</h2>`}
      const k=keyBind[a.id].filter(Boolean).map(keyName).join(' or ')||'—';h+=`<div class="krow"><div class="kname">${a.n}<small>${a.d}</small></div><div class="kkey">${k}</div></div>`}}
  else for(const [g,list] of ctrlsTab==='pad'?CTRL_PAD:CTRL_MOUSE)h+=rows(g,list);
  $('#ctrlsList').innerHTML=h;document.querySelectorAll('#ctrlsTabs button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.t===ctrlsTab))}
function showCtrls(on){$('#ctrlsBox').hidden=!on;if(on)ctrlsDraw()}
$('#ctrlsTabs').onclick=e=>{const b=e.target.closest('button');if(b){ctrlsTab=b.dataset.t;ctrlsDraw()}};
$('#ctrlsDone').onclick=()=>showCtrls(false);
$('#ctrlsKeys').onclick=()=>{showCtrls(false);showKeys(true)};
$('#ctrlsBox').addEventListener('pointerdown',e=>{if(e.target===e.currentTarget)showCtrls(false)});
addEventListener('keydown',e=>{if(e.code==='Escape'&&!$('#ctrlsBox').hidden)showCtrls(false)});
