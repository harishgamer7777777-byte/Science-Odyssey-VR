
const config = window.VR_CONFIG;
const container = document.getElementById("vr-scene");
const video = document.getElementById("vr-video");
const caption = document.getElementById("caption");

video.src = config.video;
video.load();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
container.appendChild(renderer.domElement);

const texture = new THREE.VideoTexture(video);
texture.colorSpace = THREE.SRGBColorSpace;

scene.add(new THREE.Mesh(
  new THREE.SphereGeometry(50,80,60),
  new THREE.MeshBasicMaterial({map:texture,side:THREE.BackSide})
));

video.addEventListener("timeupdate",()=>{
  const c=config.captions.find(x=>
    video.currentTime>=x.start && video.currentTime<x.end
  );
  caption.textContent=c?c.text:"";
});

document.getElementById("play").onclick=()=>video.play();
document.getElementById("pause").onclick=()=>video.pause();

let split=false;
document.getElementById("vr").onclick=()=>{
  split=!split;
  document.getElementById("vr").textContent=
    split?"Exit VR":"Enter phone VR";
};

document.getElementById("fullscreen").onclick=()=>{
  container.requestFullscreen?.();
};

document.getElementById("motion").onclick=async()=>{
  try{
    if(typeof DeviceOrientationEvent!=="undefined" &&
       DeviceOrientationEvent.requestPermission){
      const result=await DeviceOrientationEvent.requestPermission();
      if(result!=="granted")throw Error("Permission denied");
    }
    window.addEventListener("deviceorientation",e=>{
      if(e.alpha==null)return;
      const q=new THREE.Euler(
        THREE.MathUtils.degToRad(e.beta||0),
        THREE.MathUtils.degToRad(e.alpha||0),
        -THREE.MathUtils.degToRad(e.gamma||0),"YXZ"
      );
      camera.quaternion.setFromEuler(q);
    });
    document.getElementById("motion").textContent="Motion enabled";
  }catch(e){caption.textContent="Allow motion access in your browser.";}
};

let dragging=false,lastX=0,lastY=0,yaw=0,pitch=0;
renderer.domElement.onpointerdown=e=>{
  dragging=true;lastX=e.clientX;lastY=e.clientY;
};
window.onpointerup=()=>dragging=false;
window.onpointermove=e=>{
  if(!dragging)return;
  yaw-=(e.clientX-lastX)*.004;
  pitch-=(e.clientY-lastY)*.004;
  pitch=Math.max(-1.5,Math.min(1.5,pitch));
  camera.rotation.order="YXZ";
  camera.rotation.set(pitch,yaw,0);
  lastX=e.clientX;lastY=e.clientY;
};

function resize(){
  const w=container.clientWidth,h=container.clientHeight;
  renderer.setSize(w,h);
  camera.aspect=(split?w/2:w)/h;
  camera.updateProjectionMatrix();
}
function animate(){
  requestAnimationFrame(animate);
  const w=container.clientWidth,h=container.clientHeight;
  if(split){
    const half=Math.floor(w/2);
    camera.aspect=half/h;camera.updateProjectionMatrix();
    renderer.setScissorTest(true);
    renderer.setScissor(0,0,half,h);
    renderer.setViewport(0,0,half,h);
    renderer.render(scene,camera);
    renderer.setScissor(half,0,half,h);
    renderer.setViewport(half,0,half,h);
    renderer.render(scene,camera);
    renderer.setScissorTest(false);
  }else{
    camera.aspect=w/h;camera.updateProjectionMatrix();
    renderer.setViewport(0,0,w,h);
    renderer.render(scene,camera);
  }
}
window.onresize=resize;resize();animate();
