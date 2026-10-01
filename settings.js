export const SETTINGS_DEFAULTS=Object.freeze({master:.75,sfx:.85,ambient:.6,sensitivity:1,cameraShake:.45,damageNumbers:true,quality:'medium'});
export function normalizeSettings(raw){const s={...SETTINGS_DEFAULTS};
  for(const k of ['master','sfx','ambient','cameraShake'])if(Number.isFinite(raw?.[k]))s[k]=Math.max(0,Math.min(1,raw[k]));
  if(Number.isFinite(raw?.sensitivity))s.sensitivity=Math.max(.25,Math.min(2.5,raw.sensitivity));
  if(typeof raw?.damageNumbers==='boolean')s.damageNumbers=raw.damageNumbers;
  if(['low','medium','high'].includes(raw?.quality))s.quality=raw.quality;return s;
}
export function loadSettings(storage,key){try{return normalizeSettings(JSON.parse(storage.getItem(key)||'null'));}catch{return {...SETTINGS_DEFAULTS};}}
export function saveSettings(storage,key,settings){try{storage.setItem(key,JSON.stringify(normalizeSettings(settings)));return true;}catch{return false;}}
