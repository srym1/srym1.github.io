import * as T from './three.module.js';
import {seeded} from './systems.js';
export const ORES=Object.freeze({
 ore:{name:'عروق الحديد',rock:'#65756f',vein:'#b9c7bf',chip:'#d2d8c7',sound:'iron',roughness:.45,metalness:.45},
 coal:{name:'كتلة الفحم',rock:'#303b37',vein:'#596360',chip:'#515c53',sound:'coal',roughness:.93,metalness:.05},
 copper:{name:'عروق النحاس',rock:'#706958',vein:'#cd9561',chip:'#d9aa70',sound:'copper',roughness:.55,metalness:.35}
});
function seedId(id){let n=19;for(const c of id)n=(n*31+c.charCodeAt(0))>>>0;return n;}
function smoothStone(geo){const p=geo.attributes.position,n=geo.attributes.normal,sums=new Map(),keys=[];for(let i=0;i<p.count;i++){const k=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*10000)).join(':');keys.push(k);if(!sums.has(k))sums.set(k,new T.Vector3());sums.get(k).add(new T.Vector3(n.getX(i),n.getY(i),n.getZ(i)));}for(let i=0;i<p.count;i++){const v=sums.get(keys[i]).normalize();n.setXYZ(i,v.x,v.y,v.z);}}
export function buildOreNode(key,id){
 const s=ORES[key];if(!s)throw Error('Unknown ore '+key);const random=seeded(seedId(id)),g=new T.Group();g.name='ore-'+id;
 const body=new T.Group();g.add(body);const rock=new T.MeshStandardMaterial({color:s.rock,roughness:.92});
 const vein=new T.MeshStandardMaterial({color:s.vein,roughness:s.roughness,metalness:s.metalness});
 const chunks=[];
 for(let i=0;i<5;i++){
  const geo=new T.IcosahedronGeometry(1,key==='coal'?1:2),a=geo.attributes.position;
  for(let v=0;v<a.count;v++){const x=a.getX(v),y=a.getY(v),z=a.getZ(v),n=1+Math.sin(x*7+y*3+i)*Math.cos(z*8-y*2)*.11;a.setXYZ(v,x*n,y*n,z*n);}geo.computeVertexNormals();if(key!=='coal')smoothStone(geo);
  const m=new T.Mesh(geo,i===0?rock:vein),angle=i*2.4+random();m.position.set(i?Math.cos(angle)*.48:0,.33+random()*.18,i?Math.sin(angle)*.35:0);m.scale.set(i?.22+random()*.17:.68,i?.26+random()*.18:.51,i?.24+random()*.13:.55);m.rotation.set(random()*.3,random()*3,random()*.25);m.castShadow=true;m.receiveShadow=true;body.add(m);chunks.push({m,home:m.position.clone()});
 }
 if(key!=='coal')for(let j=0;j<4;j++){
  const z=-.25+j*.17,points=[new T.Vector3(-.45,.53,z),new T.Vector3(-.15,.76,z+.06),new T.Vector3(.15,.74,z-.05),new T.Vector3(.43,.55,z+.07)];
  body.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),10,.014,4,false),vein));
 }
 const moss=new T.Mesh(new T.SphereGeometry(1,12,8),new T.MeshStandardMaterial({color:'#506347',roughness:1}));moss.scale.set(.35,.055,.22);moss.position.set(-.4,.12,.28);body.add(moss);
 const cracks=[];for(let i=0;i<2;i++){
  const z=.52-i*.08,geo=new T.BufferGeometry().setFromPoints([new T.Vector3(-.31+i*.14,.2,z),new T.Vector3(-.16+i*.1,.43,z+.03),new T.Vector3(-.25+i*.16,.57,z-.08),new T.Vector3(.05+i*.12,.69,z-.2)]);
  const line=new T.Line(geo,new T.LineBasicMaterial({color:'#1d2824'}));line.visible=false;body.add(line);cracks.push(line);
 }
 g.userData.mining={body,chunks,cracks,hit:0,breaking:0,broken:false};return g;
}
export function restoreOre(node){const a=node.mesh?.userData.mining;if(!a)return;a.hit=0;a.breaking=0;a.broken=node.hits<=0;a.body.position.set(0,0,0);a.body.rotation.set(0,0,0);a.body.scale.setScalar(1);for(const c of a.chunks)c.m.position.copy(c.home);a.cracks.forEach((m,i)=>m.visible=node.hits<=(i?1:2));node.mesh.visible=node.hits>0;}
export function hitOre(node){const a=node.mesh?.userData.mining;if(!a)return;a.hit=.23;a.cracks.forEach((m,i)=>m.visible=node.hits<=(i?1:2));if(node.hits<=0){a.breaking=.55;a.broken=true;node.mesh.visible=true;}}
export function animateOre(node,dt){const a=node.mesh?.userData.mining;if(!a||!(a.hit>0||a.breaking>0))return;
 a.hit=Math.max(0,a.hit-dt);a.body.rotation.z=Math.sin(a.hit*70)*a.hit*.09;a.body.position.y=Math.sin(a.hit*50)*a.hit*.04;
 if(a.breaking>0){a.breaking=Math.max(0,a.breaking-dt);const q=1-a.breaking/.55;a.body.scale.setScalar(1-q*.32);for(let i=0;i<a.chunks.length;i++){const c=a.chunks[i];c.m.position.copy(c.home);c.m.position.x+=Math.sin(i*2.4)*q*.55;c.m.position.z+=Math.cos(i*2.4)*q*.55;c.m.position.y+=Math.sin(q*Math.PI)*.22-q*.25;}if(a.breaking===0)node.mesh.visible=false;}
}
export function miningProgress(node){const total=node.maxHits||3,left=Math.max(0,node.hits);return {left,total,ratio:left/total,name:ORES[node.key]?.name||node.name};}
