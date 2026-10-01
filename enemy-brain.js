// Renderer-independent, data-driven enemy states. Transient brains never enter saves.
const base={notice:14,lose:21,leash:30,speed:2.25,wander:.65,alert:.4,range:1.9,windup:.65,attack:.28,contact:.08,recovery:.8,damage:7,stun:.28,search:3.5};
export const ENEMY_PROFILES=Object.freeze({
 wolf:{...base,speed:3.7,windup:.48,recovery:.85,circle:true},
 bear:{...base,notice:6,lose:17,leash:25,speed:2.5,windup:.9,range:2.3,damage:15,recovery:1.35},
 mutant:{...base,windup:.7,recovery:1.05},
 spider:{...base,notice:9,lose:15,leash:22,speed:2.5,windup:.48,attack:.32,range:1.8,recovery:.95},
 archer:{...base,notice:17,lose:23,speed:1.8,range:17,windup:.85,damage:12,recovery:1.8,ranged:true},
 guardian:{...base,notice:23,lose:30,leash:24,speed:2.2,range:6,windup:1.1,attack:.4,contact:.12,recovery:3,damage:32,stun:.13,area:true},
 deer:{...base,passive:true,notice:9,speed:4,leash:45},
 rabbit:{...base,passive:true,notice:6,speed:4.5,leash:35},
 chicken:{...base,passive:true,notice:3.5,speed:2.2,leash:16},
});
export function profileFor(a){return ENEMY_PROFILES[a.guardian?'guardian':a.archer?'archer':a.kind]||ENEMY_PROFILES.mutant;}
export function createEnemyBrain(a){return {state:'idle',time:0,serial:0,clock:0,phase:a.phase||0,memory:0,lastX:a.x,lastZ:a.z,aimX:a.x,aimZ:a.z,heading:0,hit:false,stunLock:0,circleLock:0,blockedTime:0};}
function enter(b,state){if(b.state===state)return;b.state=state;b.time=0;b.serial++;b.hit=false;}
export function resetEnemy(a){a.brain=createEnemyBrain(a);a.provoked=0;a.poison=0;a.poisonTick=0;}
export function hurtEnemy(a,{stagger=true}={}){const b=a.brain||(a.brain=createEnemyBrain(a)),p=profileFor(a);a.provoked=10;if(a.dead||a.hp<=0){enter(b,'dead');return;}if(stagger&&b.stunLock<=0){b.stunLock=.85;enter(b,'stunned');}if(p.passive)b.memory=2.5;}
export function clearEnemyAttack(a){const b=a.brain;if(b&&['windup','attack'].includes(b.state))enter(b,'return');}
export function enemyLineOfSight(a,x,z,blocked){const dx=x-a.x,dz=z-a.z,d=Math.hypot(dx,dz);for(let n=.6;n<d-.4;n+=.5)if(blocked(a.x+dx*n/d,a.z+dz*n/d))return false;return true;}
export function attackConnects(a,attack,ctx){
 if(ctx.safe||!ctx.visible)return false;const dx=ctx.x-a.x,dz=ctx.z-a.z,d=Math.hypot(dx,dz);if(d>attack.range)return false;
 return attack.area||d<.25||(Math.sin(attack.heading)*dx+Math.cos(attack.heading)*dz)/d>.58;
}
export function stepEnemy(a,dt,ctx){
 const b=a.brain||(a.brain=createEnemyBrain(a)),p=profileFor(a),out={vx:0,vz:0,speed:0,heading:null,attack:null,alert:false,telegraph:false};
 dt=Math.max(0,Math.min(.1,dt));b.clock+=dt;b.time+=dt;b.stunLock=Math.max(0,b.stunLock-dt);b.circleLock=Math.max(0,b.circleLock-dt);a.provoked=Math.max(0,(a.provoked||0)-dt);
 if(a.dead||a.hp<=0){enter(b,'dead');return out;}
 const dx=ctx.x-a.x,dz=ctx.z-a.z,d=Math.hypot(dx,dz),home=Math.hypot(a.x-a.homeX,a.z-a.homeZ),seen=!ctx.safe&&ctx.visible&&d<(a.provoked>0?p.lose:p.notice);
 function toward(x,z,speed){const xdiff=x-a.x,zdiff=z-a.z,length=Math.hypot(xdiff,zdiff);if(length>.08){out.vx=xdiff/length;out.vz=zdiff/length;out.speed=speed;out.heading=Math.atan2(out.vx,out.vz);}}
 function prepare(){b.aimX=ctx.x;b.aimZ=ctx.z;b.heading=Math.atan2(dx,dz);enter(b,'windup');out.heading=b.heading;out.telegraph=true;}
 // Committed attacks cannot turn to follow a dodge. Safety, walls and leashes can cancel them.
 if(!p.passive&&(ctx.safe||home>p.leash||d>p.lose+8)){if(home>p.leash||!['idle','wander','return'].includes(b.state))enter(b,'return');b.memory=0;}
 if(p.passive){
  if(ctx.visible&&(d<p.notice||a.provoked>0)){b.lastX=ctx.x;b.lastZ=ctx.z;b.memory=2.2;if(b.state!=='stunned')enter(b,'flee');}else b.memory=Math.max(0,b.memory-dt);
  if(b.state==='stunned'){if(b.time>=p.stun)enter(b,'flee');return out;}
  if(b.state==='flee'){if(home>p.leash||b.memory<=0){enter(b,'return');}else{const away=Math.atan2(a.z-b.lastZ,a.x-b.lastX);toward(a.x+Math.cos(away)*5,a.z+Math.sin(away)*5,p.speed);return out;}}
 }else if(seen&&b.state!=='return'){b.lastX=ctx.x;b.lastZ=ctx.z;b.memory=p.search;}
 if(b.state==='stunned'){if(b.time>=p.stun)enter(b,p.passive?'flee':seen?'chase':'investigate');return out;}
 if(b.state==='return'){
  if(home>.5)toward(a.homeX,a.homeZ,p.speed*.65);else{a.provoked=0;enter(b,'idle');}return out;
 }
 if(b.state==='windup'){
  out.heading=b.heading;if(!ctx.visible||ctx.safe){enter(b,'investigate');return out;}if(b.time>=p.windup)enter(b,'attack');return out;
 }
 if(b.state==='attack'){
  out.heading=b.heading;
  if(!b.hit&&b.time>=p.contact){b.hit=true;out.attack={ranged:!!p.ranged,area:!!p.area,range:p.range,heading:b.heading,x:b.aimX,z:b.aimZ,damage:p.damage+(p.area||p.ranged?0:a.level*.8)};}
  if(b.time>=p.attack)enter(b,'recovery');return out;
 }
 if(b.state==='recovery'){out.heading=b.heading;if(b.time>=p.recovery*(a.guardian&&a.hp<a.maxHp*.5?.7:1))enter(b,seen?'chase':'investigate');return out;}
 if(b.state==='alert'){out.heading=Math.atan2(dx,dz);if(!seen){enter(b,'investigate');}else if(b.time>=p.alert)enter(b,'chase');return out;}
 if(b.state==='circle'){
  if(!seen){enter(b,'investigate');return out;}if(d<=p.range){prepare();return out;}if(b.time>.9){b.circleLock=2.8;enter(b,'chase');return out;}
  const direction=Math.sin(b.phase)>=0?1:-1,radial=(d-3.4)*.32;const vx=dx/Math.max(.01,d),vz=dz/Math.max(.01,d),n=Math.hypot(vx*radial-vz*direction,vz*radial+vx*direction);
  out.vx=(vx*radial-vz*direction)/n;out.vz=(vz*radial+vx*direction)/n;out.speed=2.5;out.heading=Math.atan2(dx,dz);return out;
 }
 if(b.state==='retreat'){if(!seen){enter(b,'investigate');return out;}if(d>=7){enter(b,'chase');return out;}toward(a.x-dx,a.z-dz,p.speed);out.heading=Math.atan2(dx,dz);return out;}
 if(b.state==='chase'){
  if(!seen){enter(b,'investigate');return out;}out.heading=Math.atan2(dx,dz);
  if(p.ranged&&d<6){enter(b,'retreat');return out;}
  if(d<=p.range){prepare();return out;}
  if(p.circle&&d<7&&b.circleLock<=0){enter(b,'circle');return out;}toward(ctx.x,ctx.z,p.speed);return out;
 }
 if(b.state==='investigate'){
  if(seen){enter(b,'chase');return out;}b.memory=Math.max(0,b.memory-dt);if(b.memory<=0||b.time>p.search){enter(b,'return');return out;}toward(b.lastX,b.lastZ,p.speed*.6);return out;
 }
 if(!p.passive&&seen){enter(b,'alert');out.alert=true;out.heading=Math.atan2(dx,dz);return out;}
 if(b.state==='idle'){if(b.time>1.2+(Math.sin(b.phase)+1)*.7)enter(b,'wander');return out;}
 if(b.state==='wander'){
  const angle=b.phase+b.clock*.18;toward(a.homeX+Math.sin(angle)*3,a.homeZ+Math.cos(angle*.7)*3,p.wander);if(b.time>4.5)enter(b,'idle');
 }return out;
}
// Small local steering probes, not a navmesh. Bounded substeps prevent wall tunnelling.
export function moveEnemy(a,motion,dt,blocked,limit=205){
 if(motion.speed<=0)return;const distance=motion.speed*dt,steps=Math.max(1,Math.ceil(distance/.15));let vx=motion.vx,vz=motion.vz;
 const probe=.6;if(blocked(a.x+vx*probe,a.z+vz*probe)){let found=false;for(const angle of [.7,-.7,1.3,-1.3]){const x=vx*Math.cos(angle)-vz*Math.sin(angle),z=vx*Math.sin(angle)+vz*Math.cos(angle);if(!blocked(a.x+x*probe,a.z+z*probe)){vx=x;vz=z;found=true;break;}}if(!found)return;}
 for(let i=0;i<steps;i++){const nx=a.x+vx*distance/steps,nz=a.z+vz*distance/steps;if(Math.abs(nx)<=limit&&!blocked(nx,a.z))a.x=nx;if(Math.abs(nz)<=limit&&!blocked(a.x,nz))a.z=nz;}
}
