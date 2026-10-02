// Transient presentation state. No timers, DOM, renderer or save data here.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function createHudFeedback(){
 const s={health:100,trail:100,hold:0,impact:0,injury:0,healing:0,angle:null,kind:'normal',enemy:null,enemyLeft:0};
 return {state:s,
  reset(hp=100){Object.assign(s,{health:hp,trail:hp,hold:0,impact:0,injury:0,healing:0,angle:null,enemy:null,enemyLeft:0});},
  hit(enemy,kind='normal'){s.enemy=enemy;s.enemyLeft=3.2;if(kind!=='poison'){s.impact=.24;s.kind=kind;}},
  hurt(hp,source,player,yaw){s.hold=.38;s.injury=.42;s.trail=Math.max(s.trail,s.health);s.health=hp;s.angle=source&&Number.isFinite(source.x)&&Number.isFinite(source.z)?Math.atan2(source.x-player.x,player.z-source.z)+yaw:null;},
  heal(){s.healing=.7;},
  pause(){s.impact=0;s.injury=0;s.angle=null;},
  tick(dt,hp){dt=clamp(dt,0,.1);if(hp>s.health)s.trail=hp;s.health=hp;s.hold=Math.max(0,s.hold-dt);if(!s.hold)s.trail+= (hp-s.trail)*(1-Math.exp(-dt*6));s.impact=Math.max(0,s.impact-dt);s.injury=Math.max(0,s.injury-dt);s.healing=Math.max(0,s.healing-dt);s.enemyLeft=Math.max(0,s.enemyLeft-dt);if(!s.enemyLeft||s.enemy?.dead)s.enemy=null;return s;}
 };
}
