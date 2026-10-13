import * as THREE from './assets/three.module.js';
import {rand,rng,canvasTexture,wornSign,adTexture,cableTexture,plantTexture,stripTexture} from './assets.js';
import {surfaceTexture,roadStripe,fuelFace,candidateTexture,vehiclePanel} from './detail-textures.js';
import {carCabin,carBody,truckCabin,beveledBox} from './vehicle-v3.js';

export function createWorld(scene,tiles,foliage,props,reserved=[]){
 const colliders=[],billboards=[],plantRecords=[],poleRecords=[],cableRecords=[],roadRects=[],compounds=[];
 const mat=(map,color='#ffffff',alpha=false)=>new THREE.MeshLambertMaterial({map,color,side:THREE.DoubleSide,alphaTest:alpha?.4:0});
 const tile=(i,rx=1,ry=1)=>{const t=tiles[i].clone();t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);t.needsUpdate=true;return t};
 const textures={wood:surfaceTexture('wood','#a49b81'),metal:surfaceTexture('metal','#a1a297'),concrete:surfaceTexture('concrete','#b4b09e'),red:surfaceTexture('paint','#a4322c'),white:surfaceTexture('paint','#d8d7c7'),black:surfaceTexture('rubber','#30372e'),glass:surfaceTexture('glass','#6b776b'),green:surfaceTexture('paint','#678773'),soil:tiles[13]};
 const mats=Object.fromEntries(Object.entries(textures).map(([k,t])=>[k,mat(t)]));
 const boxGeoCache=new Map();
 function boxGeo(w,h,d,uvScale=1){const key=[w,h,d,uvScale].join(',');if(boxGeoCache.has(key))return boxGeoCache.get(key);const g=new THREE.BoxGeometry(w,h,d);const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);if(Math.abs(n.getX(i))>.5)uv.setXY(i,(z+d/2)/uvScale,(y+h/2)/uvScale);else if(Math.abs(n.getY(i))>.5)uv.setXY(i,(x+w/2)/uvScale,(z+d/2)/uvScale);else uv.setXY(i,(x+w/2)/uvScale,(y+h/2)/uvScale)}boxGeoCache.set(key,g);return g}
 for(const t of Object.values(textures)){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.needsUpdate=true}
 function box(w,h,d,x,y,z,m,parent=scene,solid=false){const mesh=new THREE.Mesh(boxGeo(w,h,d),m);mesh.position.set(x,y,z);parent.add(mesh);if(solid)addCollider(mesh,w,d);return mesh}
 function panel(w,h,x,y,z,m,parent=scene,angle=0){const aspect=m.map?.userData?.cutoutAspect;if(aspect){const bottom=y-h/2;if(w/h>aspect)w=h*aspect;else h=w/aspect;y=bottom+h/2}const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);mesh.position.set(x,y,z);mesh.rotation.y=angle;parent.add(mesh);return mesh}
 function surface(w,d,x,z,m,y=.01){const aspect=m.map?.userData?.cutoutAspect;if(aspect){if(w/d>aspect)w=d*aspect;else d=w/aspect}const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,d),m);mesh.position.set(x,y,z);mesh.rotation.x=-Math.PI/2;scene.add(mesh);return mesh}
 function cyl(rt,rb,h,x,y,z,m,segs=8,parent=scene){const g=new THREE.CylinderGeometry(rt,rb,h,segs);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*Math.PI*(rt+rb),uv.getY(i)*h);const mesh=new THREE.Mesh(g,m);mesh.position.set(x,y,z);parent.add(mesh);return mesh}
 function addCollider(mesh,w,d){mesh.updateWorldMatrix(true,false);const p=new THREE.Vector3(),q=new THREE.Quaternion();mesh.getWorldPosition(p);mesh.getWorldQuaternion(q);const yaw=new THREE.Euler().setFromQuaternion(q,'YXZ').y,wx=Math.abs(Math.cos(yaw))*w+Math.abs(Math.sin(yaw))*d,dz=Math.abs(Math.sin(yaw))*w+Math.abs(Math.cos(yaw))*d;colliders.push({x0:p.x-wx/2,x1:p.x+wx/2,z0:p.z-dz/2,z1:p.z+dz/2})}
 const flatMat=(i,w,d,unit=2,color='#ffffff')=>mat(tile(i,w/unit,d/unit),color);
 surface(140,260,0,0,flatMat(13,140,260,2.1,'#b2a68e'),0);
 for(const [x,z,w,d]of[[-34,30,20,28],[36,-36,20,28],[-30,-40,22,24],[34,38,21,20]])surface(w,d,x,z,flatMat(13,w,d,2,'#818563'),.008);
 // Raised asphalt and sloping, unpaved shoulders. No kerbs or roadside ditches.
 function road(x,z,w,d,height=.23){roadRects.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2,height});surface(w,d,x,z,flatMat(12,w,d,2.2,'#92918a'),height);const shoulder=1.2;for(const side of[-1,1]){const x0=x+side*w/2,x1=x+side*(w/2+shoulder);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([x0,height,z-d/2,x0,height,z+d/2,x1,.015,z+d/2,x1,.015,z-d/2],3));g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,0,d/2,shoulder/2,d/2,shoulder/2,0],2));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();scene.add(new THREE.Mesh(g,mat(tile(13),'#b5aa8e')))}}
 road(0,0,8.6,240);road(17.5,-29,27,3.8,.14);road(28,0,3.8,59,.14);road(17.5,29,27,3.8,.14);road(-13,27,19,3.4,.14);road(-25,10,3.4,36,.14);road(-14,-8,19,3.4,.14);
 const stripeMat=mat(roadStripe());for(let z=-115;z<116;z+=7.3)surface(.11,2.8,0,z,stripeMat,.237);
 // Dirt aprons and a partly patched fuel forecourt.
 surface(18,21,-15,-19,flatMat(11,18,21,2.1,'#b1ad9a'),.04);surface(7.5,70,8.8,-1,flatMat(13,7.5,70,1.8,'#b9ab8a'),.02);surface(6,64,-8.3,4,flatMat(13,6,64,1.8,'#b5a382'),.02);
 function groundHeight(x,z){let y=0;for(const r of roadRects){if(x>=r.x0&&x<=r.x1&&z>=r.z0&&z<=r.z1)y=Math.max(y,r.height);else if(z>=r.z0&&z<=r.z1){const distance=Math.min(Math.abs(x-r.x0),Math.abs(x-r.x1));if(distance<1.2)y=Math.max(y,r.height*(1-distance/1.2))}}if(x>-24&&x<-6&&z>-29.5&&z<-8.5)y=Math.max(y,.04);return y}
 // Every small structural element uses a texture; UV scale follows real dimensions.
 function roof(g,w,d,h,rise,type,index=10){const m=mat(tile(index));if(type==='flat'){box(w+.25,.15,d+.3,0,h+.07,0,mat(tile(11)),g);return}if(type==='lean'){const p=new THREE.Mesh(new THREE.PlaneGeometry(w+.65,d+.8),mat(tile(index,(w+.65)/1.7,(d+.8)/1.7)));p.rotation.x=-Math.PI/2+.12;p.position.set(0,h+.4,0);g.add(p);return}const half=(w+.6)/2,len=Math.hypot(half,rise);for(const s of[-1,1]){const p=new THREE.Mesh(new THREE.PlaneGeometry(len,d+.7),mat(tile(index,len/1.6,(d+.7)/1.6)));p.rotation.x=-Math.PI/2;p.rotation.y=s*Math.atan2(rise,half);p.position.set(s*half/2,h+rise/2,0);g.add(p)}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([-w/2,h,-d/2,w/2,h,-d/2,0,h+rise,-d/2,-w/2,h,d/2,0,h+rise,d/2,w/2,h,d/2],3));geo.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,w/1.7,0,w/3.4,rise/1.7,0,0,w/3.4,rise/1.7,w/1.7,0],2));geo.computeVertexNormals();g.add(new THREE.Mesh(geo,mat(tile(24))))}
 const shopTypes=[
  ['WARUNG MAKAN SARI','NASI CAMPUR / PATIN GORENG',16,'#973a26'],
  ['JAYA MOTOR','SERVIS / TAMBAL BAN',17,'#315463'],
  ['KOPI SIMPANG','KOPI / TEH / GORENGAN',3,'#573b28'],
  ['TOKO MAKMUR','SEMBAKO / GAS / AIR MINUM',19,'#456b45'],
  ['RANTAU CELL','PULSA / DATA / TOKEN',18,'#305e86'],
  ['BAKSO PAK DUL','BAKSO / MIE AYAM',16,'#a24324'],
  ['TOKO SINAR','BERAS / PUPUK / PERALATAN',1,'#7b622b'],
  ['PANGKAS RAMBUT','RAPI DAN HEMAT',23,'#495d59'],
  ['LAUNDRY KILAT','CUCI / SETRIKA',18,'#476e84']
 ];
 const adMats=[adTexture('SEGARIN','TEH MELATI','#506545','#e2d49c'),adTexture('KOPI POROS','KOPI BUBUK','#7e3127','#e8d7ab'),adTexture('LANGIT','PAKET DATA','#365f75','#e2dfa8'),adTexture('RANTAU','RASA PILIHAN','#8f6324','#eee1ae'),adTexture('BERSIH','DETERJEN','#696b89','#ece4b6'),adTexture('MANTAP','MIE INSTAN','#a15b26','#e7dea7')].map(t=>mat(t));
 const propMats=props.map(t=>mat(t,'#ffffff',true));
 function frontage(g,bay,x,w,h,d,idx){const entry=typeof bay==='number'?shopTypes[bay]:null;const image=entry?entry[2]:bay.front;panel(w,h,x,h/2,d/2+.013,mat(tiles[image]),g);
  if(entry){panel(w*.94,.58,x,h-.1,d/2+.035,mat(wornSign(entry[0],entry[1],'#d3ccb1',entry[3],entry[3],256,80)),g);panel(.66,.93,x-w*.35,1.3,d/2+.045,adMats[idx%adMats.length],g);if([0,2,3,5].includes(bay)){panel(1.0,.34,x,.97,d/2+.12,propMats[0],g);if(bay===3)panel(.53,1.2,x+w*.3,1.65,d/2+.08,propMats[1],g)}if(bay===1)panel(1.45,1.1,x+.4,.56,d/2+.8,propMats[2],g);if(bay===3)panel(.4,.6,x-w*.25,.32,d/2+.5,propMats[3],g);
  }else{panel(.26,.21,x+w*.3,1.65,d/2+.026,mat(wornSign(String(7+idx),'','#d5cfb8','#303c33','#d5cfb8',64,40)),g)}
 }
 function compound({x,z,w,d,h=3.2,face=Math.PI/2,wall=24,roofType='gable',roofTile=10,bays=[],awning='metal',rise=.9}){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=face;scene.add(g);box(w,h,d,0,h/2,0,mat(tile(wall),'#e0d9c7'),g,true);roof(g,w,d,h,rise,roofType,roofTile);const sum=bays.reduce((s,b)=>s+b.width,0);let cursor=-w/2;for(let i=0;i<bays.length;i++){const bay=bays[i],bw=bay.width/sum*w;frontage(g,bay.type,cursor+bw/2,bw,h,d,i+compounds.length);if(i>0)box(.16,h,.15,cursor,h/2,d/2+.04,mats.concrete,g);cursor+=bw}
  if(awning){const awDepth=awning==='tarp'?2.4:1.5;const aw=new THREE.Mesh(new THREE.PlaneGeometry(w+.25,awDepth),mat(tile(awning==='tarp'?(compounds.length%2?28:30):roofTile,(w+.25)/2,awDepth/2)));aw.rotation.x=-1.38;aw.position.set(0,h-.43,d/2+awDepth*.42);g.add(aw);for(const a of[-1,1])box(.065,h-.65,.065,a*w*.48,(h-.65)/2,d/2+awDepth*.9,mats.wood,g);if(bays.some(b=>typeof b.type==='number')){const first=bays.find(b=>typeof b.type==='number');panel(w*.6,.4,-w*.11,h-.86,d/2+awDepth*.92,mat(wornSign(shopTypes[first.type][0],shopTypes[first.type][1],first.type%2?'#953a28':'#44664c','#eee3bd','#a89056',256,64)),g)}}
  if(compounds.length%3===1)box(w*.8,.12,.7,0,.065,d/2+.4,mats.concrete,g);
  compounds.push({x,z,w,d,h,face,group:g});return g
 }
 // Closely packed combined businesses, with different rooflines and bay widths.
 compound({x:13.4,z:-19,w:13.1,d:6.7,h:3.45,face:-Math.PI/2,wall:24,roofType:'lean',bays:[{width:5.1,type:0},{width:8,type:1}],awning:'metal'});
 compound({x:12.9,z:-7.7,w:8.6,d:5.8,h:2.9,face:-Math.PI/2,wall:27,roofType:'gable',roofTile:15,bays:[{width:4.8,type:2},{width:3.8,type:3}],awning:'tarp',rise:.5});
 compound({x:14.2,z:1.6,w:9.5,d:7.2,h:3.7,face:-Math.PI/2,wall:25,roofType:'flat',bays:[{width:3.7,type:4},{width:5.8,type:5}],awning:'metal'});
 compound({x:13.2,z:12,w:7.9,d:6,h:3.05,face:-Math.PI/2,wall:26,roofType:'lean',bays:[{width:5,type:6},{width:2.9,type:7}],awning:'tarp'});
 compound({x:-13.1,z:16,w:13,d:5.8,h:3.25,face:Math.PI/2,wall:27,roofTile:10,bays:[{width:5.5,type:3},{width:4.1,type:2},{width:3.4,type:4}],awning:'tarp'});
 compound({x:-13.8,z:3,w:7.5,d:6.9,h:3.5,face:Math.PI/2,wall:24,roofType:'flat',bays:[{width:3.7,type:8},{width:3.8,type:{front:21}}],awning:false});
 compound({x:-32.1,z:8,w:8,d:6.5,h:2.75,wall:9,roofTile:29,bays:[{width:8,type:{front:6}}],awning:'metal',rise:1.2});
 compound({x:-31.2,z:19,w:10.5,d:6.6,h:3.05,wall:24,roofType:'lean',bays:[{width:6,type:{front:22}},{width:4.5,type:{front:5}}],awning:false});
 compound({x:36.8,z:-19,w:10.2,d:6.2,h:3.2,face:-Math.PI/2,wall:27,roofTile:29,bays:[{width:5.2,type:{front:7}},{width:5,type:{front:21}}],awning:'metal'});
 compound({x:35.9,z:-5,w:9.8,d:5.8,h:2.8,face:-Math.PI/2,wall:25,roofType:'lean',bays:[{width:5.8,type:{front:6}},{width:4,type:3}],awning:'tarp'});
 compound({x:36.3,z:9,w:10,d:6.4,h:3.55,face:-Math.PI/2,wall:26,roofType:'flat',bays:[{width:10,type:{front:4}}],awning:false});
 compound({x:16.2,z:23,w:8.6,d:6.3,h:3.2,face:-Math.PI/2,wall:24,roofTile:15,bays:[{width:8.6,type:{front:22}}],awning:'metal'});
 compound({x:-14.9,z:36,w:9.5,d:6.8,h:2.95,wall:27,roofType:'gable',roofTile:29,bays:[{width:5,type:{front:21}},{width:4.5,type:5}],awning:'tarp'});
 // Fuel office and red/white dispensers, with no hose geometry.
 compound({x:-26,z:-19,w:11.4,d:5.3,h:3.3,wall:27,roofType:'flat',bays:[{width:6,type:6},{width:5.4,type:3}],awning:false});
 box(10,.25,12,-14,4.8,-19,mats.red);box(10,.1,12,-14,4.62,-19,mats.white);
 for(const x of[-18.2,-9.8])for(const z of[-24.2,-13.8]){box(.18,4.5,.18,x,2.3,z,mats.white);box(.19,.85,.19,x,.47,z,mats.red)}
 const pumpMat=mat(fuelFace());for(const z of[-21.7,-16.4]){box(1.3,.13,2.5,-14,.12,z,mats.concrete,scene,true);box(.92,1.68,.67,-14,1.0,z,mats.white,scene,true);panel(.925,1.68,-14,1,z+.341,pumpMat);panel(.925,1.68,-14,1,z-.341,pumpMat,scene,Math.PI);box(.95,.14,.7,-14,1.9,z,mats.red)}
 panel(8.6,.64,-14,4.7,-12.97,mat(wornSign('PERTAMINA','SIMPANG RANTAU','#ad2922','#e9e6d1','#a52621',256,64)));box(.13,5,.13,-7.6,2.5,-26,mats.metal);panel(1.7,1.7,-7.6,4,-25.9,mat(wornSign('PERTAMINA','PERTALITE / SOLAR','#e1dcc7','#922e24','#b13228',128,128)));
 // Water tank and yard fencing.
 surface(10,11,21,-37,flatMat(13,10,11,1.8),.02);cyl(1.8,1.8,.2,21,.12,-37,mats.concrete,12);
 for(const x of[-1.1,1.1])for(const z of[-1.1,1.1])box(.14,6,.14,21+x,3,-37+z,mats.metal,scene,true);
 cyl(1.58,1.5,2.3,21,6.75,-37,mats.green,10);cyl(1.62,1.62,.12,21,7.94,-37,mats.metal,10);
 for(let y=1;y<6;y+=1.2){box(2.3,.065,.065,21,y,-38.1,mats.metal);box(2.3,.065,.065,21,y,-35.9,mats.metal)}panel(1.8,.6,21,6.8,-35.49,mat(wornSign('TIRTA RANTAU','AIR BERSIH','#b9c2aa','#284137','#638171',256,80)));
 function fence(x,z,len,angle=0){const t=stripTexture();t.wrapS=THREE.RepeatWrapping;t.repeat.x=len/1.7;const m=panel(len,1.15,x,.63,z,mat(t,'#b7aa85',true),scene,angle);addCollider(m,len,.08);for(const s of[-1,1])box(.12,1.4,.12,x+s*Math.cos(angle)*len/2,.7,z-s*Math.sin(angle)*len/2,mats.wood)}
 [[31,-21,3.6,Math.PI/2],[31,-9,2.6,Math.PI/2],[-10.4,5.1,2.2,Math.PI/2],[-29,31,4.1,0],[17,28,3,0],[-21,34,2.7,0],[-21.5,10,2.2,0]].forEach(v=>fence(...v));
 // Road polygons are shared by the scatterer and placement diagnostics.
 function onRoad(x,z,margin=0){return roadRects.some(r=>x>=r.x0-margin&&x<=r.x1+margin&&z>=r.z0-margin&&z<=r.z1+margin)}
 function insideSolid(x,z,pad=0){return colliders.some(b=>x>b.x0-pad&&x<b.x1+pad&&z>b.z0-pad&&z<b.z1+pad)}
 function pole(x,z){const y=groundHeight(x,z);cyl(.09,.14,7.2,x,y+3.6,z,mats.concrete,6);box(1.3,.08,.08,x,y+6.85,z,mats.wood);for(const dx of[-.5,0,.5])cyl(.05,.05,.13,x+dx,y+6.97,z,mats.black,6);const anchor=[x,y+7.01,z];poleRecords.push({x,z,anchor});colliders.push({x0:x-.18,x1:x+.18,z0:z-.18,z1:z+.18});return anchor}
 const poles=[[-6.8,38],[-6.8,14],[-6.8,-14],[-6.8,-36],[6.8,-39],[6.8,-18],[6.8,5],[6.8,34],[31.5,-23],[31.5,2],[31.5,24]].map(v=>pole(...v));
 const cableMat=mat(cableTexture(),'#b0ac9c',true);cableMat.alphaTest=0;cableMat.transparent=true;cableMat.depthWrite=false;cableMat.map.magFilter=THREE.LinearFilter;cableMat.map.minFilter=THREE.LinearFilter;
 function cable(a,b,depth=1.6){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([a[0],a[1]+.035,a[2],a[0],a[1]-depth,a[2],b[0],b[1]-depth,b[2],b[0],b[1]+.035,b[2]],3));g.setAttribute('uv',new THREE.Float32BufferAttribute([0,1,0,0,1,0,1,1],2));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();scene.add(new THREE.Mesh(g,cableMat));cableRecords.push({a,b})}
 [[0,1],[1,2],[2,3],[4,5],[5,6],[6,7],[3,4],[5,8],[8,9],[9,10]].forEach(([a,b])=>cable(poles[a],poles[b]));
 // Service drops end at actual roof brackets, rather than in mid-air.
 for(const [p,bx,by,bz]of[[1,-10.1,3.3,17],[5,10.05,3.4,-20],[6,10.55,3.6,2],[9,33,3,-5]]){box(.06,.55,.06,bx,by+.15,bz,mats.metal);cable(poles[p],[bx,by+.42,bz],.65)}
 // Ad hoc roadside trading: tarp shelters, tables, carts and signs.
 function shed(x,z,w=4,d=3,blue=true){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);for(const dx of[-w/2,w/2])for(const dz of[-d/2,d/2])box(.065,2.5,.065,dx,1.25,dz,mats.wood,g);const top=new THREE.Mesh(new THREE.PlaneGeometry(w+.4,d+.4),mat(tile(blue?28:30,w/1.7,d/1.7)));top.rotation.x=-Math.PI/2+.07;top.position.y=2.45;g.add(top);panel(w*.7,1.5,w*.13,1.65,-d/2,mat(tile(blue?28:30,w/2,1)),g);box(w*.6,.08,.75,0,.78,.1,mats.wood,g);for(const xx of[-w*.23,w*.23])box(.06,.75,.65,xx,.37,.1,mats.wood,g);panel(1.7,1.4,-.25,.74,.51,propMats[11],g);return g}
 shed(-9,29,3.8,3.1,true);shed(20,-14,4.4,3.5,false);shed(-33,31,4.6,3,true);
 function cart(x,z,angle=0,label='BAKSO'){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=angle;scene.add(g);panel(1.5,2.1,0,1.05,.5,propMats[4],g);panel(1.5,2.1,0,1.05,-.5,propMats[4],g,Math.PI);panel(1.1,2.1,.75,1.05,0,propMats[5],g,Math.PI/2);panel(1.1,2.1,-.75,1.05,0,propMats[5],g,-Math.PI/2);panel(1.15,.24,0,.65,.51,mat(wornSign(label,'MIE AYAM','#d8c89e','#6b3528','#968347',128,32)),g);box(1.4,.15,.95,0,.82,0,mats.wood,g,true)}
 cart(-8.1,24,-.2,'BAKSO DUL');cart(8.7,-3,-Math.PI/2,'GORENGAN');cart(24.2,19,.15,'MIE AYAM');
 const candidates=[candidateTexture(props[6],'BUDI SANTOSO',3,'#395d70'),candidateTexture(props[7],'RATNA DEWI',7,'#8b4935')].map(t=>mat(t));
 function signboard(x,z,w,h,m,angle=0,y=1.8){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=angle;scene.add(g);for(const dx of[-w*.43,w*.43])box(.07,y+h/2,.07,dx,(y+h/2)/2,0,mats.wood,g);panel(w,h,0,y,.015,m,g);panel(w,h,0,y,-.015,m,g,Math.PI);return g}
 signboard(-7.2,11,1.25,.65,mat(wornSign('BAKSO / KOPI','MASUK 10 M','#ceb666','#4b3b23','#97794c',128,64)),Math.PI/2,1.25);
 signboard(7.4,-25,3.4,1.7,candidates[0],-Math.PI/2,3);signboard(-22,25,2.6,1.5,candidates[1],.3,2.3);signboard(31.4,27,2.5,1.3,adMats[3],-Math.PI/2,2.5);signboard(-7.5,-39,3.1,1.6,adMats[2],Math.PI/2,3);
 // Hanging political and product banners, all on fixed planes.
 panel(2.8,1.6,10.4,2.35,10.2,candidates[1],scene,-Math.PI/2);panel(1.1,1.7,-10.1,2,19.3,adMats[4],scene,Math.PI/2);
 for(const [x,z]of[[-10.2,10],[9.3,-10],[31.5,12],[-29,22],[-20,31]]){panel(1.35,1.1,x,.55,z,propMats[9]);panel(1.05,1.15,x+1.6,.58,z+.4,propMats[10])}
 for(const [x,z]of[[-9,7],[8.4,17],[23.5,-27],[-21,20],[-18,-6],[31,17],[-9,26]]){const mesh=surface(2.5,2.5,x,z,propMats[8],groundHeight(x,z)+.013);mesh.rotation.z=rand()*6.28}
 for(const [x,z]of[[-10.3,20],[10,-2],[24,18]]){box(1.5,.07,.5,x,.48,z,mats.wood);for(const s of[-1,1])box(.06,.45,.4,x+s*.6,.23,z,mats.wood)}
 for(const [x,z]of[[-20,4],[36,8],[-30,18]]){box(.04,1.8,.04,x,4.5,z,mats.metal);for(let y=4.4;y<5.4;y+=.3)box(.8,.03,.03,x,y,z,mats.metal)}
 // Static accident pileups. The highway continues behind them into the haze.
 const shadowTexture=canvasTexture(64,64,c=>{const gradient=c.createRadialGradient(32,32,2,32,32,32);gradient.addColorStop(0,'rgba(32,30,22,.23)');gradient.addColorStop(1,'rgba(32,30,22,0)');c.fillStyle=gradient;c.fillRect(0,0,64,64)});const shadowMat=new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,fog:true});
 let vehicleCount=0;function vehicle(x,z,yaw,type='car',color='#7d867b',tilt=0){const g=new THREE.Group();g.position.set(x,groundHeight(x,z),z);g.rotation.set(tilt,yaw,0);scene.add(g);const truck=type==='truck',van=type==='van',w=truck?2.4:1.85,len=truck?7.4:van?4.7:4.2;const body=mat(surfaceTexture('paint',color)),front=mat(vehiclePanel('front',color)),back=mat(vehiclePanel('back',color));
  if(truck){beveledBox(g,w*.78,.3,len*.95,.72,0,mats.black,.06);truckCabin(g,w,len,body,mats.glass);beveledBox(g,w,2.3,4.9,1.9,-1.15,mat(tile(31),'#b9b8a7'),.1);panel(w,.58,0,1.1,len/2+.025,front,g);beveledBox(g,w*.98,.1,5.1,3.1,-1.15,mat(tile(28,1,3)),.035);for(const s of[-1,1]){box(.06,.4,.06,s*(w/2+.12),2.02,len/2-.5,mats.black,g);panel(.18,.32,s*(w/2+.12),2.06,len/2-.46,mats.glass,g)}}else{carBody(g,w,len,body,van);carCabin(g,w,len,body,mats.glass,van);for(const s of[-1,1])for(const part of[-1,1])panel(len*.34,.4,s*w/2+.014,.86,part*len*.2,mat(vehiclePanel('door',color)),g,s*Math.PI/2);panel(w*.83,.46,0,.71,len/2+.014,front,g);panel(w*.83,.46,0,.72,-len/2-.014,back,g,Math.PI)}
  for(const zz of[-len/2,len/2])beveledBox(g,w*.91,.13,.17,.5,zz,mats.metal,.035);
  const wheelY=truck?.43:.35;for(const sx of[-1,1])for(const zz of(truck?[-len*.37,-len*.23,len*.31]:[-len*.31,len*.31])){const tire=cyl(wheelY,wheelY,.25,sx*(w/2+.025),wheelY,zz,mats.black,10,g);tire.rotation.z=Math.PI/2;const hub=cyl(.15,.15,.26,sx*(w/2+.025),wheelY,zz,mats.metal,8,g);hub.rotation.z=Math.PI/2}const shadow=surface(w*1.6,len*1.1,x,z,shadowMat,groundHeight(x,z)+.006);shadow.rotation.z=-yaw;g.updateWorldMatrix(true,true);addCollider(g,w,len);vehicleCount++;return g}
 vehicle(-2.6,-43,.22,'truck','#bdac7e');vehicle(1.3,-42.7,-.8,'car','#8c4136',.07);vehicle(3.2,-46.7,.12,'van','#adb0a2');vehicle(-1.1,-49,1.3,'car','#546e71');vehicle(-3.0,-52,.05,'car','#b0a48b');
 vehicle(2.4,44.6,Math.PI+.25,'truck','#648177');vehicle(-1.7,44,Math.PI-.65,'car','#ada997',.1);vehicle(-3,49,Math.PI+.06,'van','#848a9c');vehicle(.8,50,Math.PI-.2,'car','#8c6b42');
 // Alpha plants: scatter only where the complete sprite footprint clears asphalt.
 const plantMats=Array.from({length:8},(_,i)=>mat(foliage?.[i]??plantTexture(i%6),'#c2c3ae',true));plantMats.forEach(m=>{m.alphaTest=.32});
 function plant(x,z,type,h,w,checkRoad=true){const aspect=plantMats[type].map.userData.cutoutAspect;if(aspect)w=h*aspect;if(reserved.some(s=>s.r>0&&Math.hypot(x-s.x,z-s.z)<s.r+w*.16))return false;if(checkRoad&&onRoad(x,z,w*.45+.35))return false;if(x>-23&&x<-7&&z>-27&&z<-11)return false;if(insideSolid(x,z,.35))return false;const mesh=panel(w,h,x,h/2,z,plantMats[type]);billboards.push(mesh);plantRecords.push({x,z,w,h,type});if(h>=4){surface(Math.min(w*.6,3),Math.min(w*.6,3),x,z,shadowMat,.007);if(x>boundsPlaceholder.x0&&x<boundsPlaceholder.x1&&z>-52&&z<52){const r=type===1?.18:.15;colliders.push({x0:x-r,x1:x+r,z0:z-r,z1:z+r})}}return true}
 const boundsPlaceholder={x0:-42,x1:43};
 for(let i=0;i<410;i++){const edge=i%4;let x,z;if(edge<2){x=(edge===0?-1:1)*(42.8+rand()*13);z=-62+rand()*124}else{x=-55+rand()*110;z=(edge===2?-1:1)*(55+rand()*13)}if(Math.abs(x)<8.5)continue;plant(x,z,i%7===0?1:i%9===0?3:0,8+rand()*10,7+rand()*7)}
 const rr=rng(31);for(let i=0;i<220;i++){const x=-41+rr()*83,z=-45+rr()*90,tall=i%4===0;plant(x,z,tall?([0,2,3,6][Math.floor(i/4)%4]):(i%3?4:7),tall?4+rr()*4.5:.8+rr()*1.7,tall?3.2:1.2+rr()*1.2)}
 for(const [x,z,t,h,w]of[[-21,-2,2,4.5,2.9],[21,6,6,4.3,2.4],[24,11,3,5.2,3.5],[-19,31,1,6,3.4],[-21,-34,0,6.5,4.5],[33,21,2,4.8,3.5],[-29,-15,4,1.8,2.5]])plant(x,z,t,h,w);
 const bounds={x0:-42,x1:43,z0:-53,z1:53};
 return {colliders,billboards,bounds,groundHeight,roadRects,plantRecords,poleRecords,cableRecords,onRoad,stats:{compounds:compounds.length,shopBays:compounds.reduce((sum,c)=>sum+c.group.children.filter(m=>m.geometry?.type==='PlaneGeometry').length,0),foliage:billboards.length,poles:poleRecords.length,vehicles:vehicleCount},spawn:{x:1.8,z:31,yaw:0},landmarks:{fuel:{x:-14,z:-19},tank:{x:21,z:-37}}};
}