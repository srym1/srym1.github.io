import {ORES,buildOreNode,restoreOre,hitOre,animateOre,miningProgress} from './mining.js';
import {POTIONS,DRINK_TIME,usePotion,potionStatuses} from './potion-system.js';
import {armorAppearance,armorIcon} from './armor-art.js';
import {fusionPlan,confirmFusion} from './fusion.js';
import {createLootVisual,lootTier,animateLoot} from './loot-visual.js';
let pendingFusion=null;
import {BAG_CATEGORIES,itemCategory,inspectItem,itemStat,droppable,equipmentSnapshot,reconcileEquipment} from './inventory-view.js';
let bagFilter='all',movingItem=false;
import {createHudFeedback} from './hud-feedback.js';
const feedback=createHudFeedback();
import {stepEnemy,hurtEnemy,resetEnemy,clearEnemyAttack,enemyLineOfSight,attackConnects,moveEnemy} from './enemy-brain.js';
import {arrowGeometry} from './weapon-projectiles.js';
import {RANGED,createReload} from './weapon-motion.js';
const reload=createReload();
import {activateScene} from './scene-activation.js';
import {dressForest} from './scenery.js';
import {loadSettings,saveSettings} from './settings.js';
import {loadSave,writeSave} from './save-store.js';
import {createInput} from './input.js';
import {createPlayerController} from './player-controller.js';
import {createCameraRig} from './camera-rig.js';
import {createCombatClock,weaponDamage,incomingDamage} from './combat-core.js';
const input=createInput(),controller=createPlayerController(),cameraRig=createCameraRig(),combat=createCombatClock();
import * as T from './three.module.js';
import {ITEMS,RECIPES,newBag,count,add,consume,move,mergeAll,craft,PLACES,LIMIT,MAP_LIMIT,terrain,reveal,validSave,seeded,rarity,RARITIES,chestLoot,rollPet,canMerge,splitDeathResources} from './systems.js?v=0.15.0';
import {buildWorld} from './world.js';
import {artDirection,itemArt,lootFeed,regionName} from './art.js?v=0.15.0';
import {forestPresentation,forestAudio,illustratedMap} from './forest.js?v=0.15.0';
const $=id=>document.getElementById(id),canvas=$('world');
let renderer;
try{renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(e){$('error').textContent='الرسم ثلاثي الأبعاد غير متاح في هذا المتصفح. جرّب متصفحًا يدعم WebGL 2.';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.35));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
const scene=new T.Scene(),camera=new T.PerspectiveCamera(72,innerWidth/innerHeight,.08,420);camera.rotation.order='YXZ';scene.add(camera);
const world=buildWorld(scene),weapon=forestPresentation(scene,camera,world),art=artDirection(world),scenery=dressForest(world);weapon.group.visible=false;const activation=activateScene(scene);
camera.position.set(17,11,53);camera.lookAt(0,2,17);
const trialParam=new URLSearchParams(location.search).get('trial'),trial=['wolf','deer','mutant'].includes(trialParam)?trialParam:null;let trialCombat=false,trialActor=null;
const SAVE=new URLSearchParams(location.search).has('qa')?'rym-heart-qa':'rym-heart-v1';const settings=loadSettings(localStorage,SAVE+':settings');let state='welcome',started=false,selected=-1,dragIndex=-1,noticeTime=0,attackTime=0,interactTime=0,elapsed=0,saveTime=0,uiTime=0,mapTime=0,quality='medium';
let yaw=0,pitch=0,jump=0,bob=0,target=null,mouseHeld=false,dragLook=false,lastMouse=null;
const keys=input.held,explored=new Set(),looted=new Set(),discovered=new Set(['camp']),defeated=new Set(),harvests={};
let player={x:0,z:38,hp:100,stamina:100,level:1,xp:0,woodGathered:0,crafted:0,bag:newBag(),equipped:null,armor:null,pet:null,camp:'camp',speedBuff:0,invisible:0};player.equipped=player.bag[0].id;
let staminaDelay=0,dodgeTime=0,shake=0,useTime=0,charge=0,reloadTime=0,loaded=true,petCooldown=0,dangerTime=0,weather='',lowBreath=0,deathTime=0,footTime=0;let dying=false;let drops=[],graves=[],projectiles=[];const audio=forestAudio();audio.setMix(settings);
$('perf').hidden=!new URLSearchParams(location.search).has('qa');let saveLoaded=false;
const restored=trial?{data:null}:loadSave(localStorage,SAVE,validSave);try{const raw=restored.data;if(validSave(raw)){Object.assign(player,{x:raw.x,z:raw.z,hp:Math.max(1,Math.min(100,raw.hp)),level:raw.level,xp:raw.xp,woodGathered:raw.woodGathered||0,crafted:raw.crafted||0,bag:raw.bag,equipped:raw.equipped});for(const x of raw.explored)if(typeof x==='string')explored.add(x);for(const x of raw.looted)if(typeof x==='string')looted.add(x);for(const x of raw.discovered)if(PLACES.some(p=>p.id===x))discovered.add(x);for(const x of raw.defeated||[])if(Number.isInteger(x))defeated.add(x);Object.assign(harvests,raw.harvests||{});yaw=Number.isFinite(raw.yaw)?raw.yaw:0;player.armor=raw.armor||null;player.pet=raw.pet||null;player.camp=PLACES.some(p=>p.kind==='camp'&&p.id===raw.camp)?raw.camp:'camp';graves=Array.isArray(raw.graves)?raw.graves.filter(x=>Number.isFinite(x.x)&&Number.isFinite(x.z)&&Array.isArray(x.loot)):[];drops=Array.isArray(raw.drops)?raw.drops.filter(x=>Number.isFinite(x.x)&&Number.isFinite(x.z)&&Array.isArray(x.loot)):[];saveLoaded=true;}}catch{}
for(const c of world.chests)if(looted.has(c.id)){c.opened=true;c.lid.rotation.x=-.75;}
world.animals.forEach((a,i)=>{a.id=a.kind==='chicken'?1000+i:a.guardian?world.animals.filter(x=>x.kind!=='chicken').indexOf(a):i;a.maxHp=a.hp*(1+a.level*.065);a.hp=a.maxHp;if(defeated.has(a.id)){a.dead=true;a.mesh.visible=false;}});
for(const r of world.resources){if(Number.isFinite(harvests[r.id]))r.hits=Math.max(0,r.hits-harvests[r.id]);if(r.hits===0&&r.mesh)r.mesh.visible=false;restoreOre(r);}
if(world.blocked(player.x,player.z)){player.x=0;player.z=38;}
reveal(explored,player.x,player.z);
function trialRoute(kind){const url=new URL(location.href);if(kind)url.searchParams.set('trial',kind);else url.searchParams.delete('trial');location.href=url.href;}
function resetTrial(){if(!trialActor)return;for(const r of world.resources.filter(r=>r.trialNode)){r.hits=3;delete harvests[r.id];restoreOre(r);}weapon.cancelUse();feedback.reset();pendingFusion=null;selected=-1;movingItem=false;bagFilter='all';for(const o of [...drops,...graves]){scene.remove(o.mesh);o.mesh?.traverse(m=>{m.geometry?.dispose();m.material?.dispose();});}drops=[];graves=[];player.armor=null;player.pet=null;for(const p of projectiles){scene.remove(p.m);p.m.geometry.dispose();p.m.material.dispose();}projectiles=[];dying=false;deathTime=0;$('death').hidden=true;player.x=0;player.z=38;player.hp=100;player.stamina=100;player.invisible=0;player.speedBuff=0;player.bag=newBag();player.equipped=player.bag[0].id;add(player.bag,'bow',1,2);add(player.bag,'pistol',1,2);add(player.bag,'arrow',30);add(player.bag,'bullet',20);add(player.bag,'bandage',8);for(const [k,n] of [['sword',1],['woodarmor',1],['stonearmor',1],['healpotion',2],['wood',12],['ore',6],['coal',4],['copper',3],['scrap',4],['snakepet',1]])add(player.bag,k,n);for(const key of ['woodarmor','stonearmor'])for(const lvl of [3,5])add(player.bag,key,1,lvl);add(player.bag,'speedpotion',2);add(player.bag,'invisibility',2);yaw=0;pitch=0;controller.reset();cameraRig.reset();combat.cancel();cancelRanged();attackTime=0;useTime=0;const a=trialActor;a.dead=false;a.mesh.visible=true;a.x=0;a.z=34;a.homeX=0;a.homeZ=34;a.hp=a.maxHp;resetEnemy(a);a.mesh.rotation.set(0,.35,0);a.mesh.position.set(0,terrain(0,34),34);Object.assign(a.artRig,{lastX:0,lastZ:34,death:0});a.poison=0;a.hitReaction=0;trialCombat=false;$('trial-fight').textContent='ابدأ المواجهة';}
if(trial){for(const [i,key] of ['ore','coal','copper'].entries()){const x=-6+(i-1)*2.1,z=35,id='trial-ore-'+key,mesh=buildOreNode(key,id);mesh.position.set(x,terrain(x,z),z);scene.add(mesh);world.resources.push({id,x,z,y:terrain(x,z)+.55,key,name:ORES[key].name,n:1,hits:3,maxHits:3,mesh,trialNode:true});}trialActor=world.animals.find(a=>a.kind===trial&&!a.archer);for(const a of world.animals){a.dead=a!==trialActor;a.mesh.visible=a===trialActor;}resetTrial();player.level=3;$('trial-controls').hidden=false;$('trial-badge').hidden=false;$('trial-name').textContent=animalName(trial);$('pause-title').textContent='معرض مخلوقات الغابة';$('save').hidden=true;$('trial-entry').hidden=true;$('welcome').querySelector('p').textContent='الخطوات 4–11 · '+animalName(trial)+' — افحص التصميم والحركة، ثم اختر بدء المواجهة من القائمة. تجربتك هنا لا تغيّر حفظ المغامرة.';$('welcome').querySelector('.fine').textContent='WASD للحركة · اسحب بالماوس للنظر · Esc لاختيار المخلوقات والمواجهة. هذه تجربة مؤقتة، وحفظ مغامرتك محفوظ.';}
$('trial-entry').onclick=()=>trialRoute('wolf');for(const kind of ['wolf','deer','mutant'])$('trial-'+kind).onclick=()=>trialRoute(kind);
$('trial-mine').onclick=()=>{if(!trial)return;resetTrial();player.x=-8.1;player.z=38;pitch=-.3;player.equipped=player.bag.find(i=>i?.key==='axe').id;cameraRig.reset();resume();notify('F لضرب الخام · Esc ثم تجربة التعدين لإعادة الكتل');};
 $('trial-return').onclick=()=>trialRoute(null);$('trial-reset').onclick=()=>{resetTrial();resume();};$('trial-fight').onclick=()=>{trialCombat=!trialCombat;clearEnemyAttack(trialActor);$('trial-fight').textContent=trialCombat?'عرض هادئ':'ابدأ المواجهة';resume();};
function equipped(){let it=player.bag.find(i=>i?.id===player.equipped&&ITEMS[i.key].tool);if(!it){it=player.bag.find(i=>i&&ITEMS[i.key].tool);player.equipped=it?.id||null;}return it;}
function notify(text){$('notice').textContent=text;$('notice').classList.add('on');noticeTime=3.2;}
function xp(n){if(player.level>=10)return;player.xp+=n;let req=60+(player.level-1)*35;while(player.xp>=req&&player.level<10){player.xp-=req;player.level++;player.hp=Math.min(100,player.hp+20);notify(`وصلت للمستوى ${player.level} · زادت قوة ضربتك`);req=60+(player.level-1)*35;}if(player.level===10)player.xp=0;}
function save(silent=false){if(trial)return false;if(!started&&!saveLoaded)return false;try{const result=writeSave(localStorage,SAVE,{...player,version:2,yaw,explored:[...explored],looted:[...looted],discovered:[...discovered],defeated:[...defeated],harvests,graves:graves.map(({x,z,loot})=>({x,z,loot})),drops:drops.map(({x,z,loot})=>({x,z,loot}))},validSave);if(!result.ok)throw Error(result.reason);if(!silent)notify('تم حفظ تقدّمك في هذا المتصفح');return true;}catch{if(!silent)notify('الحفظ غير متاح: قد تكون مساحة المتصفح ممتلئة');return false;}}
function lock(){try{const p=canvas.requestPointerLock?.();if(p?.catch)p.catch(()=>notify('اسحب بالماوس للنظر إذا لم يُسمح بتثبيت المؤشر'));}catch{notify('اسحب بالماوس للنظر');}}
function cancelRanged(){reload.cancel();reloadTime=0;weapon.reload();mouseHeld=false;charge=0;weapon.draw(0);}
function beginReload(){const it=equipped();if(state!=='playing'||dying||it?.key!=='pistol'||it.chamber!==false||reload.active||attackTime>0||dodgeTime>0||useTime>0)return;if(!count(player.bag,'bullet')){notify('تحتاج ذخيرة من طاولة الصناعة');return;}if(reload.start(it.id)){reloadTime=RANGED.reload;weapon.reload(0);audio.sound('reload');notify('تلقيم المسدس…');}}
function open(which){feedback.pause();if(!started||dying)return;state=which;world.animals.forEach(clearEnemyAttack);cancelRanged();audio.setActive(false);input.clear();controller.stop();combat.cancel();weapon.cancelAttack();attackTime=0;mouseHeld=false;charge=0;weapon.draw(0);document.exitPointerLock?.();for(const id of ['pause','inventory','map'])$(id).hidden=id!==which;if(which==='inventory'){movingItem=false;audio.ui('wood',.7);renderBag();}if(which==='map')drawMap();}
function resume(){if(dying)return;pendingFusion=null;if(!started)feedback.reset(player.hp);if(!started){weapon.enter();cameraRig.reset();controller.reset();}for(const id of ['welcome','pause','inventory','map'])$(id).hidden=true;$('hud').hidden=false;state='playing';started=true;audio.setActive(true);audio.sound('wood',.1);weapon.group.visible=true;lock();updateHUD();if(restored.recovered)notify('استُعيد تقدمك من نسخة الحفظ الاحتياطية');}
function leave(){save(true);document.exitPointerLock?.();if(parent!==window)parent.postMessage({type:'rym-heart-exit'},location.origin);else location.href='index.html';}
$('start').disabled=false;$('start').textContent=trial?'ابدأ تجربة '+animalName(trial)+' ←':saveLoaded?'تابع رحلتك في الغابة ←':'ادخل الغابة ←';$('start').onclick=resume;$('resume').onclick=resume;$('leave').onclick=leave;$('leave-start').onclick=leave;
$('pause-btn').onclick=()=>open('pause');$('save').onclick=()=>{const ok=save();$('save').textContent=ok?'تم الحفظ ✓':'تعذّر الحفظ';};$('bag-btn').onclick=()=>open('inventory');$('map-btn').onclick=()=>open('map');$('close-bag').onclick=resume;$('close-map').onclick=resume;
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&state==='playing')open('pause');});
document.addEventListener('keydown',e=>{
  if(e.target instanceof HTMLSelectElement||e.target instanceof HTMLInputElement)return;
  const action=input.actionFor(e.code);if(action)e.preventDefault();
  if(!started)return;
  if(e.repeat){if(state==='playing')input.press(e.code);return;}
  if(action==='pause'){if(state==='playing')open('pause');else if(state!=='welcome')resume();return;}
  if(action==='bag'){state==='inventory'?resume():open('inventory');return;}
  if(action==='map'){state==='map'?resume():open('map');return;}
  if(state!=='playing')return;
  keys.add(e.code);
  if(action==='interact')interact();
  if(action==='heal')heal();
  if(action==='dodge'&&controller.dodge(player,input.movement(),yaw)){combat.cancel();weapon.cancelAttack();cancelRanged();attackTime=0;dodgeTime=controller.state.dodgeLeft;audio.sound('breath',.4);}
  if(action==='reload')beginReload();
  if(action==='pet')petAbility();
  if(action==='weapon')cycleWeapon();
  if(action==='jump')controller.jump();
});
document.addEventListener('keyup',e=>input.release(e.code));
window.addEventListener('blur',()=>{keys.clear();if(state==='playing')open('pause');});
document.addEventListener('visibilitychange',()=>{if(document.hidden){save(true);if(state==='playing')open('pause');}});
window.addEventListener('pagehide',()=>save(true));
document.addEventListener('mousemove',e=>{if(state!=='playing')return;if(document.pointerLockElement===canvas){yaw-=e.movementX*.0022*settings.sensitivity;pitch-=e.movementY*.0022*settings.sensitivity;}else if(dragLook&&lastMouse){yaw-=(e.clientX-lastMouse.x)*.004*settings.sensitivity;pitch-=(e.clientY-lastMouse.y)*.004*settings.sensitivity;}lastMouse={x:e.clientX,y:e.clientY};pitch=Math.max(-1.3,Math.min(1.3,pitch));});
canvas.addEventListener('mousedown',e=>{if(state!=='playing'||dying)return;mouseHeld=e.button===0;if(document.pointerLockElement!==canvas){dragLook=true;lastMouse={x:e.clientX,y:e.clientY};}if(e.button===0&&equipped()?.key!=='bow')attack();else if(e.button===0&&equipped()?.key==='bow'&&count(player.bag,'arrow')&&attackTime<=0&&dodgeTime<=0&&useTime<=0)audio.sound('bowdraw',.7);if(e.button===2)attack(true);});
document.addEventListener('mouseup',e=>{if(e.button===0&&state==='playing'&&equipped()?.key==='bow'&&charge>0)shoot(charge);charge=0;weapon.draw(0);mouseHeld=false;dragLook=false;});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
function aimAt(x,z,max=4.3){const dx=x-player.x,dz=z-player.z,d=Math.hypot(dx,dz);const dot=(-Math.sin(yaw)*dx-Math.cos(yaw)*dz)/Math.max(.01,d);if(d>=max||!(dot>.65||d<1.3))return null;for(let step=.45;step<d-.85;step+=.4)if(world.blocked(player.x+dx*step/d,player.z+dz*step/d))return null;return d;}
function chooseTarget(){let best=null,dist=99;for(const o of [...weapon.stations,...drops.map(x=>({...x,type:'drop',source:x})),...graves.map(x=>({...x,type:'grave',source:x}))]){const d=aimAt(o.x,o.z,3.4);if(d!==null&&d<dist){dist=d;best={type:o.type||'station',obj:o,label:o.type==='grave'?'F · استرجع الموارد المفقودة':o.type==='drop'?'F · '+RARITIES[o.rare].symbol+' '+RARITIES[o.rare].name+' · غنائم ('+o.loot.length+')':'F · '+o.name};}}for(const c of world.chests){if(c.opened)continue;const d=aimAt(c.x,c.z,4);if(d!==null&&d<dist){dist=d;best={type:'chest',obj:c,label:`F · نهب صندوق · مستوى ${c.level}`};}}for(const r of world.resources){if(r.hits<=0)continue;const d=aimAt(r.x,r.z,r.key==='wood'?3.4:3.2);if(d!==null&&d<dist){dist=d;best={type:'resource',obj:r,label:`F · ${r.name} · ${r.hits} ضربات متبقية`};}}for(const a of world.animals){if(a.dead)continue;const d=aimAt(a.x,a.z,5);if(d!==null&&d<dist){dist=d;best={type:'animal',obj:a,label:`${a.guardian?'حارس الجذور':a.archer?'رامي الأطلال':animalName(a.kind)} · مستوى ${a.level}`};}}return best;}
function animalName(k){return {chicken:'دجاجة برية',wolf:'ذئب',bear:'دب',deer:'غزال',rabbit:'أرنب',spider:'عنكبوت الكهف',mutant:'متحوّل الغابة'}[k];}
function interact(){if(interactTime>0||dying)return;target=chooseTarget();if(!target)return;cancelRanged();interactTime=.45;
  if(target.type==='station'){const s=target.obj;if(s.kind==='fire'){player.camp=s.id;player.hp=100;player.stamina=100;notify('استرحت وحُفظ المخيم كنقطة رجوع · الطبخ والضمادات متاحة');save(true);}open('inventory');return;}
  if(target.type==='drop'||target.type==='grave'){const o=target.obj.source;const next=player.bag.map(i=>i?{...i}:null);if(!o.loot.every(([k,n,l=1])=>add(next,k,n,l))){notify('رتّب الشنطة أولًا؛ الغنائم باقية هنا');return;}player.bag=next;scene.remove(o.mesh);o.mesh?.traverse(m=>{m.geometry?.dispose();m.material?.dispose();});if(target.type==='grave')graves=graves.filter(x=>x!==o);else drops=drops.filter(x=>x!==o);audio.sound(o.rare==='common'?'wood':o.rare==='mythic'?'mythic':'rare');useTime=.5;weapon.use('pickup');lootFeed(o.loot);save(true);return;}
  if(target.type==='resource'){
    if(combat.action||attackTime>0||useTime>0||dodgeTime>0)return;const r=target.obj,preview=player.bag.map(i=>i?{...i}:null);
    if(!add(preview,r.key,r.n)){notify('الشنطة ممتلئة؛ رتّبها أولًا');return;}
    if(!spend(['ore','coal','copper','wood','stone'].includes(r.key)?8:2))return;
    const action=combat.start(false,{kind:'mining',resourceId:r.id,duration:.42,impact:.19,heavy:true});attackTime=action.duration;weapon.attack('melee',action);audio.sound('wood',.25);return;
  }
  if(target.type==='chest'){const c=target.obj;spawnDrop(c.x,c.z+1.4,chestLoot(c.level,player.level));c.opened=true;c.lid.rotation.x=-.75;looted.add(c.id);xp(22+c.level*3);useTime=.6;weapon.use('chest');audio.sound('wood');notify('انفتح الصندوق · اقترب من الغنائم لالتقاطها');save(true);}
}
function spend(n){if(!controller.spend(player,n)){notify('التقط أنفاسك لحظة');return false;}staminaDelay=controller.state.staminaDelay;return true;}
function armor(){return player.bag.find(i=>i?.id===player.armor&&ITEMS[i.key].armor);}
function condition(it){return Math.max(0,Math.min(100,it?.durability??100));}
function wear(it,n){if(it)it.durability=Math.max(0,condition(it)-n);}
function power(it){return condition(it)<=0?.45:condition(it)<25?.8:1;}
function petItem(){return player.bag.find(i=>i?.id===player.pet&&ITEMS[i.key].pet);}
function spawnDrop(x,z,loot,grave=false,existing=null){if(!loot.length)return;const o=existing||{x,z,loot};o.rare=lootTier(loot);const group=createLootVisual(loot,grave);group.position.set(x,terrain(x,z)+.3,z);scene.add(group);o.mesh=group;if(!existing)(grave?graves:drops).push(o);if(!existing){weapon.burst(x,terrain(x,z)+.5,z,RARITIES[o.rare].color,o.rare==='mythic'?40:12);if(o.rare!=='common')audio.sound(o.rare==='mythic'?'mythic':'rare',o.rare==='uncommon'?.4:.8);}}

for(const o of drops)spawnDrop(o.x,o.z,o.loot,false,o);for(const o of graves)spawnDrop(o.x,o.z,o.loot,true,o);
function damageFeedback(a,n,kind='normal'){
 feedback.hit(a,kind);if(!settings.damageNumbers)return;const host=$('damage-feedback');
 const point=new T.Vector3(a.x,terrain(a.x,a.z)+1.65,a.z).project(camera);
 if(point.z< -1||point.z>1||Math.abs(point.x)>1||Math.abs(point.y)>1)return;const row=document.createElement('span');row.className='damage-number '+kind;row.textContent=(kind==='poison'?'· ':kind==='heavy'?'◆ ':'')+Math.round(n);
 row.style.left=((point.x+1)*50)+'%';row.style.top=((1-point.y)*50)+'%';host.append(row);
 while(host.children.length>5)host.children[0].remove();setTimeout(()=>row.remove(),760);
}
function presentHud(dt){
 const mineral=state==='playing'&&!dying&&target?.type==='resource'&&ORES[target.obj.key]&&target.obj.hits>0?target.obj:null;
 $('mining-status').hidden=!mineral;if(mineral){const m=miningProgress(mineral);$('mining-name').textContent=m.name;$('mining-left').textContent=m.left+' / '+m.total+' ضربات متبقية';$('mining-progress').max=m.total;$('mining-progress').value=m.left;}

 const statuses=potionStatuses(player),potionActive=state==='playing'&&!dying;
 $('potion-status').hidden=!potionActive||!statuses.length;
 const statusMarkup=statuses.map(s=>'<div class="potion-status" style="--potion:'+s.color+'"><b>'+s.symbol+'</b><span>'+s.name+'<small>'+Math.ceil(s.left)+' ث · '+(s.key==='invisibility'?'الهجوم يلغي الظل':'سرعة +25٪')+'</small><i style="width:'+Math.round(s.ratio*100)+'%"></i></span></div>').join('');
 if($('potion-status').innerHTML!==statusMarkup)$('potion-status').innerHTML=statusMarkup;
 $('potion-aura').dataset.kind=player.invisible>0?'shadow':player.speedBuff>0?'speed':'';
 $('potion-aura').hidden=!potionActive||!(player.invisible>0||player.speedBuff>0);
 const f=feedback.tick(dt,player.hp),active=state==='playing'&&!dying;
 $('health-trail').style.width=f.trail+'%';$('hit-confirm').style.opacity=active?String(Math.min(1,f.impact/.1)):'0';$('hit-confirm').dataset.kind=f.kind;
 $('hurt').style.opacity=active?String(f.injury/.42*.23):'0';$('damage-direction').hidden=!active||f.injury<=0||f.angle===null;if(f.angle!==null)$('damage-direction').style.transform='translate(-50%,-50%) rotate('+f.angle+'rad)';
 const wornArmor=armor();$('armor-warning').hidden=!active||!wornArmor||condition(wornArmor)>=25;$('armor-warning').textContent=wornArmor?'درعك '+(condition(wornArmor)<=0?'تالف':'متآكل')+' · أصلحه عند نار المخيم':'';$('low-health').hidden=!active||player.hp>25;$('vitals-card').classList.toggle('wounded',player.hp<=25);$('vitals-card').classList.toggle('recovering',f.healing>0);
 const aimed=target?.type==='animal'?target.obj:null,enemy=aimed||f.enemy;let visible=false;
 if(active&&enemy&&!enemy.dead&&Math.hypot(enemy.x-player.x,enemy.z-player.z)<28&&enemyLineOfSight(enemy,player.x,player.z,world.blocked)){
  const point=new T.Vector3(enemy.x,terrain(enemy.x,enemy.z)+(enemy.kind==='mutant'?2.7:enemy.kind==='deer'?3.25:1.95)*(enemy.mesh.scale.y||1),enemy.z).project(camera);
  visible=point.z>=-1&&point.z<=1&&Math.abs(point.x)<.9&&Math.abs(point.y)<.86;
  if(visible){$('enemy-health').classList.toggle('guardian',!!enemy.guardian);$('enemy-health').style.left=enemy.guardian?'50%':((point.x+1)*50)+'%';$('enemy-health').style.top=enemy.guardian?'92px':((1-point.y)*50)+'%';$('enemy-name').textContent=enemy.guardian?'حارس الجذور':animalName(enemy.kind);$('enemy-hp').max=enemy.maxHp;$('enemy-hp').value=Math.max(0,enemy.hp);$('enemy-intent').textContent=({windup:'يستعد · تفادَ',attack:'يهجم',stunned:'مذهول',circle:'يراقبك',retreat:'يتراجع ليصوّب'})[enemy.brain?.state]||'';}
 }$('enemy-health').hidden=!visible;
}

function hit(a,n,options={}){if(a.dead||!Number.isFinite(n)||n<=0)return;const actual=Math.min(a.hp,n);a.hp-=n;hurtEnemy(a,options);a.lastHit=elapsed;damageFeedback(a,actual,options.stagger===false?'poison':a.hp<=0?'defeat':options.heavy?'heavy':'normal');a.hitReaction=.3;a.provoked=10;weapon.burst(a.x,terrain(a.x,a.z)+1,a.z,'#baaa74');if(options.stagger!==false){shake=.08;audio.sound('hit');}if(a.hp<=0){a.dead=true;if(!a.artRig?.hero){a.mesh.rotation.z=Math.PI/2;a.mesh.position.y=terrain(a.x,a.z)+.25;}if(trial){notify('انتهت المواجهة · Esc لإعادة التجربة');return;}defeated.add(a.id);xp(a.level*7+12);const loot=a.guardian?[['guardianseal',1,1]]:a.kind==='spider'?[['fiber',3,1]]:a.kind==='mutant'?[['scrap',2,1],['arrow',3,1]]:[['hide',2,1],['rawmeat',1,1]];const pet=rollPet();if(pet)loot.push([pet,1,1]);spawnDrop(a.x,a.z,loot);notify(a.guardian?'سقط حارس الجذور · قلب الغابة يتذكّر رحلتك':'سقط '+animalName(a.kind)+' · الغنائم على الأرض');save(true);}}
function shoot(power=1){const it=equipped();if(state!=='playing'||dying||!it||!['bow','pistol'].includes(it.key)||attackTime>0||reload.active||dodgeTime>0||useTime>0)return;const pistol=it.key==='pistol',ammo=pistol?'bullet':'arrow';if(!pistol&&power<RANGED.bowMinimum)return;if(pistol&&it.chamber===false){mouseHeld=false;notify('R لإعادة التلقيم');return;}if(!count(player.bag,ammo)){mouseHeld=false;notify('تحتاج '+ITEMS[ammo].name+' من طاولة الصناعة');return;}power=Math.max(0,Math.min(1,power));consume(player.bag,ammo,1);wear(it,.6);if(pistol){loaded=false;it.chamber=false;mouseHeld=false;}player.invisible=0;attackTime=pistol?RANGED.pistolRecovery:RANGED.bowRecovery;weapon.attack(pistol?'pistol':'bow');shake=pistol?.12:.025;audio.sound(pistol?'shot':'bowrelease');
 const geometry=pistol?new T.SphereGeometry(.025,5,4):arrowGeometry();const m=new T.Mesh(geometry,new T.MeshBasicMaterial({color:pistol?'#ffd49a':'#d9c7a0'}));m.position.copy(camera.position);scene.add(m);const v=new T.Vector3(-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)).multiplyScalar(pistol?85:18+power*24);m.quaternion.setFromUnitVectors(new T.Vector3(0,0,-1),v.clone().normalize());projectiles.push({m,v,life:3,gravity:pistol?0:7,damage:ITEMS[it.key].damage*Math.pow(1.36,it.lvl-1)*(pistol?1:.35+power*.65)*(condition(it)<=0?.45:condition(it)<25?.8:1)});updateHUD();save(true);}

function attack(heavy=false){
 if(state!=='playing'||dying||attackTime>0||combat.action||dodgeTime>0||useTime>0)return;
 const tool=equipped();if(tool?.key==='bow')return;if(tool?.key==='pistol'){if(!heavy)shoot();return;}
 if(!spend(heavy?26:6))return;wear(tool,heavy?.9:.4);player.invisible=0;
 const action=combat.start(heavy,{range:tool?.key==='spear'?5.2:3.5,
 damage:weaponDamage(tool?ITEMS[tool.key]:null,tool?.lvl||1,condition(tool),player.level)*(heavy?1.9:1)});
 attackTime=action.duration;weapon.attack('melee',action);audio.sound('swish',heavy?.7:.35);updateHUD();
}
function resolveMelee(action){if(state!=='playing'||dying||dodgeTime>0)return;
 if(action.kind==='mining'){
   const r=world.resources.find(r=>r.id===action.resourceId);if(!r||r.hits<=0||aimAt(r.x,r.z,3.5)===null)return;
   if(!add(player.bag,r.key,r.n)){notify('لا توجد مساحة للموارد');return;}
   wear(equipped(),.25);r.hits--;harvests[r.id]=(harvests[r.id]||0)+1;if(ORES[r.key])hitOre(r);else if(!r.hits&&r.mesh)r.mesh.visible=false;
   if(r.key==='wood')player.woodGathered+=r.n;if(!trial)xp(r.key==='ore'?10:5);lootFeed([[r.key,r.n]]);
   const ore=ORES[r.key];audio.sound(ore?.sound||(r.key==='stone'?'stone':'wood'),r.hits?1:.8);weapon.burst(r.x,r.y,r.z,ore?.chip||'#a69d80',r.hits?7:18);shake=r.hits?.035:.065;updateHUD();save(true);return;
 }

 let best=null,dist=action.range;for(const a of world.animals){if(a.dead)continue;const d=aimAt(a.x,a.z,action.range);if(d!==null&&d<dist){best=a;dist=d;}}
 weapon.impact(action.heavy);if(best){hit(best,action.damage,{heavy:action.heavy});shake=action.heavy?.12:.055;}
}
function petAbility(){if(petItem()?.key!=='snakepet'){notify('قدرة Q تحتاج أفعى الندى المجهزة');return;}if(petCooldown>0)return;petCooldown=15;audio.sound('rare');for(const a of world.animals)if(!a.dead&&a.kind!=='spider'&&aimAt(a.x,a.z,9)!==null){a.poison=5;weapon.burst(a.x,1,a.z,'#a2c57a',20);}notify('نفث السم · العناكب محصّنة');}
function stationNear(kind){return weapon.stations.some(s=>s.kind===kind&&Math.hypot(player.x-s.x,player.z-s.z)<4);}

function drink(index){
 if(!started||dying||!['playing','inventory'].includes(state))return false;
 const result=usePotion(player,index,useTime>0||dodgeTime>0||attackTime>0||!!combat.action);
 if(!result.ok){notify(result.message);return false;}
 cancelRanged();combat.cancel();weapon.cancelAttack();mouseHeld=false;
 if(state==='inventory')resume();
 useTime=DRINK_TIME;weapon.use('potion',result.key);audio.sound('drink',.8);
 if(result.spec.heal)feedback.heal();
 notify(result.message);updateHUD();save(true);return true;
}
function heal(index=null){if(!started||dying||!['playing','inventory'].includes(state)||useTime>0||dodgeTime>0)return;const chosen=index??player.bag.findIndex(i=>i&&ITEMS[i.key].heal);if(POTIONS[player.bag[chosen]?.key]){drink(chosen);return;}if(player.hp>=100){notify('صحتك كاملة');return;}let i=index??player.bag.findIndex(i=>i&&ITEMS[i.key].heal);const it=player.bag[i];if(!it||!ITEMS[it.key].heal){notify('ما معك علاج؛ اصنع ضمادة من الألياف');return;}cancelRanged();combat.cancel();weapon.cancelAttack();player.hp=Math.min(100,player.hp+ITEMS[it.key].heal);feedback.heal();it.n--;if(!it.n)player.bag[i]=null;useTime=.85;weapon.use('bandage');audio.sound('wood',.4);notify('استعدت بعض صحتك');save(true);updateHUD();if(state==='inventory')renderBag();}
$('heal-btn').onclick=()=>heal();
function cycleWeapon(){cancelRanged();combat.cancel();weapon.cancelAttack();attackTime=.2;charge=0;weapon.draw(0);let tools=player.bag.filter(i=>i&&ITEMS[i.key].tool);if(!tools.length)return;let i=tools.findIndex(i=>i.id===player.equipped);player.equipped=tools[(i+1)%tools.length].id;updateHUD();}
$('weapon-btn').onclick=cycleWeapon;
function damage(n,source=null){if(!Number.isFinite(n)||n<=0)return;if(dodgeTime>0||dying||!combat.acceptDamage())return;cancelRanged();combat.cancel();weapon.cancelAttack();attackTime=Math.min(attackTime,.15);dangerTime=8;const ar=armor();wear(ar,.7);player.hp=Math.max(0,player.hp-incomingDamage(n,ar?ITEMS[ar.key]:null,ar?.lvl||1,condition(ar)));shake=.22;audio.sound('hurt');feedback.hurt(player.hp,source,player,yaw);updateHUD();if(!player.hp){weapon.cancelUse();useTime=0;dying=true;deathTime=1.6;keys.clear();mouseHeld=false;charge=0;weapon.draw(0);$('death').hidden=false;audio.sound('bear',1);}}
function respawn(){weapon.cancelUse();feedback.reset();if(trial){resetTrial();resume();return;}cancelRanged();const lost=splitDeathResources(player.bag);spawnDrop(player.x,player.z,lost.map(i=>[i.key,i.n,i.lvl]),true);const camp=PLACES.find(p=>p.id===player.camp)||PLACES[0];player.x=camp.x;player.z=camp.z+7;player.hp=100;player.stamina=100;player.invisible=0;player.speedBuff=0;yaw=0;pitch=0;jump=0;dodgeTime=0;shake=0;charge=0;reloadTime=0;loaded=true;useTime=0;controller.reset();cameraRig.reset();combat.reset();dying=false;$('death').hidden=true;world.animals.forEach(a=>{if(!a.dead){resetEnemy(a);a.mesh.rotation.x=0;a.x=a.homeX;a.z=a.homeZ;a.hp=a.maxHp;a.provoked=0;a.windup=0;a.cooldown=0;a.poison=0;a.poisonTick=0;}});for(const p of projectiles){scene.remove(p.m);p.m.geometry.dispose();p.m.material.dispose();}projectiles=[];$('pause-title').textContent='استيقظت في '+camp.name;open('pause');notify('تركت 30٪ من الموارد في مكان سقوطك. عتادك معك؛ استرجع الحقيبة متى شئت.');save(true);}

function queueFusion(pair=null){const plan=fusionPlan(player.bag,pair);if(!plan.steps.length){notify('تحتاج نسختين من النوع والمستوى نفسه · الحد الأعلى 5');return;}pendingFusion=plan;movingItem=false;renderBag();$('fusion-confirm').focus?.({preventScroll:false});}
function transferBag(a,b){if(canMerge(player.bag[a],player.bag[b])){queueFusion([a,b]);return 'preview';}const before=equipmentSnapshot(player),result=move(player.bag,a,b);if(result==='merge')for(const field of ['equipped','armor','pet'])if(before[field]&&!player.bag.some(i=>i?.id===before[field].id)&&before[field].key===player.bag[b]?.key)player[field]=player.bag[b].id;reconcileEquipment(player,before);if(result!=='none'){audio.ui(result==='merge'?'rare':'wood',.5);save(true);}return result;}
function renderBag(){if(player.armor&&!armor())player.armor=player.bag.find(i=>i&&ITEMS[i.key].armor)?.id||null;const filters=$('bag-filters');filters.replaceChildren();for(const [key,label] of BAG_CATEGORIES){const b=document.createElement('button');b.textContent=label;b.className=bagFilter===key?'active':'';b.setAttribute('aria-pressed',String(bagFilter===key));b.onclick=()=>{bagFilter=key;selected=-1;movingItem=false;renderBag();};filters.append(b);}const host=$('slots');host.replaceChildren();let shown=0;player.bag.forEach((it,i)=>{const b=document.createElement('button');b.className='slot'+(selected===i?' selected':'')+(it&&ITEMS[it.key].tool?' tool':'');if(it){b.dataset.rarity=rarity(it);b.style.setProperty('--rarity',RARITIES[rarity(it)].color);}b.hidden=bagFilter!=='all'&&(!it||itemCategory(it)!==bagFilter);if(it&&!b.hidden)shown++;b.dataset.index=String(i);b.setAttribute('aria-pressed',String(selected===i));b.draggable=!!it;b.setAttribute('aria-label',it?`${ITEMS[it.key].name}، مستوى ${it.lvl}، كمية ${it.n}`:`خانة فارغة ${i+1}`);if(it)b.innerHTML=`<span class="icon">${itemArt(it.key)}</span><span class="name">${ITEMS[it.key].name}</span><span class="qty">${ITEMS[it.key].tool||ITEMS[it.key].armor?'+'+it.lvl:it.n} ${RARITIES[rarity(it)].symbol}</span>`;
    b.onclick=()=>{if(movingItem&&selected>=0){let result=transferBag(selected,i);movingItem=false;selected=i;if(result==='merge')notify('ترقّت الأداة بمستوى واحد');}else selected=it?i:-1;renderBag();$('slots').children[i]?.focus?.({preventScroll:true});};
    b.ondragstart=e=>{dragIndex=i;e.dataTransfer.setData('text/plain',String(i));e.dataTransfer.effectAllowed='move';};b.ondragover=e=>{e.preventDefault();b.classList.add('drag-over');};b.ondragleave=()=>b.classList.remove('drag-over');b.ondrop=e=>{e.preventDefault();if(dragIndex>=0){let result=transferBag(dragIndex,i);if(result==='merge')notify('دمج ناجح · أداة أقوى');}dragIndex=-1;movingItem=false;selected=i;renderBag();};b.ondragend=()=>dragIndex=-1;host.append(b);
  });$('bag-count').textContent=`${player.bag.filter(Boolean).length} / 48 خانة`;
  const it=player.bag[selected],info=inspectItem(it,player),armorLook=armorAppearance(it);$('bag-empty').hidden=bagFilter==='all'||shown>0;$('bag-empty').textContent='لا توجد أغراض في هذا القسم بعد';$('bag-move-hint').hidden=!movingItem;
  $('item-info').innerHTML=info?'<div class="item-portrait">'+itemArt(it.key)+'</div><small class="item-rarity">'+info.rarity.symbol+' '+info.rarity.name+(info.equipped?' · مجهّز':'')+'</small><h3>'+info.definition.name+'</h3><p>'+info.definition.desc+'</p><div class="item-facts"><span>الكمية <b>'+it.n+'</b></span>'+((info.definition.tool||info.definition.armor)?'<span>المستوى <b>'+it.lvl+' / 5</b></span><span>الحالة <b>'+Math.ceil(info.durability)+'٪</b></span>':'')+'</div>'+(armorLook?'<div class="armor-design">'+armorIcon(it)+'<div><small>صناعة الغابة · '+(armorLook.material==='stone'?'حجر وجلد':'لحاء وجلد')+'</small><b>'+armorLook.stage+'</b><span>'+(armorLook.condition==='broken'?'تالف · الحماية أضعف':armorLook.condition==='worn'?'متآكل · الحماية أقل':'متين · الحماية كاملة')+'</span></div></div>':'')+(info.stat?'<div class="item-stat">'+info.stat.label+' <b>'+info.stat.value.toFixed(1)+info.stat.unit+'</b>'+(info.delta!==null?'<small>مقارنة بالمجهّز: '+(info.delta>=0?'+':'')+info.delta.toFixed(1)+info.stat.unit+'</small>':'')+'</div>':'')+(info.next?'<div class="fusion-note">الدمج التالي · '+info.next.value.toFixed(1)+info.next.unit+'<small>نسخة مطابقة مطلوبة · متوفر '+Math.min(1,info.duplicates)+' / 1 · يعيد الحالة إلى 100٪</small></div>':''):'<div class="item-portrait empty">◇</div><small>دفتر العتاد</small><h3>ما الذي ستحمله؟</h3><p>اختر غرضًا لفحص صورته وحالته. النقل يبدأ بزر «نقل الغرض» أو بالسحب.</p>';
  $('equip').disabled=!it||!(info.definition.tool||info.definition.heal||info.definition.armor||info.definition.pet||info.definition.potion);
  $('equip').textContent=info&&(info.definition.heal||info.definition.potion)?'استخدام':info?.equipped?'مجهّز الآن':'تجهيز';if(info?.equipped)$('equip').disabled=true;
  $('move-item').disabled=!it;$('move-item').textContent=movingItem?'ألغِ النقل':'نقل الغرض';$('drop-item').disabled=!droppable(it);$('drop-item').title=droppable(it)?'ضع وحدة على الأرض ويمكن استعادتها':'الأدوات والدروع والمرافقون والتذكارات تبقى محفوظة';
  $('unequip').hidden=!it||!(it.id===player.armor||it.id===player.pet);

  $('fusion-review').hidden=!pendingFusion;if(pendingFusion){$('fusion-summary').innerHTML='<span class="eyebrow">قبل أن تربط الخيوط</span><h3>معاينة الدمج</h3><p>'+pendingFusion.steps.length+' عملية دمج · تُستهلك النسخ المطابقة فقط، ولا تُستهلك موارد أخرى.</p>'+pendingFusion.steps.map(x=>{const before=itemStat(x.before,player.level),after=itemStat(x.after,player.level);return '<div class="fusion-row">'+itemArt(x.key)+'<div><b>'+ITEMS[x.key].name+' · '+x.from+' ← '+x.to+'</b><small>'+before.label+': '+before.value.toFixed(1)+before.unit+' ← '+after.value.toFixed(1)+after.unit+' · الحالة 100٪</small></div></div>';}).join('');}
  renderEquipment();$('recipes').replaceChildren();for(const r of RECIPES){let el=document.createElement('div');el.className='recipe';el.innerHTML=`<div><b>${itemArt(r.key)} ${ITEMS[r.key].name}</b><small>${Object.entries(r.cost).map(([k,n])=>`${ITEMS[k].name} ${count(player.bag,k)}/${n}`).join(' · ')}</small></div>`;let b=document.createElement('button');b.textContent='اصنع';b.textContent=stationNear(r.station)?'اصنع':r.station==='bench'?'عند الطاولة':'عند النار';b.disabled=!stationNear(r.station)||Object.entries(r.cost).some(([k,n])=>count(player.bag,k)<n);b.onclick=()=>{if(stationNear(r.station)&&craft(player.bag,r)){player.crafted++;xp(12);notify(`صنعت ${ITEMS[r.key].name}`);audio.sound('rare',.4);save(true);}else notify('الموارد أو المساحة لا تكفي');renderBag();};el.append(b);$('recipes').append(el);}const worn=player.bag.some(i=>i&&(ITEMS[i.key].tool||ITEMS[i.key].armor)&&condition(i)<100);$('repair').disabled=!stationNear('fire')||!worn||count(player.bag,'wood')<2||count(player.bag,'stone')<1;updateHUD();}
$('sort').onclick=()=>{let a=player.bag.filter(Boolean).sort((a,b)=>a.key.localeCompare(b.key)||b.lvl-a.lvl);player.bag=[...a,...Array(48-a.length).fill(null)];selected=-1;movingItem=false;save(true);renderBag();};$('merge-all').onclick=()=>queueFusion();$('deselect').onclick=()=>{movingItem=false;selected=-1;renderBag();};$('equip').onclick=()=>{const it=player.bag[selected];if(!it)return;audio.ui('wood',.5);if(ITEMS[it.key].tool){cancelRanged();player.equipped=it.id;notify(`جهّزت ${ITEMS[it.key].name} +${it.lvl}`);}else if(ITEMS[it.key].armor)player.armor=it.id;else if(ITEMS[it.key].pet)player.pet=it.id;else if(POTIONS[it.key]){drink(selected);}else if(ITEMS[it.key].heal)heal(selected);save(true);renderBag();};
$('fusion-cancel').onclick=()=>{pendingFusion=null;renderBag();};
$('fusion-confirm').onclick=()=>{const plan=pendingFusion;pendingFusion=null;if(!confirmFusion(player,plan)){notify('تغيّرت الشنطة؛ راجع الدمج من جديد');renderBag();return;}cancelRanged();combat.cancel();audio.ui('rare',.9);selected=player.bag.findIndex(i=>i?.id===plan.steps.at(-1).target);bagFilter='all';save(true);renderBag();$('item-info').classList.remove('fusion-success');void $('item-info').offsetWidth;$('item-info').classList.add('fusion-success');notify('اكتمل الدمج · العتاد أقوى والحالة 100٪');};
$('move-item').onclick=()=>{if(!player.bag[selected])return;movingItem=!movingItem;if(movingItem)bagFilter='all';renderBag();};
$('drop-item').onclick=()=>{const it=player.bag[selected];if(!droppable(it))return;spawnDrop(player.x,player.z,[[it.key,1,it.lvl]]);it.n--;if(!it.n)player.bag[selected]=null;movingItem=false;save(true);notify('وُضع غرض على الأرض · يمكنك استعادته');renderBag();};
$('unequip').onclick=()=>{const it=player.bag[selected];if(!it)return;if(player.armor===it.id)player.armor=null;if(player.pet===it.id)player.pet=null;movingItem=false;save(true);audio.ui('wood',.4);renderBag();};
function renderEquipment(){const host=$('equipment-slots');host.replaceChildren();for(const [label,it] of [['السلاح',equipped()],['الدرع',armor()],['المرافق',petItem()],['العلاج',player.bag.find(i=>i&&ITEMS[i.key].heal)]]){const b=document.createElement('button');b.className='equipment-slot';b.setAttribute('aria-label',label+' · '+(it?ITEMS[it.key].name:'فارغ'));b.innerHTML='<small>'+label+'</small><b>'+(it?itemArt(it.key):'＋')+'</b><span>'+(it?ITEMS[it.key].name:'فارغ')+'</span>';b.onclick=()=>{if(it){movingItem=false;selected=player.bag.indexOf(it);bagFilter='all';renderBag();}};host.append(b);}}
$('repair').onclick=()=>{if(!stationNear('fire')||count(player.bag,'wood')<2||count(player.bag,'stone')<1)return;consume(player.bag,'wood',2);consume(player.bag,'stone',1);player.bag.forEach(i=>{if(i&&(ITEMS[i.key].tool||ITEMS[i.key].armor))i.durability=100;});audio.sound('stone');notify('أصلحت معداتك · خشب 2 وحجر 1');save(true);renderBag();};
const mapView={zoom:2.5,x:player.x,z:player.z};let mapDrag=null;
function drawMap(){illustratedMap($('map-canvas'),player,yaw,explored,discovered,graves,mapView);$('map-location').textContent='موقعك الآن: '+regionName(player);$('map-zoom-label').textContent=Math.round(mapView.zoom*100)+'٪';}
function zoomMap(delta){mapView.zoom=Math.max(1,Math.min(7,mapView.zoom*delta));drawMap();}
$('map-plus').onclick=()=>zoomMap(1.3);$('map-minus').onclick=()=>zoomMap(1/1.3);$('map-center').onclick=()=>{mapView.x=player.x;mapView.z=player.z;drawMap();};
$('map-canvas').addEventListener('wheel',e=>{e.preventDefault();zoomMap(e.deltaY<0?1.13:1/1.13);},{passive:false});
$('map-canvas').addEventListener('pointerdown',e=>{mapDrag={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);});
$('map-canvas').addEventListener('pointermove',e=>{if(!mapDrag)return;const cv=$('map-canvas'),rect=cv.getBoundingClientRect(),scale=Math.min(cv.width,cv.height)/(MAP_LIMIT*2)*mapView.zoom;mapView.x=Math.max(-MAP_LIMIT,Math.min(MAP_LIMIT,mapView.x-(e.clientX-mapDrag.x)*cv.width/rect.width/scale));mapView.z=Math.max(-MAP_LIMIT,Math.min(MAP_LIMIT,mapView.z-(e.clientY-mapDrag.y)*cv.height/rect.height/scale));mapDrag={x:e.clientX,y:e.clientY};drawMap();});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])$('map-canvas').addEventListener(ev,()=>mapDrag=null);
function updateHUD(){const it=equipped();$('health').value=player.hp;$('health-text').textContent=Math.ceil(player.hp);$('stamina').value=player.stamina;$('stamina-text').textContent=Math.ceil(player.stamina);$('level').textContent=`المستوى ${player.level} · ${Math.floor(player.xp)} / ${player.level===10?'MAX':60+(player.level-1)*35} XP`;$('weapon-label').textContent=it?`${ITEMS[it.key].name} +${it.lvl}`:'يد فارغة';$('equipped-name').textContent=$('weapon-label').textContent;
  weapon.rebuild(it,armor());if(it?.key==='pistol')loaded=it.chamber!==false;weapon.draw(charge,!!count(player.bag,'arrow'));const ranged=it&&['bow','pistol'].includes(it.key);$('weapon-status').hidden=!ranged;$('weapon-status').textContent=it?.key==='bow'?(charge>0?(charge>=.98?'شد كامل · أفلت للإطلاق':'شد الوتر · '+Math.round(charge*100)+'٪'):'سهام '+count(player.bag,'arrow')+' · اضغط مطولًا'):(reload.active?'تلقيم · '+Math.round(reload.progress*100)+'٪':(loaded?'جاهز':'فارغ · R للتلقيم')+' · ذخيرة '+count(player.bag,'bullet'));$('aim-charge').hidden=it?.key!=='bow'||charge<=0;$('aim-charge').value=charge;$('stamina-wrap').classList.toggle('active',player.stamina<99||staminaDelay>0);$('stamina-wrap').classList.toggle('exhausted',player.stamina<20);$('gear-status').textContent='السلاح: '+(it?ITEMS[it.key].name:'—')+' · الدرع: '+(armor()?ITEMS[armor().key].name:'—')+' · المرافق: '+(petItem()?ITEMS[petItem().key].name:'—');$('pet-status').textContent=petItem()?ITEMS[petItem().key].name+(petCooldown>0?' · '+Math.ceil(petCooldown)+'ث':' · Q'):'';weapon.group.visible=started;
  const p=PLACES.find(p=>Math.hypot(player.x-p.x,player.z-p.z)<p.r+3);$('zone').textContent=trial?(trialCombat?'ساحة التجربة · مواجهة':'معرض المخلوقات · عرض هادئ'):p?`${p.name} · ${p.kind==='camp'?'منطقة آمنة':'مستوى '+p.level}`:regionName(player)+' · البرية';
  if(player.woodGathered<6){$('objective').textContent=`اجمع الخشب ${Math.min(6,player.woodGathered)} / 6`;$('objective-detail').textContent='اقترب من شجرة واضغط F';}else if(player.crafted<1){$('objective').textContent='اصنع أول أداة أو ضمادة';$('objective-detail').textContent='اقترب من طاولة المخيم أو النار واضغط F';}else if(looted.size<2){$('objective').textContent='ابحث عن الأكواخ وانهب صندوقًا';$('objective-detail').textContent='اتبع الطريق شرق الملاذ · F للنهب';}else if(discovered.has('guardian')){$('objective').textContent=world.guardian.dead?'حارس الجذور مهزوم':'تحدّ حارس الجذور · مستوى 10';$('objective-detail').textContent=world.guardian.dead?'احتفظ بالختم للمرحلة التالية':'جهّز درعك وعلاجك؛ راقب ضربة الأرض';}else{$('objective').textContent=`اكتشف الكهوف ${PLACES.filter(p=>p.kind==='cave'&&discovered.has(p.id)).length} / 3`;$('objective-detail').textContent='الخريطة M تتكشف مع كل خطوة';}
  let angle=(((-yaw*180/Math.PI)%360)+360)%360;const dirs=['شمال N','شمال شرق NE','شرق E','جنوب شرق SE','جنوب S','جنوب غرب SW','غرب W','شمال غرب NW'];$('heading').textContent=dirs[Math.round(angle/45)%8];}
function setQuality(q){quality=q;renderer.setPixelRatio(q==='low'?Math.min(devicePixelRatio,.8):q==='high'?Math.min(devicePixelRatio,1.7):Math.min(devicePixelRatio,1.2));renderer.shadowMap.enabled=q!=='low';world.grass.visible=q!=='low';renderer.setSize(innerWidth,innerHeight);}
$('quality').value=settings.quality;$('quality').onchange=e=>{settings.quality=e.target.value;setQuality(e.target.value);saveSettings(localStorage,SAVE+':settings',settings);};setQuality(settings.quality);
for(const key of ['master','sfx','ambient','sensitivity','cameraShake']){const el=$('setting-'+key);el.value=settings[key];el.oninput=()=>{settings[key]=Number(el.value);audio.setMix(settings);saveSettings(localStorage,SAVE+':settings',settings);};}
$('setting-damageNumbers').checked=settings.damageNumbers;$('setting-damageNumbers').onchange=e=>{settings.damageNumbers=e.target.checked;saveSettings(localStorage,SAVE+':settings',settings);};
$('fullscreen').onclick=()=>{const result=document.fullscreenElement?document.exitFullscreen?.():document.documentElement.requestFullscreen?.();result?.catch(()=>notify('الشاشة الكاملة غير متاحة هنا؛ افتح الموقع في المتصفح'));};
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
function updateAnimals(dt){
 const safe=!trial&&weapon.stations.some(s=>s.kind==='fire'&&Math.hypot(player.x-s.x,player.z-s.z)<14)||player.invisible>0;
 for(const a of world.animals){if(a.dead)continue;if(trial&&!trialCombat)continue;const distance=Math.hypot(player.x-a.x,player.z-a.z);if(distance>85){clearEnemyAttack(a);continue;}
  if(a.poison>0){a.poison=Math.max(0,a.poison-dt);a.poisonTick=(a.poisonTick||0)+dt;if(a.poisonTick>=1){a.poisonTick-=1;hit(a,5,{stagger:false});}if(a.dead)continue;}
  const ctx={x:player.x,z:player.z,safe,visible:player.invisible<=0&&distance<38&&enemyLineOfSight(a,player.x,player.z,world.blocked)};
  const motion=stepEnemy(a,dt,ctx);if(a.hostile&&['alert','chase','retreat','circle','windup','attack','recovery'].includes(a.brain.state))dangerTime=8;
  if(motion.alert)audio.sound(a.kind==='spider'?'insect':a.kind==='mutant'?'roots':a.kind==='wolf'?'wolfgrowl':'growl',a.guardian?.9:.35);if(motion.telegraph){audio.sound(a.archer?'bowdraw':a.kind==='spider'?'insect':a.kind==='mutant'?'roots':a.kind==='wolf'?'wolfgrowl':'growl',.28);if(a.guardian)notify('حارس الجذور يستعد · ابتعد أو تفادَ!');}
  if(a.kind==='spider'&&!a.dropped&&['alert','chase','windup','attack'].includes(a.brain.state)){a.dropHeight=Math.max(0,(a.dropHeight??3)-dt*3);if(a.dropHeight===0)a.dropped=true;}
  if(a.kind==='spider'&&!a.dropped&&a.brain.state==='windup'){a.brain.time=0;motion.attack=null;}
  if(motion.attack){const connects=attackConnects(a,motion.attack,ctx);
   if(motion.attack.ranged&&connects){const origin=new T.Vector3(a.x,terrain(a.x,a.z)+1.5,a.z),dest=new T.Vector3(motion.attack.x,terrain(motion.attack.x,motion.attack.z)+1.3,motion.attack.z);const v=dest.sub(origin).normalize().multiplyScalar(18);const m=new T.Mesh(arrowGeometry(),new T.MeshBasicMaterial({color:'#d8b285'}));m.position.copy(origin);m.quaternion.setFromUnitVectors(new T.Vector3(0,0,-1),v.clone().normalize());scene.add(m);projectiles.push({m,v,gravity:0,life:2,damage:motion.attack.damage,hostile:true,source:{x:a.x,z:a.z}});audio.sound('bowrelease',.4);}
   else if(!motion.attack.ranged){audio.sound('swish',.25);if(motion.attack.area){weapon.burst(a.x,terrain(a.x,a.z)+.5,a.z,'#c6b68d',28);audio.sound('bear',.7);}if(connects)damage(motion.attack.damage,a);}
  }
  moveEnemy(a,motion,dt,world.blocked,LIMIT-3);a.mesh.position.set(a.x,terrain(a.x,a.z)+(a.kind==='spider'&&!a.dropped?(a.dropHeight??3):0),a.z);
  if(motion.heading!==null){const diff=Math.atan2(Math.sin(motion.heading-a.mesh.rotation.y),Math.cos(motion.heading-a.mesh.rotation.y));a.mesh.rotation.y+=Math.max(-dt*5,Math.min(dt*5,diff));}
  if(dying)break;
 }
}

function updateProjectiles(dt){for(let i=projectiles.length-1;i>=0;i--){const p=projectiles[i];p.life-=dt;p.v.y-=p.gravity*dt;if(p.gravity)p.m.quaternion.setFromUnitVectors(new T.Vector3(0,0,-1),p.v.clone().normalize());let stop=false;const steps=Math.max(1,Math.ceil(p.v.length()*dt/.35));for(let j=0;j<steps&&!stop;j++){p.m.position.addScaledVector(p.v,dt/steps);const q=p.m.position;if(p.hostile&&Math.hypot(q.x-player.x,q.z-player.z)<.65&&Math.abs(q.y-(terrain(player.x,player.z)+1))<1){damage(p.damage,p.source);stop=true;}for(const a of world.animals)if(!p.hostile&&!a.dead&&Math.hypot(q.x-a.x,q.z-a.z)<(a.guardian?1.6:.75)&&Math.abs(q.y-(terrain(a.x,a.z)+1))<1.4){hit(a,p.damage);stop=true;break;}if(q.y<terrain(q.x,q.z)||world.blocked(q.x,q.z))stop=true;}if(stop||p.life<=0){scene.remove(p.m);p.m.geometry.dispose();p.m.material.dispose();projectiles.splice(i,1);}}}
let last=performance.now(),frames=0,fpsTime=0;
function frame(now){requestAnimationFrame(frame);if(now-last<1000/(state==='playing'?90:30))return;const dt=Math.min((now-last)/1000,.045);last=now;if(document.hidden)return;elapsed+=dt;noticeTime-=dt;if(noticeTime<=0)$('notice').classList.remove('on');
  if(dying){deathTime-=dt;camera.rotation.z+=dt*.4;camera.position.y-=dt*.45;if(deathTime<=0)respawn();}
  if(state==='playing'&&!dying){
    combat.tick(dt,resolveMelee);attackTime=Math.max(0,attackTime-dt);interactTime=Math.max(0,interactTime-dt);if(mouseHeld&&equipped()?.key==='bow'&&attackTime<=0&&dodgeTime<=0&&useTime<=0&&count(player.bag,'arrow')){charge=Math.min(1,charge+dt/RANGED.bowDraw);weapon.draw(charge);player.stamina=Math.max(0,player.stamina-dt*3);controller.state.staminaDelay=.65;if(player.stamina<=0){charge=0;mouseHeld=false;weapon.draw(0);}}else if(mouseHeld&&equipped()?.key!=='bow')attack();
    const motion=controller.tick(player,input.movement(),yaw,dt,world.blocked,(player.speedBuff>0?1.25:1)*(petItem()?.key==='wolfpet'?1.05:1));
    const running=motion.running,len=motion.moved>.001?1:0;dodgeTime=controller.state.dodgeLeft;staminaDelay=controller.state.staminaDelay;jump=motion.jump;bob+=motion.moved*2;
    if(len){footTime-=dt;if(footTime<=0){footTime=running?.3:.5;audio.sound('step',running?.45:.25);}}
    petCooldown=Math.max(0,petCooldown-dt);dangerTime=Math.max(0,dangerTime-dt);player.speedBuff=Math.max(0,(player.speedBuff||0)-dt);player.invisible=Math.max(0,(player.invisible||0)-dt);useTime=Math.max(0,useTime-dt);shake=Math.max(0,shake-dt);lowBreath-=dt;if(player.stamina<20&&lowBreath<=0){audio.sound('breath');lowBreath=2;}if(reload.active){const it=equipped();const ready=reload.tick(dt,it?.id,()=>audio.sound('reload',.7));reloadTime=reload.active?RANGED.reload*(1-reload.progress):0;weapon.reload(reload.active?reload.progress:-1);if(ready&&count(player.bag,'bullet')){it.chamber=true;loaded=true;audio.sound('stone',.5);notify('جاهز للإطلاق');save(true);}}if(petItem()?.key==='dollpet'&&dangerTime<=0)player.hp=Math.min(100,player.hp+dt*1.5);
    const pose=cameraRig.tick(player,terrain(player.x,player.z),yaw,pitch,motion,dt,elapsed,shake,settings.cameraShake);
    camera.position.set(pose.x,pose.y,pose.z);camera.rotation.set(pose.pitch,pose.yaw,pose.roll,'YXZ');if(Math.abs(camera.fov-pose.fov)>.01){camera.fov=pose.fov;camera.updateProjectionMatrix();}
    weapon.group.rotation.z=0;weapon.group.rotation.x=0;weapon.group.position.y=-.13+(len?Math.sin(bob)*.025:Math.sin(elapsed*1.7)*.008);weapon.group.position.z=-.35;weapon.pet(petItem()?.key||'',{x:player.x,z:player.z,yaw},elapsed);updateProjectiles(dt);audio.update(dt,world.animals.some(a=>a.hostile&&!a.dead&&Math.hypot(a.x-player.x,a.z-player.z)<22),weather);
    world.sun.position.set(player.x-65,100,player.z-45);world.sun.target.position.set(player.x,0,player.z);
    updateAnimals(dt);if(!trial&&Math.hypot(player.x,player.z-30)<13)player.hp=Math.min(100,player.hp+dt*1.7);
    mapTime+=dt;if(mapTime>.6){mapTime=0;reveal(explored,player.x,player.z);for(const p of PLACES){if(!discovered.has(p.id)&&Math.hypot(player.x-p.x,player.z-p.z)<p.r+8){discovered.add(p.id);xp(25);notify(`اكتشفت ${p.name} · +25 خبرة`);$('discovery').textContent=p.name;$('discovery').classList.remove('show');void $('discovery').offsetWidth;$('discovery').classList.add('show');audio.sound('rare',.6);}}if(Math.abs(player.x)>LIMIT-5||Math.abs(player.z)>LIMIT-5)notify('المنطقة التالية مغلقة حاليًا؛ نطوّر الغابة الأولى الآن');}
    uiTime+=dt;if(uiTime>.15){uiTime=0;updateHUD();target=chooseTarget();$('target').hidden=!target;if(target)$('target').textContent=target.label;}
    saveTime+=dt;if(saveTime>25){saveTime=0;save(true);}
  }
  for(const r of world.resources)animateOre(r,state==='playing'?dt:0);art.update(state==='playing'?dt:0,elapsed,player);scenery.update(dt,elapsed);weather=weapon.update(state==='playing'?dt:0,elapsed,player);$('clock').textContent=weather;for(const o of [...drops,...graves]){if(o.mesh){animateLoot(o.mesh,elapsed);}}
  world.fires.forEach((f,i)=>{f.scale.y=1.35+Math.sin(elapsed*9+i)*.18;f.rotation.y=elapsed*.7;});world.water.material.opacity=.74+Math.sin(elapsed*.7)*.035;
  if(state==='welcome'){camera.position.set(17+Math.sin(elapsed*.07)*2,10.5,53);camera.lookAt(0,2,17);}
  presentHud(state==='playing'?dt:0);activation.update(dt,state==='welcome'?{x:camera.position.x,z:camera.position.z}:player);renderer.render(scene,camera);frames++;fpsTime+=dt;if(fpsTime>=2){if(new URLSearchParams(location.search).has('qa'))$('perf').title='draw calls: '+renderer.info?.render.calls+' · triangles: '+renderer.info?.render.triangles+' · geometries: '+renderer.info?.memory.geometries;$('perf').textContent=`${Math.round(frames/fpsTime)} FPS · ${quality==='low'?'خفيفة':quality==='high'?'عالية':'متوازنة'}`;frames=0;fpsTime=0;}
}
requestAnimationFrame(frame);

