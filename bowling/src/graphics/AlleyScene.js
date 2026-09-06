import * as THREE from 'three';
import { DIMENSIONS, PIN_SPOTS, BALL_PRESETS, DIFFICULTY_SETTINGS } from '../config.js';
import { TextureGenerator } from './TextureGenerator.js';
import { soundManager } from '../audio/SoundManager.js';

/**
 * hubshashwat Bowling Alley Scene
 * Complete procedural bowling center environment with PBR materials, lighting, pinsetter, and dynamic camera.
 */
export class AlleyScene {
  constructor(canvasContainer) {
    this.container = canvasContainer;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0c0d12');
    this.scene.fog = new THREE.FogExp2('#0c0d12', 0.018);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    this.cameraMode = 'follow'; // 'follow', 'aim', 'pin', 'overhead'

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // Meshes
    this.pinMeshes = [];
    this.ballMesh = null;
    this.leftBumperMesh = null;
    this.rightBumperMesh = null;
    this.pinsetterRake = null;
    this.aimGuideLine = null;
    this.aimGuideMaterial = null;

    // Materials
    this.pinMaterial = null;
    this.ballMaterial = null;
    this.currentBallPreset = BALL_PRESETS[1]; // Default cosmic

    // Animations
    this.isSweeping = false;
    this.sweepProgress = 0;

    this.buildScene();
    this.setupLighting();
    this.setupAimGuide();
    this.setupResizeHandler();
    this.resetCameraToAim();
  }

  setupResizeHandler() {
    window.addEventListener('resize', () => this.onResize());
    this.onResize();
  }

  onResize() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;

    // Responsive FOV:
    // On narrow vertical screens (mobile portrait), widen the FOV
    // so the whole lane and both gutters remain clearly visible!
    if (this.camera.aspect < 1.0) {
      this.camera.fov = 48 / (this.camera.aspect * 0.95);
      this.camera.fov = Math.min(85, Math.max(48, this.camera.fov));
    } else {
      this.camera.fov = 52;
    }
    this.camera.updateProjectionMatrix();

    if (this.cameraMode === 'aim' || this.cameraMode === 'follow') {
      this.resetCameraToAim();
    }
  }

  setupLighting() {
    // Ambient light with cool alley tone
    const ambientLight = new THREE.AmbientLight('#262938', 1.5);
    this.scene.add(ambientLight);

    // Main overhead alley lighting (simulates recessed ceiling strip fixtures)
    const laneDirLight = new THREE.DirectionalLight('#fff0dd', 2.2);
    laneDirLight.position.set(0, 10, -5);
    laneDirLight.target.position.set(0, 0, -10);
    laneDirLight.castShadow = true;
    laneDirLight.shadow.mapSize.width = 2048;
    laneDirLight.shadow.mapSize.height = 2048;
    laneDirLight.shadow.camera.near = 1;
    laneDirLight.shadow.camera.far = 30;
    laneDirLight.shadow.camera.left = -3;
    laneDirLight.shadow.camera.right = 3;
    laneDirLight.shadow.camera.top = 15;
    laneDirLight.shadow.camera.bottom = -15;
    laneDirLight.shadow.bias = -0.0005;
    this.scene.add(laneDirLight);
    this.scene.add(laneDirLight.target);

    // Pin deck dramatic spotlights (makes the 10 pins sparkle!)
    const pinSpot = new THREE.SpotLight('#ffffff', 6.0, 12, Math.PI / 4, 0.4, 1.2);
    pinSpot.position.set(0, 4.5, -DIMENSIONS.LANE_LENGTH - 0.5);
    pinSpot.target.position.set(0, 0.2, -DIMENSIONS.LANE_LENGTH - 0.4);
    pinSpot.castShadow = true;
    pinSpot.shadow.mapSize.width = 1024;
    pinSpot.shadow.mapSize.height = 1024;
    pinSpot.shadow.bias = -0.0002;
    this.scene.add(pinSpot);
    this.scene.add(pinSpot.target);

    // Neon accent lights along lane divisions
    const leftNeon = new THREE.PointLight('#00f0ff', 2.0, 25);
    leftNeon.position.set(-1.2, 0.8, -9);
    this.scene.add(leftNeon);

    const rightNeon = new THREE.PointLight('#ff0077', 2.0, 25);
    rightNeon.position.set(1.2, 0.8, -9);
    this.scene.add(rightNeon);
  }

  buildScene() {
    // 1. Lane bed
    const totalLength = DIMENSIONS.APPROACH_LENGTH + DIMENSIONS.LANE_LENGTH + DIMENSIONS.PIN_DECK_LENGTH;
    const centerZ = (DIMENSIONS.APPROACH_LENGTH - (DIMENSIONS.LANE_LENGTH + DIMENSIONS.PIN_DECK_LENGTH)) / 2;

    const laneGeo = new THREE.BoxGeometry(DIMENSIONS.LANE_WIDTH, 0.2, totalLength);
    const laneTexture = TextureGenerator.createLaneTexture();
    const laneRoughness = TextureGenerator.createLaneRoughnessMap();

    const laneMat = new THREE.MeshStandardMaterial({
      map: laneTexture,
      roughnessMap: laneRoughness,
      roughness: 0.18,
      metalness: 0.04
    });

    const laneMesh = new THREE.Mesh(laneGeo, laneMat);
    laneMesh.position.set(0, -0.1, centerZ);
    laneMesh.receiveShadow = true;
    this.scene.add(laneMesh);

    // 2. Gutters (Curved sunken channel geometries)
    const gutterLength = DIMENSIONS.LANE_LENGTH + DIMENSIONS.PIN_DECK_LENGTH;
    const gutterZ = -(DIMENSIONS.LANE_LENGTH + DIMENSIONS.PIN_DECK_LENGTH) / 2;
    const gutterTexture = TextureGenerator.createGutterTexture();

    const gutterMat = new THREE.MeshStandardMaterial({
      map: gutterTexture,
      roughness: 0.75,
      metalness: 0.1
    });

    // Semi-cylindrical or channeled gutter geometry
    const gutterShape = new THREE.Shape();
    gutterShape.moveTo(-DIMENSIONS.GUTTER_WIDTH / 2, 0);
    gutterShape.quadraticCurveTo(0, -DIMENSIONS.GUTTER_DEPTH * 1.5, DIMENSIONS.GUTTER_WIDTH / 2, 0);
    gutterShape.lineTo(DIMENSIONS.GUTTER_WIDTH / 2, -0.2);
    gutterShape.lineTo(-DIMENSIONS.GUTTER_WIDTH / 2, -0.2);
    gutterShape.closePath();

    const gutterGeo = new THREE.ExtrudeGeometry(gutterShape, {
      steps: 1,
      depth: gutterLength,
      bevelEnabled: false
    });
    // Center extrusion along Z
    gutterGeo.translate(0, 0, -gutterLength / 2);

    // Left Gutter
    const leftGutterMesh = new THREE.Mesh(gutterGeo, gutterMat);
    leftGutterMesh.position.set(-(DIMENSIONS.LANE_WIDTH / 2 + DIMENSIONS.GUTTER_WIDTH / 2), 0, gutterZ);
    leftGutterMesh.receiveShadow = true;
    this.scene.add(leftGutterMesh);

    // Right Gutter
    const rightGutterMesh = new THREE.Mesh(gutterGeo, gutterMat);
    rightGutterMesh.position.set((DIMENSIONS.LANE_WIDTH / 2 + DIMENSIONS.GUTTER_WIDTH / 2), 0, gutterZ);
    rightGutterMesh.receiveShadow = true;
    this.scene.add(rightGutterMesh);

    // 3. Lane division dividers / Kickbacks
    const dividerGeo = new THREE.BoxGeometry(0.1, 0.35, gutterLength);
    const dividerMat = new THREE.MeshStandardMaterial({
      color: '#1a1b24',
      roughness: 0.4,
      metalness: 0.2
    });

    const leftDivider = new THREE.Mesh(dividerGeo, dividerMat);
    leftDivider.position.set(-(DIMENSIONS.LANE_WIDTH / 2 + DIMENSIONS.GUTTER_WIDTH + 0.05), 0.08, gutterZ);
    leftDivider.castShadow = true;
    leftDivider.receiveShadow = true;
    this.scene.add(leftDivider);

    const rightDivider = new THREE.Mesh(dividerGeo, dividerMat);
    rightDivider.position.set((DIMENSIONS.LANE_WIDTH / 2 + DIMENSIONS.GUTTER_WIDTH + 0.05), 0.08, gutterZ);
    rightDivider.castShadow = true;
    rightDivider.receiveShadow = true;
    this.scene.add(rightDivider);

    // Glowing LED neon runner strips on lane dividers
    const neonGeo = new THREE.BoxGeometry(0.02, 0.02, gutterLength);
    const leftNeonMat = new THREE.MeshBasicMaterial({ color: '#00ffff' });
    const rightNeonMat = new THREE.MeshBasicMaterial({ color: '#ff007f' });

    const leftNeonStrip = new THREE.Mesh(neonGeo, leftNeonMat);
    leftNeonStrip.position.set(-(DIMENSIONS.LANE_WIDTH / 2 + DIMENSIONS.GUTTER_WIDTH), 0.02, gutterZ);
    this.scene.add(leftNeonStrip);

    const rightNeonStrip = new THREE.Mesh(neonGeo, rightNeonMat);
    rightNeonStrip.position.set((DIMENSIONS.LANE_WIDTH / 2 + DIMENSIONS.GUTTER_WIDTH), 0.02, gutterZ);
    this.scene.add(rightNeonStrip);

    // 4. Retractable Bumpers
    const bumperGeo = new THREE.CylinderGeometry(
      DIMENSIONS.BUMPER_RADIUS,
      DIMENSIONS.BUMPER_RADIUS,
      DIMENSIONS.LANE_LENGTH,
      24
    );
    bumperGeo.rotateX(Math.PI / 2);

    const bumperMat = new THREE.MeshStandardMaterial({
      color: '#ffd166',
      roughness: 0.35,
      metalness: 0.45
    });

    const bumperZ = -DIMENSIONS.LANE_LENGTH / 2;
    this.leftBumperMesh = new THREE.Mesh(bumperGeo, bumperMat);
    this.leftBumperMesh.position.set(-DIMENSIONS.LANE_WIDTH / 2, -0.08, bumperZ);
    this.leftBumperMesh.castShadow = true;
    this.scene.add(this.leftBumperMesh);

    this.rightBumperMesh = new THREE.Mesh(bumperGeo, bumperMat);
    this.rightBumperMesh.position.set(DIMENSIONS.LANE_WIDTH / 2, -0.08, bumperZ);
    this.rightBumperMesh.castShadow = true;
    this.scene.add(this.rightBumperMesh);

    // 5. Pin Deck Hood / Masking Unit & Back Pit
    const hoodZ = -DIMENSIONS.LANE_LENGTH - DIMENSIONS.PIN_DECK_LENGTH / 2;
    const hoodGeo = new THREE.BoxGeometry(1.6, 1.2, 0.15);
    const hoodMat = new THREE.MeshStandardMaterial({
      color: '#11131c',
      roughness: 0.5,
      metalness: 0.2
    });
    const hoodMesh = new THREE.Mesh(hoodGeo, hoodMat);
    hoodMesh.position.set(0, 1.8, -DIMENSIONS.LANE_LENGTH + 0.5);
    this.scene.add(hoodMesh);

    // Masking unit graphic sign (retro-modern bowling icon)
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 256;
    const sctx = signCanvas.getContext('2d');
    sctx.fillStyle = '#161926';
    sctx.fillRect(0, 0, 512, 256);
    sctx.strokeStyle = '#00f0ff';
    sctx.lineWidth = 6;
    sctx.strokeRect(10, 10, 492, 236);
    sctx.fillStyle = '#ffffff';
    sctx.font = 'bold 54px sans-serif';
    sctx.textAlign = 'center';
    sctx.fillText('LANE  1', 256, 110);
    sctx.fillStyle = '#ff0077';
    sctx.font = '32px sans-serif';
    sctx.fillText('★ HUBSHASHWAT BOWLING ★', 256, 175);

    const signTex = new THREE.CanvasTexture(signCanvas);
    const signMat = new THREE.MeshBasicMaterial({ map: signTex });
    const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.7), signMat);
    signMesh.position.set(0, 1.8, -DIMENSIONS.LANE_LENGTH + 0.59);
    this.scene.add(signMesh);

    // Back curtain impact cushion (dark heavy vinyl back wall)
    const curtainGeo = new THREE.BoxGeometry(1.5, 0.9, 0.1);
    const curtainMat = new THREE.MeshStandardMaterial({
      color: '#08080a',
      roughness: 0.9,
      metalness: 0.05
    });
    const curtainMesh = new THREE.Mesh(curtainGeo, curtainMat);
    curtainMesh.position.set(0, 0.45, -(DIMENSIONS.LANE_LENGTH + DIMENSIONS.PIN_DECK_LENGTH + DIMENSIONS.PIT_DEPTH));
    this.scene.add(curtainMesh);

    // 6. Mechanical Pinsetter Rake / Sweep Bar
    const rakeGeo = new THREE.BoxGeometry(DIMENSIONS.LANE_WIDTH + 0.1, 0.08, 0.08);
    const rakeMat = new THREE.MeshStandardMaterial({
      color: '#444857',
      roughness: 0.3,
      metalness: 0.8
    });
    this.pinsetterRake = new THREE.Mesh(rakeGeo, rakeMat);
    this.pinsetterRake.position.set(0, 0.8, -DIMENSIONS.LANE_LENGTH + 0.2); // Rest position (high)
    this.pinsetterRake.castShadow = true;
    this.scene.add(this.pinsetterRake);

    // 7. Ball Return Track & Bowler Seating Area
    const returnGeo = new THREE.CylinderGeometry(0.04, 0.04, DIMENSIONS.LANE_LENGTH + 3, 16);
    returnGeo.rotateX(Math.PI / 2);
    const returnMat = new THREE.MeshStandardMaterial({
      color: '#888899',
      roughness: 0.25,
      metalness: 0.85
    });
    const returnTrack = new THREE.Mesh(returnGeo, returnMat);
    returnTrack.position.set(DIMENSIONS.LANE_WIDTH / 2 + DIMENSIONS.GUTTER_WIDTH + 0.22, 0.2, -DIMENSIONS.LANE_LENGTH / 2 + 1.5);
    this.scene.add(returnTrack);

    // 8. Bowling Lounge Interior Architecture (Floor, Side Walls, Ceiling Beams)
    // Dark carpeted / polished lounge floor
    const floorGeo = new THREE.PlaneGeometry(16, 35);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: '#0e1017',
      roughness: 0.85,
      metalness: 0.1
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(0, -0.21, centerZ);
    floorMesh.receiveShadow = true;
    this.scene.add(floorMesh);

    // Left & Right Acoustic Slat Walls
    const wallGeo = new THREE.BoxGeometry(0.2, 5.0, 32);
    const wallMat = new THREE.MeshStandardMaterial({
      color: '#141622',
      roughness: 0.7,
      metalness: 0.15
    });

    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.position.set(-3.2, 2.3, centerZ);
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.position.set(3.2, 2.3, centerZ);
    rightWall.receiveShadow = true;
    this.scene.add(rightWall);

    // Architectural Wall Sconces & Neon Accents
    for (let z = -15; z <= 2; z += 5) {
      const sconceLeft = new THREE.PointLight('#ff0077', 0.8, 6);
      sconceLeft.position.set(-3.0, 2.0, z);
      this.scene.add(sconceLeft);

      const sconceRight = new THREE.PointLight('#00f0ff', 0.8, 6);
      sconceRight.position.set(3.0, 2.0, z);
      this.scene.add(sconceRight);
    }

    // Overhead Ceiling Beams
    for (let z = -18; z <= 4; z += 4) {
      const beamGeo = new THREE.BoxGeometry(6.6, 0.25, 0.3);
      const beamMat = new THREE.MeshStandardMaterial({ color: '#161926', roughness: 0.6 });
      const beamMesh = new THREE.Mesh(beamGeo, beamMat);
      beamMesh.position.set(0, 4.2, z);
      this.scene.add(beamMesh);
    }

    // Build the 10 Bowling Pin geometries
    this.createPinGeometries();

    // Build Bowling Ball geometry
    this.createBallGeometry();
  }

  /**
   * Generates official curved Brunswick pin silhouette using LatheGeometry
   */
  createPinGeometries() {
    // Official regulation profile spline points
    // Y: 0 to PIN_HEIGHT (0.381m)
    const points = [];
    const numPoints = 28;

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const y = t * DIMENSIONS.PIN_HEIGHT;
      let r = 0;

      if (t < 0.06) {
        // Base rim
        r = DIMENSIONS.PIN_RADIUS_BASE * (0.95 + t * 0.8);
      } else if (t < 0.38) {
        // Flare out to belly
        const s = (t - 0.06) / (0.38 - 0.06);
        r = DIMENSIONS.PIN_RADIUS_BASE * 1.0 + (DIMENSIONS.PIN_RADIUS_BELLY - DIMENSIONS.PIN_RADIUS_BASE) * Math.sin(s * Math.PI * 0.5);
      } else if (t < 0.72) {
        // Belly taper down into neck
        const s = (t - 0.38) / (0.72 - 0.38);
        r = DIMENSIONS.PIN_RADIUS_BELLY - (DIMENSIONS.PIN_RADIUS_BELLY - DIMENSIONS.PIN_RADIUS_NECK) * Math.sin(s * Math.PI * 0.5);
      } else if (t < 0.92) {
        // Neck expands into head bulb
        const s = (t - 0.72) / (0.92 - 0.72);
        r = DIMENSIONS.PIN_RADIUS_NECK + (DIMENSIONS.PIN_RADIUS_HEAD - DIMENSIONS.PIN_RADIUS_NECK) * Math.sin(s * Math.PI);
      } else {
        // Head dome curving to top tip
        const s = (t - 0.92) / (1.0 - 0.92);
        r = DIMENSIONS.PIN_RADIUS_HEAD * Math.sqrt(Math.max(0, 1.0 - s * s));
      }

      points.push(new THREE.Vector2(r, y));
    }

    const pinGeo = new THREE.LatheGeometry(points, 24);
    // Center geometry origin to match physics center of mass (offset Y ~ -0.14m)
    pinGeo.translate(0, -DIMENSIONS.PIN_HEIGHT * 0.45, 0);

    const pinTexture = TextureGenerator.createPinTexture();
    this.pinMaterial = new THREE.MeshPhysicalMaterial({
      map: pinTexture,
      roughness: 0.14,
      metalness: 0.02,
      clearcoat: 0.85,
      clearcoatRoughness: 0.1
    });

    // Instantiate the 10 pin meshes
    this.pinMeshes = PIN_SPOTS.map(spot => {
      const mesh = new THREE.Mesh(pinGeo, this.pinMaterial);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.position.set(spot.x, DIMENSIONS.PIN_HEIGHT * 0.45, spot.z);
      this.scene.add(mesh);
      return {
        id: spot.id,
        initialSpot: spot,
        mesh: mesh
      };
    });
  }

  createBallGeometry() {
    const ballGeo = new THREE.SphereGeometry(DIMENSIONS.BALL_RADIUS, 48, 48);
    const ballTexture = TextureGenerator.createBallTexture(this.currentBallPreset);

    this.ballMaterial = new THREE.MeshPhysicalMaterial({
      map: ballTexture,
      roughness: this.currentBallPreset.roughness,
      metalness: this.currentBallPreset.metalness,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1
    });

    this.ballMesh = new THREE.Mesh(ballGeo, this.ballMaterial);
    this.ballMesh.castShadow = true;
    this.ballMesh.receiveShadow = true;
    this.ballMesh.position.set(0, DIMENSIONS.BALL_RADIUS, -0.6);
    this.ballMesh.rotation.set(-Math.PI * 0.35, 0, 0);
    this.scene.add(this.ballMesh);
  }

  setBallPreset(preset) {
    this.currentBallPreset = preset;
    const newTexture = TextureGenerator.createBallTexture(preset);
    this.ballMaterial.map = newTexture;
    this.ballMaterial.roughness = preset.roughness;
    this.ballMaterial.metalness = preset.metalness;
    this.ballMaterial.needsUpdate = true;
  }

  setupAimGuide() {
    // Dynamic trajectory line
    const maxPoints = 60;
    const positions = new Float32Array(maxPoints * 3);
    const colors = new Float32Array(maxPoints * 3);

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    lineGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.aimGuideMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      linewidth: 3
    });

    this.aimGuideLine = new THREE.Line(lineGeo, this.aimGuideMaterial);
    this.aimGuideLine.frustumCulled = false;
    this.scene.add(this.aimGuideLine);
  }

  /**
   * Updates trajectory guideline visualization according to difficulty level
   */
  updateAimGuide(startX, angle, spinRpm, difficulty) {
    const cfg = DIFFICULTY_SETTINGS[difficulty];

    if (cfg.trajectoryGuide === 'none') {
      this.aimGuideLine.visible = false;
      return;
    }

    this.aimGuideLine.visible = true;
    const positions = this.aimGuideLine.geometry.attributes.position.array;
    const colors = this.aimGuideLine.geometry.attributes.color.array;

    const numPoints = 50;
    const maxDistance = cfg.trajectoryGuide === 'full' ? DIMENSIONS.LANE_LENGTH : 4.57; // 15 ft to arrows in medium

    let simX = startX;
    let simZ = 0;
    const dt = maxDistance / numPoints;

    for (let i = 0; i < numPoints; i++) {
      const zProgress = i / numPoints;
      const currentZ = -zProgress * maxDistance;

      // Simulated hook curvature past 35 ft
      let lateralCurve = 0;
      if (cfg.trajectoryGuide === 'full' && -currentZ > 11.0) {
        const hookFactor = (-currentZ - 11.0) / (DIMENSIONS.LANE_LENGTH - 11.0);
        lateralCurve = (spinRpm / 400) * 0.25 * Math.pow(hookFactor, 1.8);
      }

      const linearX = startX + Math.sin(angle) * (-currentZ);
      simX = linearX + lateralCurve;

      // Clamp within lane/bumpers
      const maxX = DIMENSIONS.LANE_WIDTH / 2 - DIMENSIONS.BALL_RADIUS;
      if (cfg.hasBumpers) {
        simX = Math.max(-maxX, Math.min(maxX, simX));
      }

      const idx = i * 3;
      positions[idx] = simX;
      positions[idx + 1] = 0.02; // Just above wood
      positions[idx + 2] = currentZ;

      // Color gradient: Neon Cyan -> Bright Amber
      const alpha = 1.0 - (i / numPoints) * 0.6;
      colors[idx] = 0.0 + (i / numPoints) * 0.9;  // R
      colors[idx + 1] = 0.95 - (i / numPoints) * 0.3; // G
      colors[idx + 2] = 1.0 - (i / numPoints) * 0.8;  // B
    }

    this.aimGuideLine.geometry.attributes.position.needsUpdate = true;
    this.aimGuideLine.geometry.attributes.color.needsUpdate = true;
  }

  hideAimGuide() {
    if (this.aimGuideLine) {
      this.aimGuideLine.visible = false;
    }
  }

  /**
   * Sets bumper heights with smooth transition
   */
  updateBumpers(enabled, delta) {
    const targetY = enabled ? DIMENSIONS.BUMPER_HEIGHT : -0.08;
    this.leftBumperMesh.position.y = THREE.MathUtils.lerp(this.leftBumperMesh.position.y, targetY, delta * 8);
    this.rightBumperMesh.position.y = THREE.MathUtils.lerp(this.rightBumperMesh.position.y, targetY, delta * 8);
  }

  /**
   * Syncs visual meshes with Cannon-es physics bodies
   */
  syncPhysics(physicsWorld) {
    // 1. Sync Ball
    if (physicsWorld.ballBody && this.ballMesh) {
      this.ballMesh.visible = true;
      this.ballMesh.position.copy(physicsWorld.ballBody.position);
      this.ballMesh.quaternion.copy(physicsWorld.ballBody.quaternion);
    }

    // 2. Sync Pins
    const activePinBodyMap = new Map();
    physicsWorld.pinBodies.forEach(p => activePinBodyMap.set(p.id, p.body));

    this.pinMeshes.forEach(pin => {
      const body = activePinBodyMap.get(pin.id);
      if (body) {
        pin.mesh.visible = true;
        pin.mesh.position.copy(body.position);
        pin.mesh.quaternion.copy(body.quaternion);
      } else {
        // Fallen / removed pin
        pin.mesh.visible = false;
      }
    });
  }

  /**
   * Animates mechanical pinsetter rake sweeping fallen pins
   */
  startPinsetterSweep(onComplete) {
    if (this.isSweeping) return;
    this.isSweeping = true;
    this.sweepProgress = 0;
    soundManager.playPinsetterSweep();

    const startZ = -DIMENSIONS.LANE_LENGTH + 0.3;
    const endZ = -(DIMENSIONS.LANE_LENGTH + DIMENSIONS.PIN_DECK_LENGTH + 0.15);

    const animateRake = () => {
      this.sweepProgress += 0.022;

      if (this.sweepProgress <= 0.25) {
        // Lower rake bar
        const t = this.sweepProgress / 0.25;
        this.pinsetterRake.position.y = THREE.MathUtils.lerp(0.8, 0.06, t);
        this.pinsetterRake.position.z = startZ;
      } else if (this.sweepProgress <= 0.7) {
        // Sweep backward pushing dead pins into pit
        const t = (this.sweepProgress - 0.25) / 0.45;
        this.pinsetterRake.position.y = 0.06;
        this.pinsetterRake.position.z = THREE.MathUtils.lerp(startZ, endZ, t);
      } else if (this.sweepProgress <= 0.95) {
        // Lift rake bar and return
        const t = (this.sweepProgress - 0.7) / 0.25;
        this.pinsetterRake.position.y = THREE.MathUtils.lerp(0.06, 0.8, t);
        this.pinsetterRake.position.z = THREE.MathUtils.lerp(endZ, startZ, t);
      } else {
        // Sweep complete
        this.pinsetterRake.position.set(0, 0.8, startZ);
        this.isSweeping = false;
        if (onComplete) onComplete();
        return;
      }

      requestAnimationFrame(animateRake);
    };

    requestAnimationFrame(animateRake);
  }

  resetCameraToAim() {
    const isPortrait = this.camera.aspect < 1.0;
    if (isPortrait) {
      // Mobile portrait: elevated and framed comfortably above bottom controls
      this.camera.position.set(0, 1.55, 2.6);
      this.camera.lookAt(0, 0.15, -18.288);
    } else {
      // Landscape / Desktop
      this.camera.position.set(0, 1.4, 1.6);
      this.camera.lookAt(0, -0.25, -18.288);
    }
  }

  /**
   * Dynamic Camera Controller - Cinematic Follow Camera
   */
  updateCamera(ballBody, delta) {
    if (!ballBody) {
      return;
    }

    const bp = ballBody.position;

    // Smoothly follows ball trailing slightly behind and above
    const isPortrait = this.camera.aspect < 1.0;
    const targetZ = bp.z + (isPortrait ? 3.0 : 2.6);
    const targetX = bp.x * 0.45;
    const targetY = isPortrait ? 1.35 : 1.15;

    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetX, delta * 8);
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetY, delta * 8);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetZ, delta * 8);

    // Look slightly ahead of ball towards pins
    const lookZ = Math.min(-18.288, bp.z - 3.5);
    this.camera.lookAt(bp.x * 0.3, 0.2, lookZ);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
