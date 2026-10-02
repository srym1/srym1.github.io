import * as T from './three.module.js';
export const POTIONS=Object.freeze({
 healpotion:{name:'جرعة الحياة',symbol:'✚',color:'#c98162',duration:0,heal:75},
 speedpotion:{name:'جرعة الخطوة',symbol:'»',color:'#b6cf94',duration:25,field:'speedBuff'},
 invisibility:{name:'جرعة الظل',symbol:'◐',color:'#b1a5d2',duration:15,field:'invisible'}
});
export const DRINK_TIME=1.2;
export function usePotion(player,index,busy=false){
 const it=player.bag[index],spec=POTIONS[it?.key];
 if(!spec||it.n<1)return {ok:false,message:'اختر جرعة من الشنطة'};
 if(busy)return {ok:false,message:'أكمل الحركة الحالية أولًا'};
 if(spec.heal&&player.hp>=100)return {ok:false,message:'صحتك كاملة · احتفظ بالجرعة'};
 if(spec.field&&player[spec.field]>0)return {ok:false,message:'تأثير الجرعة ما زال نشطًا'};
 const restored=spec.heal?Math.min(spec.heal,100-player.hp):0;
 if(spec.heal)player.hp=Math.min(100,player.hp+spec.heal);
 if(spec.field)player[spec.field]=spec.duration;
 it.n--;if(it.n===0)player.bag[index]=null;
 return {ok:true,key:it.key,spec,restored,message:spec.heal?`استعدت ${restored} صحة`:spec.name+' · '+spec.duration+' ثانية'};
}
export function potionStatuses(player){return Object.entries(POTIONS).filter(([,s])=>s.field&&player[s.field]>0).map(([key,s])=>({...s,key,left:Math.max(0,player[s.field]),ratio:Math.min(1,player[s.field]/s.duration)}));}
export function drinkPose(progress){const q=Math.max(0,Math.min(1,progress)),ease=n=>n*n*(3-2*n);const lift=q<.3?ease(q/.3):q>.72?1-ease((q-.72)/.28):1;return {lift,tilt:lift*.85,sip:q>=.3&&q<=.72,uncork:q>.13&&q<.77};}
// Small hand-crafted flask: thick glass, coloured infusion, leather harness and cork.
export function buildPotionBottle(key='healpotion'){
 const s=POTIONS[key]||POTIONS.healpotion,g=new T.Group();g.name='forest-flask';g.userData.key=key;
 const add=(geo,mat,pos=[0,0,0])=>{const m=new T.Mesh(geo,mat);m.position.set(...pos);g.add(m);return m;};
 const glass=new T.MeshStandardMaterial({color:'#b5c5b0',transparent:true,opacity:.28,roughness:.22,metalness:.08,depthWrite:false});
 const points=[[.055,0],[.115,.025],[.14,.08],[.135,.23],[.09,.29],[.055,.32],[.055,.4],[.075,.405]].map(([x,y])=>new T.Vector2(x,y));
 add(new T.LatheGeometry(points,24),glass);
 const neck=new T.MeshStandardMaterial({color:'#a4baa6',roughness:.28,metalness:.12,side:T.DoubleSide});
 add(new T.CylinderGeometry(.057,.057,.075,20,1,true),neck,[0,.364,0]);
 const lip=add(new T.TorusGeometry(.06,.006,6,20),neck,[0,.404,0]);lip.rotation.x=Math.PI/2;
 const fluid=new T.MeshStandardMaterial({color:s.color,roughness:.3,emissive:s.color,emissiveIntensity:.13});
 add(new T.CylinderGeometry(.117,.104,.18,24),fluid,[0,.125,0]);
 const leather=new T.MeshStandardMaterial({color:'#544135',roughness:.95});
 for(const y of [.04,.24]){const ring=add(new T.TorusGeometry(.137,.011,6,24),leather,[0,y,0]);ring.rotation.x=Math.PI/2;}
 for(const x of [-.07,.07])add(new T.BoxGeometry(.018,.21,.025),leather,[x,.145,.12]);
 const tag=add(new T.BoxGeometry(.09,.08,.02),new T.MeshStandardMaterial({color:'#d9c599',roughness:.9}),[0,.16,.143]);tag.rotation.z=.1;
 const mark=new T.MeshStandardMaterial({color:s.color,roughness:.65});add(new T.BoxGeometry(.055,.012,.008),mark,[0,.16,.158]);if(key==='healpotion')add(new T.BoxGeometry(.012,.055,.008),mark,[0,.16,.158]);else if(key==='invisibility')add(new T.SphereGeometry(.019,12,8),mark,[0,.18,.159]);
 const cork=add(new T.CylinderGeometry(.047,.049,.08,16),new T.MeshStandardMaterial({color:'#9e7950',roughness:1}),[0,.425,0]);cork.name='flask-cork';
 return g;
}
