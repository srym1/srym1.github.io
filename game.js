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
import {ITEMS,RECIPES,newBag,count,add,consume,move,mergeAll,craft,PLACES,LIMIT,MAP_LIMIT,terrain,reveal,validSave,seeded,rarity,RARITIES,chestLoot,rollPet,splitDeathResources} from './systems.js?v=0.5.0';
import {buildWorld} from './world.js';
import {artDirection,itemArt,lootFeed,regionName} from './art.js';
import {forestPresentation,forestAudio,illustratedMap} from './forest.js?v=0.5.0';
const $=id=>document.getElementById(id),canvas=$('world');
let renderer;
try{renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(e){$('error').textContent='الرسم ثلاثي الأبعاد غير متاح في هذا المتصفح. جرّب متصفحًا يدعم WebGL 2.';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.35));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
const scene=new T.Scene(),camera=new T.PerspectiveCamera(72,innerWidth/innerHeight,.08,420);camera.rotation.order='YXZ';scene.add(camera);
const world=buildWorld(scene),weapon=forestPresentation(scene,camera,world),art=artDirection(world),scenery=dressForest(world);weapon.group.visible=false;const activation=activateScene(scene);
camera.position.set(17,11,53);camera.lookAt(0,2,17);
const SAVE=new URLSearchParams(location.search).has('qa')?'rym-heart-qa':'rym-heart-v1';const settings=loadSettings(localStorage,SAVE+':settings');let state='welcome',started=false,selected=-1,dragIndex=-1,noticeTime=0,attackTime=0,interactTime=0,elapsed=0,saveTime=0,uiTime=0,mapTime=0,quality='medium';
let yaw=0,pitch=0,jump=0,bob=0,target=null,mouseHeld=false,dragLook=false,lastMouse=null;
const keys=input.held,explored=new Set(),looted=new Set(),discovered=new Set(['camp']),defeated=new Set(),harvests={};
let player={x:0,z:38,hp:100,stamina:100,level:1,xp:0,woodGathered:0,crafted:0,bag:newBag(),equipped:null,armor:null,pet:null,camp:'camp',speedBuff:0,invisible:0};player.equipped=player.bag[0].id;
let staminaDelay=0,dodgeTime=0,shake=0,useTime=0,charge=0,reloadTime=0,loaded=true,petCooldown=0,dangerTime=0,weather='',lowBreath=0,deathTime=0,footTime=0;let dying=false;let drops=[],graves=[],projectiles=[];const audio=forestAudio();audio.setMix(settings);
$('perf').hidden=!new URLSearchParams(location.search).has('qa');let saveLoaded=false;
const restored=loadSave(localStorage,SAVE,validSave);try{const raw=restored.data;if(validSave(raw)){Object.assign(player,{x:raw.x,z:raw.z,hp:Math.max(1,Math.min(100,raw.hp)),level:raw.level,xp:raw.xp,woodGathered:raw.woodGathered||0,crafted:raw.crafted||0,bag:raw.bag,equipped:raw.equipped});for(const x of raw.explored)if(typeof x==='string')explored.add(x);for(const x of raw.looted)if(typeof x==='string')looted.add(x);for(const x of raw.discovered)if(PLACES.some(p=>p.id===x))discovered.add(x);for(const x of raw.defeated||[])if(Number.isInteger(x))defeated.add(x);Object.assign(harvests,raw.harvests||{});yaw=Number.isFinite(raw.yaw)?raw.yaw:0;player.armor=raw.armor||null;player.pet=raw.pet||null;player.camp=PLACES.some(p=>p.kind==='camp'&&p.id===raw.camp)?raw.camp:'camp';graves=Array.isArray(raw.graves)?raw.graves.filter(x=>Number.isFinite(x.x)&&Number.isFinite(x.z)&&Array.isArray(x.loot)):[];drops=Array.isArray(raw.drops)?raw.drops.filter(x=>Number.isFinite(x.x)&&Number.isFinite(x.z)&&Array.isArray(x.loot)):[];saveLoaded=true;}}catch{}
for(const c of world.chests)if(looted.has(c.id)){c.opened=true;c.lid.rotation.x=-.75;}
world.animals.forEach((a,i)=>{a.id=a.kind==='chicken'?1000+i:a.guardian?world.animals.filter(x=>x.kind!=='chicken').indexOf(a):i;a.maxHp=a.hp*(1+a.level*.065);a.hp=a.maxHp;if(defeated.has(a.id)){a.dead=true;a.mesh.visible=false;}});
for(const r of world.resources){if(Number.isFinite(harvests[r.id]))r.hits=Math.max(0,r.hits-harvests[r.id]);if(r.hits===0&&r.mesh)r.mesh.visible=false;}
if(world.blocked(player.x,player.z)){player.x=0;player.z=38;}
reveal(explored,player.x,player.z);
function equipped(){let it=player.bag.find(i=>i?.id===player.equipped&&ITEMS[i.key].tool);if(!it){it=player.bag.find(i=>i&&ITEMS[i.key].tool);player.equipped=it?.id||null;}return it;}
function notify(text){$('notice').textContent=text;$('notice').classList.add('on');noticeTime=3.2;}
function xp(n){if(player.level>=10)return;player.xp+=n;let req=60+(player.level-1)*35;while(player.xp>=req&&player.level<10){player.xp-=req;player.level++;player.hp=Math.min(100,player.hp+20);notify(`وصلت للمستوى ${player.level} · زادت قوة ضربتك`);req=60+(player.level-1)*35;}if(player.level===10)player.xp=0;}
function save(silent=false){if(!started&&!saveLoaded)return false;try{const result=writeSave(localStorage,SAVE,{...player,version:2,yaw,explored:[...explored],looted:[...looted],discovered:[...discovered],defeated:[...defeated],harvests,graves:graves.map(({x,z,loot})=>({x,z,loot})),drops:drops.map(({x,z,loot})=>({x,z,loot}))},validSave);if(!result.ok)throw Error(result.reason);if(!silent)notify('تم حفظ تقدّمك في هذا المتصفح');return true;}catch{if(!silent)notify('الحفظ غير متاح: قد تكون مساحة المتصفح ممتلئة');return false;}}
function lock(){try{const p=canvas.requestPointerLock?.();if(p?.catch)p.catch(()=>notify('اسحب بالماوس للنظر إذا لم يُسمح بتثبيت المؤشر'));}catch{notify('اسحب بالماوس للنظر');}}
function open(which){if(!started||dying)return;state=which;audio.setActive(false);input.clear();controller.stop();combat.cancel();weapon.cancelAttack();attackTime=0;mouseHeld=false;charge=0;weapon.draw(0);document.exitPointerLock?.();for(const id of ['pause','inventory','map'])$(id).hidden=id!==which;if(which==='inventory'){audio.sound('wood',.7);renderBag();}if(which==='map')drawMap();}
function resume(){if(dying)return;if(!started){weapon.enter();cameraRig.reset();controller.reset();}for(const id of ['welcome','pause','inventory','map'])$(id).hidden=true;$('hud').hidden=false;state='playing';started=true;audio.setActive(true);audio.sound('wood',.1);weapon.group.visible=true;lock();updateHUD();if(restored.recovered)notify('استُعيد تقدمك من نسخة الحفظ الاحتياطية');}
function leave(){save(true);document.exitPointerLock?.();if(parent!==window)parent.postMessage({type:'rym-heart-exit'},location.origin);else location.href='index.html';}
$('start').disabled=false;$('start').textContent=saveLoaded?'تابع رحلتك في الغابة ←':'ادخل الغابة ←';$('start').onclick=resume;$('resume').onclick=resume;$('leave').onclick=leave;$('leave-start').onclick=leave;
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
  if(action==='dodge'&&controller.dodge(player,input.movement(),yaw)){combat.cancel();weapon.cancelAttack();attackTime=0;dodgeTime=controller.state.dodgeLeft;audio.sound('breath',.4);}
  if(action==='reload'&&equipped()?.key==='pistol'&&!loaded&&!reloadTime){reloadTime=1.2;notify('إعادة التلقيم…');}
  if(action==='pet')petAbility();
  if(action==='weapon')cycleWeapon();
  if(action==='jump')controller.jump();
});
document.addEventListener('keyup',e=>input.release(e.code));
window.addEventListener('blur',()=>{keys.clear();if(state==='playing')open('pause');});
document.addEventListener('visibilitychange',()=>{if(document.hidden){save(true);if(state==='playing')open('pause');}});
window.addEventListener('pagehide',()=>save(true));
document.addEventListener('mousemove',e=>{if(state!=='playing')return;if(document.pointerLockElement===canvas){yaw-=e.movementX*.0022*settings.sensitivity;pitch-=e.movementY*.0022*settings.sensitivity;}else if(dragLook&&lastMouse){yaw-=(e.clientX-lastMouse.x)*.004*settings.sensitivity;pitch-=(e.clientY-lastMouse.y)*.004*settings.sensitivity;}lastMouse={x:e.clientX,y:e.clientY};pitch=Math.max(-1.3,Math.min(1.3,pitch));});
canvas.addEventListener('mousedown',e=>{if(state!=='playing'||dying)return;mouseHeld=e.button===0;if(document.pointerLockElement!==canvas){dragLook=true;lastMouse={x:e.clientX,y:e.clientY};}if(e.button===0&&equipped()?.key!=='bow')attack();if(e.button===2)attack(true);});
document.addEventListener('mouseup',e=>{if(e.button===0&&state==='playing'&&equipped()?.key==='bow'&&charge>0)shoot(charge);charge=0;weapon.draw(0);mouseHeld=false;dragLook=false;});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
function aimAt(x,z,max=4.3){const dx=x-player.x,dz=z-player.z,d=Math.hypot(dx,dz);const dot=(-Math.sin(yaw)*dx-Math.cos(yaw)*dz)/Math.max(.01,d);if(d>=max||!(dot>.65||d<1.3))return null;for(let step=.45;step<d-.85;step+=.4)if(world.blocked(player.x+dx*step/d,player.z+dz*step/d))return null;return d;}
function chooseTarget(){let best=null,dist=99;for(const o of [...weapon.stations,...drops.map(x=>({...x,type:'drop',source:x})),...graves.map(x=>({...x,type:'grave',source:x}))]){const d=aimAt(o.x,o.z,3.4);if(d!==null&&d<dist){dist=d;best={type:o.type||'station',obj:o,label:o.type==='grave'?'F · استرجع الموارد المفقودة':o.type==='drop'?'F · '+o.loot.map(([k])=>ITEMS[k].name).join(' · '):'F · '+o.name};}}for(const c of world.chests){if(c.opened)continue;const d=aimAt(c.x,c.z,4);if(d!==null&&d<dist){dist=d;best={type:'chest',obj:c,label:`F · نهب صندوق · مستوى ${c.level}`};}}for(const r of world.resources){if(r.hits<=0)continue;const d=aimAt(r.x,r.z,r.key==='wood'?3.4:3.2);if(d!==null&&d<dist){dist=d;best={type:'resource',obj:r,label:`F · ${r.name} · ${r.hits} ضربات متبقية`};}}for(const a of world.animals){if(a.dead)continue;const d=aimAt(a.x,a.z,5);if(d!==null&&d<dist){dist=d;best={type:'animal',obj:a,label:`${a.guardian?'حارس الجذور':a.archer?'رامي الأطلال':animalName(a.kind)} · مستوى ${a.level} · ${Math.ceil(a.hp)} صحة`};}}return best;}
function animalName(k){return {chicken:'دجاجة برية',wolf:'ذئب',bear:'دب',deer:'غزال',rabbit:'أرنب',spider:'عنكبوت الكهف',mutant:'متحوّل الغابة'}[k];}
function interact(){if(interactTime>0||dying)return;target=chooseTarget();if(!target)return;interactTime=.45;
  if(target.type==='station'){const s=target.obj;if(s.kind==='fire'){player.camp=s.id;player.hp=100;player.stamina=100;notify('استرحت وحُفظ المخيم كنقطة رجوع · الطبخ والضمادات متاحة');save(true);}open('inventory');return;}
  if(target.type==='drop'||target.type==='grave'){const o=target.obj.source;const next=player.bag.map(i=>i?{...i}:null);if(!o.loot.every(([k,n,l=1])=>add(next,k,n,l))){notify('رتّب الشنطة أولًا؛ الغنائم باقية هنا');return;}player.bag=next;scene.remove(o.mesh);o.mesh?.traverse(m=>{m.geometry?.dispose();m.material?.dispose();});if(target.type==='grave')graves=graves.filter(x=>x!==o);else drops=drops.filter(x=>x!==o);audio.sound(o.rare==='common'?'wood':o.rare==='mythic'?'mythic':'rare');useTime=.5;weapon.use('pickup');lootFeed(o.loot);save(true);return;}
  if(target.type==='resource'){
    if(combat.action||attackTime>0)return;const r=target.obj,preview=player.bag.map(i=>i?{...i}:null);
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
function spawnDrop(x,z,loot,grave=false,existing=null){if(!loot.length)return;const o=existing||{x,z,loot};o.rare=loot.reduce((r,[k,n,lvl=1])=>Object.keys(RARITIES).indexOf(rarity({key:k,lvl}))>Object.keys(RARITIES).indexOf(r)?rarity({key:k,lvl}):r,'common');const mat=new T.MeshBasicMaterial({color:grave?'#e7d8b4':RARITIES[o.rare].color,transparent:true,opacity:.75});const group=new T.Group();const body=new T.Mesh(new T.IcosahedronGeometry(.24,o.rare==='common'?0:1),mat);group.add(body);if(o.rare!=='common'||grave){const ring=new T.Mesh(new T.TorusGeometry(.4,.025,4,24),mat);ring.rotation.x=Math.PI/2;group.add(ring);}if(['epic','mythic'].includes(o.rare)){const pillar=new T.Mesh(new T.CylinderGeometry(.035,.2,o.rare==='mythic'?3:1.6,5),new T.MeshBasicMaterial({color:RARITIES[o.rare].color,transparent:true,opacity:.3,depthWrite:false}));pillar.position.y=.7;group.add(pillar);}group.position.set(x,terrain(x,z)+.5,z);scene.add(group);o.mesh=group;if(!existing)(grave?graves:drops).push(o);weapon.burst(x,terrain(x,z)+.7,z,RARITIES[o.rare].color,o.rare==='mythic'?40:12);if(o.rare!=='common')audio.sound(o.rare==='mythic'?'mythic':'rare',o.rare==='uncommon'?.4:.8);}
for(const o of drops)spawnDrop(o.x,o.z,o.loot,false,o);for(const o of graves)spawnDrop(o.x,o.z,o.loot,true,o);
function damageFeedback(a,n){
 if(!settings.damageNumbers)return;const host=$('damage-feedback');
 const point=new T.Vector3(a.x,terrain(a.x,a.z)+1.6,a.z).project(camera);
 if(point.z< -1||point.z>1)return;const row=document.createElement('span');row.className='damage-number';row.textContent=Math.round(n);
 row.style.left=((point.x+1)*50)+'%';row.style.top=((1-point.y)*50)+'%';host.append(row);
 while(host.children.length>8)host.children[0].remove();setTimeout(()=>row.remove(),700);
}
function hit(a,n){if(a.dead)return;a.hp-=n;a.lastHit=elapsed;damageFeedback(a,n);a.hitReaction=.3;a.provoked=10;weapon.burst(a.x,terrain(a.x,a.z)+1,a.z,'#baaa74');shake=.08;audio.sound('hit');if(a.hp<=0){a.dead=true;a.mesh.rotation.z=Math.PI/2;a.mesh.position.y=terrain(a.x,a.z)+.25;defeated.add(a.id);xp(a.level*7+12);const loot=a.guardian?[['guardianseal',1,1]]:a.kind==='spider'?[['fiber',3,1]]:a.kind==='mutant'?[['scrap',2,1],['arrow',3,1]]:[['hide',2,1],['rawmeat',1,1]];const pet=rollPet();if(pet)loot.push([pet,1,1]);spawnDrop(a.x,a.z,loot);notify(a.guardian?'سقط حارس الجذور · قلب الغابة يتذكّر رحلتك':'سقط '+animalName(a.kind)+' · الغنائم على الأرض');save(true);}}
function shoot(power=1){const it=equipped();if(!it||attackTime>0)return;const pistol=it.key==='pistol',ammo=pistol?'bullet':'arrow';if(pistol&&!loaded){notify('R لإعادة التلقيم');return;}if(!count(player.bag,ammo)){notify('تحتاج '+ITEMS[ammo].name+' من طاولة الصناعة');return;}consume(player.bag,ammo,1);wear(it,.6);if(pistol)loaded=false;player.invisible=0;attackTime=pistol?.6:.65;weapon.attack(pistol?'pistol':'bow');shake=pistol?.15:.035;audio.sound(pistol?'shot':'wood');const m=new T.Mesh(new T.SphereGeometry(pistol?.035:.045,5,4),new T.MeshBasicMaterial({color:pistol?'#ffd49a':'#bdad80'}));m.position.copy(camera.position);scene.add(m);projectiles.push({m,v:new T.Vector3(-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)).multiplyScalar(pistol?85:18+power*24),life:3,gravity:pistol?0:7,damage:ITEMS[it.key].damage*Math.pow(1.36,it.lvl-1)*(pistol?1:.35+power*.65)*(condition(it)<=0?.45:condition(it)<25?.8:1)});}
function attack(heavy=false){
 if(state!=='playing'||dying||attackTime>0||combat.action||dodgeTime>0||useTime>0)return;
 const tool=equipped();if(tool?.key==='bow')return;if(tool?.key==='pistol'){if(!heavy)shoot();return;}
 if(!spend(heavy?26:6))return;wear(tool,heavy?.9:.4);player.invisible=0;
 const action=combat.start(heavy,{range:tool?.key==='spear'?5.2:3.5,
 damage:weaponDamage(tool?ITEMS[tool.key]:null,tool?.lvl||1,condition(tool),player.level)*(heavy?1.9:1)});
 attackTime=action.duration;weapon.attack('melee',action);audio.sound('wood',heavy?.7:.35);updateHUD();
}
function resolveMelee(action){if(state!=='playing'||dying||dodgeTime>0)return;
 if(action.kind==='mining'){
   const r=world.resources.find(r=>r.id===action.resourceId);if(!r||r.hits<=0||aimAt(r.x,r.z,3.5)===null)return;
   if(!add(player.bag,r.key,r.n)){notify('لا توجد مساحة للموارد');return;}
   wear(equipped(),.25);r.hits--;harvests[r.id]=(harvests[r.id]||0)+1;if(!r.hits&&r.mesh)r.mesh.visible=false;
   if(r.key==='wood')player.woodGathered+=r.n;xp(r.key==='ore'?10:5);lootFeed([[r.key,r.n]]);
   audio.sound(['ore','coal','copper','stone'].includes(r.key)?'stone':'wood');weapon.burst(r.x,r.y,r.z,r.key==='copper'?'#c08759':'#a69d80');shake=.035;updateHUD();save(true);return;
 }

 let best=null,dist=action.range;for(const a of world.animals){if(a.dead)continue;const d=aimAt(a.x,a.z,action.range);if(d!==null&&d<dist){best=a;dist=d;}}
 weapon.impact(action.heavy);if(best){hit(best,action.damage);shake=action.heavy?.12:.055;}
}
function petAbility(){if(petItem()?.key!=='snakepet'){notify('قدرة Q تحتاج أفعى الندى المجهزة');return;}if(petCooldown>0)return;petCooldown=15;audio.sound('rare');for(const a of world.animals)if(!a.dead&&a.kind!=='spider'&&aimAt(a.x,a.z,9)!==null){a.poison=5;weapon.burst(a.x,1,a.z,'#a2c57a',20);}notify('نفث السم · العناكب محصّنة');}
function stationNear(kind){return weapon.stations.some(s=>s.kind===kind&&Math.hypot(player.x-s.x,player.z-s.z)<4);}

function heal(index=null){if(player.hp>=100){notify('صحتك كاملة');return;}let i=index??player.bag.findIndex(i=>i&&ITEMS[i.key].heal);const it=player.bag[i];if(!it||!ITEMS[it.key].heal){notify('ما معك علاج؛ اصنع ضمادة من الألياف');return;}player.hp=Math.min(100,player.hp+ITEMS[it.key].heal);it.n--;if(!it.n)player.bag[i]=null;useTime=.85;weapon.use('potion');audio.sound('rare');notify('استعدت بعض صحتك');audio.sound('rare',.4);updateHUD();if(state==='inventory')renderBag();}
$('heal-btn').onclick=()=>heal();
function cycleWeapon(){combat.cancel();weapon.cancelAttack();attackTime=.2;charge=0;weapon.draw(0);let tools=player.bag.filter(i=>i&&ITEMS[i.key].tool);if(!tools.length)return;let i=tools.findIndex(i=>i.id===player.equipped);player.equipped=tools[(i+1)%tools.length].id;updateHUD();}
$('weapon-btn').onclick=cycleWeapon;
function damage(n){if(dodgeTime>0||dying||!combat.acceptDamage())return;combat.cancel();weapon.cancelAttack();attackTime=Math.min(attackTime,.15);dangerTime=8;const ar=armor();wear(ar,.7);player.hp=Math.max(0,player.hp-incomingDamage(n,ar?ITEMS[ar.key]:null,ar?.lvl||1,condition(ar)));shake=.22;audio.sound('hurt');$('hurt').style.opacity='.7';setTimeout(()=>$('hurt').style.opacity='0',230);if(!player.hp){dying=true;deathTime=1.6;keys.clear();mouseHeld=false;charge=0;weapon.draw(0);$('death').hidden=false;audio.sound('bear',1);}}
function respawn(){const lost=splitDeathResources(player.bag);spawnDrop(player.x,player.z,lost.map(i=>[i.key,i.n,i.lvl]),true);const camp=PLACES.find(p=>p.id===player.camp)||PLACES[0];player.x=camp.x;player.z=camp.z+7;player.hp=100;player.stamina=100;player.invisible=0;player.speedBuff=0;yaw=0;pitch=0;jump=0;dodgeTime=0;shake=0;charge=0;reloadTime=0;loaded=true;useTime=0;controller.reset();cameraRig.reset();combat.reset();dying=false;$('death').hidden=true;world.animals.forEach(a=>{if(!a.dead){a.x=a.homeX;a.z=a.homeZ;a.hp=a.maxHp;a.provoked=0;a.windup=0;a.cooldown=0;a.poison=0;a.poisonTick=0;}});for(const p of projectiles){scene.remove(p.m);p.m.geometry.dispose();p.m.material.dispose();}projectiles=[];$('pause-title').textContent='استيقظت في '+camp.name;open('pause');notify('تركت 30٪ من الموارد في مكان سقوطك. عتادك معك؛ استرجع الحقيبة متى شئت.');save(true);}

function renderBag(){if(player.armor&&!armor())player.armor=player.bag.find(i=>i&&ITEMS[i.key].armor)?.id||null;const host=$('slots');host.replaceChildren();player.bag.forEach((it,i)=>{const b=document.createElement('button');b.className='slot'+(selected===i?' selected':'')+(it&&ITEMS[it.key].tool?' tool':'');if(it){b.dataset.rarity=rarity(it);b.style.setProperty('--rarity',RARITIES[rarity(it)].color);}b.draggable=!!it;b.setAttribute('aria-label',it?`${ITEMS[it.key].name}، مستوى ${it.lvl}، كمية ${it.n}`:`خانة فارغة ${i+1}`);if(it)b.innerHTML=`<span class="icon">${itemArt(it.key)}</span><span class="name">${ITEMS[it.key].name}</span><span class="qty">${ITEMS[it.key].tool||ITEMS[it.key].armor?'+'+it.lvl:it.n} ${RARITIES[rarity(it)].symbol}</span>`;
    b.onclick=()=>{if(selected>=0&&selected!==i){let result=move(player.bag,selected,i);selected=-1;if(result==='merge')notify('ترقّت الأداة بمستوى واحد');}else selected=selected===i?-1:i;renderBag();};
    b.ondragstart=e=>{dragIndex=i;e.dataTransfer.setData('text/plain',String(i));e.dataTransfer.effectAllowed='move';};b.ondragover=e=>{e.preventDefault();b.classList.add('drag-over');};b.ondragleave=()=>b.classList.remove('drag-over');b.ondrop=e=>{e.preventDefault();if(dragIndex>=0){let result=move(player.bag,dragIndex,i);if(result==='merge')notify('دمج ناجح · أداة أقوى');}dragIndex=-1;selected=-1;renderBag();};b.ondragend=()=>dragIndex=-1;host.append(b);
  });$('bag-count').textContent=`${player.bag.filter(Boolean).length} / 48 خانة`;
  const it=player.bag[selected];$('item-info').textContent=it?`${RARITIES[rarity(it)].symbol} ${RARITIES[rarity(it)].name} · ${ITEMS[it.key].name} · مستوى ${it.lvl}${ITEMS[it.key].tool||ITEMS[it.key].armor?' · الحالة '+Math.ceil(condition(it))+'٪':''} — ${ITEMS[it.key].desc}`:'حدّد غرضًا لعرض تفاصيله أو اسحبه للنقل والدمج.';$('equip').disabled=!it||!(ITEMS[it.key].tool||ITEMS[it.key].heal||ITEMS[it.key].armor||ITEMS[it.key].pet||ITEMS[it.key].potion);
  renderEquipment();$('recipes').replaceChildren();for(const r of RECIPES){let el=document.createElement('div');el.className='recipe';el.innerHTML=`<div><b>${ITEMS[r.key].icon} ${ITEMS[r.key].name}</b><small>${Object.entries(r.cost).map(([k,n])=>`${ITEMS[k].name} ${count(player.bag,k)}/${n}`).join(' · ')}</small></div>`;let b=document.createElement('button');b.textContent='اصنع';b.textContent=stationNear(r.station)?'اصنع':r.station==='bench'?'عند الطاولة':'عند النار';b.disabled=!stationNear(r.station)||Object.entries(r.cost).some(([k,n])=>count(player.bag,k)<n);b.onclick=()=>{if(stationNear(r.station)&&craft(player.bag,r)){player.crafted++;xp(12);notify(`صنعت ${ITEMS[r.key].name}`);audio.sound('rare',.4);save(true);}else notify('الموارد أو المساحة لا تكفي');renderBag();};el.append(b);$('recipes').append(el);}const worn=player.bag.some(i=>i&&(ITEMS[i.key].tool||ITEMS[i.key].armor)&&condition(i)<100);$('repair').disabled=!stationNear('fire')||!worn||count(player.bag,'wood')<2||count(player.bag,'stone')<1;updateHUD();}
$('sort').onclick=()=>{let a=player.bag.filter(Boolean).sort((a,b)=>a.key.localeCompare(b.key)||b.lvl-a.lvl);player.bag=[...a,...Array(48-a.length).fill(null)];selected=-1;renderBag();};$('merge-all').onclick=()=>{let n=mergeAll(player.bag);notify(n?`تم ${n} دمج`:'تحتاج أداتين من نفس النوع والمستوى');selected=-1;renderBag();};$('deselect').onclick=()=>{selected=-1;renderBag();};$('equip').onclick=()=>{const it=player.bag[selected];if(!it)return;if(ITEMS[it.key].tool){player.equipped=it.id;notify(`جهّزت ${ITEMS[it.key].name} +${it.lvl}`);}else if(ITEMS[it.key].armor)player.armor=it.id;else if(ITEMS[it.key].pet)player.pet=it.id;else if(ITEMS[it.key].potion){player[ITEMS[it.key].potion==='speed'?'speedBuff':'invisible']=ITEMS[it.key].potion==='speed'?25:15;it.n--;if(!it.n)player.bag[selected]=null;useTime=.8;weapon.use('potion');notify('استُخدمت الجرعة');}else if(ITEMS[it.key].heal)heal(selected);save(true);renderBag();};
function renderEquipment(){const host=$('equipment-slots');host.replaceChildren();for(const [label,it] of [['السلاح',equipped()],['الدرع',armor()],['المرافق',petItem()],['العلاج',player.bag.find(i=>i&&ITEMS[i.key].heal)]]){const b=document.createElement('button');b.className='equipment-slot';b.innerHTML='<small>'+label+'</small><b>'+(it?itemArt(it.key):'＋')+'</b><span>'+(it?ITEMS[it.key].name:'فارغ')+'</span>';b.onclick=()=>{if(it){selected=player.bag.indexOf(it);renderBag();}};host.append(b);}}
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
  weapon.rebuild(it,armor());$('stamina-wrap').classList.toggle('active',player.stamina<99||staminaDelay>0);$('stamina-wrap').classList.toggle('exhausted',player.stamina<20);$('gear-status').textContent='السلاح: '+(it?ITEMS[it.key].name:'—')+' · الدرع: '+(armor()?ITEMS[armor().key].name:'—')+' · المرافق: '+(petItem()?ITEMS[petItem().key].name:'—');$('pet-status').textContent=petItem()?ITEMS[petItem().key].name+(petCooldown>0?' · '+Math.ceil(petCooldown)+'ث':' · Q'):'';weapon.group.visible=started;
  const p=PLACES.find(p=>Math.hypot(player.x-p.x,player.z-p.z)<p.r+3);$('zone').textContent=p?`${p.name} · ${p.kind==='camp'?'منطقة آمنة':'مستوى '+p.level}`:regionName(player)+' · البرية';
  if(player.woodGathered<6){$('objective').textContent=`اجمع الخشب ${Math.min(6,player.woodGathered)} / 6`;$('objective-detail').textContent='اقترب من شجرة واضغط F';}else if(player.crafted<1){$('objective').textContent='اصنع أول أداة أو ضمادة';$('objective-detail').textContent='اقترب من طاولة المخيم أو النار واضغط F';}else if(looted.size<2){$('objective').textContent='ابحث عن الأكواخ وانهب صندوقًا';$('objective-detail').textContent='اتبع الطريق شرق الملاذ · F للنهب';}else if(discovered.has('guardian')){$('objective').textContent=world.guardian.dead?'حارس الجذور مهزوم':'تحدّ حارس الجذور · مستوى 10';$('objective-detail').textContent=world.guardian.dead?'احتفظ بالختم للمرحلة التالية':'جهّز درعك وعلاجك؛ راقب ضربة الأرض';}else{$('objective').textContent=`اكتشف الكهوف ${PLACES.filter(p=>p.kind==='cave'&&discovered.has(p.id)).length} / 3`;$('objective-detail').textContent='الخريطة M تتكشف مع كل خطوة';}
  let angle=(((-yaw*180/Math.PI)%360)+360)%360;const dirs=['شمال N','شمال شرق NE','شرق E','جنوب شرق SE','جنوب S','جنوب غرب SW','غرب W','شمال غرب NW'];$('heading').textContent=dirs[Math.round(angle/45)%8];}
function setQuality(q){quality=q;renderer.setPixelRatio(q==='low'?Math.min(devicePixelRatio,.8):q==='high'?Math.min(devicePixelRatio,1.7):Math.min(devicePixelRatio,1.2));renderer.shadowMap.enabled=q!=='low';world.grass.visible=q!=='low';renderer.setSize(innerWidth,innerHeight);}
$('quality').value=settings.quality;$('quality').onchange=e=>{settings.quality=e.target.value;setQuality(e.target.value);saveSettings(localStorage,SAVE+':settings',settings);};setQuality(settings.quality);
for(const key of ['master','sfx','ambient','sensitivity','cameraShake']){const el=$('setting-'+key);el.value=settings[key];el.oninput=()=>{settings[key]=Number(el.value);audio.setMix(settings);saveSettings(localStorage,SAVE+':settings',settings);};}
$('setting-damageNumbers').checked=settings.damageNumbers;$('setting-damageNumbers').onchange=e=>{settings.damageNumbers=e.target.checked;saveSettings(localStorage,SAVE+':settings',settings);};
$('fullscreen').onclick=()=>{const result=document.fullscreenElement?document.exitFullscreen?.():document.documentElement.requestFullscreen?.();result?.catch(()=>notify('الشاشة الكاملة غير متاحة هنا؛ افتح الموقع في المتصفح'));};
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
function updateAnimals(dt){for(const a of world.animals){if(a.dead)continue;let dx=player.x-a.x,dz=player.z-a.z,d=Math.hypot(dx,dz);if(d>85)continue;a.cooldown=Math.max(0,a.cooldown-dt);a.provoked=Math.max(0,(a.provoked||0)-dt);const safe=weapon.stations.some(s=>s.kind==='fire'&&Math.hypot(player.x-s.x,player.z-s.z)<14)||player.invisible>0;const aggressive=a.hostile&&!safe&&(d<(a.guardian?23:a.kind==='bear'?6:a.kind==='spider'?9:14)||a.provoked>0);let speed=0,vx=0,vz=0;
 if(a.poison>0){a.poison-=dt;a.poisonTick=(a.poisonTick||0)+dt;if(a.poisonTick>=1){a.poisonTick=0;hit(a,5);}if(a.dead)continue;}
 if(aggressive){dangerTime=8;if(a.kind==='spider'&&!a.dropped){a.dropHeight=Math.max(0,(a.dropHeight??3)-dt*3);if(a.dropHeight===0)a.dropped=true;}
  vx=dx/Math.max(.1,d);vz=dz/Math.max(.1,d);speed=a.guardian?2.2:a.kind==='bear'?2.5:a.kind==='wolf'?3.7:2.25;
  if(a.kind==='wolf'&&d>2.3&&d<8&&Math.sin(elapsed*.9+a.phase)>.1){const angle=Math.atan2(dz,dx)+1.1;vx=Math.cos(angle);vz=Math.sin(angle);speed=2.8;}
  if(a.archer){speed=d<6?-1.6:d>11?1.8:0;if(d<17&&a.cooldown===0){a.cooldown=2.8;const origin=new T.Vector3(a.x,terrain(a.x,a.z)+1.6,a.z);const dest=new T.Vector3(player.x,terrain(player.x,player.z)+1.3,player.z);const m=new T.Mesh(new T.SphereGeometry(.08,5,4),new T.MeshBasicMaterial({color:'#d8b285'}));m.position.copy(origin);scene.add(m);projectiles.push({m,v:dest.sub(origin).normalize().multiplyScalar(15),gravity:0,life:2,damage:12,hostile:true});audio.sound('wood',.3);}}
  else if(a.guardian){if(a.windup>0){a.windup-=dt;speed=0;a.mesh.rotation.x=-Math.sin(a.windup*3)*.18;if(a.windup<=0){weapon.burst(a.x,.5,a.z,'#c6b68d',35);audio.sound('bear');if(d<6)damage(32);a.cooldown=a.hp<a.maxHp*.5?2.3:3.4;}}else if(d<6&&a.cooldown===0){a.windup=1.1;notify('حارس الجذور يرفع مخالبه · ابتعد أو تفادَ!');}}
  else if(d<1.9&&a.cooldown===0){a.cooldown=1.2;damage((a.kind==='bear'?15:7)+a.level*.8);}if(d<1.25&&!a.archer)speed=0;
 }else if(!a.hostile&&d<9){speed=a.kind==='rabbit'?4.5:4;vx=-dx/Math.max(.1,d);vz=-dz/Math.max(.1,d);}
 else{a.phase+=dt*.35;let tx=a.homeX+Math.sin(a.phase)*3,tz=a.homeZ+Math.cos(a.phase*.7)*3,dd=Math.hypot(tx-a.x,tz-a.z);if(dd>.3){speed=.65;vx=(tx-a.x)/dd;vz=(tz-a.z)/dd;}}
 let nx=a.x+vx*speed*dt,nz=a.z+vz*speed*dt;if(!world.blocked(nx,a.z))a.x=nx;if(!world.blocked(a.x,nz))a.z=nz;a.mesh.position.set(a.x,terrain(a.x,a.z)+(a.kind==='spider'&&!a.dropped?(a.dropHeight??3):0),a.z);if(speed>.1){a.mesh.rotation.y=Math.atan2(vx,vz);a.legs.forEach((l,j)=>l.rotation.x=Math.sin(elapsed*speed*4+j*Math.PI)*.3);}if(dying)break;
 }}

function updateProjectiles(dt){for(let i=projectiles.length-1;i>=0;i--){const p=projectiles[i];p.life-=dt;p.v.y-=p.gravity*dt;let stop=false;const steps=Math.max(1,Math.ceil(p.v.length()*dt/.35));for(let j=0;j<steps&&!stop;j++){p.m.position.addScaledVector(p.v,dt/steps);const q=p.m.position;if(p.hostile&&Math.hypot(q.x-player.x,q.z-player.z)<.65&&Math.abs(q.y-(terrain(player.x,player.z)+1))<1){damage(p.damage);stop=true;}for(const a of world.animals)if(!p.hostile&&!a.dead&&Math.hypot(q.x-a.x,q.z-a.z)<(a.guardian?1.6:.75)&&Math.abs(q.y-(terrain(a.x,a.z)+1))<1.4){hit(a,p.damage);stop=true;break;}if(q.y<terrain(q.x,q.z)||world.blocked(q.x,q.z))stop=true;}if(stop||p.life<=0){scene.remove(p.m);p.m.geometry.dispose();p.m.material.dispose();projectiles.splice(i,1);}}}
let last=performance.now(),frames=0,fpsTime=0;
function frame(now){requestAnimationFrame(frame);if(now-last<1000/(state==='playing'?90:30))return;const dt=Math.min((now-last)/1000,.045);last=now;if(document.hidden)return;elapsed+=dt;noticeTime-=dt;if(noticeTime<=0)$('notice').classList.remove('on');
  if(dying){deathTime-=dt;camera.rotation.z+=dt*.4;camera.position.y-=dt*.45;if(deathTime<=0)respawn();}
  if(state==='playing'&&!dying){
    combat.tick(dt,resolveMelee);attackTime=Math.max(0,attackTime-dt);interactTime=Math.max(0,interactTime-dt);if(mouseHeld&&equipped()?.key==='bow'){charge=Math.min(1,charge+dt*.75);weapon.draw(charge);player.stamina=Math.max(0,player.stamina-dt*3);controller.state.staminaDelay=.65;if(player.stamina<=0){charge=0;mouseHeld=false;weapon.draw(0);}}else if(mouseHeld)attack();
    const motion=controller.tick(player,input.movement(),yaw,dt,world.blocked,(player.speedBuff>0?1.25:1)*(petItem()?.key==='wolfpet'?1.05:1));
    const running=motion.running,len=motion.moved>.001?1:0;dodgeTime=controller.state.dodgeLeft;staminaDelay=controller.state.staminaDelay;jump=motion.jump;bob+=motion.moved*2;
    if(len){footTime-=dt;if(footTime<=0){footTime=running?.3:.5;audio.sound('step',running?.45:.25);}}
    petCooldown=Math.max(0,petCooldown-dt);dangerTime=Math.max(0,dangerTime-dt);player.speedBuff=Math.max(0,(player.speedBuff||0)-dt);player.invisible=Math.max(0,(player.invisible||0)-dt);useTime=Math.max(0,useTime-dt);shake=Math.max(0,shake-dt);lowBreath-=dt;if(player.stamina<20&&lowBreath<=0){audio.sound('breath');lowBreath=2;}if(reloadTime>0){reloadTime-=dt;if(reloadTime<=0){loaded=true;audio.sound('stone');notify('جاهز للإطلاق');}}if(petItem()?.key==='dollpet'&&dangerTime<=0)player.hp=Math.min(100,player.hp+dt*1.5);
    const pose=cameraRig.tick(player,terrain(player.x,player.z),yaw,pitch,motion,dt,elapsed,shake,settings.cameraShake);
    camera.position.set(pose.x,pose.y,pose.z);camera.rotation.set(pose.pitch,pose.yaw,pose.roll,'YXZ');if(Math.abs(camera.fov-pose.fov)>.01){camera.fov=pose.fov;camera.updateProjectionMatrix();}
    weapon.group.rotation.z=0;weapon.group.rotation.x=0;weapon.group.position.y=-.13+(len?Math.sin(bob)*.025:Math.sin(elapsed*1.7)*.008)+Math.sin(useTime*4)*.2;weapon.group.position.z=-.35+Math.sin(attackTime*8)*.07;weapon.group.rotation.x+=reloadTime>0?.6:0;weapon.pet(petItem()?.key||'',{x:player.x,z:player.z,yaw},elapsed);updateProjectiles(dt);audio.update(dt,world.animals.some(a=>a.hostile&&!a.dead&&Math.hypot(a.x-player.x,a.z-player.z)<22),weather);
    world.sun.position.set(player.x-65,100,player.z-45);world.sun.target.position.set(player.x,0,player.z);
    updateAnimals(dt);if(Math.hypot(player.x,player.z-30)<13)player.hp=Math.min(100,player.hp+dt*1.7);
    mapTime+=dt;if(mapTime>.6){mapTime=0;reveal(explored,player.x,player.z);for(const p of PLACES){if(!discovered.has(p.id)&&Math.hypot(player.x-p.x,player.z-p.z)<p.r+8){discovered.add(p.id);xp(25);notify(`اكتشفت ${p.name} · +25 خبرة`);$('discovery').textContent=p.name;$('discovery').classList.remove('show');void $('discovery').offsetWidth;$('discovery').classList.add('show');audio.sound('rare',.6);}}if(Math.abs(player.x)>LIMIT-5||Math.abs(player.z)>LIMIT-5)notify('المنطقة التالية مغلقة حاليًا؛ نطوّر الغابة الأولى الآن');}
    uiTime+=dt;if(uiTime>.15){uiTime=0;updateHUD();target=chooseTarget();$('target').hidden=!target;if(target)$('target').textContent=target.label;const enemy=target?.type==='animal'?target.obj:null;$('enemy-health').hidden=!enemy;if(enemy){$('enemy-name').textContent=enemy.guardian?'حارس الجذور':animalName(enemy.kind);$('enemy-hp').max=enemy.maxHp;$('enemy-hp').value=Math.max(0,enemy.hp);}}
    saveTime+=dt;if(saveTime>25){saveTime=0;save(true);}
  }
  art.update(state==='playing'?dt:0,elapsed,player);scenery.update(dt,elapsed);weather=weapon.update(dt,elapsed,player);$('clock').textContent=weather;for(const o of [...drops,...graves]){if(o.mesh){o.mesh.rotation.y=elapsed*.7;o.mesh.position.y=terrain(o.x,o.z)+.6+Math.sin(elapsed*2)*.1;}}
  world.fires.forEach((f,i)=>{f.scale.y=1.35+Math.sin(elapsed*9+i)*.18;f.rotation.y=elapsed*.7;});world.water.material.opacity=.74+Math.sin(elapsed*.7)*.035;
  if(state==='welcome'){camera.position.set(17+Math.sin(elapsed*.07)*2,10.5,53);camera.lookAt(0,2,17);}
  activation.update(dt,state==='welcome'?{x:camera.position.x,z:camera.position.z}:player);renderer.render(scene,camera);frames++;fpsTime+=dt;if(fpsTime>=2){if(new URLSearchParams(location.search).has('qa'))$('perf').title='draw calls: '+renderer.info?.render.calls+' · triangles: '+renderer.info?.render.triangles+' · geometries: '+renderer.info?.memory.geometries;$('perf').textContent=`${Math.round(frames/fpsTime)} FPS · ${quality==='low'?'خفيفة':quality==='high'?'عالية':'متوازنة'}`;frames=0;fpsTime=0;}
}
requestAnimationFrame(frame);
