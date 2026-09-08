/**
 * Ultra-Realistic Giant Jungle Serpent (Snake) Entity
 * Features anatomical pit-viper skull (temporal venom glands, supraocular brows, heat pits),
 * hinged jaw with ivory fangs and crimson buccal cavity, 65 overlapping muscular vertebrae segments
 * with zero gaps, traveling S-wave lateral undulation, and wet PBR diamondback scales.
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
    this.waveFrequency = 0.30;
    this.waveAmplitude = 0.85;

    // Jaw & lunging state
    this.isLunging = false;
    this.jawOpenAngle = 0;
    this.tongueFlickerPhase = 0;

    // Continuous body configuration: 65 closely spaced overlapping segments
    this.numSegments = 65;
    this.segmentSpacing = 0.22; // Closely spaced for seamless overlap without bead gaps
    this.segments = [];

    // Historical trail buffer for snake spine to follow the cat's exact path
    this.trailHistory = [];
    this.maxTrailLength = 350;

    // Build 3D mesh
    this.group = new THREE.Group();
    this.buildSnakeModel();
    this.scene.add(this.group);
  }

  /**
   * Procedural scale micro-normal/bump map with embossed diamond scales & ventral scutes
   */
  createSnakeScaleBumpMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Neutral baseline
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 512, 512);

    // Embossed diamond scales with raised central keels
    const scaleSize = 20;
    for (let y = 0; y < 512; y += scaleSize) {
      for (let x = 0; x < 512; x += scaleSize) {
        const cx = x + (y % (scaleSize * 2) === 0 ? 0 : scaleSize / 2);

        const grad = ctx.createRadialGradient(cx, y + scaleSize / 2, 1, cx, y + scaleSize / 2, scaleSize / 2);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.7, '#999999');
        grad.addColorStop(1.0, '#303030');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(cx, y);
        ctx.lineTo(cx + scaleSize / 2, y + scaleSize / 2);
        ctx.lineTo(cx, y + scaleSize);
        ctx.lineTo(cx - scaleSize / 2, y + scaleSize / 2);
        ctx.closePath();
        ctx.fill();

        // Longitudinal scale keel ridge
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx, y + 2);
        ctx.lineTo(cx, y + scaleSize - 2);
        ctx.stroke();
      }
    }

    // Belly plate ridges (ventral scutes)
    for (let y = 420; y < 512; y += 12) {
      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(0, y, 512, 5);
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(0, y + 5, 512, 4);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * Procedural scale texture with emerald/gold reticulated diamond patterns and ivory belly scutes
   */
  createSnakeScaleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base deep rainforest python green
    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, '#0a2213');
    grad.addColorStop(0.22, '#164826');
    grad.addColorStop(0.5, '#2aa854');
    grad.addColorStop(0.78, '#164826');
    grad.addColorStop(1.0, '#0a2213');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Diamond pattern scales on back with golden-amber highlights
    ctx.strokeStyle = 'rgba(6, 18, 10, 0.92)';
    ctx.lineWidth = 2.0;

    const scaleSize = 20;
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

        // Luminescent emerald & golden scale core
        const isDorsalCenter = (cx > 175 && cx < 335);
        ctx.fillStyle = isDorsalCenter ? 'rgba(225, 195, 85, 0.32)' : 'rgba(120, 255, 160, 0.18)';
        ctx.fill();
      }
    }

    // Belly ventral scutes (warm ivory transverse plates along ventral floor)
    ctx.fillStyle = 'rgba(238, 230, 195, 0.72)';
    ctx.fillRect(0, 420, 512, 92);
    ctx.strokeStyle = 'rgba(75, 65, 40, 0.65)';
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
    this.scaleBumpTexture = this.createSnakeScaleBumpMap();

    // Ultra-Realistic PBR Wet Reptile Scale Material (glistening high clearcoat)
    this.scaleMaterial = new THREE.MeshPhysicalMaterial({
      map: scaleTexture,
      bumpMap: this.scaleBumpTexture,
      bumpScale: 0.058,
      roughness: 0.25,
      metalness: 0.14,
      clearcoat: 0.98,
      clearcoatRoughness: 0.12,
      shadowSide: THREE.DoubleSide
    });

    // Dark wet buccal cavity material (mouth lining, throat, glottis)
    this.mouthMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x7c1524,
      roughness: 0.15,
      metalness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08
    });

    // Razor-sharp venomous fangs with wet ivory sheen
    this.fangMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xfffdf5,
      roughness: 0.06,
      metalness: 0.04,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04
    });

    // Predatory glowing reptilian eyes with glass cornea
    this.eyeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffa200,
      emissive: 0xff4800,
      emissiveIntensity: 1.1,
      roughness: 0.04,
      metalness: 0.08,
      clearcoat: 1.0
    });

    // Dark forked tongue material
    this.tongueMaterial = new THREE.MeshBasicMaterial({
      color: 0x850b20
    });

    // 1. Head Group
    this.headGroup = new THREE.Group();
    this.group.add(this.headGroup);

    // Anatomical Pit-Viper Skull:
    // Broad triangular skull with wide temporal muscle lobes (venom glands) tapering to a rounded snout
    const craniumGeo = new THREE.ConeGeometry(0.46, 1.05, 8);
    craniumGeo.rotateX(Math.PI / 2);
    craniumGeo.scale(1.25, 0.48, 1.0);
    this.upperSkull = new THREE.Mesh(craniumGeo, this.scaleMaterial);
    this.upperSkull.castShadow = true;
    this.headGroup.add(this.upperSkull);

    // Temporal Venom Gland Bulges (Massive muscular jowls on rear skull)
    const venomGlandGeo = new THREE.SphereGeometry(0.24, 12, 10);
    venomGlandGeo.scale(1.15, 0.72, 1.45);

    const venomGlandL = new THREE.Mesh(venomGlandGeo, this.scaleMaterial);
    venomGlandL.position.set(0.25, 0.04, -0.15);
    venomGlandL.castShadow = true;
    this.headGroup.add(venomGlandL);

    const venomGlandR = new THREE.Mesh(venomGlandGeo, this.scaleMaterial);
    venomGlandR.position.set(-0.25, 0.04, -0.15);
    venomGlandR.castShadow = true;
    this.headGroup.add(venomGlandR);

    // Blunt rounded snout (Rostral area)
    const snoutGeo = new THREE.SphereGeometry(0.18, 10, 8);
    snoutGeo.scale(1.1, 0.75, 1.2);
    const snout = new THREE.Mesh(snoutGeo, this.scaleMaterial);
    snout.position.set(0, -0.02, 0.42);
    snout.castShadow = true;
    this.headGroup.add(snout);

    // Menacing glowing slit eyes
    const eyeGeo = new THREE.SphereGeometry(0.068, 10, 8);
    eyeGeo.scale(0.8, 1.35, 0.75);

    const eyeL = new THREE.Mesh(eyeGeo, this.eyeMaterial);
    eyeL.position.set(0.25, 0.12, 0.14);
    this.headGroup.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, this.eyeMaterial);
    eyeR.position.set(-0.25, 0.12, 0.14);
    this.headGroup.add(eyeR);

    // Heavy Supraocular Brow Ridges (Predatory scowl overhang casting deep shadows)
    const browGeo = new THREE.BoxGeometry(0.14, 0.045, 0.24);

    const browL = new THREE.Mesh(browGeo, this.scaleMaterial);
    browL.position.set(0.26, 0.18, 0.12);
    browL.rotation.z = 0.32;
    browL.castShadow = true;
    this.headGroup.add(browL);

    const browR = new THREE.Mesh(browGeo, this.scaleMaterial);
    browR.position.set(-0.26, 0.18, 0.12);
    browR.rotation.z = -0.32;
    browR.castShadow = true;
    this.headGroup.add(browR);

    // Heat-Sensing Pits (Infrared sensory organ cavities between nostrils and eyes)
    const pitGeo = new THREE.ConeGeometry(0.03, 0.06, 5);
    pitGeo.rotateX(Math.PI / 2);
    this.pitMaterial = new THREE.MeshBasicMaterial({ color: 0x140404 });

    const pitL = new THREE.Mesh(pitGeo, this.pitMaterial);
    pitL.position.set(0.19, 0.05, 0.28);
    this.headGroup.add(pitL);

    const pitR = new THREE.Mesh(pitGeo, this.pitMaterial);
    pitR.position.set(-0.19, 0.05, 0.28);
    this.headGroup.add(pitR);

    // Hinged Lower Jaw (Articulated to drop wide open when lunging)
    this.lowerJaw = new THREE.Group();
    this.lowerJaw.position.set(0, -0.06, -0.15);
    this.headGroup.add(this.lowerJaw);

    // Mandibular branches
    const jawGeo = new THREE.BoxGeometry(0.34, 0.08, 0.72);
    jawGeo.translate(0, -0.04, 0.34);
    const jawMesh = new THREE.Mesh(jawGeo, this.scaleMaterial);
    jawMesh.castShadow = true;
    this.lowerJaw.add(jawMesh);

    // Dark crimson buccal cavity lining (mouth & throat)
    const mouthCavityGeo = new THREE.BoxGeometry(0.26, 0.04, 0.55);
    mouthCavityGeo.translate(0, 0.01, 0.30);
    const mouthCavity = new THREE.Mesh(mouthCavityGeo, this.mouthMaterial);
    this.lowerJaw.add(mouthCavity);

    // Curved sharp ivory fangs on upper maxilla
    const fangGeo = new THREE.ConeGeometry(0.038, 0.22, 6);
    fangGeo.rotateX(-Math.PI / 5);

    const fangL = new THREE.Mesh(fangGeo, this.fangMaterial);
    fangL.position.set(0.15, -0.04, 0.32);
    fangL.castShadow = true;
    this.headGroup.add(fangL);

    const fangR = new THREE.Mesh(fangGeo, this.fangMaterial);
    fangR.position.set(-0.15, -0.04, 0.32);
    fangR.castShadow = true;
    this.headGroup.add(fangR);

    // Slender forked tongue with tasting flick
    this.tongueGroup = new THREE.Group();
    this.tongueGroup.position.set(0, -0.02, 0.44);
    this.headGroup.add(this.tongueGroup);

    const tongueStem = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.014, 0.26), this.tongueMaterial);
    tongueStem.position.z = 0.13;
    this.tongueGroup.add(tongueStem);

    const forkGeo = new THREE.BoxGeometry(0.014, 0.011, 0.12);

    const forkL = new THREE.Mesh(forkGeo, this.tongueMaterial);
    forkL.position.set(0.022, 0, 0.28);
    forkL.rotation.y = 0.38;
    this.tongueGroup.add(forkL);

    const forkR = new THREE.Mesh(forkGeo, this.tongueMaterial);
    forkR.position.set(-0.022, 0, 0.28);
    forkR.rotation.y = -0.38;
    this.tongueGroup.add(forkR);

    // 2. Continuous Muscular Body: 65 Closely Overlapping Vertebrae
    // With 0.22m spacing and 0.5-0.75m segment lengths, segments overlap by > 45%,
    // forming a continuous, muscular, writhing reptile body with ZERO gaps!
    for (let i = 0; i < this.numSegments; i++) {
      const segGroup = new THREE.Group();

      const t = i / this.numSegments;
      let radius;
      if (t < 0.10) {
        // Neck constriction behind broad head
        radius = 0.30 + t * 1.2;
      } else if (t < 0.42) {
        // Massive muscular midsection (up to 0.52m radius!)
        radius = 0.42 + Math.sin((t - 0.10) / 0.32 * Math.PI) * 0.10;
      } else {
        // Graceful continuous taper down to pointed tail tip
        const tailT = (t - 0.42) / 0.58;
        radius = 0.42 * Math.pow(1.0 - tailT, 0.72) + 0.04;
      }

      // Flattened serpentine cross-section with longitudinal elongation for seamless overlap
      const segGeo = new THREE.SphereGeometry(radius, 12, 10);
      segGeo.scale(1.32, 0.82, 1.45);
      const segMesh = new THREE.Mesh(segGeo, this.scaleMaterial);
      segMesh.castShadow = true;
      segMesh.receiveShadow = true;
      segGroup.add(segMesh);

      this.group.add(segGroup);
      this.segments.push({
        group: segGroup,
        mesh: segMesh,
        radius: radius,
        position: new THREE.Vector3(0, radius * 0.75, -i * this.segmentSpacing)
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

    // Reared-up aggressive striking posture:
    // Head hovers elevated at 1.15m looking down menacingly at cat!
    const headWave = Math.sin(this.undulationPhase) * this.waveAmplitude * 0.4;
    const headHover = 1.15 + Math.sin(this.undulationPhase * 0.5) * 0.08;
    this.headGroup.position.set(
      leadPoint.x + headWave,
      headHover,
      leadPoint.z
    );

    // Danger proximity mechanics (< 4.0m = lunging strike mode)
    this.isLunging = this.distance < 4.0;
    const targetJawAngle = this.isLunging ? 0.82 : 0.08;
    this.jawOpenAngle = THREE.MathUtils.lerp(this.jawOpenAngle, targetJawAngle, dt * 9);
    this.lowerJaw.rotation.x = -this.jawOpenAngle;

    // Eye glow intensity flares when lunging
    this.eyeMaterial.emissiveIntensity = this.isLunging ? 1.5 : 0.8;

    // Tongue tasting flicker
    this.tongueFlickerPhase += dt * (this.isLunging ? 30.0 : 9.0);
    const tongueZ = Math.sin(this.tongueFlickerPhase) > 0.3 ? 0.32 : -0.05;
    this.tongueGroup.position.z = 0.44 + Math.max(0, tongueZ);

    // Head orients towards cat
    const lookTarget = new THREE.Vector3(
      catPosition.x,
      Math.max(0.35, catPosition.y + 0.45),
      catPosition.z
    );
    this.headGroup.lookAt(lookTarget);

    // Update 65 body segments along trail with smooth traveling S-wave undulation
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
      const xOffset = wave * (1.0 - (i / this.numSegments) * 0.25);

      // Striking S-curve neck:
      // Segments 0 to 7 smoothly curve from 1.15m at neck down to ground level
      let segY;
      if (i < 8) {
        const neckRatio = (i + 1) / 9.0;
        segY = THREE.MathUtils.lerp(headHover * 0.92, pathPt.y + seg.radius * 0.72, neckRatio);
      } else {
        segY = pathPt.y + seg.radius * 0.72;
      }

      seg.group.position.set(
        pathPt.x + xOffset,
        segY,
        pathPt.z
      );

      // Orient segment smoothly towards predecessor
      const prevPos = i === 0 ? this.headGroup.position : this.segments[i - 1].group.position;
      seg.group.lookAt(prevPos);
    }
  }

  getPointAtDistance(distAlongTrail) {
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
    if (this.scaleBumpTexture) this.scaleBumpTexture.dispose();
    this.scaleMaterial.dispose();
    this.mouthMaterial.dispose();
    this.fangMaterial.dispose();
    this.eyeMaterial.dispose();
    this.tongueMaterial.dispose();
    if (this.pitMaterial) this.pitMaterial.dispose();
  }
}
