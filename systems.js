export const ITEMS = {
  wood:{name:'خشب',icon:'🪵',stack:99,desc:'مادة أساسية لصنع الأدوات والمعدات.'},
  stone:{name:'حجر',icon:'◆',stack:99,desc:'حجر صلب لصناعة نصل الفأس.'},
  fiber:{name:'ألياف',icon:'🌿',stack:99,desc:'ألياف نباتية لصناعة الضمادات والحبال.'},
  ore:{name:'خام حديد',icon:'⛏',stack:99,desc:'معدن يوجد في الكهوف، لصناعة فأس أقوى.'},
  hide:{name:'جلد',icon:'◇',stack:99,desc:'غنيمة من حيوانات الغابة.'},
  meat:{name:'لحم مشوي',icon:'🍖',stack:20,heal:18,desc:'يعيد 18 نقطة صحة.'},
  berry:{name:'توت',icon:'🫐',stack:20,heal:8,desc:'يعيد 8 نقاط صحة.'},
  bandage:{name:'ضمادة',icon:'✚',stack:20,heal:40,desc:'تعيد 40 نقطة صحة.'},
  axe:{name:'فأس حجري',icon:'🪓',stack:1,tool:true,damage:18,desc:'للقتال وجمع الخشب. ادمج فأسين من نفس المستوى لترقية الضرر.'},
  spear:{name:'رمح خشبي',icon:'↟',stack:1,tool:true,damage:25,desc:'مدى أطول للقتال. يمكن دمجه حتى المستوى 5.'},
  ironaxe:{name:'فأس حديدي',icon:'⚒',stack:1,tool:true,damage:36,desc:'فأس قوي. ادمج نسختين متطابقتين لزيادة قوته.'}
};
export const RECIPES=[
  {key:'axe',cost:{wood:5,stone:3}},
  {key:'spear',cost:{wood:7,stone:2,fiber:2}},
  {key:'bandage',cost:{fiber:4}},
  {key:'ironaxe',cost:{wood:8,ore:6,hide:2}}
];
Object.assign(ITEMS,{
  coal:{name:'فحم',icon:'⬟',stack:99,desc:'فحم من عروق الكهوف، للرصاص والنار.'},copper:{name:'نحاس',icon:'⬢',stack:99,desc:'نحاس أحمر للأسلحة البدائية.'},scrap:{name:'خردة',icon:'⚙',stack:99,desc:'قطع معدنية قديمة من الصناديق.'},
  rawmeat:{name:'لحم نيئ',icon:'♧',stack:20,desc:'اطبخه عند نار المخيم.'},arrow:{name:'سهام',icon:'↗',stack:99,desc:'ذخيرة القوس.'},bullet:{name:'رصاص بدائي',icon:'•',stack:99,desc:'ذخيرة المسدس الخشبي الصدئ.'},
  sword:{name:'سيف الجذور',icon:'†',stack:1,tool:true,damage:23,desc:'سيف خشبي بدائي. نقرة للضربة الخفيفة، الزر الأيمن للثقيلة. يتغير شكله مع الدمج.'},
  bow:{name:'قوس السرو',icon:'⌒',stack:1,tool:true,ranged:true,damage:32,desc:'اضغط مطولًا لشد الوتر، ثم اتركه لإطلاق السهم. يحتاج سهامًا.'},
  pistol:{name:'مسدس الخردة',icon:'⌐',stack:1,tool:true,ranged:true,damage:54,desc:'خشب وحبال ومعدن صدئ. طلقة واحدة؛ R لإعادة التلقيم.'},
  woodarmor:{name:'درع اللحاء',icon:'▣',stack:1,armor:true,defense:.12,desc:'درع خشبي. يتطور إلى جلد وخشب مقوّى مع كل دمج.'},
  stonearmor:{name:'درع الصوّان',icon:'⬡',stack:1,armor:true,defense:.24,desc:'صفائح حجرية ثقيلة. تقلل الضرر وتُرى على الذراعين.'},
  healpotion:{name:'جرعة الحياة',icon:'♜',stack:10,heal:75,rarity:'uncommon',desc:'تستعيد 75 صحة. غنيمة قليلة الظهور.'},
  speedpotion:{name:'جرعة الخطوة',icon:'♜',stack:10,potion:'speed',rarity:'rare',desc:'سرعة إضافية 25% لمدة 25 ثانية.'},
  invisibility:{name:'جرعة الظل',icon:'♜',stack:10,potion:'invisible',rarity:'epic',desc:'تخفيك عن الأعداء 15 ثانية. الهجوم يلغي الاختفاء. فرصة ظهور 1% في الصندوق.'},
  snakepet:{name:'أفعى الندى',icon:'∿',stack:1,pet:'snake',rarity:'mythic',desc:'مرافق نادر للغاية. Q ينفث السم، والعناكب لا تتأثر به.'},
  wolfpet:{name:'ذئب الرفقة',icon:'♞',stack:1,pet:'wolf',rarity:'mythic',desc:'ذئب ظاهر يتبعك؛ يزيد سرعتك 5%.'},
  dollpet:{name:'دمية الجذور',icon:'♟',stack:1,pet:'doll',rarity:'mythic',desc:'رفيق خشبي يعالجك تدريجيًا بعد 8 ثوانٍ بعيدًا عن الخطر.'},
  guardianseal:{name:'ختم حارس الجذور',icon:'✺',stack:1,rarity:'epic',desc:'علامة إكمال تحدي قلب الغابة. محفوظة كتذكار للمنطقة التالية.'}
});
RECIPES.splice(0,RECIPES.length,
 {key:'sword',station:'bench',cost:{wood:5,stone:2,fiber:2}},
 {key:'bow',station:'bench',cost:{wood:7,fiber:5}},
 {key:'pistol',station:'bench',cost:{wood:6,ore:5,copper:3,scrap:4}},
 {key:'woodarmor',station:'bench',cost:{wood:8,hide:3,fiber:3}},
 {key:'stonearmor',station:'bench',cost:{stone:12,hide:4,ore:3}},
 {key:'arrow',n:6,station:'bench',cost:{wood:2,stone:1,fiber:1}},
 {key:'bullet',n:3,station:'bench',cost:{ore:2,coal:1,scrap:1}},
 {key:'bandage',station:'fire',cost:{fiber:4}},
 {key:'meat',station:'fire',cost:{rawmeat:1}},
 {key:'axe',station:'bench',cost:{wood:5,stone:3}}
);
export const RARITIES={common:{name:'عادي',symbol:'·',color:'#bcb79d'},uncommon:{name:'غير شائع',symbol:'◇',color:'#90bd87'},rare:{name:'نادر',symbol:'✧',color:'#85c1da'},epic:{name:'ملحمي',symbol:'✦',color:'#c7a0e8'},mythic:{name:'استثنائي',symbol:'✺',color:'#efd185'}};
export const PET_CHANCE=1/10000;
export function rarity(it){return ITEMS[it.key]?.rarity||(it.lvl>=5?'epic':it.lvl>=3?'rare':it.lvl>=2?'uncommon':'common');}
export function canMerge(a,b){return !!(a&&b&&a!==b&&a.key===b.key&&a.lvl===b.lvl&&a.lvl<5&&(ITEMS[a.key].tool||ITEMS[a.key].armor));}
export function chestLoot(level,playerLevel,random=Math.random){
 const loot=[['scrap',2+Math.floor(random()*4),1],['wood',3+Math.floor(random()*5),1]];
 const tier=Math.min(4,1+Math.floor(random()*Math.max(1,(level+playerLevel)/4)));
 if(random()<.65){const pool=['sword','bow','woodarmor',...(level>=5?['pistol','stonearmor']:[])];loot.push([pool[Math.floor(random()*pool.length)],1,tier]);}
 if(random()<.18)loot.push(['healpotion',1,1]);if(random()<.05)loot.push(['speedpotion',1,1]);if(random()<.01)loot.push(['invisibility',1,1]);
 loot.push([level>=5?'ore':'stone',2+Math.floor(random()*4),1]);return loot;
}
export function rollPet(random=Math.random){return random()<PET_CHANCE?['snakepet','wolfpet','dollpet'][Math.floor(random()*3)]:null;}
export function spendStamina(p,n){if(p.stamina<n)return false;p.stamina-=n;return true;}
export function splitDeathResources(bag){const lost=[];for(const i of bag){if(!i||ITEMS[i.key].tool||ITEMS[i.key].armor||ITEMS[i.key].pet||ITEMS[i.key].heal||ITEMS[i.key].potion||i.key==='guardianseal')continue;const n=Math.floor(i.n*.3);if(n){lost.push({...i,n});i.n-=n;}}return lost;}
let serial=0;
export function item(key,n=1,lvl=1){return {id:`${Date.now().toString(36)}-${++serial}`,key,n,lvl};}
export function newBag(){const b=Array(48).fill(null);b[0]=item('sword');b[1]=item('axe');b[2]=item('bandage',2);return b;}
export function count(bag,key){return bag.reduce((n,i)=>n+(i?.key===key?i.n:0),0);}
export function add(bag,key,n=1,lvl=1){
  if(!ITEMS[key]||!Number.isInteger(n)||n<1)return false;
  const stack=ITEMS[key].stack;
  const capacity=bag.reduce((c,i)=>c+(!i?stack:i.key===key&&i.lvl===lvl?stack-i.n:0),0);
  if(capacity<n)return false;
  for(const i of bag)if(i&&i.key===key&&i.lvl===lvl&&i.n<stack){const k=Math.min(n,stack-i.n);i.n+=k;n-=k;if(!n)return true;}
  for(let j=0;j<bag.length;j++)if(!bag[j]){const k=Math.min(n,stack);bag[j]=item(key,k,lvl);n-=k;if(!n)return true;}
  return false;
}
export function consume(bag,key,n){if(count(bag,key)<n)return false;for(let j=0;j<bag.length&&n;j++)if(bag[j]?.key===key){let k=Math.min(n,bag[j].n);bag[j].n-=k;n-=k;if(!bag[j].n)bag[j]=null;}return true;}
export function move(bag,a,b){
  if(a===b||!bag[a]||a<0||b<0||a>=48||b>=48)return 'none';
  const x=bag[a],y=bag[b];
  if(y&&x.key===y.key&&x.lvl===y.lvl){
    if(canMerge(x,y)){y.lvl++;y.durability=100;bag[a]=null;return 'merge';}
    if(!ITEMS[x.key].tool&&y.n<ITEMS[y.key].stack){let k=Math.min(x.n,ITEMS[y.key].stack-y.n);y.n+=k;x.n-=k;if(!x.n)bag[a]=null;return 'stack';}
  }
  [bag[a],bag[b]]=[bag[b],bag[a]];return 'move';
}
export function mergeAll(bag){let total=0,again=true;while(again){again=false;outer:for(let i=0;i<48;i++)for(let j=i+1;j<48;j++){if(canMerge(bag[i],bag[j])){move(bag,i,j);total++;again=true;break outer;}}}return total;}
export function craft(bag,recipe){
  if(!recipe||Object.entries(recipe.cost).some(([k,n])=>count(bag,k)<n))return false;
  const next=bag.map(i=>i?{...i}:null);
  for(const [k,n] of Object.entries(recipe.cost))consume(next,k,n);
  if(!add(next,recipe.key,recipe.n||1))return false;
  bag.splice(0,bag.length,...next);return true;
}
export const PLACES=[
  {id:'camp',name:'ملاذ الجذور',x:0,z:30,r:15,level:1,kind:'camp'},
  {id:'village',name:'قرية السرو',x:58,z:4,r:21,level:3,kind:'village'},
  {id:'cabin',name:'كوخ الحطّاب',x:-30,z:-57,r:12,level:2,kind:'cabin'},
  {id:'cave1',name:'كهف الندى',x:-88,z:-64,r:16,level:5,kind:'cave'},
  {id:'cave2',name:'كهف العروق',x:94,z:-79,r:16,level:7,kind:'cave'},
  {id:'cave3',name:'كهف الجذور',x:-100,z:80,r:16,level:10,kind:'cave'},
  {id:'camp2',name:'أطلال المخيم القديم',x:108,z:45,r:12,level:4,kind:'camp'},
  {id:'giant',name:'شجرة الذاكرة',x:-48,z:18,r:14,level:3,kind:'tree'},
  {id:'lake',name:'بحيرة المرآة',x:10,z:-115,r:22,level:6,kind:'lake'},
  {id:'tower',name:'مرصد الغربان',x:118,z:-20,r:14,level:7,kind:'tower'},
  {id:'ruins',name:'قرية الرماد',x:-140,z:-125,r:17,level:8,kind:'ruins'},
  {id:'bridge',name:'الجسر المنكسر',x:-55,z:72,r:14,level:5,kind:'bridge'},
  {id:'guardian',name:'وادي الصنوبر الأسود',x:153,z:-145,r:28,level:10,kind:'guardian'},
];
export function seeded(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export const LIMIT=210,MAP_LIMIT=270;
export function terrain(x,z){
  let h=Math.sin(x*.034)*1.4+Math.cos(z*.041)*1.1+Math.sin((x+z)*.057)*.45;
  for(const p of PLACES){const d=Math.hypot(x-p.x,z-p.z),f=Math.max(0,Math.min(1,(d-p.r)/(9)));h*=f;}
  return h;
}
export function reveal(set,x,z){let n=0;const cell=10;for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++){if(a*a+b*b>6)continue;const k=`${Math.floor(x/cell)+a},${Math.floor(z/cell)+b}`;if(!set.has(k)){set.add(k);n++;}}return n;}
export function validSave(v){return v&&v.version===1&&Number.isFinite(v.x)&&Number.isFinite(v.z)&&Math.abs(v.x)<=LIMIT&&Math.abs(v.z)<=LIMIT&&Number.isFinite(v.hp)&&Number.isInteger(v.level)&&v.level>=1&&v.level<=10&&Number.isFinite(v.xp)&&v.xp>=0&&Array.isArray(v.bag)&&v.bag.length===48&&v.bag.every(i=>!i||(ITEMS[i.key]&&typeof i.id==='string'&&Number.isInteger(i.n)&&i.n>0&&i.n<=ITEMS[i.key].stack&&Number.isInteger(i.lvl)&&i.lvl>=1&&i.lvl<=5))&&Array.isArray(v.explored)&&Array.isArray(v.looted)&&Array.isArray(v.discovered);}
