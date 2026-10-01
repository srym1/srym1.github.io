import {ATTACKS,PLAYER_TUNING} from './tuning.js';
export function weaponDamage(definition,level=1,durability=100,playerLevel=1){
  return (definition?.damage||8)*Math.pow(1.36,Math.max(0,level-1))
    *(durability<=0?.45:durability<25?.8:1)*(1+(playerLevel-1)*.04);
}
export function incomingDamage(n,definition,level=1,durability=100){
  const effectiveness=durability<=0?.45:durability<25?.8:1;
  return Math.max(0,n)*(1-(definition?Math.min(.6,(definition.defense+level*.04)*effectiveness):0));
}
export function createCombatClock(){let action=null,invulnerable=0,combo=0;
  return {
    get action(){return action;}, get invulnerable(){return invulnerable;},
    start(heavy,context){if(action)return null;const spec=ATTACKS[heavy?'heavy':'light'];
      action={...spec,...context,heavy,age:0,resolved:false,combo:combo++%2};return action;},
    tick(dt,onImpact){invulnerable=Math.max(0,invulnerable-dt);if(!action)return;
      action.age+=dt;if(!action.resolved&&action.age>=action.impact){action.resolved=true;onImpact(action);}
      if(action&&action.age>=action.duration)action=null;},
    acceptDamage(){if(invulnerable>0)return false;invulnerable=PLAYER_TUNING.hurtInvulnerability;return true;},
    cancel(){action=null;}, reset(){action=null;invulnerable=0;combo=0;},
  };
}
