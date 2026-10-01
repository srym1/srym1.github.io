import {CAMERA_TUNING as C,PLAYER_TUNING as P} from './tuning.js';
export function createCameraRig(){let height=null,fov=C.baseFov,stride=0,amplitude=0;
  return {
    reset(){height=null;fov=C.baseFov;stride=0;amplitude=0;},
    tick(player,ground,yaw,pitch,motion,dt,time,impact,shakeStrength){
      // Ground height is smoothed; jump and mouse direction remain immediate.
      height=height===null?ground:height+(ground-height)*(1-Math.exp(-C.heightResponse*dt));
      stride+=motion.moved*(motion.running?2.2:2.7);
      const target=motion.moved>.001?(motion.running?C.runBob:C.walkBob):0;
      amplitude+=(target-amplitude)*(1-Math.exp(-14*dt));
      const targetFov=motion.running?C.sprintFov:C.baseFov;
      fov+=(targetFov-fov)*(1-Math.exp(-C.fovResponse*dt));
      const jolt=impact*Math.max(0,Math.min(1,shakeStrength));
      return {x:player.x,z:player.z,y:height+P.eyeHeight+motion.jump+Math.sin(stride)*amplitude,
        yaw,pitch:Math.max(-C.pitchLimit,Math.min(C.pitchLimit,pitch))+Math.sin(time*49)*jolt*.07,
        roll:motion.dodging?Math.sin(time*18)*C.roll:Math.sin(stride*.5)*amplitude*.18,fov,stride};
    },
  };
}
