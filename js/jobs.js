// Corley's Island: jobs and the operator ladder. The work already pays by the yard (fuel.js); a job is a piece of it
// with an end: so much dirt dug, hauled or moved, or grass mowed, counted from when you take it. Finishing pays a bonus
// on top of the piece pay and earns one to three stars: one for the work, one for finishing inside the par time (real
// minutes of play, never a deadline: late still pays), one for a clean job (no line strike and no cave-in while it ran).
// Stars add up to your rank (JOB_RANKS), which opens bigger jobs and lifts every job's bonus. The board is the Jobs
// panel (the job chip under the wallet, ☰ Play → Jobs, or the Jobs key); the chip shows the job you are on.
// What is kept (in stats, so it syncs with the rest: STAT_ZERO in stats.js): jobN the job you are on (its place in
// JOBS plus one, 0 for none), jobGot how much of it is done, jobSec the play time on it, jobBad a strike or cave-in
// during it, jobsDone, jobStars and jobPay for good. JOBS is added to at the end only: saves point at places in it.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// name, stars needed
const JOB_RANKS=[['Greenhorn',0],['Apprentice operator',4],['Operator',10],['Lead operator',20],['Foreman',34],['Superintendent',52]];
// what is counted: its unit, how it is written, the machine's name for the card, and par minutes for one of the unit
const JOB_KINDS={dig:{u:'yd³',v:'Dig',w:'Excavator or backhoe',par:1},haul:{u:'yd³',v:'Haul off',w:'Dump truck',par:1.6},
  skid:{u:'yd³',v:'Move',w:'Skid steer',par:1.3},mow:{u:'sq ft',v:'Mow',w:'Zero-turn mower',par:1/1500}};
// name, rank it opens at, kind, how much, the bonus in dollars
const JOBS=[['Open the trench',0,'dig',5,60],['Knock down the tall grass',0,'mow',2000,35],['First load out',0,'haul',6,90],
  ['Trench to grade',1,'dig',15,190],['A full truck',1,'haul',12,200],['Tidy the spoil',1,'skid',5,95],['Mow the patch',1,'mow',6000,110],
  ['Service trench',2,'dig',30,420],['Three loads off the site',2,'haul',36,640],['Clear the yard',2,'skid',15,300],['Mow it all',2,'mow',15000,290],
  ['Footing excavation',3,'dig',60,900],['Six loads off the site',3,'haul',72,1350],['Stockpile move',3,'skid',30,640],
  ['Basement dig',4,'dig',120,1900],['Ten loads off the site',4,'haul',120,2400],
  ['Mass excavation',5,'dig',240,4000],['Twenty loads off the site',5,'haul',240,5000]];
const jobBox=$('#jobBox');let jobSeen=-1,jobChipT=0;
const jobRank=()=>{let r=0;for(let i=0;i<JOB_RANKS.length;i++)if(stats.jobStars>=JOB_RANKS[i][1])r=i;return r};
const jobNow=()=>JOBS[Math.round(stats.jobN)-1]||null;
const jobParMin=J=>J[3]*JOB_KINDS[J[2]].par*TU.jobPar;
const jobAmt=(J,v)=>(J[2]==='mow'?Math.round(v).toLocaleString():(+v).toFixed(v<10&&v%1?1:0))+' '+JOB_KINDS[J[2]].u;
const jobMin=s=>{s=Math.max(0,Math.round(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
// what a job would pay at this rank with these stars
const jobPays=(J,onTime,clean)=>J[4]*(1+(onTime?TU.jobOnTime:0)+(clean?TU.jobClean:0))*(1+jobRank()*TU.jobRankPay);
function jobTake(i){const J=JOBS[i];if(!J||J[1]>jobRank())return;
  Object.assign(stats,{jobN:i+1,jobGot:0,jobSec:0,jobBad:0});jobSeen=-1;statDirty=true;
  toast(say('jobTook',{job:J[0],what:JOB_KINDS[J[2]].v+' '+jobAmt(J,J[3]),par:jobMin(jobParMin(J)*60)}),'good',4200);jobFill();jobChip(true)}
function jobDrop(){const J=jobNow();if(!J)return;Object.assign(stats,{jobN:0,jobGot:0,jobSec:0,jobBad:0});statDirty=true;toast(say('jobDropped',{job:J[0]}),'',2600);jobFill();jobChip(true)}
// the work done, from the pay hooks (fuel.js): cubic yards, or square feet mowed
function jobWork(kind,amt){const J=jobNow();if(!J||J[2]!==kind||!(amt>0))return;stats.jobGot+=amt;statDirty=true;if(stats.jobGot>=J[3]-1e-6)jobDone(J)}
function jobDone(J){const r0=jobRank(),onTime=stats.jobSec<=jobParMin(J)*60,clean=!stats.jobBad,stars=1+onTime+clean,pay=jobPays(J,onTime,clean);
  Object.assign(stats,{jobN:0,jobGot:0,jobSec:0,jobBad:0});stats.jobsDone++;stats.jobStars+=stars;stats.jobPay+=pay;payAdd(pay);
  if(typeof town!=='undefined')town.chipT=8;
  toast(say('jobDone',{job:J[0],stars:'★'.repeat(stars)+'☆'.repeat(3-stars),pay:usd(pay),
    how:onTime&&clean?'on time and clean':onTime?'on time':clean?'clean, but past par':'past par'}),'good',6000);
  const r=jobRank();if(r>r0)setTimeout(()=>toast(say('jobRank',{rank:JOB_RANKS[r][0]}),'good',6000),6200);
  if(typeof rumble==='function')rumble(200,0.5);jobFill();jobChip(true)}
// every frame of play (stats.js statTick): the job's clock, and a strike or cave-in while it runs
function jobTick(dt){const bad=stats.strikes+stats.caves,J=jobNow();
  if(J){stats.jobSec+=dt;if(jobSeen>=0&&bad>jobSeen&&!stats.jobBad){stats.jobBad=1;statDirty=true;toast(say('jobSpoiled',{job:J[0]}),'bad',4200)}}
  jobSeen=bad;if((jobChipT-=dt)<=0){jobChipT=0.5;jobChip()}}
// the chip under the wallet
function jobChip(){const J=jobNow(),n=$('#jobName'),s=$('#jobSub'),b=$('#jobBar');let a,c,f=0;
  if(J){f=Math.min(1,stats.jobGot/J[3]);const left=jobParMin(J)*60-stats.jobSec;a=J[0];
    c=jobAmt(J,Math.min(J[3],stats.jobGot)).replace(' '+JOB_KINDS[J[2]].u,'')+' / '+jobAmt(J,J[3])+' · '+(left>=0?'par '+jobMin(left):'past par')+(stats.jobBad?' · not clean':'')}
  else{a='No job';c=JOB_RANKS[jobRank()][0]+' · tap to pick one'}
  if(n.textContent!==a)n.textContent=a;if(s.textContent!==c)s.textContent=c;b.style.width=(f*100).toFixed(1)+'%';$('#jobChip').classList.toggle('on',!!J)}
// the board
function jobFill(){if(jobBox.hidden)return;const r=jobRank(),nx=JOB_RANKS[r+1],cur=Math.round(stats.jobN)-1,esc=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;');
  $('#jobRankLine').innerHTML=`<b>${esc(JOB_RANKS[r][0])}</b> · ${Math.round(stats.jobStars)} ★ · ${Math.round(stats.jobsDone)} job${Math.round(stats.jobsDone)===1?'':'s'} done · ${usd(stats.jobPay)} in bonuses`+
    (nx?`<span class="sbar"><i style="width:${Math.min(100,(stats.jobStars-JOB_RANKS[r][1])/(nx[1]-JOB_RANKS[r][1])*100).toFixed(0)}%"></i></span> ${nx[1]-Math.round(stats.jobStars)} ★ to ${esc(nx[0])}`:' · top of the ladder');
  $('#jobList').innerHTML=JOBS.map((J,i)=>{const K=JOB_KINDS[J[2]],lock=J[1]>r,on=i===cur;
    return `<div class="jrow${lock?' lock':''}${on?' on':''}"><div><b>${esc(J[0])}</b><span>${K.v} ${jobAmt(J,J[3])} · ${K.w} · par ${jobMin(jobParMin(J)*60)}</span>`+
      (on?`<span>Done so far: ${jobAmt(J,Math.min(J[3],stats.jobGot))} · ${jobMin(stats.jobSec)} on the job${stats.jobBad?' · not clean':''}</span>`:'')+
      `</div><div class="jpay"><b>${usd(jobPays(J,0,0))}</b><span>up to ${usd(jobPays(J,1,1))}</span>`+
      (lock?`<span>${esc(JOB_RANKS[J[1]][0])}</span>`:`<button data-j="${i}"${on?' data-drop="1" class="ghost"':cur>=0?' class="ghost"':''}>${on?'Drop it':cur>=0?'Switch':'Take it'}</button>`)+'</div></div>'}).join('')}
let jobFillT=0;
function showJobs(on){jobBox.hidden=!on;clearInterval(jobFillT);if(on){jobFill();jobFillT=setInterval(()=>{if(jobNow())jobFill()},2000)}}
$('#jobList').onclick=e=>{const b=e.target.closest('button[data-j]');if(!b)return;if(b.dataset.drop)jobDrop();else jobTake(+b.dataset.j)};
$('#jobsBtn').onclick=()=>{showJobs(true);showMenu(false)};
$('#jobDone').onclick=()=>showJobs(false);
jobBox.addEventListener('pointerdown',e=>{if(e.target===jobBox)showJobs(false)});
jobChip();
// a self-check for the headless run (the check workflow, tools/play.js): a job taken, spoiled, finished and paid, a
// locked job refused, the rank rising; your own numbers are put back after
function jobTestRun(){const keep={},K=['jobN','jobGot','jobSec','jobBad','jobsDone','jobStars','jobPay','earned','dEarn','dDug','strikes'];for(const k of K)keep[k]=stats[k];
  const checks=[],ok=(c,n)=>checks.push((c?'ok ':'FAIL ')+n);
  Object.assign(stats,{jobN:0,jobGot:0,jobSec:0,jobBad:0,jobsDone:0,jobStars:0,jobPay:0});jobSeen=-1;
  jobTake(3);ok(stats.jobN===0,'a job above your rank is refused');
  jobTake(0);ok(stats.jobN===1,'a job is taken');const e0=stats.earned;
  payDug(2/1.307951);jobTick(0.1);ok(Math.abs(stats.jobGot-2)<1e-6&&stats.jobN===1,'work counts toward it');
  payMow(500);ok(Math.abs(stats.jobGot-2)<1e-6,'other work does not');
  stats.strikes++;jobTick(0.1);ok(stats.jobBad===1,'a line strike costs the clean star');
  payDug(3/1.307951);ok(stats.jobN===0&&stats.jobsDone===1&&stats.jobStars===2,'finishing gives the stars');
  ok(Math.abs(stats.jobPay-JOBS[0][4]*(1+TU.jobOnTime))<0.01&&stats.earned-e0>stats.jobPay,'the bonus is paid on top of the piece pay');
  jobTake(1);stats.jobSec=1e6;payMow(2000);ok(stats.jobStars===4&&jobRank()===1,'past par still pays, and stars raise the rank');
  jobTake(3);ok(stats.jobN===4,'the next rank opens bigger jobs');jobDrop();ok(stats.jobN===0,'a job can be dropped');
  for(const k of K)stats[k]=keep[k];jobSeen=-1;statDirty=true;jobChip();return {ok:checks.every(c=>c.startsWith('ok')),checks}}
