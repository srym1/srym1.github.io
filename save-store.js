// No scene objects, controllers or DOM references are serialized. Supports legacy version 1.
export function loadSave(storage,key,validate){
  for(const suffix of ['',':backup']){try{const data=JSON.parse(storage.getItem(key+suffix)||'null');
    if(validate(data))return {data,recovered:suffix!==''};}catch{/* Try the previous validated copy. */}}
  return {data:null,recovered:false};
}
export function writeSave(storage,key,data,validate){
  if(!validate(data))return {ok:false,reason:'invalid'};
  try{const previous=storage.getItem(key);if(previous){let old;try{old=JSON.parse(previous);}catch{}
    if(validate(old)){try{storage.setItem(key+':backup',previous);}catch{/* Main save remains possible if backup quota is full. */}}}
    storage.setItem(key,JSON.stringify(data));return {ok:true};
  }catch{return {ok:false,reason:'storage'};}
}
