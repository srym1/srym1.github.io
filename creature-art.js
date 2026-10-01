import * as T from './three.module.js';
import {enemyPose} from './enemy-motion.js';

// One atlas, shared surfaces, and jointed silhouettes; no per-frame geometry allocation.
const round=new T.SphereGeometry(1,18,12);round.userData.shared=true;
const materials=new Map(),maps=[];
let atlas;
function material(color,tile){
 const key=color+tile;if(materials.has(key))return materials.get(key);
 const m=new T.MeshStandardMaterial({color,roughness:.92,emissive:tile===undefined?'#000000':'#53615b',emissiveIntensity:tile===undefined?0:.14});
 if(tile!==undefined&&typeof Image!=='undefined'&&document.createElementNS){
  if(!atlas)atlas=new T.TextureLoader().load('./creature-materials-v1.png',()=>maps.forEach(x=>x.needsUpdate=true));
  const map=atlas.clone();map.colorSpace=T.SRGBColorSpace;map.repeat.set(.48,.48);map.offset.set(tile%2*.5+.01,tile<2?.51:.01);maps.push(map);m.map=map;m.bumpMap=map;m.bumpScale=tile===2?.025:.012;
 }
 materials.set(key,m);return m;
}
function shape(g,geo,m,p=[0,0,0],s=[1,1,1]){const o=new T.Mesh(geo,m);o.position.fromArray(p);o.scale.fromArray(s);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
function oval(g,m,p,s){return shape(g,round,m,p,s);}
function group(g,p){const o=new T.Group();o.position.fromArray(p);g.add(o);return o;}
function link(g,m,a,b,r1,r2=r1){const v=new T.Vector3(...a),w=new T.Vector3(...b),d=w.clone().sub(v);const o=shape(g,new T.CylinderGeometry(r2,r1,d.length(),10),m,v.clone().add(w).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;}
function tube(g,m,points,r){return shape(g,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),14,r,7,false),m);}
// Rings along Z, closed tips, smooth normals and stable atlas UVs.
function loft(g,m,rings){const p=[],uv=[],indices=[],n=20;for(let i=0;i<rings.length;i++){const [z,y,rx,ry]=rings[i];for(let j=0;j<=n;j++){const a=j/n*Math.PI*2;p.push(Math.cos(a)*rx,y+Math.sin(a)*ry,z);uv.push(j/n,i/(rings.length-1));}}for(let i=0;i<rings.length-1;i++)for(let j=0;j<n;j++){const a=i*(n+1)+j,b=a+n+1;indices.push(a,a+1,b,b,a+1,b+1);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();return shape(g,geo,m);}
function ear(g,m,inner,p,s){const e=group(g,p);const v=[-.11,0,0,.11,0,0,0,.34,-.05,0,.08,-.09];const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setIndex([0,1,2,0,2,3,2,1,3,0,3,1]);geo.computeVertexNormals();shape(e,geo,m);oval(e,inner,[0,.12,.015],[.059,.11,.016]);e.rotation.z=s*.25;return e;}
function eyes(head,spacing,y,z,color){const socket=material('#211e1b'),iris=material(color);const lids=[];for(const s of [-1,1]){oval(head,socket,[s*spacing,y,z],[.052,.03,.031]);oval(head,iris,[s*spacing,y,z+.023],[.025,.019,.012]);oval(head,material('#0f1616'),[s*spacing,y,z+.033],[.009,.017,.008]);oval(head,material('#eee5c7'),[s*spacing-.007,y+.007,z+.04],[.006,.006,.004]);lids.push(oval(head,socket,[s*spacing,y+.038,z+.004],[.058,.009,.037]));}return lids;}
function jointLeg(g,m,p,upper,lower,thick,hoof,rear=false){const hip=group(g,p);oval(hip,m,[0,-upper*.2,0],[thick*1.3,upper*.36,thick*1.3]);link(hip,m,[0,0,0],[0,-upper,rear?.12:-.04],thick,thick*.66);const knee=group(hip,[0,-upper,rear?.12:-.04]);oval(knee,m,[0,0,0],[thick*.8,thick*.9,thick*.8]);link(knee,m,[0,0,0],[0,-lower,rear?-.13:.04],thick*.65,thick*.39);const foot=group(knee,[0,-lower,rear?-.13:.04]);oval(foot,hoof,[0,-.025,.075],[thick*.91,.075,thick*1.6]);return {hip,knee,foot,upper,lower,rear};}

export function buildHeroCreature(a){if(!['wolf','deer','mutant'].includes(a.kind))return false;
 const g=a.mesh;if(a.artRig?.hero)g.traverse(o=>{if(o.geometry&&!o.geometry.userData.shared)o.geometry.dispose();});g.clear();a.legs=[];
 const r=a.artRig={hero:true,lastX:a.x,lastZ:a.z,stride:0,clock:0,joints:[],ears:[],death:0};
 const deer=a.kind==='deer',mutant=a.kind==='mutant';const fur=material(deer?'#dfc0a0':'#c6cdd2',deer?1:0),cream=material('#d4ceba',deer?1:0),dark=material('#303033');
 r.upper=group(g,[0,0,0]);
 if(!mutant){
  const h=deer?1.27:1.02;
  loft(r.upper,fur,[[-.94,h,.001,.001],[-.76,h,.22,.28],[-.4,h,.32,.36],[.02,h,.29,.32],[.38,h+.035,.34,.46],[.64,h+.09,.24,.36],[.76,h+.17,.001,.001]]);
  oval(r.upper,cream,[0,h-.24,.23],[.2,.16,.38]);
  if(deer){const neck=oval(r.upper,fur,[0,1.63,.59],[.18,.57,.2]);neck.rotation.x=.3;oval(r.upper,cream,[0,1.61,.75],[.11,.43,.064]);}
  else{oval(r.upper,fur,[0,1.4,.48],[.29,.38,.3]);for(const s of [-1,1])for(let j=0;j<5;j++){const tuft=oval(r.upper,j%2?fur:cream,[s*(.19+j*.018),1.42-j*.095,.45-j*.06],[.075,.15,.15]);tuft.rotation.z=s*.42;}}
  r.head=group(r.upper,[0,deer?2.03:1.49,deer?.72:.79]);
  loft(r.head,fur,[[-.25,.03,.001,.001],[-.13,.04,.18,.22],[.12,.02,.2,.21],[.24,-.04,.125,.115],[.54,-.1,.072,.068],[.58,-.1,.001,.001]]);
  loft(r.head,cream,[[.17,-.11,.001,.001],[.23,-.13,.105,.045],[.5,-.145,.069,.04],[.54,-.145,.001,.001]]);
  oval(r.head,dark,[0,-.08,.56],[.079,.053,.039]);
  r.jaw=group(r.head,[0,-.13,.17]);oval(r.jaw,cream,[0,-.043,.15],[.105,.04,.23]);
  if(!deer)for(const s of [-1,1]){shape(r.jaw,new T.ConeGeometry(.019,.065,7),material('#d4c9a8'),[s*.077,.002,.22]);shape(r.head,new T.ConeGeometry(.018,.07,7),material('#d4c9a8'),[s*.085,-.13,.35]).rotation.z=Math.PI;}
  r.lids=eyes(r.head,.155,.06,.194,deer?'#5d4329':'#c99b55');
  for(const s of [-1,1]){if(deer){const e=group(r.head,[s*.18,.14,-.075]);const o=oval(e,fur,[s*.13,.07,0],[.23,.10,.075]);o.rotation.z=s*.32;oval(e,cream,[s*.13,.075,.058],[.17,.054,.02]);r.ears.push(e);}else r.ears.push(ear(r.head,fur,dark,[s*.16,.19,-.12],s));}
  if(deer)for(const s of [-1,1]){const horn=material('#c4b59a');tube(r.head,horn,[[s*.09,.19,-.13],[s*.19,.47,-.21],[s*.38,.73,-.27],[s*.52,1,-.28]],.026);for(let j=0;j<3;j++)tube(r.head,horn,[[s*(.17+j*.12),.43+j*.17,-.2-j*.025],[s*(.2+j*.16),.66+j*.19,-.08],[s*(.23+j*.18),.78+j*.2,-.04]],.017);}
  for(const s of [-1,1])for(const rear of [false,true]){const j=jointLeg(g,fur,[s*(deer?.235:.26),deer?1.14:.89,rear?-.59:.45],deer?.52:.36,deer?.54:.45,deer?.065:.10,dark,rear);r.joints.push(j);a.legs.push(j.hip);if(deer)link(j.foot,material('#817365'),[0,-.072,.16],[0,-.072,.06],.008);else for(let k=-1;k<=1;k++)oval(j.foot,material('#b7aca0'),[k*.04,-.035,.22],[.011,.018,.026]);}
  r.tail=group(r.upper,[0,h-.025,-.79]);const tail=oval(r.tail,deer?cream:fur,[0,-.19,-.27],[deer?.07:.135,deer?.16:.19,deer?.15:.38]);tail.rotation.x=-.45;
 }else{
  const bark=material('#e2d9c6',2),wood=material('#b6aa95',2),cloth=material('#c5cbc1',3),root=material('#c0b290',2);
  oval(r.upper,cloth,[0,1.19,-.09],[.3,.48,.23]);const chest=oval(r.upper,bark,[0,1.51,-.08],[.42,.42,.28]);chest.rotation.x=.22;
  oval(r.upper,wood,[-.08,1.77,-.28],[.37,.3,.28]);
  for(const s of [-1,1])for(let j=0;j<5;j++){const rib=oval(r.upper,j%2?wood:bark,[s*(.18+j*.027),1.72-j*.14,.17],[.095,.18,.065]);rib.rotation.z=-s*.36;}
  for(let j=0;j<7;j++){const t=j/7*Math.PI*2;const flap=shape(r.upper,new T.ConeGeometry(.12,.49,4),cloth,[Math.cos(t)*.24,.72,Math.sin(t)*.19],[1,1,.32]);flap.rotation.z=Math.PI+(j%2?.12:-.1);}
  r.head=group(r.upper,[.045,1.96,.18]);oval(r.head,wood,[0,.13,-.07],[.205,.3,.18]);
  // The mask sits in front of the skull. Eye slits remain readable at gameplay distance.
  const mask=oval(r.head,bark,[0,.06,.105],[.19,.265,.065]);mask.rotation.z=-.08;
  r.lids=eyes(r.head,.085,.13,.164,'#b6cbb0');
  link(r.head,wood,[-.14,.2,.175],[-.015,.18,.19],.033,.02);link(r.head,wood,[.025,.18,.19],[.14,.2,.175],.02,.033);
  for(const s of [-1,1]){tube(r.head,root,[[s*.13,.29,-.07],[s*.18,.47,-.16],[s*.25,.64,-.23]],.028);tube(r.head,wood,[[s*.06,-.02,.168],[s*.045,-.13,.17],[s*.1,-.22,.11]],.012);}
  r.jaw=group(r.head,[0,-.1,.1]);oval(r.jaw,wood,[0,-.075,.016],[.12,.08,.05]);
  r.arms=[];
  for(const s of [-1,1]){
   const leg=jointLeg(g,cloth,[s*.20,.96,-.03],.43,.43,.115,wood,s===1);r.joints.push(leg);a.legs.push(leg.hip);
   const arm=group(r.upper,[s*.42,1.63,-.07]);oval(arm,bark,[s*.04,-.025,-.005],[s===-1?.25:.18,.24,.20]);link(arm,bark,[0,-.05,0],[s*.09,-.4,.04],.135,.085);
   const elbow=group(arm,[s*.09,-.4,.04]);link(elbow,wood,[0,0,0],[0,-.43,.11],.085,.067);const hand=group(elbow,[0,-.45,.11]);oval(hand,bark,[0,-.055,0],[.10,.14,.07]);
   for(let k=0;k<4;k++)tube(hand,root,[[(k-1.5)*.043,-.11,.018],[(k-1.5)*.056,-.22,.033],[(k-1.5)*.042,-.27,.095]],.014);
   r.arms.push({arm,elbow,hand});a.legs.push(arm);
   for(let j=0;j<3;j++)tube(r.upper,root,[[s*.35,1.78,-.1],[s*(.4+j*.045),1.94+j*.05,-.2],[s*(.48+j*.03),2.02+j*.07,-.24]],.023);
  }
  tube(r.upper,root,[[-.33,1.74,.2],[-.1,1.4,.27],[.25,1.13,.16]],.032);
  if(a.archer){tube(g,root,[[.62,.6,.22],[.83,1.2,.24],[.63,1.8,.22]],.033);link(g,material('#c7ba98'),[.62,.6,.22],[.63,1.8,.22],.007);}
 }
 a.artHead=r.head;return true;
}

export function animateHeroCreature(a,dt){const r=a.artRig;if(!r?.hero)return false;if(dt<=0)return true;r.clock+=dt;const t=r.clock+(a.phase||0);
 if(a.dead){r.death=Math.min(1,r.death+dt*1.8);const q=1-(1-r.death)**3;a.mesh.rotation.z=q*1.47;a.mesh.rotation.x=-q*.15;r.head.rotation.x=q*.22;return true;}
 r.death=0;const distance=Math.hypot(a.x-r.lastX,a.z-r.lastZ),speed=distance/dt;r.lastX=a.x;r.lastZ=a.z;r.stride+=distance*(a.kind==='deer'?4.9:5.7);
 const pose=enemyPose(a),mix=1-Math.exp(-dt*14),moving=speed>.1,fast=speed>2.5;
 const amplitude=moving?(fast?.52:.29):0;
 r.joints.forEach((j,i)=>{const phase=r.stride+(i===0||i===3?0:Math.PI);let angle=Math.sin(phase)*amplitude;if(a.kind==='mutant')angle=Math.sin(r.stride+(i?Math.PI:0))*amplitude*.75;
  j.hip.rotation.x=T.MathUtils.lerp(j.hip.rotation.x,angle,mix);j.knee.rotation.x=T.MathUtils.lerp(j.knee.rotation.x,moving?Math.max(0,-Math.cos(phase))*.52:0,mix);j.foot.rotation.x=-j.hip.rotation.x-j.knee.rotation.x;
 });
 r.upper.position.y=Math.sin(t*1.8)*.008+(moving?Math.abs(Math.sin(r.stride))* (a.kind==='deer'&&fast?.075:.018):0);
 r.upper.rotation.x=T.MathUtils.lerp(r.upper.rotation.x,pose.pitch,mix);r.upper.rotation.z=T.MathUtils.lerp(r.upper.rotation.z,pose.roll+(moving?Math.sin(r.stride)*.017:0),mix);
 a.hitReaction=Math.max(0,(a.hitReaction||0)-dt*2);
 r.head.rotation.x=pose.head-(a.hitReaction||0)+Math.sin(t*1.3)*.025;r.head.rotation.y=moving?0:Math.sin(t*.45)*.14;r.head.rotation.z=(a.kind==='mutant'?-.09:0)+pose.hurt*.16;
 r.jaw.rotation.x=a.kind==='deer'?0:(pose.ready*.28+pose.strike*.35+Math.max(0,Math.sin(t*.7))*.025);
 const blink=Math.max(0,1-Math.abs((t%5.3)-4.7)/.11);r.lids.forEach(l=>{l.scale.y=.009*(1+blink*3.8);});
 r.ears.forEach((e,i)=>{e.rotation.x=Math.sin(t*1.4+i*3)*.055+pose.ready*.18;e.rotation.y=Math.max(0,Math.sin(t*.8+i*2))*.16;});
 if(r.tail)r.tail.rotation.y=Math.sin(t*2)*.12;
 r.arms?.forEach(({arm,elbow,hand},i)=>{arm.rotation.x=T.MathUtils.lerp(arm.rotation.x,-pose.arm*(i?1:.65)+(moving?Math.sin(r.stride+(i?0:Math.PI))*.18:0),mix);elbow.rotation.x=T.MathUtils.lerp(elbow.rotation.x,-pose.ready*.3+pose.strike*.45,mix);hand.rotation.z=(i?1:-1)*(.12+pose.ready*.18);});
 return true;
}
