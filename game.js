from pathlib import Path

path = Path("game.js")
if not path.exists():
    raise SystemExit("Coloque este script na pasta do jogo, junto de game.js.")

source = path.read_text(encoding="utf-8")
changes = [
    (
        "m.userData.solid=true;m.name=name;scene.add(m);obstacles.push(m);return m;",
        "m.userData.solid=true;m.userData.dimensions=new THREE.Vector3(sx,sy,sz);m.name=name;scene.add(m);obstacles.push(m);return m;"
    ),
    (
"""function buildArena(){
 arenaGroup=new THREE.Group();scene.add(arenaGroup);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(76,76),mat(0x626c68));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
 const grid=new THREE.GridHelper(76,38,0x687a72,0x758078);grid.position.y=.012;scene.add(grid);
 const wall=mat(0x37464b),container=mat(0x344f50),crate=mat(0x766a53),dark=mat(0x28363b);""",
"""function makeSandTexture(){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
 const ctx=canvas.getContext('2d');
 ctx.fillStyle='#c9b184';ctx.fillRect(0,0,512,512);
 let seed=918273;
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<38;i++){
  const x=random()*512,y=random()*512,r=18+random()*55;
  const g=ctx.createRadialGradient(x,y,0,x,y,r);
  g.addColorStop(0,random()>.5?'rgba(105,83,52,.13)':'rgba(255,238,193,.20)');
  g.addColorStop(1,'rgba(201,177,132,0)');
  ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
 }
 for(let i=0;i<22000;i++){
  const x=random()*512,y=random()*512,s=.5+random()*2.2;
  const shade=random()>.5?'rgba(105,83,52,'+(.04+random()*.12)+')':'rgba(255,245,218,'+(.04+random()*.16)+')';
  ctx.fillStyle=shade;ctx.fillRect(x,y,s,s);
 }
 for(let i=0;i<150;i++){
  const x=random()*512,y=random()*512;
  ctx.strokeStyle='rgba(112,91,61,'+(.04+random()*.10)+')';
  ctx.lineWidth=.5+random()*1.2;ctx.beginPath();ctx.moveTo(x,y);
  ctx.lineTo(x+random()*13,y+random()*5);ctx.stroke();
 }
 const texture=new THREE.CanvasTexture(canvas);
 texture.colorSpace=THREE.SRGBColorSpace;
 texture.wrapS=THREE.RepeatWrapping;texture.wrapT=THREE.RepeatWrapping;
 texture.repeat.set(19,19);
 texture.anisotropy=renderer.capabilities.getMaxAnisotropy();
 return texture;
}
function buildArena(){
 arenaGroup=new THREE.Group();scene.add(arenaGroup);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(76,76),new THREE.MeshStandardMaterial({color:0xf1dfb8,map:makeSandTexture(),roughness:1}));
 floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
 const wall=mat(0x8d826e),container=mat(0x59604d),crate=mat(0x8c704c),dark=mat(0x48463b);"""
    ),
    (
        " const siteMat=new THREE.MeshBasicMaterial({color:0x48dca1,transparent:true,opacity:.16});",
        " const siteMat=new THREE.MeshBasicMaterial({color:0x8a7655,transparent:true,opacity:.12,depthWrite:false});"
    ),
    (
        "yaw-=dx*.0032;pitch=clamp(pitch-dy*.0032,-1.25,1.25);player.rotation.y=yaw;camera.rotation.x=pitch;",
        "yaw-=dx*.0032;pitch=clamp(pitch-dy*.0032,-1.25,1.25);player.rotation.y=yaw;camera.rotation.x=-pitch;"
    ),
    (
        " const v=new THREE.Vector3(x,0,-z);if(v.lengthSq()>1)v.normalize();",
        " const v=new THREE.Vector3(x,0,z);if(v.lengthSq()>1)v.normalize();"
    ),
    (
        " for(const o of obstacles){const p=o.position,s=o.scale;if(Math.abs(next.x-p.x)<s.x/2+radius&&Math.abs(next.z-p.z)<s.z/2+radius&&next.y<s.y){blocked=true;break;}}",
""" for(const o of obstacles){
  const p=o.position,d=o.userData.dimensions;
  const obstacleBottom=p.y-d.y/2,obstacleTop=p.y+d.y/2;
  const overlapsPlayerHeight=obstacleTop>0&&obstacleBottom<1.75;
  if(overlapsPlayerHeight&&Math.abs(next.x-p.x)<d.x/2+radius&&Math.abs(next.z-p.z)<d.z/2+radius){blocked=true;break;}
 }"""
    ),
    (
        "player.position.set(0,0,29);yaw=Math.PI;pitch=0;player.rotation.y=yaw;camera.rotation.set(0,0,0);",
        "player.position.set(0,0,29);yaw=0;pitch=0;player.rotation.y=yaw;camera.rotation.set(0,0,0);"
    )
]

for old, new in changes:
    if old not in source:
        raise SystemExit("Não foi possível aplicar: trecho original não encontrado. Nenhuma alteração salva.")
    source = source.replace(old, new, 1)

backup = path.with_suffix(".js.backup")
backup.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
path.write_text(source, encoding="utf-8")
print("OK! game.js atualizado. Backup criado em game.js.backup")
