// Corley's Island: the words the game shows in its tips (the toasts) and stick captions, so the owner can rewrite them
// on the screen editor's Words tab (js/gui.js); the rewrites go out with the screen skin (skin.words). The start card's
// words are plain markup and are renamed there too (skin.text). In a text, [id] is the key bound to that action
// (keyLabel, keys.js), so it follows the player's own keys, and {name} is filled in by the game (a count, a time, a
// stick's keys); a caption's second line comes after a line break.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md. This file needs nothing at load time,
// so the claude.ai screen editor can load it alone.
// [id, group, words, what fills the {names}]
const WORDS=[
  ['capL_dig','Captions','{lh} Swing\n{lv} Stick out / in','Left stick, Dig'],['capR_dig','Captions','{rh} Curl / dump\n{rv} Boom down / up','Right stick, Dig'],
  ['capL_drive','Captions','{lh} Turn\n{lv} Drive fwd / back','Left stick, Drive'],
  ['capL_truck','Captions','{lh} Steer\n{lv} Gas / reverse','Left stick, Truck'],['capR_truck','Captions','{rv} Bed up / down','Right stick, Truck'],
  ['capL_mow','Captions','{lv} Left lap bar\n{lh} Spin','Left stick, Mow (touch)'],['capR_mow','Captions','{rv} Right lap bar','Right stick, Mow (touch)'],
  ['capL_mowKb','Captions','{lv} Drive fwd / back\n{lh} Turn','Left keys, Mow'],['capR_mowKb','Captions','[mwLF] [mwLB] Left bar · [mwRF] [mwRB] Right bar\n[mwSpinL] [mwSpinR] Spin in place','Right keys, Mow'],
  ['capL_walk','Captions','{lv} Walk / back\n{lh} Step left / right','Left stick, Walk'],['capR_walk','Captions','{rh} Turn\n{rv} Look up / down','Right stick, Walk'],
  ['capL_skid','Captions','{lv} Drive fwd / back\n{lh} Turn','Left stick, Skid steer'],['capR_skid','Captions','{rh} Curl / dump\n{rv} Arms down / up','Right stick, Skid steer'],
  ['mowKb','Machines','Mower running. [lUp] drives straight, [lLeft] [lRight] turn; the number pad works each lap bar.'],
  ['mowTouch','Machines','Mower running. Push both sticks up to drive, one up and one back to spin.'],
  ['skidKb','Machines','Skid steer running. [lUp] [lDown] drive, [lLeft] [lRight] turn; [rUp] [rDown] lower and raise the arms, [rLeft] [rRight] curl and dump.'],
  ['skidTouch','Machines','Skid steer running. Left stick drives and turns; right stick up and down lowers and raises the arms, left and right curls and dumps.'],
  ['inMachine','Machines','In the {machine}. {key} to climb out.','{machine}: excavator, dump truck…; {key}: the get out key or button'],
  ['getInFar','Machines','Walk up to the excavator, the truck or the mower to get in.'],['noRoomOut','Machines','No room to climb out here. Move the machine a little.'],
  ['bedUp','Machines','Bed is up. Lower it to drive faster.'],['truckFirst','Machines','Dirt in the truck.'],
  ['truckFull','Machines','Truck full. Tap Truck, drive it to the spoil yard north of the dig and raise the bed.'],
  ['spanDone','Machines','The crane set a steel span on the {bridge} bridge. {left} to go.','{bridge}: town or north; {left}: spans left'],['bridgeDone','Machines','The {bridge} bridge is all steel now. The temporary trestle is gone.','{bridge}: town or north'],
  ['dumpYard','Machines','Load dumped in the yard.'],['dumpOff','Machines','Load hauled off site.'],
  ['skidFull','Machines','Bucket full. Raise the arms and drive to where it goes.'],
  ['stuck','Machines','Stuck in the mud. Rock it free: [lUp] then [lDown], and again.'],
  ['lawnBack','Machines','The grass has grown back. Time to mow again.'],['lawnDone','Machines','Lawn mowed in {time}. Nice stripes.','{time}: minutes:seconds'],
  ['bucketFull','Digging','Bucket full. Boom up, swing, dump.'],['trackPack','Machines','Clay is packing into the tracks, so they drag and turn slow. Drive onto firm ground and rock them back and forth, [lUp] then [lDown], to knock it out.'],['claySticks','Digging','Moist clay is stuck in the bucket. Shake it out: tip it and rock the curl fast, [rLeft] then [rRight], or bang it on the dump stop.'],['bedSticks','Machines','Clay is stuck in the bed. Shake it loose: drop the bed a little and run it up hard into the top stop.'],['sand','Digging','Sand bedding. The gas main is right below. Go easy.'],
  ['rock','Digging','Rock. You are past trench depth.'],['strike','Digging','LINE STRIKE! You hit the gas main.'],
  ['exposed','Digging','Gas main exposed. Nice and careful.'],
  ['trenchDone','Digging','Trench complete in {time}{strikes}{caves}','{time}: minutes:seconds; {strikes}: " · no strikes" or " · 2 strikes"; {caves}: " · 1 cave-in" or nothing'],
  ['caveSpoil','Digging','Cave-in! Spoil too close to the edge. Keep piles 2 ft back.'],
  ['caveWall','Digging','Cave-in! Walls past 5 ft deep need a slope or a trench box.'],
  ['boxHooked','Digging','Box hooked. Swing it over the trench and press {key} to set it.','{key}: the drop box key or button'],
  ['boxSet','Digging','Trench box set. The walls between its panels are safe.'],['boxDown','Digging','Box set down. Set it in a cut to hold the walls.'],
  ['boxFar','Digging','Bring the bucket over the box to hook it.'],['boxMode','Digging','Switch to Dig to handle the box.'],
  ['walkKb','On foot','On foot. [jump] jumps, [place] sets a block, [enter] gets into a machine.'],
  ['walkTouch','On foot','On foot. Tap Jump to jump. Walk up to a machine and tap Get in.'],
  ['walkPad','On foot','On foot. A jumps, X sets a block, B gets into a machine.'],
  ['mouseLook','On foot','Mouse look. Move the mouse to look around, wheel or [zoom] zooms, [lookAhead] looks ahead. Esc frees the mouse.'],
  ['fromTable','On foot','Back from {game} at the pavilion.','{game}: chess or checkers'],
  ['famSit','On foot','Sitting down to {game}...','{game}: chess or checkers'],
  ['blkWrongMode','Blocks','Switch to Dig or Walk to set blocks.'],['blkLiftMode','Blocks','Switch to Dig or Walk to pick up blocks.'],
  ['blkSet','Blocks','{size} {mat} block set · {n} on site','{size}: its size; {mat}: concrete…; {n}: blocks on site'],
  ['blkLifted','Blocks','{size} block picked up · {n} on site','{size}: its size; {n}: blocks on site'],
  ['blkNone','Blocks','No blocks set yet.'],['blkDot','Blocks','Put the dot on a block to pick it up.'],
  ['blkFace','Blocks','Face a block within reach to pick it up.'],['blkBucket','Blocks','Bring the bucket onto a block to pick it up.'],
  ['blkSize','Blocks','Block size {size}'],['blkSnap','Blocks','Block snap: {snap}'],['blkMat','Blocks','Block material: {mat}'],
  ['blkFP','Blocks','Blocks go where the dot is. The mouse wheel (or [blkNear] [blkFar]) pulls them in and pushes them out.'],
  ['rainIn','Weather and water','Rain coming in. Dirt, clay and low ground will turn to mud.'],
  ['wipeTip','Weather and water','Rain on the glass. [wipers] runs the wipers.'],
  ['rainOut','Weather and water','Rain has stopped. The ground will dry out over the next several minutes.'],
  ['wxAuto','Weather and water','Weather: showers now and then'],['wxRain','Weather and water','Weather: rain'],['wxDry','Weather and water','Weather: dry'],
  ['waterSeep','Weather and water','Groundwater seeping in. Tap Pump to dewater the hole.'],
  ['waterRain','Weather and water','Rain is filling the hole. Tap Pump to dewater it.'],['pumpOn','Weather and water','Pump running. The water will drop slowly.'],
  ['edTip_raise','Map editor','Raise: hold and drag on the ground to lift it.'],['edTip_lower','Map editor','Lower: hold and drag on the ground to take it down.'],
  ['edTip_flatten','Map editor','Flatten: hold and drag to level the ground to the height where you start.'],['edTip_smooth','Map editor','Smooth: hold and drag to even out bumps.'],
  ['edTip_paint','Map editor','Hold and drag to lay the material. Natural ground takes it back up; digging cuts through it.'],
  ['edTip_dirt','Map editor','Hold and drag to paint worked dirt.'],['edTip_grass','Map editor','Hold and drag to paint grass, over the dirt yards too.'],
  ['edTip_select','Map editor','Tap to pick. Shift-tap or a long press picks more; drag on empty ground (Box select on touch) to pick many; drag a picked one to move them all.'],
  ['edTip_add','Map editor','Tap the ground to place it; keep holding to drag it into place.'],
  ['edTip_query','Map editor','Tap or drag over the ground to read its height, slope and surface.'],
  ['edTip_roads','Map editor','Tap a road to pick it, drag its dots, tap it between dots to add one.'],
  ['padReady','Other','Controller ready. LB / RB switch machine, Y cab view.'],['reset','Other','Fresh ground. Paint is back.'],
  ['tpNoRoom','Other','No room there. Pick an open spot on land.'],['tpLake','Other','That is the lake. Pick a spot on land.'],
  ['tpDone','Other','Teleported {ft} ft {how}.','{ft}: distance; {how}: on foot, in the dump truck…'],
  ['gfx','Other','Graphics: {name}','{name}: Low, Medium, High'],
  ['glReset','Other','The phone reset the graphics (low on memory). A lower Dirt detail helps.']];
const WORDS_BY={};for(const w of WORDS)WORDS_BY[w[0]]=w;
// the owner's words if the skin has them, else the game's own; html: escaped, with the filled-in parts in bold and the
// lines broken (the captions)
function say(id,vars,html){const own=typeof gui!=='undefined'&&gui.skin&&gui.skin.words?gui.skin.words[id]:undefined,w=WORDS_BY[id];
  const t=typeof own==='string'?own:w?w[2]:id,esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
  const part=s=>html?'<b>'+esc(s)+'</b>':s;let out='',i=0;
  for(const m of t.matchAll(/\[(\w+)\]|\{(\w+)\}/g)){out+=html?esc(t.slice(i,m.index)):t.slice(i,m.index);i=m.index+m[0].length;
    if(m[1])out+=typeof keyBind!=='undefined'&&keyBind[m[1]]?part(keyLabel(m[1])):m[0];
    else out+=vars&&vars[m[2]]!==undefined?part(vars[m[2]]):m[0]}
  out+=html?esc(t.slice(i)):t.slice(i);
  return html?out.replace(/<\/b> <b>/g,' ').replace(/\n/g,'<br>'):out}
// new words from the skin: redraw what is on screen now (the captions)
function wordsRefresh(){if(typeof setCaps==='function'&&typeof mode!=='undefined'){try{setCaps()}catch(e){}}}
