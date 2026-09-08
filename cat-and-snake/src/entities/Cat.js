/**
 * Anatomical 3D Procedural Cat Model & Quadruped Gallop Controller
 * Features realistic quadruped gallop cycle, jumping, sliding, tail physics, and dynamic coat shaders.
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
    this.laneChangeSpeed = 12.0;

    this.y = 0;
    this.velocityY = 0;
    this.gravity = -38.0;
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.slideDuration = DIMENSIONS.SLIDE_DURATION;

    // Invulnerability / speed boost visual state
    this.isInvincible = false;
    this.invincibilityTimer = 0;

    // Gallop cycle parameters
    this.gallopPhase = 0;
    this.gallopFrequency = 9.0; // steps per second scaled with speed
    this.tailPhysicsNodes = [];

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
   * Generates procedural fur coat textures with rosettes, stripes, or panther sleekness
   */
  createCoatTexture(skinConfig) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base coat gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    const primHex = '#' + skinConfig.primaryColor.toString(16).padStart(6, '0');
    const bellyHex = '#' + skinConfig.bellyColor.toString(16).padStart(6, '0');
    grad.addColorStop(0, primHex);
    grad.addColorStop(0.7, primHex);
    grad.addColorStop(1.0, bellyHex);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Add fine fur fiber noise
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let i = 0; i < 4000; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      ctx.fillRect(rx, ry, 2, 4);
    }

    // Pattern markings (Rosettes or Stripes)
    const spotHex = '#' + skinConfig.spotColor.toString(16).padStart(6, '0');
    ctx.fillStyle = spotHex;

    if (skinConfig.id === 'leopard' || skinConfig.id === 'mystic') {
      // Rosettes / irregular spots
      for (let i = 0; i < 90; i++) {
        const cx = Math.random() * 512;
        const cy = Math.random() * 380; // keep off belly
        const r = 4 + Math.random() * 7;
        ctx.beginPath();
        // Broken rosette ring
        ctx.arc(cx, cy, r, 0, Math.PI * 1.6);
        ctx.lineWidth = 2 + Math.random() * 2.5;
        ctx.strokeStyle = spotHex;
        ctx.stroke();

        // Small central dot
        if (Math.random() > 0.4) {
          ctx.beginPath();
          ctx.arc(cx + 1, cy + 1, r * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (skinConfig.id === 'tiger') {
      // Bold wild tiger stripes
      ctx.strokeStyle = spotHex;
      for (let i = 0; i < 30; i++) {
        const sy = 40 + i * 14;
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.bezierCurveTo(120, sy + 15, 240, sy - 15, 360, sy + 10);
        ctx.lineWidth = 4 + Math.random() * 4;
        ctx.stroke();
      }
    } else if (skinConfig.id === 'panther') {
      // Subtle ghost rosettes visible only under specular highlights
      ctx.fillStyle = 'rgba(10, 10, 12, 0.6)';
      for (let i = 0; i < 60; i++) {
        const cx = Math.random() * 512;
        const cy = Math.random() * 380;
        ctx.beginPath();
        ctx.arc(cx, cy, 5 + Math.random() * 5, 0, Math.PI * 2);
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

    // Primary fur material
    this.coatMaterial = new THREE.MeshStandardMaterial({
      map: coatTexture,
      roughness: 0.62,
      metalness: 0.08,
      shadowSide: THREE.DoubleSide
    });

    // Dark accents material (nose, pads)
    this.noseMaterial = new THREE.MeshStandardMaterial({
      color: this.skinConfig.noseColor,
      roughness: 0.3,
      metalness: 0.1
    });

    // Menacing glowing predatory feline eyes
    this.eyeMaterial = new THREE.MeshStandardMaterial({
      color: this.skinConfig.eyeColor,
      emissive: this.skinConfig.eyeColor,
      emissiveIntensity: 0.65,
      roughness: 0.1,
      metalness: 0.1
    });

    // 1. Root body pivot
    this.bodyRoot = new THREE.Group();
    this.group.add(this.bodyRoot);

    // 2. Muscular Chest / Thorax (Tapered oval)
    const chestGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.65, 12);
    chestGeo.rotateX(Math.PI / 2);
    this.chest = new THREE.Mesh(chestGeo, this.coatMaterial);
    this.chest.castShadow = true;
    this.chest.receiveShadow = true;
    this.chest.position.set(0, 0.58, 0.18);
    this.bodyRoot.add(this.chest);

    // 3. Slender Waist & Hindquarters (Pelvis)
    const pelvisGeo = new THREE.CylinderGeometry(0.22, 0.25, 0.55, 12);
    pelvisGeo.rotateX(Math.PI / 2);
    this.pelvis = new THREE.Mesh(pelvisGeo, this.coatMaterial);
    this.pelvis.castShadow = true;
    this.pelvis.receiveShadow = true;
    this.pelvis.position.set(0, 0.54, -0.32);
    this.bodyRoot.add(this.pelvis);

    // 4. Neck & Head
    this.neckPivot = new THREE.Group();
    this.neckPivot.position.set(0, 0.68, 0.45);
    this.bodyRoot.add(this.neckPivot);

    const neckGeo = new THREE.CylinderGeometry(0.14, 0.19, 0.32, 10);
    neckGeo.rotateX(Math.PI / 4);
    const neck = new THREE.Mesh(neckGeo, this.coatMaterial);
    neck.castShadow = true;
    this.neckPivot.add(neck);

    // Feline Head
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.2, 0.16);
    this.neckPivot.add(this.headGroup);

    // Cranium
    const headGeo = new THREE.SphereGeometry(0.20, 14, 12);
    headGeo.scale(1.0, 0.88, 1.05);
    const headMesh = new THREE.Mesh(headGeo, this.coatMaterial);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Muzzle & Whiskers area
    const muzzleGeo = new THREE.BoxGeometry(0.16, 0.12, 0.16);
    const muzzle = new THREE.Mesh(muzzleGeo, this.coatMaterial);
    muzzle.position.set(0, -0.06, 0.14);
    muzzle.castShadow = true;
    this.headGroup.add(muzzle);

    // Nose
    const noseGeo = new THREE.ConeGeometry(0.04, 0.05, 5);
    noseGeo.rotateX(-Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, this.noseMaterial);
    nose.position.set(0, -0.02, 0.22);
    this.headGroup.add(nose);

    // Alert Feline Triangular Ears
    const earGeo = new THREE.ConeGeometry(0.085, 0.16, 4);
    earGeo.rotateY(Math.PI / 4);

    this.earL = new THREE.Mesh(earGeo, this.coatMaterial);
    this.earL.position.set(0.11, 0.18, 0.02);
    this.earL.rotation.z = -0.3;
    this.earL.rotation.x = -0.15;
    this.headGroup.add(this.earL);

    this.earR = new THREE.Mesh(earGeo, this.coatMaterial);
    this.earR.position.set(-0.11, 0.18, 0.02);
    this.earR.rotation.z = 0.3;
    this.earR.rotation.x = -0.15;
    this.headGroup.add(this.earR);

    // Reflective Slit Eyes
    const eyeGeo = new THREE.SphereGeometry(0.042, 8, 8);
    eyeGeo.scale(0.8, 1.2, 0.8);

    const eyeL = new THREE.Mesh(eyeGeo, this.eyeMaterial);
    eyeL.position.set(0.085, 0.04, 0.15);
    this.headGroup.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, this.eyeMaterial);
    eyeR.position.set(-0.085, 0.04, 0.15);
    this.headGroup.add(eyeR);

    // 5. Articulated Legs (Front Left, Front Right, Rear Left, Rear Right)
    this.legs = {
      FL: this.createLimb(true, 0.2, 0.52, 0.35),
      FR: this.createLimb(true, -0.2, 0.52, 0.35),
      RL: this.createLimb(false, 0.22, 0.52, -0.38),
      RR: this.createLimb(false, -0.22, 0.52, -0.38),
    };

    // 6. Articulated Multi-Segment Physics Tail
    this.tailSegments = [];
    const tailBase = new THREE.Group();
    tailBase.position.set(0, 0.62, -0.58);
    this.bodyRoot.add(tailBase);

    let parentNode = tailBase;
    const numSegments = 7;
    for (let i = 0; i < numSegments; i++) {
      const segGroup = new THREE.Group();
      segGroup.position.set(0, 0.03, -0.12);

      const radius = 0.048 * (1.0 - i * 0.09);
      const segGeo = new THREE.CylinderGeometry(radius * 0.85, radius, 0.13, 7);
      segGeo.rotateX(-Math.PI / 3);
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
   * Helper to build articulated quadruped limb
   */
  createLimb(isFront, x, y, z) {
    const limbGroup = new THREE.Group();
    limbGroup.position.set(x, y, z);
    this.bodyRoot.add(limbGroup);

    // Upper limb (thigh/shoulder)
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

    // Lower limb (shin/metatarsus)
    const lowerLen = isFront ? 0.28 : 0.30;
    const lowerGeo = new THREE.CylinderGeometry(0.05, 0.04, lowerLen, 8);
    const lower = new THREE.Mesh(lowerGeo, this.coatMaterial);
    lower.position.y = -lowerLen / 2;
    lower.castShadow = true;
    joint.add(lower);

    // Paw with dark pads
    const pawGeo = new THREE.BoxGeometry(0.09, 0.055, 0.12);
    const paw = new THREE.Mesh(pawGeo, this.coatMaterial);
    paw.position.set(0, -lowerLen, 0.03);
    paw.castShadow = true;
    joint.add(paw);

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

    // Dispose old textures and build fresh
    if (this.coatMaterial.map) this.coatMaterial.map.dispose();
    this.coatMaterial.map = this.createCoatTexture(this.skinConfig);
    this.coatMaterial.needsUpdate = true;

    this.eyeMaterial.color.setHex(this.skinConfig.eyeColor);
    this.eyeMaterial.emissive.setHex(this.skinConfig.eyeColor);
    this.noseMaterial.color.setHex(this.skinConfig.noseColor);
  }

  setLane(laneIndex) {
    this.lane = Math.max(-1, Math.min(1, laneIndex));
    this.targetX = this.lane * DIMENSIONS.LANE_WIDTH;
  }

  jump() {
    if (this.isJumping) return false;
    this.isJumping = true;
    this.velocityY = 13.5;
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
    // If airborne, push down rapidly
    if (this.isJumping) {
      this.velocityY = -18.0;
    }
    return true;
  }

  setInvincible(duration = 5.0) {
    this.isInvincible = true;
    this.invincibilityTimer = duration;
  }

  update(dt, speed, worldCurvature = 0) {
    // 1. Smooth Lane Interpolation
    const dx = this.targetX - this.currentX;
    this.currentX += dx * Math.min(1.0, this.laneChangeSpeed * dt);
    this.group.position.x = this.currentX;

    // Bank / tilt body during lane transition
    const bankAngle = -dx * 0.18;
    this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, bankAngle, dt * 10);
    this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, dx * 0.12, dt * 10);

    // 2. Vertical Jump & Gravity Physics
    if (this.isJumping) {
      this.y += this.velocityY * dt;
      this.velocityY += this.gravity * dt;

      if (this.y <= 0) {
        this.y = 0;
        this.velocityY = 0;
        this.isJumping = false;
        // Paw landing trigger
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
    this.bodyRoot.scale.y = THREE.MathUtils.lerp(this.bodyRoot.scale.y, targetScaleY, dt * 16);
    this.bodyRoot.scale.z = THREE.MathUtils.lerp(this.bodyRoot.scale.z, targetScaleZ, dt * 16);
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

    // 6. Invincibility flicker
    if (this.isInvincible) {
      this.invincibilityTimer -= dt;
      if (this.invincibilityTimer <= 0) {
        this.isInvincible = false;
        this.coatMaterial.opacity = 1.0;
        this.coatMaterial.transparent = false;
      } else {
        this.coatMaterial.transparent = true;
        this.coatMaterial.opacity = 0.5 + 0.5 * Math.sin(performance.now() * 0.02);
      }
    }
  }

  animateGallop(phase, dt, speed) {
    if (this.isJumping) {
      // In-flight leap pose
      this.chest.rotation.x = -0.25;
      this.pelvis.rotation.x = 0.2;
      this.neckPivot.rotation.x = -0.15;

      // Forelegs stretched forward
      this.legs.FL.root.rotation.x = 0.65;
      this.legs.FR.root.rotation.x = 0.60;
      this.legs.FL.joint.rotation.x = -0.3;
      this.legs.FR.joint.rotation.x = -0.25;

      // Hind legs tucked backward
      this.legs.RL.root.rotation.x = -0.85;
      this.legs.RR.root.rotation.x = -0.80;
      this.legs.RL.joint.rotation.x = 0.6;
      this.legs.RR.joint.rotation.x = 0.55;
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
    // Spine flexes and extends
    const spineFlex = Math.sin(phase);
    this.chest.rotation.x = spineFlex * 0.14;
    this.pelvis.rotation.x = -spineFlex * 0.16;
    this.bodyRoot.position.y = Math.abs(Math.sin(phase)) * 0.12;

    // Head bobs naturally with stride
    this.neckPivot.rotation.x = -spineFlex * 0.12;

    // Legs: 4-beat rotary rhythm
    // Forelegs
    const flAngle = Math.sin(phase) * 0.75;
    const frAngle = Math.sin(phase + 0.45) * 0.75;
    this.legs.FL.root.rotation.x = flAngle;
    this.legs.FR.root.rotation.x = frAngle;
    this.legs.FL.joint.rotation.x = -Math.max(0, flAngle) * 0.9;
    this.legs.FR.joint.rotation.x = -Math.max(0, frAngle) * 0.9;

    // Hind legs
    const rlAngle = Math.sin(phase + Math.PI) * 0.85;
    const rrAngle = Math.sin(phase + Math.PI + 0.4) * 0.85;
    this.legs.RL.root.rotation.x = rlAngle;
    this.legs.RR.root.rotation.x = rrAngle;
    this.legs.RL.joint.rotation.x = Math.max(0, -rlAngle) * 0.8;
    this.legs.RR.joint.rotation.x = Math.max(0, -rrAngle) * 0.8;

    // Paw strike particle triggers
    if (Math.cos(phase) > 0.95 && this.onPawStrike) {
      const pawPos = this.group.position.clone().add(new THREE.Vector3(0.15, 0, 0.2));
      this.onPawStrike(pawPos, false);
    }
  }

  animateTail(dt, speed) {
    const time = performance.now() * 0.006;
    const speedRatio = speed / 25.0;

    this.tailSegments.forEach((seg, i) => {
      // Undulating wave traveling down tail
      const wave = Math.sin(time * 1.8 - i * 0.6) * 0.25;
      const inertia = (this.group.rotation.z || 0) * 1.5;

      seg.rotation.y = wave + inertia * (i / this.tailSegments.length);
      seg.rotation.x = -0.15 + (i * 0.06) + (this.isJumping ? 0.3 : 0);
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
    this.coatMaterial.dispose();
    this.eyeMaterial.dispose();
    this.noseMaterial.dispose();
  }
}
