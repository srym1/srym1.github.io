import {PLAYER_TUNING as P} from './tuning.js';

export function createPlayerController(){
  const c={vx:0,vz:0,jump:0,verticalSpeed:0,staminaDelay:0,dodgeLeft:0,
    dodgeCooldown:0,dodgeX:0,dodgeZ:0,exhausted:false,grounded:true};
  return {
    state:c,
    reset(){Object.assign(c,{vx:0,vz:0,jump:0,verticalSpeed:0,staminaDelay:0,dodgeLeft:0,dodgeCooldown:0,exhausted:false,grounded:true});},
    stop(){c.vx=0;c.vz=0;c.dodgeLeft=0;},
    spend(player,n){if(!Number.isFinite(n)||n<0||player.stamina<n)return false;
      player.stamina-=n;c.staminaDelay=P.regenerationDelay;return true;},
    jump(){if(!c.grounded||c.dodgeLeft>0)return false;c.verticalSpeed=P.jumpSpeed;c.grounded=false;return true;},
    dodge(player,axes,yaw){if(!c.grounded||c.dodgeCooldown>0||!this.spend(player,P.dodgeCost))return false;
      let {forward:f,side:s}=axes;const length=Math.hypot(f,s);
      if(length){f/=length;s/=length;}else{f=-1;s=0;}
      c.dodgeX=-Math.sin(yaw)*f+Math.cos(yaw)*s;
      c.dodgeZ=-Math.cos(yaw)*f-Math.sin(yaw)*s;
      c.dodgeLeft=P.dodgeDuration;c.dodgeCooldown=P.dodgeDuration+P.dodgeRecovery;return true;},
    tick(player,axes,yaw,dt,blocked,speedBonus=1){
      dt=Math.min(.1,Math.max(0,dt));
      if(c.exhausted&&player.stamina>=P.recoveredAt)c.exhausted=false;
      if(player.stamina<=P.exhaustedAt)c.exhausted=true;
      let {forward:f,side:s}=axes;const length=Math.hypot(f,s);if(length){f/=length;s/=length;}
      const running=axes.sprint&&length>0&&!c.exhausted&&c.dodgeLeft<=0;
      const speed=(running?P.runSpeed:P.walkSpeed)*speedBonus;
      const tx=(-Math.sin(yaw)*f+Math.cos(yaw)*s)*speed;
      const tz=(-Math.cos(yaw)*f-Math.sin(yaw)*s)*speed;
      // Very short response, with faster braking and reversal; never a long camera-style lerp.
      const rate=length?P.acceleration:P.braking;
      const deltaX=tx-c.vx,deltaZ=tz-c.vz,delta=Math.hypot(deltaX,deltaZ);
      const fraction=delta?Math.min(1,rate*dt/delta):1;
      c.vx+=deltaX*fraction;c.vz+=deltaZ*fraction;
      const dodging=c.dodgeLeft>0;
      const dx=(dodging?c.dodgeX*P.dodgeSpeed:c.vx)*dt;
      const dz=(dodging?c.dodgeZ*P.dodgeSpeed:c.vz)*dt;
      const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/P.collisionStep));
      const oldX=player.x,oldZ=player.z;
      for(let j=0;j<steps;j++){
        if(!blocked(player.x+dx/steps,player.z))player.x+=dx/steps;else c.vx=0;
        if(!blocked(player.x,player.z+dz/steps))player.z+=dz/steps;else c.vz=0;
      }
      const moved=Math.hypot(player.x-oldX,player.z-oldZ);
      if(running&&moved>.001){player.stamina=Math.max(0,player.stamina-P.sprintDrain*dt);c.staminaDelay=P.regenerationDelay;}
      else if(c.staminaDelay<=0&&!dodging)player.stamina=Math.min(100,player.stamina+P.regeneration*dt);
      c.staminaDelay=Math.max(0,c.staminaDelay-dt);
      c.dodgeLeft=Math.max(0,c.dodgeLeft-dt);c.dodgeCooldown=Math.max(0,c.dodgeCooldown-dt);
      c.verticalSpeed-=P.gravity*dt;c.jump=Math.max(0,c.jump+c.verticalSpeed*dt);
      if(c.jump===0){c.verticalSpeed=0;c.grounded=true;}
      return {running:running&&moved>.001,dodging,moved,speed:dt?moved/dt:0,jump:c.jump};
    },
  };
}
