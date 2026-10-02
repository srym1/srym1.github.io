import * as T from './three.module.js';
export const ARMOR_STYLES={
 woodarmor:{name:'درع اللحاء',material:'wood',color:'#795839',grain:true,roughness:.95,geometry:{radius:.166,length:.43,count:6,width:.072,depth:.02,bevel:.005},stages:['لحاء مربوط','جلد ولحاء','خشب مقوّى','خشب مدعّم بالنحاس','درع الحطّاب']},
 stonearmor:{name:'درع الصوّان',material:'stone',color:'#7e8982',roughness:.87,geometry:{radius:.185,length:.48,count:5,width:.085,depth:.035,bevel:.009},stages:['صوّان وجلد','صفائح مربوطة','حجر مدعّم','صوّان ونحاس','درع حارس الممر']}
};
export function armorAppearance(it){const style=ARMOR_STYLES[it?.key];if(!style)return null;const lvl=Math.max(1,Math.min(5,it.lvl||1)),dur=Math.max(0,Math.min(100,it.durability??100));return {...style,lvl,stage:style.stages[lvl-1],condition:dur<=0?'broken':dur<25?'worn':'sound'};}
export function armorSignature(it){const p=armorAppearance(it);return p?it.key+':'+p.lvl+':'+p.condition:'';}
export function buildArmorSleeve(parent,it,wrist,elbow,side){const p=armorAppearance(it);if(!p)return null;const g=new T.Group();g.name=(side<0?'left':'right')+'-armor';g.userData.armor={key:it.key,level:p.lvl,stage:p.stage,condition:p.condition};parent.add(g);
 const axis=elbow.clone().sub(wrist).normalize();g.position.copy(wrist.clone().addScaledVector(axis,.26));g.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),axis);
 const materials={skin:new T.MeshStandardMaterial({color:p.skinColor||'#4d392a',roughness:1}),plate:new T.MeshStandardMaterial({color:p.color,roughness:p.roughness??.9,metalness:p.metalness??0}),rope:new T.MeshStandardMaterial({color:'#b69b70',roughness:1}),metal:new T.MeshStandardMaterial({color:'#a38652',roughness:.55,metalness:.35}),groove:new T.MeshStandardMaterial({color:'#342c23',roughness:1})};
 function mesh(geo,mat,pos=[0,0,0]){const m=new T.Mesh(geo,materials[mat]);m.position.set(...pos);g.add(m);return m;}
 const shapeProfile=p.geometry||ARMOR_STYLES.woodarmor.geometry,radius=shapeProfile.radius,len=shapeProfile.length;
 mesh(new T.CylinderGeometry(radius-.018,radius-.004,len,12,1,true),'skin');
 const count=shapeProfile.count;for(let i=0;i<count;i++){const angle=i*Math.PI*2/count,width=shapeProfile.width,shape=new T.Shape();shape.moveTo(-width,-len*.47);shape.lineTo(-width*.92,len*.34);shape.lineTo(-width*.45,len*.49);shape.lineTo(width*.7,len*.44);shape.lineTo(width,len*.1);shape.lineTo(width*.78,-len*.45);shape.closePath();const plate=mesh(new T.ExtrudeGeometry(shape,{depth:shapeProfile.depth,bevelEnabled:true,bevelSize:shapeProfile.bevel,bevelThickness:.005,bevelSegments:1}),'plate',[Math.sin(angle)*radius,0,Math.cos(angle)*radius]);plate.rotation.y=angle;
  if(p.grain&&i%2===0){const line=mesh(new T.BoxGeometry(.004,len*.62,.004),'groove',[Math.sin(angle)*(radius+.024),0,Math.cos(angle)*(radius+.024)]);line.rotation.y=angle;}
  if(p.lvl>=3){const rivet=mesh(new T.SphereGeometry(.012,6,4),'metal',[Math.sin(angle)*(radius+.037),len*.3,Math.cos(angle)*(radius+.037)]);rivet.scale.z=.5;}
 }
 for(const y of [-len*.29,len*.28]){const band=mesh(new T.TorusGeometry(radius+.025,p.lvl>=2?.025:.012,5,16),p.lvl>=4?'metal':p.lvl>=2?'skin':'rope',[0,y,0]);band.rotation.x=Math.PI/2;}
 if(p.lvl>=2)mesh(new T.BoxGeometry(.07,.046,.025),'metal',[0,-len*.29,radius+.047]);
 if(p.lvl>=4){const guard=mesh(new T.BoxGeometry(.09,len*.55,.027),'metal',[0,0,radius+.03]);guard.rotation.z=.08;}
 if(p.lvl>=5){const crest=mesh(new T.OctahedronGeometry(.031,0),'metal',[0,.01,radius+.06]);crest.scale.z=.3;}
 if(p.condition!=='sound')for(let j=0;j<(p.condition==='broken'?3:2);j++){const crack=mesh(new T.BoxGeometry(.009,.13,.009),'groove',[(j-1)*.036,.06-j*.07,radius+.045]);crack.rotation.z=.45+j*.4;}
 return g;
}
export function armorIcon(it){const p=armorAppearance(it);if(!p)return '';const stone=p.material==='stone',fill=stone?'#87948c':'#80603f';let shapes='<path d="M19 9L32 15L45 9L58 23L49 36L45 57H19L15 36L6 23Z" fill="#4f3d2b" stroke="#c1a879" stroke-width="1.5"/>';
 for(let i=0;i<(stone?3:5);i++){const x=stone?19+i*9:18+i*6;shapes+='<path d="M'+x+' 20l'+(stone?8:5)+' 1 -1 30 -'+(stone?7:4)+' 1Z" fill="'+fill+'" stroke="#423c30" stroke-width="1.2"/>';}
 shapes+='<path d="M15 30H49M18 46H46" stroke="'+(p.lvl>=4?'#b89d61':p.lvl>=2?'#5d432d':'#c4aa78')+'" stroke-width="'+(p.lvl>=2?4:2)+'"/>';
 if(p.lvl>=3)for(const x of [20,32,44])shapes+='<circle cx="'+x+'" cy="24" r="1.8" fill="#d3b47a"/>';
 if(p.lvl>=5)shapes+='<path d="M32 28l5 6 -5 6 -5 -6Z" fill="#cdb679"/>';
 if(p.condition!=='sound')shapes+='<path d="M25 21l4 8 -5 5 5 8" fill="none" stroke="#272e25" stroke-width="2"/>';
 return '<svg class="painted-item vector-item armor-illustration" viewBox="0 0 64 64" aria-hidden="true">'+shapes+'</svg>';
}
