import * as THREE from "https://unpkg.com/three@0.126.1/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js";
import {GUI} from "https://unpkg.com/three/examples/jsm/libs/dat.gui.module.js";
import {vertexShader, fragmentShader} from "./shaders.js";

function IVimageProcessing(height, width, imageProcessingMaterial) {
  this.height = height;
  this.width = width;

  //3 rtt setup
  this.scene = new THREE.Scene();
  // prettier-ignore
  this.orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1);

  //4 create a target texture
  var options = {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
               // type:THREE.FloatType
    type: THREE.UnsignedByteType,
  };
  this.rtt = new THREE.WebGLRenderTarget(width, height, options);

  var geom = new THREE.BufferGeometry();
  geom.addAttribute(
    "position",
    new THREE.BufferAttribute(
      new Float32Array(
        // prettier-ignore
        [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0]
      ),
      3
    )
  );
  geom.addAttribute(
    "uv",
    new THREE.BufferAttribute(
      new Float32Array(
        // prettier-ignore
        [ 0,0, 1,0, 1,1, 0,0, 1,1, 0,1 ]
      ),
      2
    )
  );
  this.scene.add(new THREE.Mesh(geom, imageProcessingMaterial));
}

function IVprocess(imageProcessing, renderer) {
  renderer.setRenderTarget(imageProcessing.rtt);
  renderer.render(imageProcessing.scene, imageProcessing.orthoCamera);
  renderer.setRenderTarget(null);
}

var camera, controls, scene, renderer, container;
var plane;

// VIDEO AND THE ASSOCIATED TEXTURE
var video, videoTexture;

var imageProcessing, imageProcessingMaterial;

// GUI
var gui;

init();
animate();

function init() {
  container = document.createElement("div");
  document.body.appendChild(container);

  scene = new THREE.Scene();

  renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
  renderer.autoClear = false;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = false;

  container.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.001,
    10
  );
  camera.position.z = 0.7;
  controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 0.005;
  controls.maxDistance = 1.0;
  controls.enableRotate = true;
  controls.addEventListener("change", render);
  controls.update();

  video = document.createElement("video");
  video.src = "./assets/video.mp4";
  video.load();
  video.muted = true;
  video.loop = true;

  video.onloadeddata = function () {
    videoTexture = new THREE.VideoTexture(video);
    videoTexture.wrapS = videoTexture.wrapT = THREE.RepeatWrapping;
    videoTexture.minFilter = THREE.NearestFilter;
    videoTexture.magFilter = THREE.NearestFilter;
    videoTexture.generateMipmaps = false;
    videoTexture.format = THREE.RGBFormat;

    const srcLUT = new THREE.TextureLoader().load('./assets/src.png');
    const dstLUT = new THREE.TextureLoader().load('./assets/dst.png');

    srcLUT.minFilter = THREE.NearestFilter;
    srcLUT.magFilter = THREE.NearestFilter;
    dstLUT.minFilter = THREE.NearestFilter;
    dstLUT.magFilter = THREE.NearestFilter;

    imageProcessingMaterial = new THREE.ShaderMaterial({
      uniforms: {
	// Image scaling
        scaleX: {type: "f", value: 1.0},
        scaleY: {type: "f", value: 1.0},
        interpolation: {type: "i", value: 0},
        image: {type: "t", value: videoTexture},
        srcLUT: {type: "t", value: srcLUT},
        dstLUT: {type: "t", value: dstLUT},
        resolution: {
          type: "2f",
          value: new THREE.Vector2(video.videoWidth, video.videoHeight),
        },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: THREE.DoubleSide,
    });

    imageProcessing = new IVimageProcessing(
      video.videoHeight,
      video.videoWidth,
      imageProcessingMaterial
    );

    var geometry = new THREE.PlaneGeometry(
      1,
      video.videoHeight / video.videoWidth,
    );
    var material = new THREE.MeshBasicMaterial({
      map: imageProcessing.rtt.texture,
      side: THREE.DoubleSide,
    });
    plane = new THREE.Mesh(geometry, imageProcessingMaterial);
    plane.receiveShadow = false;
    plane.castShadow = false;
    scene.add(plane);

    var geometry2 = new THREE.PlaneGeometry(
      1,
      video.videoHeight / video.videoWidth
    );
    var material2 = new THREE.MeshBasicMaterial({
      map: videoTexture,
      side: THREE.DoubleSide,
    });
    plane = new THREE.Mesh(geometry2, material2);
    plane.position.z = -0.5;
    plane.receiveShadow = false;
    plane.castShadow = false;
    scene.add(plane);

    var pausePlayObj = {
      pausePlay: function () {
        if (!video.paused) {
          video.pause();
        } else {
          video.play();
        }
      },
      add10sec: function () {
        video.currentTime = video.currentTime + 10;
      },
    };

    gui = new GUI();
    gui.add(pausePlayObj, "pausePlay").name("Pause/play video");
    gui.add(pausePlayObj, "add10sec").name("Add 10 seconds");
    video.play();
  };

  window.addEventListener("resize", onWindowResize, false);
}

function render() {
  renderer.clear();

  if (typeof imageProcessing !== "undefined")
    IVprocess(imageProcessing, renderer);
  renderer.render(scene, camera);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  render();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}
