/**
 * Dynamic Jungle Particle System
 * Generates atmospheric sun dust motes, glowing fireflies, paw dirt kickups, mud splashes, and boost trails.
 */

import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;

    this.particleTexture = this.createSoftParticleTexture();

    // 1. Ambient Sun Dust & Spores System
    this.numDust = 250;
    this.dustGeometry = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(this.numDust * 3);
    const dustScales = new Float32Array(this.numDust);

    for (let i = 0; i < this.numDust; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 24;
      dustPositions[i * 3 + 1] = Math.random() * 8 + 0.5;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 80;
      dustScales[i] = Math.random() * 0.08 + 0.03;
    }

    this.dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));

    this.dustMaterial = new THREE.PointsMaterial({
      map: this.particleTexture,
      color: 0xffea9e,
      size: 0.22,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.dustPoints = new THREE.Points(this.dustGeometry, this.dustMaterial);
    this.scene.add(this.dustPoints);

    // 2. Fireflies (Glowing emerald green points)
    this.numFireflies = 60;
    this.fireflyGeometry = new THREE.BufferGeometry();
    const fireflyPositions = new Float32Array(this.numFireflies * 3);
    for (let i = 0; i < this.numFireflies; i++) {
      fireflyPositions[i * 3] = (Math.random() - 0.5) * 20;
      fireflyPositions[i * 3 + 1] = Math.random() * 5 + 0.8;
      fireflyPositions[i * 3 + 2] = (Math.random() - 0.5) * 70;
    }
    this.fireflyGeometry.setAttribute('position', new THREE.BufferAttribute(fireflyPositions, 3));

    this.fireflyMaterial = new THREE.PointsMaterial({
      map: this.particleTexture,
      color: 0x55ff88,
      size: 0.35,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.fireflyPoints = new THREE.Points(this.fireflyGeometry, this.fireflyMaterial);
    this.scene.add(this.fireflyPoints);

    // 3. Transient Impact Particles Pool (Paw Dirt, Mud Splashes, Speed Sparks)
    this.maxTransient = 180;
    this.transientGeometry = new THREE.BufferGeometry();
    this.transientPositions = new Float32Array(this.maxTransient * 3);
    this.transientVelocities = new Float32Array(this.maxTransient * 3);
    this.transientLifes = new Float32Array(this.maxTransient);
    this.transientColors = new Float32Array(this.maxTransient * 3);

    this.transientGeometry.setAttribute('position', new THREE.BufferAttribute(this.transientPositions, 3));
    this.transientGeometry.setAttribute('color', new THREE.BufferAttribute(this.transientColors, 3));

    this.transientMaterial = new THREE.PointsMaterial({
      map: this.particleTexture,
      size: 0.25,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });

    this.transientPoints = new THREE.Points(this.transientGeometry, this.transientMaterial);
    this.scene.add(this.transientPoints);

    this.nextTransientIndex = 0;
  }

  createSoftParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.25, 'rgba(255, 255, 255, 0.75)');
    grad.addColorStop(0.6, 'rgba(255, 255, 255, 0.25)');
    grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Spawns puff of dirt or mud droplets from paw impact
   */
  emitPawPuff(origin, isMud = false, count = 6) {
    for (let i = 0; i < count; i++) {
      const idx = this.nextTransientIndex;
      this.nextTransientIndex = (this.nextTransientIndex + 1) % this.maxTransient;

      this.transientPositions[idx * 3] = origin.x + (Math.random() - 0.5) * 0.15;
      this.transientPositions[idx * 3 + 1] = Math.max(0.05, origin.y + (Math.random() - 0.5) * 0.1);
      this.transientPositions[idx * 3 + 2] = origin.z - 0.1;

      // Velocity: fly backwards and slightly up
      this.transientVelocities[idx * 3] = (Math.random() - 0.5) * 1.5;
      this.transientVelocities[idx * 3 + 1] = Math.random() * 2.5 + 0.5;
      this.transientVelocities[idx * 3 + 2] = -(Math.random() * 4.0 + 1.5);

      this.transientLifes[idx] = 0.45; // 0.45s life

      if (isMud) {
        // Dark rich mud
        this.transientColors[idx * 3] = 0.18;
        this.transientColors[idx * 3 + 1] = 0.12;
        this.transientColors[idx * 3 + 2] = 0.08;
      } else {
        // Jungle earth / golden moss
        this.transientColors[idx * 3] = 0.42;
        this.transientColors[idx * 3 + 1] = 0.32;
        this.transientColors[idx * 3 + 2] = 0.16;
      }
    }
    this.transientGeometry.attributes.position.needsUpdate = true;
    this.transientGeometry.attributes.color.needsUpdate = true;
  }

  /**
   * Spawns golden spark trail during speed boost
   */
  emitBoostSparks(origin, count = 4) {
    for (let i = 0; i < count; i++) {
      const idx = this.nextTransientIndex;
      this.nextTransientIndex = (this.nextTransientIndex + 1) % this.maxTransient;

      this.transientPositions[idx * 3] = origin.x + (Math.random() - 0.5) * 0.4;
      this.transientPositions[idx * 3 + 1] = origin.y + Math.random() * 0.8;
      this.transientPositions[idx * 3 + 2] = origin.z - 0.2;

      this.transientVelocities[idx * 3] = (Math.random() - 0.5) * 2.0;
      this.transientVelocities[idx * 3 + 1] = Math.random() * 2.0;
      this.transientVelocities[idx * 3 + 2] = -(Math.random() * 8.0 + 2.0);

      this.transientLifes[idx] = 0.35;

      // Radiant gold/yellow
      this.transientColors[idx * 3] = 1.0;
      this.transientColors[idx * 3 + 1] = 0.85;
      this.transientColors[idx * 3 + 2] = 0.2;
    }
    this.transientGeometry.attributes.position.needsUpdate = true;
    this.transientGeometry.attributes.color.needsUpdate = true;
  }

  update(dt, playerZ) {
    const time = performance.now() * 0.001;

    // 1. Dust motes follow player's general Z region
    const dustPos = this.dustGeometry.attributes.position.array;
    for (let i = 0; i < this.numDust; i++) {
      let z = dustPos[i * 3 + 2];
      // Keep within [-30, +50] relative to playerZ
      if (z < playerZ - 30) {
        z += 80;
      } else if (z > playerZ + 50) {
        z -= 80;
      }
      dustPos[i * 3 + 2] = z;

      // Gentle floating motion
      dustPos[i * 3 + 1] += Math.sin(time + i) * dt * 0.15;
    }
    this.dustGeometry.attributes.position.needsUpdate = true;

    // 2. Fireflies flicker and undulate
    const fireflyPos = this.fireflyGeometry.attributes.position.array;
    for (let i = 0; i < this.numFireflies; i++) {
      let z = fireflyPos[i * 3 + 2];
      if (z < playerZ - 25) {
        z += 70;
      } else if (z > playerZ + 45) {
        z -= 70;
      }
      fireflyPos[i * 3 + 2] = z;

      fireflyPos[i * 3] += Math.cos(time * 1.5 + i) * dt * 0.3;
      fireflyPos[i * 3 + 1] += Math.sin(time * 2.0 + i) * dt * 0.25;
    }
    this.fireflyGeometry.attributes.position.needsUpdate = true;
    this.fireflyMaterial.opacity = 0.6 + 0.35 * Math.sin(time * 4);

    // 3. Update transient impact particles
    const transPos = this.transientGeometry.attributes.position.array;
    let anyAlive = false;

    for (let i = 0; i < this.maxTransient; i++) {
      if (this.transientLifes[i] > 0) {
        anyAlive = true;
        this.transientLifes[i] -= dt;

        // Apply velocity & gravity
        transPos[i * 3] += this.transientVelocities[i * 3] * dt;
        transPos[i * 3 + 1] += this.transientVelocities[i * 3 + 1] * dt;
        transPos[i * 3 + 2] += this.transientVelocities[i * 3 + 2] * dt;
        this.transientVelocities[i * 3 + 1] -= 9.8 * dt; // gravity

        // Floor collision
        if (transPos[i * 3 + 1] < 0.02) {
          transPos[i * 3 + 1] = 0.02;
          this.transientVelocities[i * 3 + 1] = 0;
        }

        if (this.transientLifes[i] <= 0) {
          transPos[i * 3 + 1] = -100; // hide below world
        }
      }
    }

    if (anyAlive) {
      this.transientGeometry.attributes.position.needsUpdate = true;
    }
  }

  destroy() {
    this.scene.remove(this.dustPoints);
    this.scene.remove(this.fireflyPoints);
    this.scene.remove(this.transientPoints);
    this.dustGeometry.dispose();
    this.dustMaterial.dispose();
    this.fireflyGeometry.dispose();
    this.fireflyMaterial.dispose();
    this.transientGeometry.dispose();
    this.transientMaterial.dispose();
    if (this.particleTexture) this.particleTexture.dispose();
  }
}
