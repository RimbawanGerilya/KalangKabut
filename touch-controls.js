export function createTouchControls({canvas,isActive,onLook,onJump,onMode}){
 const root=document.querySelector('#touch-controls'),pad=document.querySelector('#move-pad'),knob=document.querySelector('#move-knob'),run=document.querySelector('#touch-run'),jump=document.querySelector('#touch-jump');
 const state={enabled:matchMedia('(pointer: coarse)').matches,side:0,forward:0,running:false};let moveId=null,lookId=null,origin=null,lastLook=null;
 function release(el,id){if(id!==null&&el.hasPointerCapture?.(id)){try{el.releasePointerCapture(id)}catch{}}}
 function resetMove(){const id=moveId;moveId=null;origin=null;state.side=state.forward=0;knob.style.transform='translate(0px,0px)';pad.classList.remove('pressed');release(pad,id)}
 function resetLook(){const id=lookId;lookId=null;lastLook=null;release(canvas,id)}
 function reset(){resetMove();resetLook();state.running=false;run.setAttribute('aria-pressed','false')}
 function setEnabled(value){if(value===state.enabled&&document.body.classList.contains('touch-mode')===value)return;state.enabled=value;reset();document.body.classList.toggle('touch-mode',value);onMode(value);root.classList.toggle('hidden',!value||!isActive())}
 function sync(){root.classList.toggle('hidden',!state.enabled||!isActive())}
 function move(e){const dx=e.clientX-origin.x,dy=e.clientY-origin.y,radius=origin.radius,length=Math.hypot(dx,dy),scale=length>radius?radius/length:1;knob.style.transform=`translate(${dx*scale}px,${dy*scale}px)`;const strength=Math.max(0,(Math.min(length/radius,1)-.09)/.91);state.side=length?dx/length*strength:0;state.forward=length?-dy/length*strength:0}
 document.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')setEnabled(true)},{capture:true});
 pad.addEventListener('pointerdown',e=>{if(!isActive()||e.pointerType!=='touch'||moveId!==null)return;e.preventDefault();const rect=pad.getBoundingClientRect();origin={x:rect.left+rect.width/2,y:rect.top+rect.height/2,radius:rect.width*.34};moveId=e.pointerId;pad.setPointerCapture(moveId);pad.classList.add('pressed');move(e)});
 pad.addEventListener('pointermove',e=>{if(e.pointerId===moveId){e.preventDefault();move(e)}});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(event,e=>{if(e.pointerId===moveId)resetMove()});
 canvas.addEventListener('pointerdown',e=>{if(!isActive()||e.pointerType!=='touch'||e.clientX<innerWidth*.4||lookId!==null)return;e.preventDefault();lookId=e.pointerId;lastLook={x:e.clientX,y:e.clientY};canvas.setPointerCapture(lookId)});
 canvas.addEventListener('pointermove',e=>{if(e.pointerId!==lookId)return;e.preventDefault();onLook(e.clientX-lastLook.x,e.clientY-lastLook.y);lastLook={x:e.clientX,y:e.clientY}});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{if(e.pointerId===lookId)resetLook()});
 function toggleRun(e){e.preventDefault();if(!isActive())return;state.running=!state.running;run.setAttribute('aria-pressed',String(state.running))}
 run.addEventListener('pointerdown',toggleRun);
 run.addEventListener('click',e=>{if(e.detail===0)toggleRun(e)});
 jump.addEventListener('pointerdown',e=>{if(!isActive())return;e.preventDefault();onJump()});
 jump.addEventListener('click',e=>{if(e.detail===0&&isActive())onJump()});
 // Initial mode also configures the title-screen instructions and resolution.
 document.body.classList.toggle('touch-mode',state.enabled);onMode(state.enabled);sync();
 addEventListener('resize',reset);
 return {state,reset,sync};
}