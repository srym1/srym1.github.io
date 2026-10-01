// Weapon timings and continuous poses, independent of renderer and frame rate.
export const RANGED = Object.freeze({bowDraw:1.15,bowMinimum:.12,bowRecovery:.58,pistolRecovery:.62,reload:1.65});
const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
export function reloadPose(progress){
 const q=clamp(progress),lower=smooth(q/.2)*(1-smooth((q-.8)/.2));
 const reach=smooth((q-.15)/.2)*(1-smooth((q-.66)/.14));
 return {lower,reach,ram:Math.sin(clamp((q-.38)/.23)*Math.PI),cock:smooth((q-.67)/.12)*(1-smooth((q-.86)/.14))};
}
export function recoilPose(elapsed){return Math.exp(-Math.max(0,elapsed)*15)*Math.sin(Math.min(1,Math.max(0,elapsed)/.055)*Math.PI/2);}
export function createReload(){
 let owner=null,time=0,stage=0;
 return {get active(){return owner!==null;},get progress(){return owner===null?0:clamp(time/RANGED.reload);},
 start(id){if(owner!==null)return false;owner=id;time=0;stage=0;return true;},
 cancel(){owner=null;time=0;stage=0;},
 tick(dt,id,onStage=()=>{}){if(owner===null)return false;if(id!==owner){this.cancel();return false;}
  time+=Math.max(0,dt);const marks=[.28,.55,.78];while(stage<marks.length&&this.progress>=marks[stage])onStage(stage++);
  if(time>=RANGED.reload){this.cancel();return true;}return false;
 }
 };
}
