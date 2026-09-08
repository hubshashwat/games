/**
 * Scene Manager for Cat and Snake
 * High-fidelity PBR rendering, PCF soft shadows, atmospheric jungle fog,
 * volumetric sunbeams, and aspect-ratio adaptive camera framing for all screen sizes.
 */

import * as THREE from 'three';
import { CAMERA_VIEWS } from '../config.js';

export class SceneManager {
  constructor(canvasContainer) {
    this.container = canvasContainer;

    // 1. Three.js Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0e1c12);
    // Humid atmospheric jungle fog
    this.scene.fog = new THREE.FogExp2(0x102416, 0.014);

    // 2. Camera setup
    this.camera = new THREE.PerspectiveCamera(58, 1, 0.1, 300);
    this.cameraView = CAMERA_VIEWS.CINEMATIC;
    this.targetCameraPos = new THREE.Vector3();
    this.targetLookAt = new THREE.Vector3();
    this.cameraShakeIntensity = 0;

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
      alpha: false,
      stencil: false,
      depth: true
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.container.appendChild(this.renderer.domElement);

    // 4. Atmospheric Jungle Lighting
    this.setupLighting();

    // 5. Volumetric Canopy God Rays
    this.setupSunbeams();

    // 6. Responsive Resize Handling
    this.onResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.onResize);
    this.handleResize();
  }

  setupLighting() {
    // Ambient / Hemisphere Light: Lush canopy blue-sky top with warm amber ground bounce
    this.hemiLight = new THREE.HemisphereLight(0x7ab886, 0x2b1d11, 0.65);
    this.scene.add(this.hemiLight);

    // Warm tropical sunlight penetrating canopy
    this.sunLight = new THREE.DirectionalLight(0xfff6dd, 1.4);
    this.sunLight.position.set(12, 28, 18);
    this.sunLight.castShadow = true;

    // Shadow map tuning for high-detail contact shadows
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 1.0;
    this.sunLight.shadow.camera.far = 70;
    this.sunLight.shadow.camera.left = -12;
    this.sunLight.shadow.camera.right = 12;
    this.sunLight.shadow.camera.top = 25;
    this.sunLight.shadow.camera.bottom = -15;
    this.sunLight.shadow.bias = -0.0006;

    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // Soft emerald backlight for jungle rim lighting
    this.rimLight = new THREE.DirectionalLight(0x27ae60, 0.55);
    this.rimLight.position.set(-10, 15, -15);
    this.scene.add(this.rimLight);
  }

  setupSunbeams() {
    // Volumetric sunbeam planes filtering through canopy
    const beamGeo = new THREE.ConeGeometry(3.5, 24, 8, 1, true);
    beamGeo.rotateX(-Math.PI / 6);
    beamGeo.rotateZ(Math.PI / 8);

    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xfff0b3,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.sunbeams = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set((i % 2 === 0 ? -4 : 4), 16, i * 40);
      this.sunbeams.add(beam);
    }
    this.scene.add(this.sunbeams);
  }

  handleResize() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    const aspect = width / height;

    this.camera.aspect = aspect;

    // ADAPTIVE FIELD OF VIEW:
    // Ensures consistent horizontal view regardless of aspect ratio!
    // On vertical mobile (aspect ~0.5), expands vertical FOV so side lanes are never cropped.
    const baseFov = 56;
    const targetAspect = 16 / 9;
    if (aspect < targetAspect) {
      this.camera.fov = 2 * Math.atan(Math.tan((baseFov * Math.PI / 180) / 2) * (targetAspect / aspect)) * (180 / Math.PI);
      this.camera.fov = Math.min(85, this.camera.fov); // clamp upper bound
    } else {
      this.camera.fov = baseFov;
    }

    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  setCameraView(viewKey) {
    if (CAMERA_VIEWS[viewKey] || Object.values(CAMERA_VIEWS).includes(viewKey)) {
      this.cameraView = viewKey;
    }
  }

  triggerCameraShake(intensity = 0.4) {
    this.cameraShakeIntensity = Math.min(1.2, this.cameraShakeIntensity + intensity);
  }

  updateCamera(dt, catPosition, snakePosition, catSpeed) {
    // Compute camera offset and lookAt based on active camera view
    let targetOffset, lookAtOffset;

    if (this.cameraView === CAMERA_VIEWS.CLOSE) {
      targetOffset = new THREE.Vector3(0, 1.6, -3.2);
      lookAtOffset = new THREE.Vector3(0, 0.7, 4.5);
    } else if (this.cameraView === CAMERA_VIEWS.BEHIND_SNAKE) {
      targetOffset = new THREE.Vector3(0, 2.8, -12.5);
      lookAtOffset = new THREE.Vector3(0, 0.8, 3.0);
    } else {
      // Default: CINEMATIC DYNAMIC CHASE CAM
      // Automatically frames both the lunging serpent and the galloping cat
      const snakeHeadDist = Math.max(2.5, catPosition.z - snakePosition.z);
      const camZ = -Math.max(7.2, snakeHeadDist + 2.2);
      targetOffset = new THREE.Vector3(
        catPosition.x * 0.45,
        3.0 + catPosition.y * 0.45,
        camZ
      );
      lookAtOffset = new THREE.Vector3(
        catPosition.x * 0.55,
        1.1 + catPosition.y * 0.4,
        4.2
      );
    }

    // Target positions in world coordinates
    this.targetCameraPos.set(
      catPosition.x + targetOffset.x,
      targetOffset.y,
      catPosition.z + targetOffset.z
    );

    this.targetLookAt.set(
      catPosition.x + lookAtOffset.x,
      lookAtOffset.y,
      catPosition.z + lookAtOffset.z
    );

    // Smooth camera damping
    const lerpSpeed = 10.0 * dt;
    this.camera.position.lerp(this.targetCameraPos, Math.min(1.0, lerpSpeed));
    this.camera.lookAt(this.targetLookAt);

    // Apply Camera Shake on near misses, lunges, or trips
    if (this.cameraShakeIntensity > 0.001) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.cameraShakeIntensity = THREE.MathUtils.lerp(this.cameraShakeIntensity, 0, dt * 8);
    }

    // Dynamic sunlight and shadow box tracking player
    this.sunLight.position.set(catPosition.x + 12, 28, catPosition.z + 18);
    this.sunLight.target.position.set(catPosition.x, 0, catPosition.z + 8);
    this.sunLight.target.updateMatrixWorld();

    // Sunbeams follow along
    this.sunbeams.position.z = Math.floor(catPosition.z / 40) * 40;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  setQuality(quality = 'high') {
    if (quality === 'low') {
      this.renderer.shadowMap.enabled = false;
      this.renderer.setPixelRatio(1.0);
    } else if (quality === 'medium') {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.BasicShadowMap;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    } else {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    }
  }

  destroy() {
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
