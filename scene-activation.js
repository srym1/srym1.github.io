import * as T from './three.module.js';

// Spatial batches give the renderer meaningful bounds instead of one forest-sized bound.
// Original meshes remain available to art/resource systems; their transforms/materials are shared.
export function activateScene(scene,{cellSize=40,distance=160}={}){
  const batches=[],objects=[],matrix=new T.Matrix4(),position=new T.Vector3(),scale=new T.Vector3(),rotation=new T.Quaternion(),color=new T.Color();
  for(const source of [...scene.children]){
    if(source.isInstancedMesh&&source.count>80){
      const cells=new Map();
      for(let i=0;i<source.count;i++){
        source.getMatrixAt(i,matrix);matrix.decompose(position,rotation,scale);
        if(Math.max(Math.abs(scale.x),Math.abs(scale.y),Math.abs(scale.z))<.001)continue;
        const cx=Math.floor(position.x/cellSize),cz=Math.floor(position.z/cellSize),key=cx+','+cz;
        if(!cells.has(key))cells.set(key,{cx,cz,indices:[]});cells.get(key).indices.push(i);
      }
      const chunks=[];
      for(const {cx,cz,indices} of cells.values()){
        const mesh=new T.InstancedMesh(source.geometry,source.material,indices.length);
        mesh.castShadow=source.castShadow;mesh.receiveShadow=source.receiveShadow;
        for(let j=0;j<indices.length;j++){source.getMatrixAt(indices[j],matrix);mesh.setMatrixAt(j,matrix);
          if(source.instanceColor){source.getColorAt(indices[j],color);mesh.setColorAt(j,color);}}
        mesh.computeBoundingBox();mesh.computeBoundingSphere();scene.add(mesh);
        chunks.push({mesh,x:(cx+.5)*cellSize,z:(cz+.5)*cellSize});
      }
      scene.remove(source);batches.push({source,chunks});
    }else if((source.isGroup||source.isMesh)&&!source.isCamera){
      // Large land, sky, distant mountains and water remain continuous background geometry.
      const r=source.geometry?.boundingSphere?.radius||0;
      if(source.material?.isShaderMaterial||r>100||Math.max(Math.abs(source.position.x),Math.abs(source.position.z))>245||source.geometry?.type==='PlaneGeometry')continue;
      if(source.position.x===0&&source.position.z===0)continue;
      objects.push({object:source,desired:source.visible,applied:source.visible});
    }
  }
  let timer=0;
  return {
    batches,
    update(dt,player,force=false){timer+=dt;if(timer<.2&&!force)return;timer=0;
      for(const {source,chunks} of batches)for(const chunk of chunks){
        const m=chunk.mesh;m.position.copy(source.position);m.rotation.copy(source.rotation);m.scale.copy(source.scale);
        m.visible=source.visible&&Math.hypot(player.x-chunk.x,player.z-chunk.z)<distance+cellSize*.71;
      }
      for(const entry of objects){const o=entry.object;if(o.visible!==entry.applied)entry.desired=o.visible;
        entry.applied=entry.desired&&Math.hypot(player.x-o.position.x,player.z-o.position.z)<distance;
        o.visible=entry.applied;
      }
    },
  };
}
