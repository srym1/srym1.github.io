import {PLACES,LIMIT,MAP_LIMIT,seeded} from './systems.js';
function path(c,points,close=false){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));if(close)c.closePath();}
function pine(c,x,y,s=1){c.strokeStyle='#566e60';c.lineWidth=.6;path(c,[[x,y+4*s],[x,y-4*s]]);c.stroke();for(let j=0;j<3;j++){const yy=y-4*s+j*2*s;path(c,[[x,yy],[x-(j+1)*s,yy+3*s],[x+(j+1)*s,yy+3*s]],true);c.fillStyle=j%2?'#7d9174':'#647e69';c.fill();}}
function landmark(c,kind){c.lineWidth=1.3;c.strokeStyle='#394d44';c.fillStyle='#d5c7a3';
 if(kind==='cave'){c.beginPath();c.moveTo(-9,5);c.quadraticCurveTo(-11,-7,0,-10);c.quadraticCurveTo(11,-7,9,5);c.closePath();c.fill();c.stroke();c.fillStyle='#344940';c.beginPath();c.ellipse(0,1,4,6,0,Math.PI,0);c.lineTo(4,5);c.lineTo(-4,5);c.fill();}
 else if(kind==='camp'){path(c,[[-9,6],[0,-9],[9,6]],true);c.fill();c.stroke();path(c,[[0,-9],[0,6],[5,6]],true);c.fillStyle='#657566';c.fill();path(c,[[-3,-12],[3,-6]]);c.stroke();}
 else if(kind==='tree'){pine(c,0,0,2.1);}
 else if(kind==='lake'){c.strokeStyle='#668f8b';for(let j=0;j<3;j++){c.beginPath();c.moveTo(-9,j*4-5);c.bezierCurveTo(-4,j*4-9,3,j*4,9,j*4-5);c.stroke();}}
 else if(kind==='bridge'){for(const y of [-4,4]){path(c,[[-10,y],[10,y]]);c.stroke();}for(let x=-8;x<9;x+=4){path(c,[[x,-5],[x,5]]);c.stroke();}}
 else if(kind==='guardian'){path(c,[[-8,5],[-5,-5],[0,-9],[5,-5],[8,5]],true);c.fill();c.stroke();for(const s of [-1,1]){path(c,[[s*4,-5],[s*9,-10],[s*8,-15]]);c.stroke();}c.fillStyle='#8b6044';c.fillRect(-3,-2,2,2);c.fillRect(2,-2,2,2);}
 else{c.fillRect(-7,-3,14,10);c.strokeRect(-7,-3,14,10);path(c,[[-10,-3],[0,-11],[10,-3]],true);c.fillStyle='#728271';c.fill();c.stroke();c.fillStyle='#45594c';c.fillRect(-2,1,4,6);if(kind==='tower'){c.strokeRect(-5,-11,10,8);path(c,[[-7,-11],[0,-16],[7,-11]],true);c.fill();}}
}
export function drawJournalMap(canvas,player,yaw,explored,discovered,graves=[],view={zoom:1,x:0,z:0}){const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,s=Math.min(w,h)/(MAP_LIMIT*2)*view.zoom,ox=w/2-view.x*s,oz=h/2-view.z*s,rnd=seeded(613);c.fillStyle='#d5c8a5';c.fillRect(0,0,w,h);
 c.save();c.translate(ox,oz);c.scale(s,s);
 // Hand-drawn contour ridges, with the same world axes as exploration and movement.
 for(let j=0;j<29;j++){const x=(rnd()-.5)*500,z=(rnd()-.5)*500,rx=15+rnd()*32,rz=10+rnd()*25;c.strokeStyle='#8c997854';c.lineWidth=.8;for(let ring=1;ring<4;ring++){c.beginPath();c.ellipse(x,z,rx*ring*.34,rz*ring*.34,j,0,Math.PI*2);c.stroke();}}
 c.fillStyle='#8ba8a0';c.beginPath();c.ellipse(10,-115,20,17,.1,0,Math.PI*2);c.fill();c.strokeStyle='#acc1ae';c.lineWidth=2;c.stroke();c.fillStyle='#8ba8a0';c.fillRect(-64,30,18,90);c.strokeStyle='#a79c77';c.lineWidth=4;for(const vertical of [true,false]){c.beginPath();for(let p=-LIMIT;p<LIMIT;p+=5){const a=vertical?[5*Math.sin(p*.04),p]:[p,6*Math.sin(p*.035)];p===-LIMIT?c.moveTo(...a):c.lineTo(...a);}c.stroke();}
 for(let j=0;j<500;j++){const x=(rnd()-.5)*450,z=(rnd()-.5)*450;if(PLACES.some(p=>Math.hypot(x-p.x,z-p.z)<p.r)||Math.abs(x-5*Math.sin(z*.04))<4)continue;pine(c,x,z,.5+rnd()*.6);}
 c.strokeStyle='#8e8b6e';c.lineWidth=1;c.setLineDash([4,6]);c.strokeRect(-LIMIT,-LIMIT,LIMIT*2,LIMIT*2);c.setLineDash([]);c.restore();
 const fogCanvas=document.createElement('canvas');fogCanvas.width=w;fogCanvas.height=h;const fog=fogCanvas.getContext('2d');fog.fillStyle='#263d38';fog.fillRect(0,0,w,h);fog.globalCompositeOperation='destination-out';for(const cell of explored){const [gx,gz]=cell.split(',').map(Number),x=ox+(gx*10+5)*s,y=oz+(gz*10+5)*s;const fade=fog.createRadialGradient(x,y,5*s,x,y,16*s);fade.addColorStop(0,'#000');fade.addColorStop(1,'#0000');fog.fillStyle=fade;fog.fillRect(x-16*s,y-16*s,32*s,32*s);}c.drawImage(fogCanvas,0,0);
 // Labels keep a legible screen size when zooming; distant undiscovered names stay hidden.
 for(const p of PLACES)if(discovered.has(p.id)){const x=ox+p.x*s,y=oz+p.z*s;if(x<0||x>w||y<0||y>h)continue;c.save();c.translate(x,y);landmark(c,p.kind);c.font='bold 12px Tahoma';c.textAlign='center';c.lineWidth=4;c.strokeStyle='#dfd3b2';c.strokeText(p.name,0,-21);c.fillStyle='#304b40';c.fillText(p.name,0,-21);c.restore();}
 for(const g of graves){c.fillStyle='#d9af69';c.strokeStyle='#293e35';c.lineWidth=2;c.beginPath();c.arc(ox+g.x*s,oz+g.z*s,5,0,Math.PI*2);c.fill();c.stroke();}
 c.save();c.translate(ox+player.x*s,oz+player.z*s);c.fillStyle='#a9653d22';c.beginPath();c.arc(0,0,18,0,Math.PI*2);c.fill();c.rotate(-yaw);path(c,[[0,-10],[-6,7],[0,3],[6,7]],true);c.fillStyle='#b77142';c.strokeStyle='#fff1c9';c.lineWidth=2;c.fill();c.stroke();c.restore();
 c.save();c.translate(w-38,40);c.strokeStyle='#c7b58a';c.lineWidth=1;c.beginPath();c.arc(0,0,18,0,Math.PI*2);c.stroke();path(c,[[0,-16],[-4,8],[0,4],[4,8]],true);c.fillStyle='#c7b58a';c.fill();c.font='10px Georgia';c.textAlign='center';c.fillText('N',0,-22);c.restore();
 c.strokeStyle='#ab987144';c.lineWidth=1;c.strokeRect(8,8,w-16,h-16);c.fillStyle='#c4b894';c.font='10px Tahoma';c.textAlign='left';c.fillText('ما وراء الضباب لم يُكتشف بعد',22,h-19);
}
