import {canMerge,move} from './systems.js';
export const bagSignature=bag=>JSON.stringify(bag.map(i=>i?[i.id,i.key,i.lvl,i.n,i.durability??100]:null));
export function fusionPlan(bag,pair=null){const next=bag.map(i=>i?{...i}:null),steps=[];
 function combine(a,b){if(!canMerge(next[a],next[b]))return false;const s={source:next[a].id,target:next[b].id,key:next[b].key,from:next[b].lvl,to:next[b].lvl+1,before:{...next[b]}};move(next,a,b);s.after={...next[b]};steps.push(s);return true;}
 if(pair)combine(...pair);else{let found=true;while(found){found=false;outer:for(let i=0;i<next.length;i++)for(let j=i+1;j<next.length;j++)if(combine(i,j)){found=true;break outer;}}}
 return {signature:bagSignature(bag),steps,result:next};
}
export function confirmFusion(player,plan){if(!plan?.steps.length||plan.signature!==bagSignature(player.bag))return false;
 const refs={equipped:player.equipped,armor:player.armor,pet:player.pet};for(const s of plan.steps)for(const field of Object.keys(refs))if(refs[field]===s.source)refs[field]=s.target;
 player.bag.splice(0,player.bag.length,...plan.result.map(i=>i?{...i}:null));Object.assign(player,refs);return true;
}
