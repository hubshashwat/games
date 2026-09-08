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
    this.scene.background = new THREE.Color(0x0c1c13);
    // Humid atmospheric tropical rainforest fog with natural depth falloff
    this.scene.fog = new THREE.FogExp2(0x0c1c13, 0.0088);

    // 2. Camera setup
    this.camera = new THREE.PerspectiveCamera(58, 1, 0.1, 350);
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
    this.renderer.toneMappingExposure = 1.15;

    this.container.appendChild(this.renderer.domElement);

    // 4. Atmospheric Sky Dome & Backdrop
    this.setupSkyDome();

    // 5. Atmospheric Jungle Lighting
    this.setupLighting();

    // 6. Volumetric Canopy God Rays
    this.setupSunbeams();

    // 7. Ground Mist Layers
    this.setupGroundMist();

    // 8. Responsive Resize Handling
    this.onResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.onResize);
    this.handleResize();
  }

  setupSkyDome() {
    // Majestic procedural sky dome with canopy gradient and golden sun aura
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0.0, '#06130c'); // Deep canopy zenith
    grad.addColorStop(0.35, '#0e2617'); // Upper rainforest foliage
    grad.addColorStop(0.65, '#224a2d'); // Mid canopy glow
    grad.addColorStop(0.85, '#5c522a'); // Warm golden sun break
    grad.addColorStop(1.0, '#12281a'); // Distant humid horizon mist

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Add soft sun flare glow in upper atmosphere
    const sunGrad = ctx.createRadialGradient(320, 360, 10, 320, 360, 220);
    sunGrad.addColorStop(0, 'rgba(255, 235, 170, 0.45)');
    sunGrad.addColorStop(0.5, 'rgba(230, 180, 80, 0.15)');
    sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, 512, 512);

    const skyTexture = new THREE.CanvasTexture(canvas);
    const skyGeo = new THREE.SphereGeometry(260, 24, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      map: skyTexture,
      side: THREE.BackSide,
      depthWrite: false
    });

    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyDome);
  }

  setupLighting() {
    // Ambient / Hemisphere Light: Natural rainforest canopy ambient with warm rich loam ground bounce
    this.hemiLight = new THREE.HemisphereLight(0x769b82, 0x362114, 0.65);
    this.scene.add(this.hemiLight);

    // Warm golden tropical sunlight penetrating canopy
    this.sunLight = new THREE.DirectionalLight(0xfff4dc, 2.2);
    this.sunLight.position.set(14, 30, 20);
    this.sunLight.castShadow = true;

    // Shadow map tuning for ultra-sharp contact shadows
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 1.0;
    this.sunLight.shadow.camera.far = 80;
    this.sunLight.shadow.camera.left = -14;
    this.sunLight.shadow.camera.right = 14;
    this.sunLight.shadow.camera.top = 28;
    this.sunLight.shadow.camera.bottom = -18;
    this.sunLight.shadow.normalBias = 0.038;
    this.sunLight.shadow.bias = -0.0004;

    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // Subtle golden-lime backlight for jungle rim lighting
    this.rimLight = new THREE.DirectionalLight(0x8ae068, 0.55);
    this.rimLight.position.set(-12, 18, -16);
    this.scene.add(this.rimLight);

    // Dynamic character fill light tracking the cat & serpent
    this.playerFillLight = new THREE.PointLight(0xffeedb, 1.0, 16, 1.5);
    this.playerFillLight.position.set(0, 3, 0);
    this.scene.add(this.playerFillLight);
  }

  setupSunbeams() {
    // Delicate volumetric sunbeams filtering softly through high branches
    const beamGeo = new THREE.ConeGeometry(4.0, 32, 10, 1, true);
    beamGeo.rotateX(-Math.PI / 6);
    beamGeo.rotateZ(Math.PI / 9);

    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffecb3,
      transparent: true,
      opacity: 0.028,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.sunbeams = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set((i % 2 === 0 ? -5.5 : 5.5), 20, i * 36);
      this.sunbeams.add(beam);
    }
    this.scene.add(this.sunbeams);
  }

  setupGroundMist() {
    // Soft atmospheric ground mist hovering right above the jungle floor
    const mistCanvas = document.createElement('canvas');
    mistCanvas.width = 256;
    mistCanvas.height = 256;
    const mCtx = mistCanvas.getContext('2d');
    const mGrad = mCtx.createRadialGradient(128, 128, 20, 128, 128, 128);
    mGrad.addColorStop(0, 'rgba(180, 220, 195, 0.35)');
    mGrad.addColorStop(0.6, 'rgba(140, 180, 160, 0.15)');
    mGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    mCtx.fillStyle = mGrad;
    mCtx.fillRect(0, 0, 256, 256);

    const mistTexture = new THREE.CanvasTexture(mistCanvas);
    const mistGeo = new THREE.PlaneGeometry(18, 48);
    mistGeo.rotateX(-Math.PI / 2);

    const mistMat = new THREE.MeshBasicMaterial({
      map: mistTexture,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.groundMist = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const mistPlane = new THREE.Mesh(mistGeo, mistMat);
      mistPlane.position.set((i - 1) * 1.5, 0.22, i * 40);
      this.groundMist.add(mistPlane);
    }
    this.scene.add(this.groundMist);
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
    // Single locked cinematic angle where serpent and cat look best
  }

  triggerCameraShake(intensity = 0.4) {
    this.cameraShakeIntensity = Math.min(1.2, this.cameraShakeIntensity + intensity);
  }

  updateCamera(dt, catPosition, snakePosition, catSpeed) {
    // SINGLE OPTIMAL CINEMATIC CHASE ANGLE:
    // Positioned 1.8m behind the giant reared serpent head, elevated to perfectly frame
    // the menacing viper head, glowing eyes, and fangs in the foreground / lower third,
    // the galloping cat in the center, and the endless jungle track unfolding ahead.
    const camZ = snakePosition.z - 1.8;
    const camY = 2.45 + catPosition.y * 0.30;
    const camX = catPosition.x * 0.35;

    this.targetCameraPos.set(camX, camY, camZ);

    const lookX = catPosition.x * 0.45;
    const lookY = 0.95 + catPosition.y * 0.30;
    const lookZ = catPosition.z + 1.6;

    this.targetLookAt.set(lookX, lookY, lookZ);

    // Smooth camera damping
    const lerpSpeed = 12.0 * dt;
    this.camera.position.lerp(this.targetCameraPos, Math.min(1.0, lerpSpeed));
    this.camera.lookAt(this.targetLookAt);

    // Apply Camera Shake on near misses, lunges, or trips
    if (this.cameraShakeIntensity > 0.001) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.cameraShakeIntensity = THREE.MathUtils.lerp(this.cameraShakeIntensity, 0, dt * 8);
    }

    // Dynamic sunlight and shadow box tracking player
    this.sunLight.position.set(catPosition.x + 14, 30, catPosition.z + 20);
    this.sunLight.target.position.set(catPosition.x, 0, catPosition.z + 8);
    this.sunLight.target.updateMatrixWorld();

    // Dynamic player fill light illuminates fur sheen and scale gloss
    this.playerFillLight.position.set(catPosition.x * 0.5, 2.4 + catPosition.y, catPosition.z - 1.5);

    // Sky dome stays centered around player
    if (this.skyDome) {
      this.skyDome.position.set(0, 0, catPosition.z);
    }

    // Ground mist drifts along with player
    if (this.groundMist) {
      this.groundMist.position.z = Math.floor(catPosition.z / 30) * 30;
    }

    // Sunbeams follow along and gently shimmer
    if (this.sunbeams) {
      this.sunbeams.position.z = Math.floor(catPosition.z / 36) * 36;
      this.sunbeams.rotation.y = Math.sin(performance.now() * 0.0008) * 0.08;
    }
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
