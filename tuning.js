// Values are in metres, seconds and health points. Keep future zones out of the controller.
export const PLAYER_TUNING = Object.freeze({
  walkSpeed:4.1, runSpeed:7, acceleration:48, braking:62,
  dodgeSpeed:13.5, dodgeDuration:.26, dodgeRecovery:.48, dodgeCost:22,
  gravity:18, jumpSpeed:6, eyeHeight:1.75, collisionStep:.16,
  sprintDrain:17, regeneration:30, regenerationDelay:.65,
  exhaustedAt:3, recoveredAt:25, hurtInvulnerability:.45,
});
export const CAMERA_TUNING = Object.freeze({
  baseFov:72, sprintFov:76, fovResponse:9, heightResponse:22,
  walkBob:.022, runBob:.032, roll:.018, pitchLimit:1.3,
});
export const ATTACKS = Object.freeze({
  light:{duration:.55, impact:.23, cost:6, multiplier:1, range:3.5},
  heavy:{duration:.88, impact:.38, cost:26, multiplier:1.9, range:3.5},
});
export const DEFAULT_BINDINGS = Object.freeze({
  forward:['KeyW'], back:['KeyS'], left:['KeyA'], right:['KeyD'],
  sprint:['ShiftLeft','ShiftRight'], jump:['Space'], dodge:['ControlLeft','ControlRight'],
  interact:['KeyF'], heal:['KeyE'], bag:['KeyI','AltLeft','AltRight'],
  map:['KeyM'], reload:['KeyR'], pet:['KeyQ'], weapon:['Digit1'], pause:['Escape'],
});
