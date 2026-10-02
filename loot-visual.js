import * as T from './three.module.js';
import {rarity,RARITIES} from './systems.js';
export const LOOT_TIERS=['common','uncommon','rare','epic','mythic'];
export function lootTier(loot){return loot.reduce((rank,[key,n,lvl=1])=>LOOT_TIERS.indexOf(rarity({key,lvl}))>LOOT_TIERS.indexOf(rank)?rarity({key,lvl}):rank,'common');}
export function createLootVisual(loot,grave=false){const rank=lootTier(loot),tier=LOOT_TIERS.indexOf(rank),group=new T.Group(),leather=new T.MeshStandardMaterial({color:grave?'#9b8460':'#68513a',roughness:1}),rope=new T.MeshStandardMaterial({color:'#b49c72',roughness:1});
 const pouch=new T.Mesh(new T.SphereGeometry(.27,12,8),leather);pouch.scale.set(1,.83,.8);pouch.castShadow=true;group.add(pouch);
 const neck=new T.Mesh(new T.CylinderGeometry(.11,.17,.15,8),leather);neck.position.y=.23;group.add(neck);const tie=new T.Mesh(new T.TorusGeometry(.13,.025,4,12),rope);tie.rotation.x=Math.PI/2;tie.position.y=.23;group.add(tie);
 const glow=new T.MeshBasicMaterial({color:grave?'#e7d8b4':RARITIES[rank].color,transparent:true,opacity:tier?.45:.16,depthWrite:false});const ring=new T.Mesh(new T.TorusGeometry(.36,.013+tier*.004,4,24),glow);ring.rotation.x=Math.PI/2;ring.position.y=-.16;group.add(ring);
 const motes=[];if(tier>=2||grave)for(let i=0;i<(tier===4?8:tier+1);i++){const m=new T.Mesh(new T.OctahedronGeometry(.018+tier*.003),glow);motes.push(m);group.add(m);}
 if(tier>=3){const crown=new T.Mesh(new T.TorusGeometry(.3,.014,4,tier===4?6:4),glow);crown.rotation.x=Math.PI/2;crown.position.y=.55;group.add(crown);}
 group.userData.loot={tier,ring,motes};return group;
}
export function animateLoot(group,time){const rig=group.userData.loot;if(!rig)return;rig.ring.material.opacity=(rig.tier?.36:.13)+Math.sin(time*2)*.045;rig.motes.forEach((m,i)=>{const a=time*.45+i*Math.PI*2/rig.motes.length;m.position.set(Math.cos(a)*.34,.23+Math.sin(time*1.7+i)*.18,Math.sin(a)*.34);m.rotation.y=time;});}
