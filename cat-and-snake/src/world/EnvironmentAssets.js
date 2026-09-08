/**
 * Procedural 3D Jungle Assets & Obstacles
 * High-fidelity PBR models for Kapok trees, hanging lianas, tropical ferns, mossy fallen logs,
 * ancient stone arches, mud quagmires, and hovering jungle collectibles.
 */

import * as THREE from 'three';

export class EnvironmentAssets {
  constructor() {
    this.materials = this.initMaterials();
  }

  initMaterials() {
    // 1. Procedural Mossy Bark Texture
    const barkCanvas = document.createElement('canvas');
    barkCanvas.width = 512;
    barkCanvas.height = 512;
    const bCtx = barkCanvas.getContext('2d');

    // Base dark bark
    bCtx.fillStyle = '#2c1e14';
    bCtx.fillRect(0, 0, 512, 512);

    // Bark ridges & cracks
    for (let i = 0; i < 400; i++) {
      const y = Math.random() * 512;
      const h = 40 + Math.random() * 80;
      const x = Math.random() * 512;
      bCtx.fillStyle = (Math.random() > 0.5) ? '#18100a' : '#3f2e21';
      bCtx.fillRect(x, y, 4 + Math.random() * 6, h);
    }

    // Moss patches
    bCtx.fillStyle = 'rgba(45, 95, 35, 0.45)';
    for (let i = 0; i < 40; i++) {
      const cx = Math.random() * 512;
      const cy = Math.random() * 512;
      const r = 16 + Math.random() * 32;
      bCtx.beginPath();
      bCtx.arc(cx, cy, r, 0, Math.PI * 2);
      bCtx.fill();
    }

    const barkTexture = new THREE.CanvasTexture(barkCanvas);
    barkTexture.wrapS = THREE.RepeatWrapping;
    barkTexture.wrapT = THREE.RepeatWrapping;

    // 2. Leaf Texture
    const leafCanvas = document.createElement('canvas');
    leafCanvas.width = 256;
    leafCanvas.height = 256;
    const lCtx = leafCanvas.getContext('2d');
    const leafGrad = lCtx.createRadialGradient(128, 128, 10, 128, 128, 128);
    leafGrad.addColorStop(0, '#38a846');
    leafGrad.addColorStop(0.7, '#1b5e20');
    leafGrad.addColorStop(1.0, '#0f3d13');
    lCtx.fillStyle = leafGrad;
    lCtx.fillRect(0, 0, 256, 256);

    const leafTexture = new THREE.CanvasTexture(leafCanvas);

    return {
      bark: new THREE.MeshStandardMaterial({
        map: barkTexture,
        roughness: 0.88,
        metalness: 0.05
      }),
      leaves: new THREE.MeshStandardMaterial({
        map: leafTexture,
        roughness: 0.55,
        metalness: 0.02,
        side: THREE.DoubleSide
      }),
      stone: new THREE.MeshStandardMaterial({
        color: 0x4a5448,
        roughness: 0.92,
        metalness: 0.1
      }),
      mud: new THREE.MeshStandardMaterial({
        color: 0x22170d,
        roughness: 0.25, // wet glossy sheen
        metalness: 0.08
      }),
      logMoss: new THREE.MeshStandardMaterial({
        map: barkTexture,
        roughness: 0.85,
        metalness: 0.05
      }),
      sunBerry: new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        emissive: 0xff7700,
        emissiveIntensity: 0.85,
        roughness: 0.2,
        metalness: 0.1
      }),
      starOrchid: new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x0099cc,
        emissiveIntensity: 0.9,
        roughness: 0.2,
        metalness: 0.2
      }),
      relicGold: new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xb8860b,
        emissiveIntensity: 0.6,
        roughness: 0.25,
        metalness: 0.85
      })
    };
  }

  /**
   * Giant Ancient Kapok / Banyan Tree
   */
  createKapokTree(height = 16, radius = 1.6) {
    const group = new THREE.Group();

    // Massive trunk
    const trunkGeo = new THREE.CylinderGeometry(radius * 0.65, radius, height, 10);
    const trunk = new THREE.Mesh(trunkGeo, this.materials.bark);
    trunk.position.y = height / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);

    // Buttress roots sprawling outward
    const numRoots = 4;
    for (let r = 0; r < numRoots; r++) {
      const angle = (r / numRoots) * Math.PI * 2 + Math.random() * 0.4;
      const rootGeo = new THREE.ConeGeometry(radius * 0.45, height * 0.35, 5);
      rootGeo.rotateZ(Math.PI / 4);
      const root = new THREE.Mesh(rootGeo, this.materials.bark);
      root.position.set(
        Math.cos(angle) * (radius * 0.85),
        height * 0.12,
        Math.sin(angle) * (radius * 0.85)
      );
      root.rotation.y = angle;
      root.castShadow = true;
      group.add(root);
    }

    // Dense Canopy Domes
    const canopyLevels = 3;
    for (let lvl = 0; lvl < canopyLevels; lvl++) {
      const domeR = radius * (3.2 - lvl * 0.6);
      const domeGeo = new THREE.DodecahedronGeometry(domeR, 1);
      domeGeo.scale(1.4, 0.65, 1.4);
      const canopy = new THREE.Mesh(domeGeo, this.materials.leaves);
      canopy.position.set(
        (Math.random() - 0.5) * 1.5,
        height * (0.85 + lvl * 0.15),
        (Math.random() - 0.5) * 1.5
      );
      canopy.castShadow = true;
      group.add(canopy);
    }

    // Hanging Lianas dangling from branches
    const numVines = 3;
    for (let v = 0; v < numVines; v++) {
      const vineLen = 6 + Math.random() * 5;
      const vineGeo = new THREE.CylinderGeometry(0.04, 0.05, vineLen, 5);
      const vine = new THREE.Mesh(vineGeo, this.materials.bark);
      const vAngle = Math.random() * Math.PI * 2;
      const vDist = radius * 1.8 + Math.random() * 1.5;
      vine.position.set(
        Math.cos(vAngle) * vDist,
        height * 0.9 - vineLen / 2,
        Math.sin(vAngle) * vDist
      );
      vine.rotation.z = (Math.random() - 0.5) * 0.2;
      group.add(vine);
    }

    return group;
  }

  /**
   * Tropical Fern / Monstera Bush
   */
  createFernCluster() {
    const group = new THREE.Group();
    const numFronds = 7;

    for (let i = 0; i < numFronds; i++) {
      const angle = (i / numFronds) * Math.PI * 2;
      const frondGeo = new THREE.PlaneGeometry(0.5, 1.6);
      frondGeo.translate(0, 0.8, 0);
      const frond = new THREE.Mesh(frondGeo, this.materials.leaves);
      frond.rotation.y = angle;
      frond.rotation.x = 0.55 + Math.random() * 0.25;
      frond.castShadow = true;
      group.add(frond);
    }

    return group;
  }

  /**
   * OBSTACLE 1: Fallen Mossy Tree Trunk (Requires JUMP)
   */
  createFallenLog(width = 6.6) {
    const group = new THREE.Group();

    // Log cylinder lying horizontally across track
    const logGeo = new THREE.CylinderGeometry(0.48, 0.55, width, 10);
    logGeo.rotateZ(Math.PI / 2);
    const log = new THREE.Mesh(logGeo, this.materials.logMoss);
    log.position.y = 0.45;
    log.castShadow = true;
    log.receiveShadow = true;
    group.add(log);

    // Broken branch stubs
    for (let b = 0; b < 3; b++) {
      const stubGeo = new THREE.CylinderGeometry(0.1, 0.16, 0.6, 6);
      const stub = new THREE.Mesh(stubGeo, this.materials.bark);
      stub.position.set((b - 1) * 1.8, 0.8, (Math.random() - 0.5) * 0.3);
      stub.rotation.z = (Math.random() - 0.5) * 0.8;
      group.add(stub);
    }

    // Collision metadata
    group.userData = {
      type: 'obstacle',
      subType: 'jump',
      height: 0.9,
      width: width,
      depth: 1.2
    };

    return group;
  }

  /**
   * OBSTACLE 2: Low Creepers / Ancient Ruin Stone Arch (Requires SLIDE)
   */
  createLowArch(width = 6.6) {
    const group = new THREE.Group();

    // Left & Right stone pillars
    const pillarGeo = new THREE.BoxGeometry(0.7, 3.5, 0.8);
    const pillarL = new THREE.Mesh(pillarGeo, this.materials.stone);
    pillarL.position.set(-width / 2, 1.75, 0);
    pillarL.castShadow = true;
    group.add(pillarL);

    const pillarR = new THREE.Mesh(pillarGeo, this.materials.stone);
    pillarR.position.set(width / 2, 1.75, 0);
    pillarR.castShadow = true;
    group.add(pillarR);

    // Low crossbeam with hanging curtain of thick vines
    const beamGeo = new THREE.BoxGeometry(width + 0.8, 0.6, 0.8);
    const beam = new THREE.Mesh(beamGeo, this.materials.stone);
    beam.position.set(0, 1.85, 0); // Bottom of beam is at ~1.55m, requiring slide
    beam.castShadow = true;
    group.add(beam);

    // Hanging tangled vines
    const numVines = 8;
    for (let v = 0; v < numVines; v++) {
      const x = -width * 0.4 + (v / (numVines - 1)) * (width * 0.8);
      const vLen = 1.0 + Math.sin(v) * 0.3;
      const vineGeo = new THREE.CylinderGeometry(0.035, 0.045, vLen, 5);
      const vine = new THREE.Mesh(vineGeo, this.materials.bark);
      vine.position.set(x, 1.55 - vLen / 2, (Math.random() - 0.5) * 0.2);
      group.add(vine);
    }

    // Collision metadata
    group.userData = {
      type: 'obstacle',
      subType: 'slide',
      bottomClearance: 0.55, // cat can slide underneath
      topClearance: 2.2,
      width: width,
      depth: 0.9
    };

    return group;
  }

  /**
   * OBSTACLE 3: Thorny Jungle Brambles / Ancient Roots (Requires LANE DODGE)
   */
  createBrambleObstacle(width = 1.8) {
    const group = new THREE.Group();

    const clusterGeo = new THREE.DodecahedronGeometry(0.85, 1);
    clusterGeo.scale(width * 0.6, 1.1, 0.7);
    const bramble = new THREE.Mesh(clusterGeo, this.materials.bark);
    bramble.position.y = 0.85;
    bramble.castShadow = true;
    group.add(bramble);

    // Sharp spiky branches
    for (let i = 0; i < 6; i++) {
      const spikeGeo = new THREE.ConeGeometry(0.08, 0.9, 5);
      spikeGeo.rotateX(Math.PI / 4 + Math.random() * 0.5);
      const spike = new THREE.Mesh(spikeGeo, this.materials.bark);
      spike.position.set((Math.random() - 0.5) * 0.6, 0.8 + Math.random() * 0.6, (Math.random() - 0.5) * 0.4);
      spike.rotation.y = Math.random() * Math.PI * 2;
      group.add(spike);
    }

    group.userData = {
      type: 'obstacle',
      subType: 'dodge',
      height: 1.8,
      width: width,
      depth: 1.0
    };

    return group;
  }

  /**
   * OBSTACLE 4: Mud Quagmire / Deep Swamp Pool (Slows cat, lets snake close in!)
   */
  createMudPuddle(width = 2.4, length = 4.0) {
    const group = new THREE.Group();

    const puddleGeo = new THREE.PlaneGeometry(width, length, 8, 8);
    const puddle = new THREE.Mesh(puddleGeo, this.materials.mud);
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.y = 0.03;
    puddle.receiveShadow = true;
    group.add(puddle);

    group.userData = {
      type: 'hazard',
      subType: 'mud',
      width: width,
      length: length
    };

    return group;
  }

  /**
   * COLLECTIBLE: Golden Sun Berry (Speed boost & invincibility)
   */
  createSunBerry() {
    const group = new THREE.Group();

    // Central golden sphere
    const berryGeo = new THREE.SphereGeometry(0.28, 12, 10);
    const berry = new THREE.Mesh(berryGeo, this.materials.sunBerry);
    berry.castShadow = true;
    group.add(berry);

    // Little leaves at top
    const capGeo = new THREE.ConeGeometry(0.14, 0.12, 5);
    capGeo.rotateX(Math.PI);
    const cap = new THREE.Mesh(capGeo, this.materials.leaves);
    cap.position.y = 0.28;
    group.add(cap);

    // Subtle golden halo ring
    const haloGeo = new THREE.TorusGeometry(0.38, 0.03, 6, 16);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffe066,
      transparent: true,
      opacity: 0.6
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = Math.PI / 2;
    group.add(halo);

    group.position.y = 1.1;
    group.userData = {
      type: 'collectible',
      collectibleType: 'sun_berry',
      radius: 0.45
    };

    return group;
  }

  /**
   * COLLECTIBLE: Star Orchid (Score multiplier boost)
   */
  createStarOrchid() {
    const group = new THREE.Group();

    // 5 luminous petals
    const numPetals = 5;
    for (let p = 0; p < numPetals; p++) {
      const pAngle = (p / numPetals) * Math.PI * 2;
      const petalGeo = new THREE.ConeGeometry(0.12, 0.42, 5);
      petalGeo.rotateZ(Math.PI / 2);
      const petal = new THREE.Mesh(petalGeo, this.materials.starOrchid);
      petal.rotation.y = pAngle;
      group.add(petal);
    }

    const centerGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const center = new THREE.Mesh(centerGeo, this.materials.starOrchid);
    group.add(center);

    group.position.y = 1.1;
    group.userData = {
      type: 'collectible',
      collectibleType: 'star_orchid',
      radius: 0.45
    };

    return group;
  }

  /**
   * COLLECTIBLE: Ancient Golden Paw Relic (+500 points, pushes snake back)
   */
  createGoldenRelic() {
    const group = new THREE.Group();

    // Golden medallion disc
    const discGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.08, 16);
    const disc = new THREE.Mesh(discGeo, this.materials.relicGold);
    disc.rotation.x = Math.PI / 2;
    disc.castShadow = true;
    group.add(disc);

    // Carved paw print impression
    const padGeo = new THREE.SphereGeometry(0.1, 8, 6);
    padGeo.scale(1.2, 0.9, 0.4);
    const pad = new THREE.Mesh(padGeo, this.materials.bark);
    pad.position.set(0, -0.04, 0.045);
    group.add(pad);

    group.position.y = 1.2;
    group.userData = {
      type: 'collectible',
      collectibleType: 'relic',
      radius: 0.45
    };

    return group;
  }
}
