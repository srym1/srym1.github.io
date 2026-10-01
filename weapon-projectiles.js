import * as T from './three.module.js';
// One draw call per arrow: shaft, broadhead and three feather vanes.
export function arrowGeometry(){
 const shaft=new T.CylinderGeometry(.009,.009,.65,5);shaft.rotateX(Math.PI/2);shaft.translate(0,0,-.325);
 const head=new T.ConeGeometry(.035,.12,4);head.rotateX(-Math.PI/2);head.translate(0,0,-.71);
 const positions=[];
 for(const g of [shaft,head]){const flat=g.toNonIndexed();positions.push(...flat.attributes.position.array);flat.dispose();g.dispose();}
 for(let j=0;j<3;j++){const angle=j*Math.PI*2/3,x=Math.cos(angle)*.055,y=Math.sin(angle)*.055;positions.push(0,0,-.04,x,y,-.1,0,0,-.23);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();geometry.computeBoundingSphere();return geometry;
}
