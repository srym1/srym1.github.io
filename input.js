import {DEFAULT_BINDINGS} from './tuning.js';

// An action layer, independent of keyboard codes. A gamepad can feed these actions later.
export function createInput(bindings=DEFAULT_BINDINGS){
  const held=new Set();
  return {
    held,
    actionFor(code){return Object.keys(bindings).find(k=>bindings[k].includes(code));},
    isDown(action){return bindings[action]?.some(code=>held.has(code))||false;},
    press(code){held.add(code);}, release(code){held.delete(code);}, clear(){held.clear();},
    movement(){return {forward:Number(this.isDown('forward'))-Number(this.isDown('back')),
      side:Number(this.isDown('right'))-Number(this.isDown('left')), sprint:this.isDown('sprint')};},
  };
}
