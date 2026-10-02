import {ITEMS,rarity,RARITIES,canMerge} from './systems.js';
import {weaponDamage,incomingDamage} from './combat-core.js';
export const BAG_CATEGORIES=[['all','الكل'],['weapons','الأسلحة'],['armor','الدروع'],['potions','العلاج والجرعات'],['resources','الموارد'],['ore','الخامات'],['scrap','الخردة'],['special','التذكارات والمرافقون']];
export function itemCategory(it){const d=ITEMS[it?.key];if(!d)return 'special';if(d.tool)return 'weapons';if(d.armor)return 'armor';if(d.heal||d.potion)return 'potions';if(['ore','coal','copper'].includes(it.key))return 'ore';if(it.key==='scrap')return 'scrap';if(d.pet||it.key==='guardianseal')return 'special';return 'resources';}
export const conditionOf=it=>Math.max(0,Math.min(100,it?.durability??100));
export function itemStat(it,playerLevel=1){if(!it)return null;const d=ITEMS[it.key],dur=conditionOf(it),level=it.lvl;
 if(d.tool)return {label:d.ranged?'ضرر إطلاق كامل':'ضرر الضربة الخفيفة',value:d.ranged?d.damage*Math.pow(1.36,level-1)*(dur<=0?.45:dur<25?.8:1):weaponDamage(d,level,dur,playerLevel),unit:''};
 if(d.armor)return {label:'تقليل الضرر',value:(1-incomingDamage(100,d,level,dur)/100)*100,unit:'٪'};
 if(d.heal)return {label:'استعادة الصحة',value:d.heal,unit:''};return null;
}
export function inspectItem(it,player){if(!it)return null;const d=ITEMS[it.key],stat=itemStat(it,player.level),other=d.tool?player.bag.find(x=>x?.id===player.equipped):d.armor?player.bag.find(x=>x?.id===player.armor):null;
 const compared=other&&other.id!==it.id?itemStat(other,player.level):null;
 return {definition:d,rarity:RARITIES[rarity(it)],stat,delta:compared&&stat?stat.value-compared.value:null,durability:conditionOf(it),duplicates:player.bag.filter(x=>canMerge(it,x)).length,equipped:[player.equipped,player.armor,player.pet].includes(it.id),next:it.lvl<5&&(d.tool||d.armor)?itemStat({...it,lvl:it.lvl+1,durability:100},player.level):null};
}
// Recover references when an equipped source is consumed by an existing fusion.
export function reconcileEquipment(player,before){for(const field of ['equipped','armor','pet']){const old=before[field];if(!old||player.bag.some(i=>i?.id===player[field]))continue;const candidates=player.bag.filter(i=>i?.key===old.key).sort((a,b)=>b.lvl-a.lvl);player[field]=candidates[0]?.id||null;}}
export function equipmentSnapshot(player){return Object.fromEntries(['equipped','armor','pet'].map(k=>[k,player.bag.find(i=>i?.id===player[k])]));}
export function droppable(it){const d=ITEMS[it?.key];return !!d&&!d.tool&&!d.armor&&!d.pet&&it.key!=='guardianseal';}
