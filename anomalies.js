import * as THREE from './assets/three.module.js';
import {canvasTexture} from './assets.js';

// Reserve small clear patches before the normal vegetation scatter runs.
export const anomalySites=[
 {id:'person-plant',kind:'person',x:-6.1,z:1.5,h:1.74,r:1.1},
 {id:'six-legged-pig',kind:'pig',x:22.5,z:2,h:.94,r:1.6},
 {id:'roof-owl',kind:'owl',x:11,z:12,h:.84,y:3.21,r:0},
 {id:'dirt-arm',kind:'arm',x:-20.3,z:-1.5,h:.76,r:.8},
 {id:'seated-granny',kind:'granny',x:32.2,z:7,h:1.3,r:1.2}
];
const rects=[[0,0,84,256],[256,0,142,256],[512,0,256,141],[0,256,123,256],[256,256,138,256],[512,256,148,256]];
export async function loadAnomalySprites(){
 const source=await new THREE.TextureLoader().loadAsync('./assets/anomalies-small.png'),im=source.image;
 const textures=rects.map(([x,y,w,h])=>{const t=canvasTexture(w,h,c=>c.drawImage(im,x,y,w,h,0,0,w,h));t.magFilter=THREE.LinearFilter;t.userData.cutoutAspect=w/h;return t});source.dispose();return textures;
}
const smooth=THREE.MathUtils.smoothstep;
export function createAnomalies(scene,camera,world,textures){
 const root=new THREE.Group();root.name='haze-encounters';scene.add(root);
 const plane=new THREE.PlaneGeometry(1,1),point=new THREE.Vector3(),view=new THREE.Vector3(),frustum=new THREE.Frustum(),vp=new THREE.Matrix4();
 const entries=anomalySites.map(site=>{
  const group=new THREE.Group();group.name=site.id;group.position.set(site.x,site.y??world.groundHeight(site.x,site.z),site.z);root.add(group);
  const layers=[];const add=(index,height)=>{const mat=new THREE.MeshLambertMaterial({map:textures[index],color:'#b3b5a1',side:THREE.DoubleSide,transparent:true,alphaTest:.025,depthWrite:false,opacity:1,fog:true});const mesh=new THREE.Mesh(plane,mat);mesh.scale.set(height*textures[index].userData.cutoutAspect,height,1);mesh.position.y=height/2;mesh.visible=false;group.add(mesh);layers.push(mesh);return mesh};
  if(site.kind==='person'){add(0,site.h);add(1,1.85)}else add({pig:2,owl:3,arm:4,granny:5}[site.kind],site.h);
  return {...site,group,layers,opacity:1,plantMix:0,revealed:false,lookTime:0,awayTime:0,absent:false,occluded:false,rangeVisible:false,centerRadius:Infinity,distance:Infinity};
 });
 const stats={encounters:entries.length,spritePlanes:6,visibleSprites:0,occlusionChecks:0};let occlusionClock=0;
 // Test the shared horizontal collision footprints rather than raycasting every
 // building triangle. Roof encounters ignore objects lower than their perch.
 function blockedSight(entry){if(entry.kind==='owl')return false;const sx=camera.position.x,sz=camera.position.z,dx=entry.x-sx,dz=entry.z-sz;for(const box of world.colliders){let lo=0,hi=1;for(const [origin,delta,min,max]of[[sx,dx,box.x0,box.x1],[sz,dz,box.z0,box.z1]]){if(Math.abs(delta)<1e-6){if(origin<min||origin>max){hi=-1;break}}else{const a=(min-origin)/delta,b=(max-origin)/delta;lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));if(lo>hi)break}}if(lo<hi&&hi>.02&&lo<.965)return true}return false}
 function update(dt){
  camera.updateMatrixWorld();vp.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(vp);occlusionClock+=dt;const checkOcclusion=occlusionClock>=.14;if(checkOcclusion)occlusionClock=0;stats.visibleSprites=0;stats.occlusionChecks=0;
  for(const entry of entries){
   const base=entry.group.position;point.set(entry.x,base.y+entry.h*.52,entry.z);view.copy(point).applyMatrix4(camera.matrixWorldInverse);const depth=-view.z;entry.distance=Math.hypot(camera.position.x-entry.x,camera.position.z-entry.z);entry.rangeVisible=depth>camera.near&&depth<Math.min(camera.far,entry.kind==='arm'?25:42)&&entry.distance<camera.far+2&&frustum.intersectsSphere(new THREE.Sphere(point,entry.h*.7));
   point.project(camera);entry.centerRadius=depth>0?Math.hypot(point.x,point.y):Infinity;
   if(checkOcclusion&&entry.rangeVisible&&dt>0){entry.occluded=blockedSight(entry);stats.occlusionChecks++}
   const perceived=entry.rangeVisible&&!entry.occluded,centered=entry.centerRadius<.45;
   if(dt>0){
    if(entry.kind==='person'){
     if(perceived&&entry.distance<8.8)entry.revealed=true;
     // Fog conceals most of the transition; the plant remains after discovery.
     const target=entry.revealed?1:1-smooth(entry.distance,8.8,15.5);entry.plantMix=THREE.MathUtils.damp(entry.plantMix,target,4.5,dt);
    }
    if(entry.kind==='owl'||entry.kind==='granny'){
     if(!entry.absent&&perceived&&centered&&entry.distance<22){entry.lookTime+=dt;entry.awayTime=0}
     else if(!entry.absent&&entry.lookTime>(entry.kind==='owl'?.8:1.2)){entry.awayTime+=dt;if(entry.awayTime>(entry.kind==='owl'?.6:.85))entry.absent=true}
     if(entry.absent&&entry.distance>(entry.kind==='owl'?32:26)&&!perceived){entry.absent=false;entry.lookTime=0;entry.awayTime=0}
    }
    let target=entry.absent?0:1;
    if(entry.kind==='pig')target*=smooth(entry.centerRadius,.10,.34)*smooth(entry.distance,2.8,6);
    if(entry.kind==='arm')target*=smooth(entry.distance,2.8,5.8);
    entry.opacity=THREE.MathUtils.damp(entry.opacity,target,entry.kind==='pig'?5:3.4,dt);
   }
   const yaw=Math.atan2(camera.position.x-entry.x,camera.position.z-entry.z);entry.group.rotation.y=yaw;
   for(let i=0;i<entry.layers.length;i++){const mesh=entry.layers[i];let opacity=entry.opacity;if(entry.kind==='person')opacity*=i===0?1-entry.plantMix:entry.plantMix;mesh.material.opacity=opacity;mesh.visible=entry.rangeVisible&&opacity>.015;if(mesh.visible)stats.visibleSprites++}
   if(entry.kind==='arm')entry.layers[0].position.y=entry.h/2-(1-entry.opacity)*entry.h*.65;
  }
 }
 return {root,entries,stats,update};
}