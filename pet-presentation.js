import * as T from './three.module.js';
import {releaseViewmodel,rebuildCreature,animateCreature} from './models.js';
import {terrain} from './systems.js';
export const PET_DESIGNS={snakepet:{name:'أفعى الندى',color:'#a9bd7c'},wolfpet:{name:'ذئب الرفقة',color:'#c2bb9d'},dollpet:{name:'دمية الجذور',color:'#b9c8a0'}};
export function safeToHeal(player,animals,danger,blocked){return danger<=0&&!animals.some(a=>a.hostile&&!a.dead&&Math.hypot(a.x-player.x,a.z-player.z)<22&&(!blocked||!blocked(a,player)));}
export function createPetPresentation(scene,blocked=()=>false){let key='',model=null,rig=null,last=null,stride=0,pulse=0;
 const ownedMaterials=new Set();const mat=c=>{const m=new T.MeshStandardMaterial({color:c,roughness:.92});ownedMaterials.add(m);return m;};
 function mesh(g,geo,c,x,y,z,sx=1,sy=sx,sz=sx){const m=new T.Mesh(geo,mat(c));m.position.set(x,y,z);m.scale.set(sx,sy,sz);g.add(m);return m;}
 function bone(g,c,a,b,r){const v=new T.Vector3(...b).sub(new T.Vector3(...a)),m=mesh(g,new T.CylinderGeometry(r,r*.8,v.length(),10),c,...new T.Vector3(...a).add(new T.Vector3(...b)).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return m;}
 function oval(g,c,p,s){return mesh(g,new T.SphereGeometry(1,18,12),c,...p,...s);}
 function clear(){if(!model)return;scene.remove(model);releaseViewmodel(model);ownedMaterials.forEach(m=>{m.map?.dispose();m.dispose();});ownedMaterials.clear();model=null;rig=null;last=null;stride=0;key='';}
 function build(next){clear();key=next;if(!PET_DESIGNS[key])return;model=new T.Group();model.name='companion-'+key;scene.add(model);
  if(key==='wolfpet'){rig={kind:'wolf',mesh:model,legs:[],x:0,z:0,phase:0,dead:false};rebuildCreature(rig);model.scale.setScalar(.65);const collar=mesh(model,new T.TorusGeometry(.25,.028,6,20),'#755338',0,1.1,.56);collar.rotation.x=Math.PI/2;oval(model,'#c3a977',[0,.91,.72],[.06,.1,.025]);}
  if(key==='snakepet'){rig={segments:[]};const verts=new Float32Array(29*9*3),colors=[],indices=[];for(let i=0;i<=28;i++){rig.segments.push({position:new T.Vector3(0,.1,-i*.055)});for(let j=0;j<=8;j++){const c=new T.Color(j>4?'#b4b18b':(i%3===0?'#718455':'#64784f'));colors.push(c.r,c.g,c.b);if(i<28&&j<8){const a=i*9+j,b=a+9;indices.push(a,b,a+1,a+1,b,b+1);}}}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(verts,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(indices);const skin=mat('#ffffff');skin.vertexColors=true;rig.body=new T.Mesh(geo,skin);model.add(rig.body);rig.head=new T.Group();model.add(rig.head);oval(rig.head,'#899967',[0,.16,.11],[.105,.075,.15]);oval(rig.head,'#cbbb85',[0,.115,.12],[.08,.02,.1]);for(const s of [-1,1]){oval(rig.head,'#c79851',[s*.083,.185,.17],[.019,.019,.02]);oval(rig.head,'#273326',[s*.091,.185,.182],[.005,.014,.007]);}rig.tongue=bone(rig.head,'#a77960',[0,.14,.24],[0,.14,.35],.005);}
  if(key==='dollpet'){rig={arms:[]};model.scale.setScalar(.65);
 const cloth=mat('#8c8062');if(typeof document!=='undefined'){const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const ctx=canvas.getContext('2d');if(ctx){ctx.fillStyle='#9b8d6c';ctx.fillRect(0,0,128,128);for(let i=0;i<128;i+=3){ctx.strokeStyle=i%2?'#776f57':'#b0a182';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,128);ctx.moveTo(0,i);ctx.lineTo(128,i);ctx.stroke();}cloth.map=new T.CanvasTexture(canvas);cloth.map.wrapS=cloth.map.wrapT=T.RepeatWrapping;cloth.map.repeat.set(2,2);}}
 const cloak=mesh(model,new T.CylinderGeometry(.17,.235,.38,14,1,true),'#8c8062',0,.43,0);cloak.material.dispose();ownedMaterials.delete(cloak.material);cloak.material=cloth;
 for(const side of [-1,1]){bone(model,'#7c654a',[side*.25,.42,.01],[side*.3,.38,.08],.014);bone(model,'#7c654a',[side*.28,.4,.05],[side*.32,.43,.08],.01);for(let i=0;i<3;i++)bone(model,'#c1b38f',[side*.1,.61+i*.025,.126],[side*.12,.63+i*.025,.132],.003);}
 for(let i=0;i<4;i++)bone(model,'#6d6852',[-.045+i*.03,.675,.147],[-.025+i*.03,.66,.148],.003);oval(model,'#655643',[0,.42,0],[.17,.23,.12]);oval(model,'#c4b994',[0,.72,.025],[.14,.16,.115]);oval(model,'#68634b',[0,.75,-.035],[.18,.2,.13]);oval(model,'#c4b994',[0,.72,.075],[.12,.14,.07]);for(const s of [-1,1]){oval(model,'#292f28',[s*.055,.75,.137],[.022,.025,.01]);const arm=new T.Group();arm.position.set(s*.14,.53,0);model.add(arm);bone(arm,'#796248',[0,0,0],[s*.16,-.15,.01],.024);rig.arms.push(arm);bone(model,'#735e42',[s*.07,.27,0],[s*.1,.06,.025],.03);oval(model,'#50633f',[s*.11,.37,.11],[.045,.075,.017]);}for(let j=0;j<5;j++)bone(model,'#b7a685',[-.08,.3+j*.035,.12],[.08,.3+j*.035,.12],.004);rig.charm=oval(model,'#acc291',[0,.46,.135],[.028,.04,.01]);}
 }
 function update(next,p,time,dt){if(next!==key)build(next);if(!model)return;pulse=Math.max(0,pulse-dt);const right=new T.Vector3(Math.cos(p.yaw),0,-Math.sin(p.yaw)),forward=new T.Vector3(-Math.sin(p.yaw),0,-Math.cos(p.yaw)),goal=new T.Vector3(p.x,0,p.z).addScaledVector(right,key==='wolfpet'?1:-1.1).addScaledVector(forward,key==='wolfpet'?3.2:key==='dollpet'?1.7:2);
  const snap=!last||Math.hypot(model.position.x-p.x,model.position.z-p.z)>9;
  if(snap){model.position.set(goal.x,terrain(goal.x,goal.z),goal.z);last=model.position.clone();model.rotation.y=Math.atan2(p.x-goal.x,p.z-goal.z);if(rig.artRig){rig.artRig.lastX=goal.x;rig.artRig.lastZ=goal.z;}}
  const distance=Math.hypot(goal.x-model.position.x,goal.z-model.position.z),step=Math.min(distance,dt*(distance>3?4.8:2.5)),x=model.position.x+(goal.x-model.position.x)/Math.max(.001,distance)*step,z=model.position.z+(goal.z-model.position.z)/Math.max(.001,distance)*step;
  if(!blocked(x,z)){model.position.x=x;model.position.z=z;}else if(!blocked(x,model.position.z))model.position.x=x;else if(!blocked(model.position.x,z))model.position.z=z;
  const moved=Math.hypot(model.position.x-last.x,model.position.z-last.z);stride+=moved*10;if(moved>.001){const angle=Math.atan2(model.position.x-last.x,model.position.z-last.z);model.rotation.y+=T.MathUtils.euclideanModulo(angle-model.rotation.y+Math.PI,Math.PI*2)-Math.PI;}else{const angle=Math.atan2(p.x-model.position.x,p.z-model.position.z),delta=T.MathUtils.euclideanModulo(angle-model.rotation.y+Math.PI,Math.PI*2)-Math.PI;model.rotation.y+=delta*(1-Math.exp(-dt*2));}
  model.position.y=terrain(model.position.x,model.position.z)+(key==='dollpet'?.9+Math.sin(time*2.1)*.025:0);last.copy(model.position);
  if(key==='wolfpet'){rig.x=model.position.x;rig.z=model.position.z;animateCreature(rig,dt,time);}
  if(key==='snakepet'){rig.segments.forEach((m,i)=>{m.position.x=Math.sin(stride-i*.4+time*.5)*(.05+(moved>.001?.075:0));m.position.y=.1+Math.sin(time*1.1-i*.15)*.008;});const vertices=rig.body.geometry.attributes.position;for(let i=0;i<rig.segments.length;i++)for(let j=0;j<=8;j++){const a=j/8*Math.PI*2,r=.081*(1-i/29),c=rig.segments[i].position;vertices.setXYZ(i*9+j,c.x+Math.cos(a)*r,c.y+Math.sin(a)*r*.85,c.z);}vertices.needsUpdate=true;rig.body.geometry.computeVertexNormals();rig.body.geometry.computeBoundingSphere();rig.head.position.x=rig.segments[0].position.x;rig.head.position.y=Math.sin(time*1.8)*.009+pulse*.12;rig.head.rotation.x=-pulse*.24;rig.tongue.visible=pulse>0||Math.sin(time*2)> .95;}
  if(key==='dollpet'){model.rotation.z=Math.sin(time*1.7)*.045;rig.arms.forEach((m,i)=>m.rotation.z=Math.sin(time*2+i)*.13+(i?1:-1)*pulse*.2);rig.charm.material.emissive.set('#93b56d');rig.charm.material.emissiveIntensity=pulse*.8;}
 }
 return {update,pulse(){pulse=.7;},clear,get model(){return model;},get key(){return key;}};
}





