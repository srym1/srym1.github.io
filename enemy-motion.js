import {profileFor} from './enemy-brain.js';
const clamp=n=>Math.max(0,Math.min(1,n));
export function enemyPose(a){
 const b=a.brain,p=profileFor(a);let ready=0,strike=0,hurt=0;
 if(b?.state==='windup')ready=clamp(b.time/p.windup);
 if(b?.state==='attack'){const q=b.time<p.contact?b.time/p.contact*.5:.5+(b.time-p.contact)/(p.attack-p.contact)*.5;strike=Math.sin(clamp(q)*Math.PI);}
 if(b?.state==='recovery')strike=Math.exp(-b.time*9)*.18;
 if(b?.state==='stunned')hurt=1-clamp(b.time/p.stun);
 return {ready,strike,hurt,pitch:ready*(a.kind==='mutant'?-.12:.14)-strike*.16,roll:hurt*.12,head:ready*.24-strike*.26+hurt*.18,arm:-ready*.95+strike*.9};
}
