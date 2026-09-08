/**
 * Ultra-Realistic Giant Jungle Serpent (Snake) Entity
 * Features 45 articulated vertebrae segments, cubic spine tracking, diamond scale shaders,
 * realistic lateral undulation (sinusoidal slither wave), lunging hinged jaws, fangs, and flicking tongue.
 */

import * as THREE from 'three';

export class Snake {
  constructor(scene) {
    this.scene = scene;

    // Chase distance from cat (in meters along Z)
    this.distance = 8.5; 
    this.targetDistance = 8.5;
    this.catchDistance = 1.2;
    this.speed = 20.0;

    // Slither undulation parameters
    this.undulationPhase = 0;
    this.waveFrequency = 0.35;
    this.waveAmplitude = 0.85;

    // Jaw & lunging state
    this.isLunging = false;
    this.jawOpenAngle = 0;
    this.tongueFlickerPhase = 0;

    // Body segments configuration
    this.numSegments = 45;
    this.segmentSpacing = 0.38;
    this.segments = [];

    // Historical trail buffer for snake spine to follow the cat's exact path
    this.trailHistory = [];
    this.maxTrailLength = 250;

    // Build 3D mesh
    this.group = new THREE.Group();
    this.buildSnakeModel();
    this.scene.add(this.group);
  }

  /**
   * Procedural scale texture with diamond patterns and belly scutes
   */
  createSnakeScaleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base emerald reptile green
    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, '#102e18');
    grad.addColorStop(0.3, '#1c5e31');
    grad.addColorStop(0.5, '#2dc263');
    grad.addColorStop(0.7, '#1c5e31');
    grad.addColorStop(1.0, '#102e18');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Diamond pattern scales on back
    ctx.strokeStyle = 'rgba(10, 25, 12, 0.85)';
    ctx.lineWidth = 2.5;

    const scaleSize = 24;
    for (let y = 0; y < 512; y += scaleSize) {
      for (let x = 0; x < 512; x += scaleSize) {
        const cx = x + (y % (scaleSize * 2) === 0 ? 0 : scaleSize / 2);
        ctx.beginPath();
        ctx.moveTo(cx, y);
        ctx.lineTo(cx + scaleSize / 2, y + scaleSize / 2);
        ctx.lineTo(cx, y + scaleSize);
        ctx.lineTo(cx - scaleSize / 2, y + scaleSize / 2);
        ctx.closePath();
        ctx.stroke();

        // Highlight center of scale
        ctx.fillStyle = 'rgba(120, 255, 160, 0.12)';
        ctx.fill();
      }
    }

    // Belly ventral scutes (horizontal bands along bottom edge)
    ctx.fillStyle = 'rgba(235, 230, 180, 0.45)';
    ctx.fillRect(0, 420, 512, 92);
    ctx.strokeStyle = 'rgba(60, 55, 30, 0.5)';
    for (let y = 420; y < 512; y += 12) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  buildSnakeModel() {
    const scaleTexture = this.createSnakeScaleTexture();

    // Scale PBR Material
    this.scaleMaterial = new THREE.MeshStandardMaterial({
      map: scaleTexture,
      roughness: 0.38,
      metalness: 0.22,
      shadowSide: THREE.DoubleSide
    });

    // Dark flesh interior material (mouth, throat)
    this.mouthMaterial = new THREE.MeshStandardMaterial({
      color: 0x8a1c2b,
      roughness: 0.5,
      metalness: 0.05
    });

    // Razor-sharp venomous fangs material
    this.fangMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.15,
      metalness: 0.1
    });

    // Predatory glowing reptilian eyes
    this.eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      emissive: 0xff6600,
      emissiveIntensity: 0.85,
      roughness: 0.1,
      metalness: 0.1
    });

    // Forked tongue material
    this.tongueMaterial = new THREE.MeshBasicMaterial({
      color: 0x990022
    });

    // 1. Head Group
    this.headGroup = new THREE.Group();
    this.group.add(this.headGroup);

    // Upper viper skull (triangular flared brow)
    const skullGeo = new THREE.ConeGeometry(0.38, 0.85, 6);
    skullGeo.rotateX(Math.PI / 2);
    skullGeo.scale(1.2, 0.55, 1.0);
    this.upperSkull = new THREE.Mesh(skullGeo, this.scaleMaterial);
    this.upperSkull.castShadow = true;
    this.headGroup.add(this.upperSkull);

    // Menacing glowing slit eyes
    const eyeGeo = new THREE.SphereGeometry(0.065, 8, 8);
    eyeGeo.scale(0.8, 1.3, 0.7);

    const eyeL = new THREE.Mesh(eyeGeo, this.eyeMaterial);
    eyeL.position.set(0.24, 0.12, 0.12);
    this.headGroup.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, this.eyeMaterial);
    eyeR.position.set(-0.24, 0.12, 0.12);
    this.headGroup.add(eyeR);

    // Hinged Lower Jaw (Drops open during lunges)
    this.lowerJaw = new THREE.Group();
    this.lowerJaw.position.set(0, -0.06, -0.15);
    this.headGroup.add(this.lowerJaw);

    const jawGeo = new THREE.BoxGeometry(0.32, 0.08, 0.65);
    jawGeo.translate(0, -0.04, 0.3);
    const jawMesh = new THREE.Mesh(jawGeo, this.scaleMaterial);
    jawMesh.castShadow = true;
    this.lowerJaw.add(jawMesh);

    // Curved sharp fangs
    const fangGeo = new THREE.ConeGeometry(0.035, 0.16, 5);
    fangGeo.rotateX(-Math.PI / 6);

    const fangL = new THREE.Mesh(fangGeo, this.fangMaterial);
    fangL.position.set(0.14, -0.04, 0.28);
    fangL.castShadow = true;
    this.headGroup.add(fangL);

    const fangR = new THREE.Mesh(fangGeo, this.fangMaterial);
    fangR.position.set(-0.14, -0.04, 0.28);
    fangR.castShadow = true;
    this.headGroup.add(fangR);

    // Forked tongue
    this.tongueGroup = new THREE.Group();
    this.tongueGroup.position.set(0, -0.02, 0.42);
    this.headGroup.add(this.tongueGroup);

    const tongueStem = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.015, 0.22), this.tongueMaterial);
    tongueStem.position.z = 0.11;
    this.tongueGroup.add(tongueStem);

    const forkGeoL = new THREE.BoxGeometry(0.015, 0.012, 0.1);
    const forkL = new THREE.Mesh(forkGeoL, this.tongueMaterial);
    forkL.position.set(0.02, 0, 0.24);
    forkL.rotation.y = 0.35;
    this.tongueGroup.add(forkL);

    const forkR = new THREE.Mesh(forkGeoL, this.tongueMaterial);
    forkR.position.set(-0.02, 0, 0.24);
    forkR.rotation.y = -0.35;
    this.tongueGroup.add(forkR);

    // 2. 45 Articulated Vertebrae Segments
    for (let i = 0; i < this.numSegments; i++) {
      const segGroup = new THREE.Group();

      // Realistic anatomical tapering profile:
      // Starts medium at neck, swells thick in muscular midsection (up to radius 0.38), then tapers down to 0.04 at tail tip!
      const t = i / this.numSegments;
      let radius;
      if (t < 0.12) {
        // Neck transition
        radius = 0.28 + t * 0.7;
      } else if (t < 0.45) {
        // Muscular midsection
        radius = 0.36 + Math.sin((t - 0.12) / 0.33 * Math.PI) * 0.06;
      } else {
        // Graceful taper down to tip
        const tailT = (t - 0.45) / 0.55;
        radius = 0.36 * Math.pow(1.0 - tailT, 0.75) + 0.04;
      }

      const segGeo = new THREE.SphereGeometry(radius, 10, 8);
      segGeo.scale(1.15, 0.85, 1.2); // Flatted serpentine cross-section
      const segMesh = new THREE.Mesh(segGeo, this.scaleMaterial);
      segMesh.castShadow = true;
      segMesh.receiveShadow = true;
      segGroup.add(segMesh);

      this.group.add(segGroup);
      this.segments.push({
        group: segGroup,
        mesh: segMesh,
        radius: radius,
        position: new THREE.Vector3(0, radius * 0.8, -i * this.segmentSpacing)
      });
    }
  }

  setDistance(dist) {
    this.targetDistance = Math.max(0.8, dist);
  }

  pushBack(meters = 3.0) {
    this.targetDistance = Math.min(14.0, this.targetDistance + meters);
  }

  surgeForward(meters = 2.0) {
    this.targetDistance = Math.max(0.4, this.targetDistance - meters);
    this.distance = Math.max(0.4, this.distance - meters);
  }

  recordPathPoint(catPosition) {
    this.trailHistory.unshift(catPosition.clone());
    if (this.trailHistory.length > this.maxTrailLength) {
      this.trailHistory.pop();
    }
  }

  update(dt, catPosition, speed, difficultyAggression = 1.0) {
    // Record cat path
    this.recordPathPoint(catPosition);

    // Smoothly interpolate current chase distance
    const distDelta = this.targetDistance - this.distance;
    this.distance += distDelta * Math.min(1.0, 2.5 * dt);

    // Undulation traveling wave along snake body
    const slitherSpeed = (speed / 18.0) * 12.0;
    this.undulationPhase += dt * slitherSpeed;

    // Head position relative to cat
    const snakeHeadZ = catPosition.z - this.distance;

    // Find path history point at snakeHeadZ
    const leadPoint = this.getPointAtDistance(this.distance) || new THREE.Vector3(
      catPosition.x,
      catPosition.y,
      snakeHeadZ
    );

    // Sinusoidal lateral slither for the head
    const headWave = Math.sin(this.undulationPhase) * this.waveAmplitude * 0.4;
    this.headGroup.position.set(
      leadPoint.x + headWave,
      Math.max(0.35, leadPoint.y + 0.4),
      leadPoint.z
    );

    // Danger proximity mechanics (< 3.8m = high danger)
    this.isLunging = this.distance < 4.0;
    const targetJawAngle = this.isLunging ? 0.75 : 0.08;
    this.jawOpenAngle = THREE.MathUtils.lerp(this.jawOpenAngle, targetJawAngle, dt * 8);
    this.lowerJaw.rotation.x = -this.jawOpenAngle;

    // Eye glow intensity increases when lunging
    this.eyeMaterial.emissiveIntensity = this.isLunging ? 1.4 : 0.7;

    // Tongue flicker
    this.tongueFlickerPhase += dt * (this.isLunging ? 28.0 : 8.0);
    const tongueZ = Math.sin(this.tongueFlickerPhase) > 0.4 ? 0.28 : -0.05;
    this.tongueGroup.position.z = 0.42 + Math.max(0, tongueZ);

    // Head orient towards cat
    const lookTarget = catPosition.clone().add(new THREE.Vector3(0, 0.4, 0));
    this.headGroup.lookAt(lookTarget);

    // Update body segments along trail with traveling S-wave undulation
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      const segmentDist = this.distance + (i + 1) * this.segmentSpacing;
      const pathPt = this.getPointAtDistance(segmentDist) || new THREE.Vector3(
        catPosition.x,
        0,
        catPosition.z - segmentDist
      );

      // S-wave traveling undulation
      const wave = Math.sin(this.undulationPhase - i * this.waveFrequency) * this.waveAmplitude;
      const xOffset = wave * (1.0 - (i / this.numSegments) * 0.3);

      seg.group.position.set(
        pathPt.x + xOffset,
        pathPt.y + seg.radius * 0.78,
        pathPt.z
      );

      // Orient segment towards predecessor
      const prevPos = i === 0 ? this.headGroup.position : this.segments[i - 1].group.position;
      seg.group.lookAt(prevPos);
    }
  }

  getPointAtDistance(distAlongTrail) {
    // Approximate distance along trail buffer
    // Cat is at index 0, each step is approximately speed * dt in Z
    if (this.trailHistory.length === 0) return null;

    let accumulatedDist = 0;
    for (let i = 0; i < this.trailHistory.length - 1; i++) {
      const p1 = this.trailHistory[i];
      const p2 = this.trailHistory[i + 1];
      const segLen = p1.distanceTo(p2);

      if (accumulatedDist + segLen >= distAlongTrail) {
        const ratio = (distAlongTrail - accumulatedDist) / Math.max(0.001, segLen);
        return new THREE.Vector3().lerpVectors(p1, p2, ratio);
      }
      accumulatedDist += segLen;
    }

    return this.trailHistory[this.trailHistory.length - 1].clone();
  }

  isCaught() {
    return this.distance <= this.catchDistance;
  }

  destroy() {
    this.scene.remove(this.group);
    if (this.scaleMaterial.map) this.scaleMaterial.map.dispose();
    this.scaleMaterial.dispose();
    this.mouthMaterial.dispose();
    this.fangMaterial.dispose();
    this.eyeMaterial.dispose();
    this.tongueMaterial.dispose();
  }
}
