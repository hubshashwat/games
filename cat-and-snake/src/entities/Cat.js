/**
 * Anatomical 3D Procedural Cat Model & Quadruped Gallop Controller
 * Features realistic feline anatomy (whisker pads, fangs, cup ears, slit eyes, digitigrade limbs, claws),
 * athletic quadruped gallop cycle, leaping, sliding, tail wave physics, and dynamic PBR coat shaders.
 */

import * as THREE from 'three';
import { DIMENSIONS, CAT_SKINS } from '../config.js';

export class Cat {
  constructor(scene, skinKey = 'leopard') {
    this.scene = scene;
    this.skinKey = skinKey;
    this.skinConfig = CAT_SKINS[skinKey] || CAT_SKINS.leopard;

    // Movement & state
    this.lane = 0; // -1 (left), 0 (center), 1 (right)
    this.targetX = 0;
    this.currentX = 0;
    this.laneChangeSpeed = 18.0; // Snappy, instant response

    this.y = 0;
    this.velocityY = 0;
    this.gravity = -45.0; // Athletic, responsive jump
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.slideDuration = DIMENSIONS.SLIDE_DURATION;

    // Gallop cycle parameters
    this.gallopPhase = 0;
    this.gallopFrequency = 9.0;
    this.tailSegments = [];

    // Particle hook
    this.onPawStrike = null;

    // Build 3D Mesh hierarchy
    this.group = new THREE.Group();
    this.buildCatModel();
    this.scene.add(this.group);

    // Initial position
    this.group.position.set(0, 0, 0);
  }

  /**
   * Generates procedural anisotropic fur micro-normal/bump texture
   */
  createFurBumpMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Neutral grey bump baseline
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 512, 512);

    // Directional fur strand micro-grooves
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 4500; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const len = 6 + Math.random() * 12;
      const angle = (Math.random() - 0.5) * 0.4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.sin(angle) * len, y + Math.cos(angle) * len);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 4);
    return texture;
  }

  /**
   * Creates a photorealistic feline eye texture with vertical slit pupil & iridescent iris
   */
  createEyeTexture(eyeHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Dark limbal ring border
    ctx.fillStyle = '#080808';
    ctx.beginPath();
    ctx.arc(128, 128, 120, 0, Math.PI * 2);
    ctx.fill();

    // Radiant iris gradient
    const irisGrad = ctx.createRadialGradient(128, 128, 20, 128, 128, 116);
    const colorStr = '#' + eyeHex.toString(16).padStart(6, '0');
    irisGrad.addColorStop(0.0, colorStr);
    irisGrad.addColorStop(0.7, colorStr);
    irisGrad.addColorStop(1.0, '#111812');
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.arc(128, 128, 114, 0, Math.PI * 2);
    ctx.fill();

    // Iris fiber striations
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    for (let a = 0; a < Math.PI * 2; a += 0.1) {
      ctx.beginPath();
      ctx.moveTo(128 + Math.cos(a) * 35, 128 + Math.sin(a) * 35);
      ctx.lineTo(128 + Math.cos(a) * 110, 128 + Math.sin(a) * 110);
      ctx.stroke();
    }

    // Predatory vertical slit pupil
    ctx.fillStyle = '#020202';
    ctx.beginPath();
    ctx.ellipse(128, 128, 16, 96, 0, 0, Math.PI * 2);
    ctx.fill();

    // Specular cornea reflection glint
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(146, 92, 12, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  /**
   * Generates procedural fur coat textures with multi-lobed rosettes, stripes, or panther sleekness
   */
  createCoatTexture(skinConfig) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base coat gradient with spine-to-belly contrast
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    const primHex = '#' + skinConfig.primaryColor.toString(16).padStart(6, '0');
    const bellyHex = '#' + skinConfig.bellyColor.toString(16).padStart(6, '0');
    grad.addColorStop(0.0, primHex);
    grad.addColorStop(0.65, primHex);
    grad.addColorStop(0.95, bellyHex);
    grad.addColorStop(1.0, '#ffffff');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Microscopic fur grain stippling
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < 5000; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      ctx.fillRect(rx, ry, 1, 3);
    }

    // Pattern markings (Authentic Multi-Lobed Rosettes or Tiger Stripes)
    const spotHex = '#' + skinConfig.spotColor.toString(16).padStart(6, '0');

    if (skinConfig.id === 'leopard' || skinConfig.id === 'mystic') {
      // Authentic leopard rosettes: warm cinnamon core encircled by dark espresso broken lobes
      for (let i = 0; i < 95; i++) {
        const cx = Math.random() * 512;
        const cy = 30 + Math.random() * 380;
        const r = 5 + Math.random() * 9;

        // Warm interior core
        ctx.fillStyle = (skinConfig.id === 'leopard') ? 'rgba(160, 90, 25, 0.65)' : 'rgba(40, 110, 130, 0.5)';
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2);
        ctx.fill();

        // 3 to 5 dark petal lobes encircling core
        const numLobes = 3 + Math.floor(Math.random() * 3);
        ctx.fillStyle = spotHex;
        for (let l = 0; l < numLobes; l++) {
          const lAngle = (l / numLobes) * Math.PI * 2 + Math.random() * 0.4;
          const lx = cx + Math.cos(lAngle) * r;
          const ly = cy + Math.sin(lAngle) * r;
          ctx.beginPath();
          ctx.arc(lx, ly, 2 + Math.random() * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (skinConfig.id === 'tiger') {
      // Tapered wild tiger stripes with organic curvature
      ctx.strokeStyle = spotHex;
      for (let i = 0; i < 36; i++) {
        const sy = 35 + i * 13;
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.bezierCurveTo(100, sy + 18, 220, sy - 18, 360, sy + 12);
        ctx.lineWidth = 3.5 + Math.random() * 4.5;
        ctx.stroke();

        if (Math.random() > 0.5) {
          ctx.beginPath();
          ctx.moveTo(180, sy);
          ctx.lineTo(260, sy + 22);
          ctx.lineWidth = 2.5 + Math.random() * 2;
          ctx.stroke();
        }
      }
    } else if (skinConfig.id === 'panther') {
      // Midnight satin coat with subtle obsidian rosettes visible under specular light
      ctx.fillStyle = 'rgba(6, 7, 9, 0.75)';
      for (let i = 0; i < 75; i++) {
        const cx = Math.random() * 512;
        const cy = 20 + Math.random() * 400;
        ctx.beginPath();
        ctx.arc(cx, cy, 6 + Math.random() * 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  buildCatModel() {
    const coatTexture = this.createCoatTexture(this.skinConfig);
    this.furBumpTexture = this.createFurBumpMap();
    const eyeTexture = this.createEyeTexture(this.skinConfig.eyeColor);

    // Ultra-Realistic PBR Feline Fur Material (with soft velvet sheen)
    this.coatMaterial = new THREE.MeshPhysicalMaterial({
      map: coatTexture,
      bumpMap: this.furBumpTexture,
      bumpScale: 0.035,
      roughness: 0.58,
      metalness: 0.03,
      sheen: 1.0,
      sheenColor: new THREE.Color(0xf6d89e),
      sheenRoughness: 0.35,
      clearcoat: 0.08,
      clearcoatRoughness: 0.5,
      shadowSide: THREE.DoubleSide
    });

    // Dark leather accents material with wet specular sheen (nose, paw pads)
    this.noseMaterial = new THREE.MeshPhysicalMaterial({
      color: this.skinConfig.noseColor,
      roughness: 0.22,
      metalness: 0.05,
      clearcoat: 0.85,
      clearcoatRoughness: 0.15
    });

    // Sharp canine fangs material
    this.canineMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.1,
      metalness: 0.02,
      clearcoat: 0.95
    });

    // Pink mouth & gums material
    this.gumMaterial = new THREE.MeshStandardMaterial({
      color: 0xc4626e,
      roughness: 0.45,
      metalness: 0.0
    });

    // Claws material
    this.clawMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f1712,
      roughness: 0.3,
      metalness: 0.1
    });

    // Realistic predatory feline eyes with glass cornea & vertical slit
    this.eyeMaterial = new THREE.MeshPhysicalMaterial({
      map: eyeTexture,
      roughness: 0.04,
      metalness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      emissive: this.skinConfig.eyeColor,
      emissiveIntensity: 0.28
    });

    // Whiskers material
    this.whiskerMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85
    });

    // Ear interior soft fur material
    this.innerEarMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5cfc5,
      roughness: 0.85,
      metalness: 0.0
    });

    // 1. Root body pivot
    this.bodyRoot = new THREE.Group();
    this.group.add(this.bodyRoot);

    // 2. Muscular Chest / Thorax (Tapered oval ribcage)
    const chestGeo = new THREE.CylinderGeometry(0.24, 0.29, 0.68, 14);
    chestGeo.rotateX(Math.PI / 2);
    this.chest = new THREE.Mesh(chestGeo, this.coatMaterial);
    this.chest.castShadow = true;
    this.chest.receiveShadow = true;
    this.chest.position.set(0, 0.58, 0.18);
    this.bodyRoot.add(this.chest);

    // Scapulae (Shoulder blade muscle masses)
    const scapulaGeo = new THREE.CylinderGeometry(0.08, 0.13, 0.36, 8);
    scapulaGeo.rotateZ(0.2);
    const scapulaL = new THREE.Mesh(scapulaGeo, this.coatMaterial);
    scapulaL.position.set(0.22, 0.64, 0.22);
    scapulaL.castShadow = true;
    this.bodyRoot.add(scapulaL);

    const scapulaR = new THREE.Mesh(scapulaGeo, this.coatMaterial);
    scapulaR.position.set(-0.22, 0.64, 0.22);
    scapulaR.rotation.y = Math.PI;
    scapulaR.castShadow = true;
    this.bodyRoot.add(scapulaR);

    // 3. Slender Waist & Hindquarters (Pelvis / Haunches)
    const pelvisGeo = new THREE.CylinderGeometry(0.21, 0.26, 0.58, 14);
    pelvisGeo.rotateX(Math.PI / 2);
    this.pelvis = new THREE.Mesh(pelvisGeo, this.coatMaterial);
    this.pelvis.castShadow = true;
    this.pelvis.receiveShadow = true;
    this.pelvis.position.set(0, 0.55, -0.32);
    this.bodyRoot.add(this.pelvis);

    // Haunch muscle bulges (Biceps femoris)
    const haunchGeo = new THREE.SphereGeometry(0.18, 10, 8);
    haunchGeo.scale(0.8, 1.25, 1.1);
    const haunchL = new THREE.Mesh(haunchGeo, this.coatMaterial);
    haunchL.position.set(0.20, 0.52, -0.35);
    haunchL.castShadow = true;
    this.bodyRoot.add(haunchL);

    const haunchR = new THREE.Mesh(haunchGeo, this.coatMaterial);
    haunchR.position.set(-0.20, 0.52, -0.35);
    haunchR.castShadow = true;
    this.bodyRoot.add(haunchR);

    // 4. Neck & Head
    this.neckPivot = new THREE.Group();
    this.neckPivot.position.set(0, 0.68, 0.46);
    this.bodyRoot.add(this.neckPivot);

    const neckGeo = new THREE.CylinderGeometry(0.13, 0.19, 0.34, 12);
    neckGeo.rotateX(Math.PI / 4);
    const neck = new THREE.Mesh(neckGeo, this.coatMaterial);
    neck.castShadow = true;
    this.neckPivot.add(neck);

    // Feline Head
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.21, 0.18);
    this.neckPivot.add(this.headGroup);

    // Anatomical Cranium (Rounded forehead, tapered cheeks)
    const headGeo = new THREE.SphereGeometry(0.20, 16, 14);
    headGeo.scale(1.02, 0.90, 1.08);
    const headMesh = new THREE.Mesh(headGeo, this.coatMaterial);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Rounded Zygomatic Cheek Arches
    const cheekGeo = new THREE.SphereGeometry(0.09, 8, 8);
    cheekGeo.scale(1.2, 0.8, 0.9);
    const cheekL = new THREE.Mesh(cheekGeo, this.coatMaterial);
    cheekL.position.set(0.13, -0.02, 0.08);
    this.headGroup.add(cheekL);

    const cheekR = new THREE.Mesh(cheekGeo, this.coatMaterial);
    cheekR.position.set(-0.13, -0.02, 0.08);
    this.headGroup.add(cheekR);

    // Feline Whisker Pads (Rounded dual vibrissal pads)
    const padGeo = new THREE.SphereGeometry(0.065, 10, 8);
    padGeo.scale(1.25, 0.88, 1.15);

    const padL = new THREE.Mesh(padGeo, this.coatMaterial);
    padL.position.set(0.062, -0.052, 0.20);
    this.headGroup.add(padL);

    const padR = new THREE.Mesh(padGeo, this.coatMaterial);
    padR.position.set(-0.062, -0.052, 0.20);
    this.headGroup.add(padR);

    // Feline Nose (Triangular rhinarium leather)
    const noseGeo = new THREE.ConeGeometry(0.038, 0.048, 5);
    noseGeo.rotateX(-Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, this.noseMaterial);
    nose.position.set(0, -0.015, 0.245);
    this.headGroup.add(nose);

    // Mouth & Lower Chin
    const chinGeo = new THREE.SphereGeometry(0.06, 8, 6);
    chinGeo.scale(1.0, 0.65, 1.2);
    const chin = new THREE.Mesh(chinGeo, this.coatMaterial);
    chin.position.set(0, -0.09, 0.17);
    this.headGroup.add(chin);

    // Sharp white canine fangs
    const fangGeo = new THREE.ConeGeometry(0.014, 0.05, 4);
    fangGeo.rotateX(-0.2);

    const fangL = new THREE.Mesh(fangGeo, this.canineMaterial);
    fangL.position.set(0.042, -0.075, 0.21);
    this.headGroup.add(fangL);

    const fangR = new THREE.Mesh(fangGeo, this.canineMaterial);
    fangR.position.set(-0.042, -0.075, 0.21);
    this.headGroup.add(fangR);

    // Realistic Feline Whiskers (Long, curved nylon strands)
    const whiskerGeo = new THREE.CylinderGeometry(0.0018, 0.0006, 0.24, 4);
    whiskerGeo.rotateZ(Math.PI / 2);
    for (let side = -1; side <= 1; side += 2) {
      for (let w = 0; w < 3; w++) {
        const whisker = new THREE.Mesh(whiskerGeo, this.whiskerMaterial);
        whisker.position.set(side * 0.11, -0.052 + (w - 1) * 0.02, 0.20);
        whisker.rotation.y = side * (0.35 + w * 0.14);
        whisker.rotation.z = side * (0.05 - w * 0.16);
        this.headGroup.add(whisker);
      }
      // Brow whisker above eye
      const browWhisker = new THREE.Mesh(whiskerGeo, this.whiskerMaterial);
      browWhisker.position.set(side * 0.08, 0.10, 0.16);
      browWhisker.rotation.y = side * 0.45;
      browWhisker.rotation.z = side * 0.35;
      this.headGroup.add(browWhisker);
    }

    // Realistic Cup-Shaped Feline Ears
    const earGeo = new THREE.ConeGeometry(0.085, 0.17, 5);
    earGeo.rotateY(Math.PI / 4);

    this.earL = new THREE.Mesh(earGeo, this.coatMaterial);
    this.earL.position.set(0.12, 0.18, 0.03);
    this.earL.rotation.z = -0.32;
    this.earL.rotation.x = -0.15;
    this.headGroup.add(this.earL);

    const innerEarGeo = new THREE.ConeGeometry(0.055, 0.12, 3);
    innerEarGeo.rotateY(Math.PI / 4);
    const innerEarL = new THREE.Mesh(innerEarGeo, this.innerEarMaterial);
    innerEarL.position.set(0, -0.01, 0.02);
    this.earL.add(innerEarL);

    this.earR = new THREE.Mesh(earGeo, this.coatMaterial);
    this.earR.position.set(-0.12, 0.18, 0.03);
    this.earR.rotation.z = 0.32;
    this.earR.rotation.x = -0.15;
    this.headGroup.add(this.earR);

    const innerEarR = new THREE.Mesh(innerEarGeo, this.innerEarMaterial);
    innerEarR.position.set(0, -0.01, 0.02);
    this.earR.add(innerEarR);

    // Reflective Slit Eyes with Eyelid Rim
    const eyeGeo = new THREE.SphereGeometry(0.044, 10, 8);
    eyeGeo.scale(0.85, 1.25, 0.85);

    const eyeL = new THREE.Mesh(eyeGeo, this.eyeMaterial);
    eyeL.position.set(0.09, 0.045, 0.16);
    this.headGroup.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, this.eyeMaterial);
    eyeR.position.set(-0.09, 0.045, 0.16);
    this.headGroup.add(eyeR);

    // 5. Articulated Digitigrade Legs (Front Left, Front Right, Rear Left, Rear Right)
    this.legs = {
      FL: this.createLimb(true, 0.21, 0.52, 0.35),
      FR: this.createLimb(true, -0.21, 0.52, 0.35),
      RL: this.createLimb(false, 0.23, 0.52, -0.38),
      RR: this.createLimb(false, -0.23, 0.52, -0.38),
    };

    // 6. Articulated 10-Segment Physics Tail
    this.tailSegments = [];
    const tailBase = new THREE.Group();
    tailBase.position.set(0, 0.62, -0.58);
    this.bodyRoot.add(tailBase);

    let parentNode = tailBase;
    const numSegments = 10;
    for (let i = 0; i < numSegments; i++) {
      const segGroup = new THREE.Group();
      segGroup.position.set(0, 0.02, -0.11);

      const radius = 0.045 * (1.0 - i * 0.075);
      const segGeo = new THREE.CylinderGeometry(radius * 0.85, radius, 0.12, 8);
      segGeo.rotateX(-Math.PI / 3.2);
      const segMesh = new THREE.Mesh(segGeo, this.coatMaterial);
      segMesh.castShadow = true;
      segGroup.add(segMesh);

      parentNode.add(segGroup);
      this.tailSegments.push(segGroup);
      parentNode = segGroup;
    }

    // Shadow blob / ground contact indicator
    const shadowGeo = new THREE.PlaneGeometry(0.9, 1.8);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });
    this.groundShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.groundShadow.rotation.x = -Math.PI / 2;
    this.groundShadow.position.y = 0.02;
    this.scene.add(this.groundShadow);
  }

  /**
   * Helper to build articulated quadruped feline limb with digitigrade stance and curved claws
   */
  createLimb(isFront, x, y, z) {
    const limbGroup = new THREE.Group();
    limbGroup.position.set(x, y, z);
    this.bodyRoot.add(limbGroup);

    // Upper limb (thigh / upper arm)
    const upperLen = isFront ? 0.28 : 0.32;
    const upperGeo = new THREE.CylinderGeometry(0.065, 0.05, upperLen, 8);
    const upper = new THREE.Mesh(upperGeo, this.coatMaterial);
    upper.position.y = -upperLen / 2;
    upper.castShadow = true;
    limbGroup.add(upper);

    // Knee / Hock joint
    const joint = new THREE.Group();
    joint.position.y = -upperLen;
    limbGroup.add(joint);

    // Lower limb (shin / metatarsus)
    const lowerLen = isFront ? 0.28 : 0.30;
    const lowerGeo = new THREE.CylinderGeometry(0.05, 0.04, lowerLen, 8);
    const lower = new THREE.Mesh(lowerGeo, this.coatMaterial);
    lower.position.y = -lowerLen / 2;
    lower.castShadow = true;
    joint.add(lower);

    // Paws with 4 distinct curved claws
    const pawGeo = new THREE.BoxGeometry(0.095, 0.055, 0.13);
    const paw = new THREE.Mesh(pawGeo, this.coatMaterial);
    paw.position.set(0, -lowerLen, 0.035);
    paw.castShadow = true;
    joint.add(paw);

    // 4 sharp curved claws
    for (let c = -1.5; c <= 1.5; c += 1.0) {
      const clawGeo = new THREE.ConeGeometry(0.010, 0.035, 4);
      clawGeo.rotateX(Math.PI / 2.5);
      const claw = new THREE.Mesh(clawGeo, this.clawMaterial);
      claw.position.set(c * 0.024, -lowerLen - 0.01, 0.10);
      joint.add(claw);
    }

    // Dark leathery paw pad on sole
    const padGeo = new THREE.BoxGeometry(0.08, 0.015, 0.10);
    const pad = new THREE.Mesh(padGeo, this.noseMaterial);
    pad.position.set(0, -lowerLen - 0.02, 0.035);
    joint.add(pad);

    return {
      root: limbGroup,
      joint: joint,
      paw: paw,
      isFront: isFront,
      baseX: x,
      baseY: y,
      baseZ: z
    };
  }

  setSkin(skinKey) {
    if (!CAT_SKINS[skinKey]) return;
    this.skinKey = skinKey;
    this.skinConfig = CAT_SKINS[skinKey];

    if (this.coatMaterial.map) this.coatMaterial.map.dispose();
    this.coatMaterial.map = this.createCoatTexture(this.skinConfig);
    this.coatMaterial.needsUpdate = true;

    if (this.eyeMaterial.map) this.eyeMaterial.map.dispose();
    this.eyeMaterial.map = this.createEyeTexture(this.skinConfig.eyeColor);
    this.eyeMaterial.emissive.setHex(this.skinConfig.eyeColor);
    this.eyeMaterial.needsUpdate = true;

    this.noseMaterial.color.setHex(this.skinConfig.noseColor);
  }

  setLane(laneIndex) {
    this.lane = Math.max(-1, Math.min(1, laneIndex));
    // Since camera looks forward along +Z, screen-left corresponds to +X and screen-right to -X
    this.targetX = -this.lane * DIMENSIONS.LANE_WIDTH;
  }

  jump() {
    if (this.isJumping) return false;
    this.isJumping = true;
    this.velocityY = 15.0; // Crisp athletic leap
    if (this.isSliding) {
      this.isSliding = false;
      this.slideTimer = 0;
    }
    return true;
  }

  slide() {
    if (this.isSliding) return false;
    this.isSliding = true;
    this.slideTimer = this.slideDuration;
    if (this.isJumping) {
      this.velocityY = -22.0;
    }
    return true;
  }

  update(dt, speed, worldCurvature = 0) {
    // 1. Instantaneous Smooth Lane Interpolation
    const dx = this.targetX - this.currentX;
    this.currentX += dx * Math.min(1.0, this.laneChangeSpeed * dt);
    this.group.position.x = this.currentX;

    // Bank / tilt body into the turn
    const bankAngle = dx * 0.18;
    this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, bankAngle, dt * 12);
    this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, dx * 0.12, dt * 12);

    // 2. Vertical Jump & Gravity Physics
    if (this.isJumping) {
      this.y += this.velocityY * dt;
      this.velocityY += this.gravity * dt;

      if (this.y <= 0) {
        this.y = 0;
        this.velocityY = 0;
        this.isJumping = false;
        if (this.onPawStrike) {
          this.onPawStrike(this.group.position.clone(), false);
        }
      }
    }

    // 3. Sliding State
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    // Apply vertical displacement
    const targetScaleY = this.isSliding ? 0.45 : 1.0;
    const targetScaleZ = this.isSliding ? 1.35 : 1.0;
    this.bodyRoot.scale.y = THREE.MathUtils.lerp(this.bodyRoot.scale.y, targetScaleY, dt * 18);
    this.bodyRoot.scale.z = THREE.MathUtils.lerp(this.bodyRoot.scale.z, targetScaleZ, dt * 18);
    this.group.position.y = this.y + (this.isSliding ? -0.22 : 0);

    // Shadow follows on ground
    this.groundShadow.position.x = this.group.position.x;
    this.groundShadow.position.z = this.group.position.z;
    const shadowScale = Math.max(0.2, 1.0 - (this.y / 4.0));
    this.groundShadow.scale.set(shadowScale, shadowScale, 1.0);
    this.groundShadow.material.opacity = 0.45 * shadowScale;

    // 4. Quadruped Gallop Cycle Animation
    const gallopSpeed = (speed / 18.0) * this.gallopFrequency;
    this.gallopPhase = (this.gallopPhase + dt * gallopSpeed) % (Math.PI * 2);

    this.animateGallop(this.gallopPhase, dt, speed);

    // 5. Tail Physics (Sways and trails smoothly with inertia)
    this.animateTail(dt, speed);
  }

  animateGallop(phase, dt, speed) {
    if (this.isJumping) {
      // In-flight leap pose
      this.chest.rotation.x = -0.28;
      this.pelvis.rotation.x = 0.22;
      this.neckPivot.rotation.x = -0.15;

      // Forelegs stretched forward
      this.legs.FL.root.rotation.x = 0.70;
      this.legs.FR.root.rotation.x = 0.65;
      this.legs.FL.joint.rotation.x = -0.35;
      this.legs.FR.joint.rotation.x = -0.30;

      // Hind legs tucked backward
      this.legs.RL.root.rotation.x = -0.90;
      this.legs.RR.root.rotation.x = -0.85;
      this.legs.RL.joint.rotation.x = 0.65;
      this.legs.RR.joint.rotation.x = 0.60;
      return;
    }

    if (this.isSliding) {
      // Sleek low crouch
      this.chest.rotation.x = 0.05;
      this.pelvis.rotation.x = -0.05;
      this.neckPivot.rotation.x = -0.25;
      this.earL.rotation.x = -0.7;
      this.earR.rotation.x = -0.7;

      this.legs.FL.root.rotation.x = 1.2;
      this.legs.FR.root.rotation.x = 1.2;
      this.legs.RL.root.rotation.x = -1.1;
      this.legs.RR.root.rotation.x = -1.1;
      return;
    }

    // Normal Gallop Rhythm (Rotary gallop)
    const spineFlex = Math.sin(phase);
    this.chest.rotation.x = spineFlex * 0.15;
    this.pelvis.rotation.x = -spineFlex * 0.17;
    this.bodyRoot.position.y = Math.abs(Math.sin(phase)) * 0.13;

    // Head bobs naturally with stride
    this.neckPivot.rotation.x = -spineFlex * 0.12;

    // Legs: 4-beat rotary rhythm
    const flAngle = Math.sin(phase) * 0.78;
    const frAngle = Math.sin(phase + 0.45) * 0.78;
    this.legs.FL.root.rotation.x = flAngle;
    this.legs.FR.root.rotation.x = frAngle;
    this.legs.FL.joint.rotation.x = -Math.max(0, flAngle) * 0.9;
    this.legs.FR.joint.rotation.x = -Math.max(0, frAngle) * 0.9;

    const rlAngle = Math.sin(phase + Math.PI) * 0.88;
    const rrAngle = Math.sin(phase + Math.PI + 0.4) * 0.88;
    this.legs.RL.root.rotation.x = rlAngle;
    this.legs.RR.root.rotation.x = rrAngle;
    this.legs.RL.joint.rotation.x = Math.max(0, -rlAngle) * 0.82;
    this.legs.RR.joint.rotation.x = Math.max(0, -rrAngle) * 0.82;

    // Paw strike particle triggers
    if (Math.cos(phase) > 0.95 && this.onPawStrike) {
      const pawPos = this.group.position.clone().add(new THREE.Vector3(0.15, 0, 0.2));
      this.onPawStrike(pawPos, false);
    }
  }

  animateTail(dt, speed) {
    const time = performance.now() * 0.006;

    this.tailSegments.forEach((seg, i) => {
      const wave = Math.sin(time * 1.8 - i * 0.5) * 0.28;
      const inertia = (this.group.rotation.z || 0) * 1.5;

      seg.rotation.y = wave + inertia * (i / this.tailSegments.length);
      seg.rotation.x = -0.15 + (i * 0.05) + (this.isJumping ? 0.35 : 0);
    });
  }

  getBounds() {
    return {
      x: this.group.position.x,
      y: this.group.position.y,
      z: this.group.position.z,
      width: DIMENSIONS.CAT_BOUNDS.width,
      height: this.isSliding ? DIMENSIONS.SLIDE_HEIGHT : DIMENSIONS.CAT_BOUNDS.height,
      length: DIMENSIONS.CAT_BOUNDS.length,
      isSliding: this.isSliding,
      isJumping: this.isJumping
    };
  }

  destroy() {
    this.scene.remove(this.group);
    this.scene.remove(this.groundShadow);
    if (this.coatMaterial.map) this.coatMaterial.map.dispose();
    if (this.furBumpTexture) this.furBumpTexture.dispose();
    if (this.eyeMaterial.map) this.eyeMaterial.map.dispose();
    this.coatMaterial.dispose();
    this.eyeMaterial.dispose();
    this.noseMaterial.dispose();
    this.canineMaterial.dispose();
    this.gumMaterial.dispose();
    this.clawMaterial.dispose();
    if (this.whiskerMaterial) this.whiskerMaterial.dispose();
    if (this.innerEarMaterial) this.innerEarMaterial.dispose();
  }
}
