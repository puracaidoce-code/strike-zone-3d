let THREE;


const $ = id => document.getElementById(id);
const ui = {
  loading:$('loading'), menu:$('menu'), hud:$('hud'), end:$('endScreen'),
  start:$('start'), pause:$('pause'), pausePanel:$('pausePanel'),
  resume:$('resume'), exit:$('exit'), again:$('again'), backMenu:$('backMenu'),
  joystick:$('joystick'), stick:$('stick'), lookArea:$('lookArea'),
  fire:$('fire'), reload:$('reload'), reloadTouch:$('reloadTouch'),
  health:$('health'), healthFill:$('healthFill'), ammo:$('ammo'), reserve:$('reserve'),
  kills:$('kills'), finalKills:$('finalKills'), endTitle:$('endTitle'),
  hitmarker:$('hitmarker'), feed:$('feed'), center:$('centerMessage')
};
let scene,camera,renderer,clock,player,weaponRay,arenaGroup;
let bots=[], obstacles=[], bullets=[];
let running=false,paused=false,health=100,kills=0,ammo=30,reserve=90;
let yaw=0,pitch=0,moveAxis=new THREE.Vector2(),lookPointer=null,lastLook={x:0,y:0};
let lastShot=0,reloading=false,roundTime=120,spawnTimer=0,damageFlash=0;
const raycaster=new THREE.Raycaster();
const mats={};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function mat(color,roughness=.85){return new THREE.MeshStandardMaterial({color,roughness});}
function box(x,y,z,sx,sy,sz,material,name='cover'){
 const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;m.userData.solid=true;m.name=name;scene.add(m);obstacles.push(m);return m;
}
function init(){
 scene=new THREE.Scene();scene.background=new THREE.Color(0x8a9ba0);scene.fog=new THREE.Fog(0x8a9ba0,32,95);
 camera=new THREE.PerspectiveCamera(76,innerWidth/innerHeight,.08,130);
 renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);
 renderer.shadowMap.enabled=false;renderer.outputColorSpace=THREE.SRGBColorSpace;
 $('game').appendChild(renderer.domElement);
 clock=new THREE.Clock();
 scene.add(new THREE.HemisphereLight(0xc6e2ec,0x35413c,2.1));
 const sun=new THREE.DirectionalLight(0xffe2bd,2.0);sun.position.set(-18,28,12);scene.add(sun);
 buildArena();createPlayer();weaponRay=new THREE.Raycaster();
 window.addEventListener('resize',resize);bindControls();
 ui.loading.classList.add('hidden');
 animate();
}
function buildArena(){
 arenaGroup=new THREE.Group();scene.add(arenaGroup);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(76,76),mat(0x626c68));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
 const grid=new THREE.GridHelper(76,38,0x687a72,0x758078);grid.position.y=.012;scene.add(grid);
 const wall=mat(0x37464b),container=mat(0x344f50),crate=mat(0x766a53),dark=mat(0x28363b);
 box(0,2,-38,76,4,1,wall,'north wall');box(0,2,38,76,4,1,wall,'south wall');
 box(-38,2,0,1,4,76,wall,'west wall');box(38,2,0,1,4,76,wall,'east wall');
 // warehouse columns and cargo cover
 for(let x of [-26,-13,0,13,26]){box(x,3,-31,1,6,1,dark);box(x,3,31,1,6,1,dark);}
 box(-17,1.3,-10,10,2.6,4,container,'cargo');box(16,1.3,11,11,2.6,4,container,'cargo');
 box(0,1.2,0,7,2.4,3,crate,'central crate');
 box(-8,.85,17,5,1.7,2.2,crate);box(9,.85,-18,5,1.7,2.2,crate);
 box(-27,1,4,3,2,8,container);box(27,1,-5,3,2,8,container);
 // site floor markings
 const siteMat=new THREE.MeshBasicMaterial({color:0x48dca1,transparent:true,opacity:.16});
 for(const [x,z] of [[-26,-25],[26,25]]){let p=new THREE.Mesh(new THREE.PlaneGeometry(10,10),siteMat);p.rotation.x=-Math.PI/2;p.position.set(x,.025,z);scene.add(p);}
 // overhead warehouse beams
 for(let z of [-25,0,25])box(0,7,z,74,.3,.4,dark,'beam');
}
function createPlayer(){
 player=new THREE.Group();player.position.set(0,0,29);scene.add(player);
 camera.position.set(0,1.65,0);player.add(camera);
 // simple first-person rifle silhouette
 const gun=new THREE.Group();camera.add(gun);gun.position.set(.32,-.28,-.62);
 const body=new THREE.Mesh(new THREE.BoxGeometry(.18,.16,.58),mat(0x202b2e));body.position.z=-.12;gun.add(body);
 const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.42,8),mat(0x111719));barrel.rotation.x=Math.PI/2;barrel.position.set(0,.03,-.55);gun.add(barrel);
 const grip=new THREE.Mesh(new THREE.BoxGeometry(.09,.22,.12),mat(0x171d1e));grip.position.set(0,-.16,-.08);grip.rotation.x=-.2;gun.add(grip);
}
function makeBot(pos,index){
 const group=new THREE.Group();group.position.copy(pos);scene.add(group);
 const uniform=mat(index%2?0x9a6650:0x536b62),dark=mat(0x222b2b),skin=mat(0xb68c6d);
 const torso=new THREE.Mesh(new THREE.BoxGeometry(.72,1.05,.42),uniform);torso.position.y=1.05;torso.castShadow=true;group.add(torso);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.25,10,8),skin);head.position.y=1.78;head.castShadow=true;group.add(head);
 const helmet=new THREE.Mesh(new THREE.SphereGeometry(.27,10,7,0,Math.PI*2,0,Math.PI/2),dark);helmet.position.y=1.9;group.add(helmet);
 for(let side of [-1,1]){let leg=new THREE.Mesh(new THREE.BoxGeometry(.25,.72,.3),dark);leg.position.set(side*.2,.38,0);group.add(leg);let arm=new THREE.Mesh(new THREE.BoxGeometry(.2,.7,.22),uniform);arm.position.set(side*.48,1.08,-.04);group.add(arm);}
 const bot={group,hp:100,alive:true,fireAt:Math.random()*1.5,moveSeed:Math.random()*10,hitFlash:0,index};
 bots.push(bot);return bot;
}
function spawnBots(){
 bots.forEach(b=>scene.remove(b.group));bots=[];
 const spots=[[-23,0,-22],[22,0,-22],[-25,0,19],[24,0,8],[-4,0,-28],[8,0,-8]];
 spots.forEach((p,i)=>makeBot(new THREE.Vector3(p[0],0,p[2]),i));
}
function bindControls(){
 ui.start.addEventListener('click',startGame);
 ui.pause.addEventListener('click',togglePause);ui.resume.addEventListener('click',togglePause);
 ui.exit.addEventListener('click',()=>{togglePause();endGame(false)});
 ui.again.addEventListener('click',()=>{ui.end.classList.add('hidden');startGame()});
 ui.backMenu.addEventListener('click',()=>{ui.end.classList.add('hidden');ui.menu.classList.remove('hidden')});
 ui.fire.addEventListener('pointerdown',e=>{e.preventDefault();shoot()});
 ui.reload.addEventListener('click',reload);ui.reloadTouch.addEventListener('click',reload);
 const joy=ui.joystick;let joyId=null,rect;
 joy.addEventListener('pointerdown',e=>{joyId=e.pointerId;joy.setPointerCapture(joyId);rect=joy.getBoundingClientRect();joyMove(e);});
 joy.addEventListener('pointermove',e=>{if(e.pointerId===joyId)joyMove(e)});
 const joyEnd=e=>{if(e.pointerId===joyId){joyId=null;moveAxis.set(0,0);ui.stick.style.transform='translate(-50%,-50%)';}};
 joy.addEventListener('pointerup',joyEnd);joy.addEventListener('pointercancel',joyEnd);
 function joyMove(e){let dx=e.clientX-(rect.left+rect.width/2),dy=e.clientY-(rect.top+rect.height/2),max=38;let len=Math.hypot(dx,dy);if(len>max){dx=dx/len*max;dy=dy/len*max;}moveAxis.set(dx/max,-dy/max);ui.stick.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;}
 ui.lookArea.addEventListener('pointerdown',e=>{if(lookPointer!==null)return;lookPointer=e.pointerId;lastLook={x:e.clientX,y:e.clientY};ui.lookArea.setPointerCapture(lookPointer)});
 ui.lookArea.addEventListener('pointermove',e=>{if(e.pointerId!==lookPointer)return;let dx=e.clientX-lastLook.x,dy=e.clientY-lastLook.y;lastLook={x:e.clientX,y:e.clientY};look(dx,dy)});
 const lookEnd=e=>{if(e.pointerId===lookPointer)lookPointer=null};
 ui.lookArea.addEventListener('pointerup',lookEnd);ui.lookArea.addEventListener('pointercancel',lookEnd);
 window.addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='Space')shoot();if(e.code==='KeyR')reload();if(e.code==='Escape')togglePause()});
 window.addEventListener('keyup',e=>keys[e.code]=false);
}
const keys={};
function look(dx,dy){yaw-=dx*.0032;pitch=clamp(pitch-dy*.0032,-1.25,1.25);player.rotation.y=yaw;camera.rotation.x=pitch;}
function startGame(){
 health=100;kills=0;ammo=30;reserve=90;roundTime=120;reloading=false;paused=false;spawnBots();
 player.position.set(0,0,29);yaw=Math.PI;pitch=0;player.rotation.y=yaw;camera.rotation.set(0,0,0);
 ui.menu.classList.add('hidden');ui.end.classList.add('hidden');ui.hud.classList.remove('hidden');ui.pausePanel.classList.add('hidden');
 updateHud();say('ELIMINE A EQUIPE ADVERSÁRIA');running=true;clock.getDelta();
}
function togglePause(){if(!running)return;paused=!paused;ui.pausePanel.classList.toggle('hidden',!paused);}
function shoot(){
 if(!running||paused||reloading||performance.now()-lastShot<155)return;
 if(ammo<=0){say('SEM MUNIÇÃO · RECARREGUE');return;}
 lastShot=performance.now();ammo--;updateHud();
 const dir=new THREE.Vector3();camera.getWorldDirection(dir);
 raycaster.setFromCamera(new THREE.Vector2(0,0),camera);raycaster.far=75;
 const targets=[];
 bots.filter(b=>b.alive).forEach(b=>{b.group.traverse(o=>{if(o.isMesh){o.userData.bot=b;targets.push(o)}})});
 const hits=raycaster.intersectObjects([...targets,...obstacles],false);
 if(hits.length&&hits[0].object.userData.bot){
  const bot=hits[0].object.userData.bot;bot.hp-=34;bot.hitFlash=.15;ui.hitmarker.classList.add('show');setTimeout(()=>ui.hitmarker.classList.remove('show'),100);
  if(bot.hp<=0){bot.alive=false;scene.remove(bot.group);kills++;ui.kills.textContent=String(kills).padStart(2,'0');addFeed('VOCÊ','BOT ELIMINADO');if(bots.every(b=>!b.alive))setTimeout(()=>endGame(true),900);}
 }else if(hits.length){/* cover absorbs the shot */}
 updateHud();
}
function reload(){if(!running||paused||reloading||ammo===30||reserve<=0)return;reloading=true;say('RECARREGANDO');setTimeout(()=>{let n=Math.min(30-ammo,reserve);ammo+=n;reserve-=n;reloading=false;updateHud()},1150);}
function updateHud(){ui.health.textContent=Math.ceil(health);ui.healthFill.style.width=health+'%';ui.ammo.textContent=ammo;ui.reserve.textContent=reserve;}
function addFeed(a,b){let d=document.createElement('div');d.textContent=`${a}  ×  ${b}`;ui.feed.prepend(d);while(ui.feed.children.length>3)ui.feed.lastChild.remove();setTimeout(()=>d.remove(),3500);}
let messageTimer;
function say(t){ui.center.textContent=t;ui.center.classList.remove('hidden');clearTimeout(messageTimer);messageTimer=setTimeout(()=>ui.center.classList.add('hidden'),1600);}
function endGame(win){running=false;ui.hud.classList.add('hidden');ui.end.classList.remove('hidden');ui.finalKills.textContent=String(kills).padStart(2,'0');ui.endTitle.innerHTML=win?'ARENA<br><em>DOMINADA</em>':'OPERAÇÃO<br><em>ENCERRADA</em>';}
function botUpdate(dt){
 for(const b of bots){if(!b.alive)continue;
  const toPlayer=new THREE.Vector3().subVectors(player.position,b.group.position);toPlayer.y=0;
  const dist=toPlayer.length();b.group.lookAt(player.position.x,0,player.position.z);
  if(dist>8){let dir=toPlayer.normalize();let strafe=Math.sin(performance.now()*.0007+b.moveSeed)*.35;b.group.position.addScaledVector(dir,dt*1.55);b.group.position.x+=Math.cos(b.moveSeed)*strafe*dt;b.group.position.z+=Math.sin(b.moveSeed)*strafe*dt;}
  b.group.position.x=clamp(b.group.position.x,-34,34);b.group.position.z=clamp(b.group.position.z,-34,34);
  // Keep bots from clipping directly through the large center obstacle.
  if(dist<25&&performance.now()/1000>b.fireAt){b.fireAt=performance.now()/1000+1.15+Math.random()*.9;
    if(dist<27&&Math.random()<.58){health=Math.max(0,health-(4+Math.random()*5));updateHud();damageFlash=.2;if(health<=0){endGame(false);return;}}
  }
 }
}
function playerUpdate(dt){
 let x=moveAxis.x,z=moveAxis.y;
 if(keys.KeyW||keys.ArrowUp)z+=1;if(keys.KeyS||keys.ArrowDown)z-=1;if(keys.KeyA||keys.ArrowLeft)x-=1;if(keys.KeyD||keys.ArrowRight)x+=1;
 const v=new THREE.Vector3(x,0,-z);if(v.lengthSq()>1)v.normalize();
 const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
 const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
 const delta=forward.multiplyScalar(v.z).add(right.multiplyScalar(v.x)).multiplyScalar(5.2*dt);
 const next=player.position.clone().add(delta);
 // Basic collision against obstacle boxes.
 const radius=.42;
 let blocked=false;
 for(const o of obstacles){const p=o.position,s=o.scale;if(Math.abs(next.x-p.x)<s.x/2+radius&&Math.abs(next.z-p.z)<s.z/2+radius&&next.y<s.y){blocked=true;break;}}
 if(!blocked)player.position.copy(next);
 player.position.x=clamp(player.position.x,-35,35);player.position.z=clamp(player.position.z,-35,35);
}
function animate(){
 requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);
 if(running&&!paused){playerUpdate(dt);botUpdate(dt);roundTime-=dt;if(roundTime<=0){endGame(kills>=3);} }
 renderer.render(scene,camera);
}
function resize(){if(!camera||!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));}

import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js')
  .then(module => {
    THREE = module;
    init();
  })
  .catch(error => {
    console.error('Falha ao carregar Three.js:', error);
    const loading = document.getElementById('loading');
    if (loading) {
      const span = loading.querySelector('span');
      if (span) span.textContent = 'ERRO THREE.JS: ' + (error && error.message ? error.message : String(error));
    }
  });
       
