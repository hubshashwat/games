/**
 * Procedural 3D Jungle Assets & Obstacles
 * High-fidelity PBR models for Kapok trees, hanging lianas, tropical ferns, mossy fallen logs,
 * ancient stone arches, mud quagmires, and hovering jungle collectibles.
 */

import * as THREE from 'three';

export class EnvironmentAssets {
  constructor() {
    this.textures = [];
    this.materials = this.initMaterials();
  }

  initMaterials() {
    // 1. Procedural Mossy Bark Texture & Bump Map
    const barkCanvas = document.createElement('canvas');
    barkCanvas.width = 512;
    barkCanvas.height = 512;
    const bCtx = barkCanvas.getContext('2d');

    // Base dark weathered ironwood bark
    bCtx.fillStyle = '#26180e';
    bCtx.fillRect(0, 0, 512, 512);

    // Vertical fibrous bark grain, furrows & crevices
    for (let i = 0; i < 900; i++) {
      const y = Math.random() * 512;
      const h = 40 + Math.random() * 120;
      const x = Math.random() * 512;
      const w = 1.5 + Math.random() * 4;
      bCtx.fillStyle = (Math.random() > 0.5) ? '#130a05' : '#382416';
      bCtx.fillRect(x, y, w, h);
    }

    // Organic micro-fissures and fine bark grain
    for (let i = 0; i < 3000; i++) {
      const gx = Math.random() * 512;
      const gy = Math.random() * 512;
      bCtx.fillStyle = (Math.random() > 0.5) ? 'rgba(60, 42, 28, 0.35)' : 'rgba(12, 7, 3, 0.45)';
      bCtx.fillRect(gx, gy, 1 + Math.random() * 2, 6 + Math.random() * 14);
    }

    // Subtle moss wash blended vertically into deep crevices (soft, natural, no circular blobs)
    for (let i = 0; i < 600; i++) {
      const mx = Math.random() * 512;
      const my = Math.random() * 512;
      bCtx.fillStyle = (Math.random() > 0.4) ? 'rgba(40, 78, 30, 0.22)' : 'rgba(58, 98, 42, 0.18)';
      bCtx.fillRect(mx, my, 2 + Math.random() * 4, 10 + Math.random() * 24);
    }

    const barkTexture = new THREE.CanvasTexture(barkCanvas);
    barkTexture.wrapS = THREE.RepeatWrapping;
    barkTexture.wrapT = THREE.RepeatWrapping;
    this.textures.push(barkTexture);

    // Grayscale Bark Bump Map (Pronounced vertical furrows & tactile wood relief)
    const barkBumpCanvas = document.createElement('canvas');
    barkBumpCanvas.width = 512;
    barkBumpCanvas.height = 512;
    const bbCtx = barkBumpCanvas.getContext('2d');
    bbCtx.fillStyle = '#808080';
    bbCtx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 900; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const h = 40 + Math.random() * 120;
      const isRidge = Math.random() > 0.5;
      bbCtx.fillStyle = isRidge ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.4)';
      bbCtx.fillRect(x, y, 1.5 + Math.random() * 3.5, h);
    }

    const barkBumpTexture = new THREE.CanvasTexture(barkBumpCanvas);
    barkBumpTexture.wrapS = THREE.RepeatWrapping;
    barkBumpTexture.wrapT = THREE.RepeatWrapping;
    this.textures.push(barkBumpTexture);

    // 2. Procedural Weathered Stone Texture & Bump Map
    const stoneCanvas = document.createElement('canvas');
    stoneCanvas.width = 512;
    stoneCanvas.height = 512;
    const sCtx = stoneCanvas.getContext('2d');

    // Base aged granite / basaltic rock
    sCtx.fillStyle = '#3c453a';
    sCtx.fillRect(0, 0, 512, 512);

    // Sedimentary strata bands
    for (let i = 0; i < 50; i++) {
      const y = i * 10 + Math.random() * 6;
      sCtx.fillStyle = (i % 2 === 0) ? 'rgba(50, 60, 48, 0.55)' : 'rgba(28, 34, 26, 0.5)';
      sCtx.fillRect(0, y, 512, 6 + Math.random() * 6);
    }

    // Fine mineral speckling (quartz, mica, basalt)
    for (let i = 0; i < 4000; i++) {
      const sx = Math.random() * 512;
      const sy = Math.random() * 512;
      sCtx.fillStyle = Math.random() > 0.5 ? 'rgba(160, 175, 155, 0.28)' : 'rgba(12, 16, 12, 0.4)';
      sCtx.fillRect(sx, sy, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }

    // Subtle natural lichen wash along horizontal fractures (natural streaks, no circular blobs)
    for (let i = 0; i < 400; i++) {
      const lx = Math.random() * 512;
      const ly = Math.random() * 512;
      sCtx.fillStyle = 'rgba(42, 80, 36, 0.25)';
      sCtx.fillRect(lx, ly, 6 + Math.random() * 18, 2 + Math.random() * 4);
    }

    const stoneTexture = new THREE.CanvasTexture(stoneCanvas);
    stoneTexture.wrapS = THREE.RepeatWrapping;
    stoneTexture.wrapT = THREE.RepeatWrapping;
    this.textures.push(stoneTexture);

    // Stone Grayscale Bump Map
    const stoneBumpCanvas = document.createElement('canvas');
    stoneBumpCanvas.width = 512;
    stoneBumpCanvas.height = 512;
    const sbCtx = stoneBumpCanvas.getContext('2d');
    sbCtx.fillStyle = '#808080';
    sbCtx.fillRect(0, 0, 512, 512);

    // Jagged fracture cracks
    for (let i = 0; i < 20; i++) {
      sbCtx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      sbCtx.lineWidth = 2 + Math.random() * 2;
      sbCtx.beginPath();
      let cx = Math.random() * 512;
      let cy = Math.random() * 512;
      sbCtx.moveTo(cx, cy);
      for (let s = 0; s < 5; s++) {
        cx += (Math.random() - 0.5) * 60;
        cy += (Math.random() - 0.5) * 60;
        sbCtx.lineTo(cx, cy);
      }
      sbCtx.stroke();
    }

    // Granular rock roughness
    for (let i = 0; i < 3000; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      sbCtx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)';
      sbCtx.fillRect(rx, ry, 2, 2);
    }

    const stoneBumpTexture = new THREE.CanvasTexture(stoneBumpCanvas);
    stoneBumpTexture.wrapS = THREE.RepeatWrapping;
    stoneBumpTexture.wrapT = THREE.RepeatWrapping;
    this.textures.push(stoneBumpTexture);

    // 3. High-Fidelity Leaf Texture with Pinnate Veining
    const leafCanvas = document.createElement('canvas');
    leafCanvas.width = 256;
    leafCanvas.height = 256;
    const lCtx = leafCanvas.getContext('2d');

    const leafGrad = lCtx.createRadialGradient(128, 128, 10, 128, 128, 128);
    leafGrad.addColorStop(0, '#369e44');
    leafGrad.addColorStop(0.65, '#195c21');
    leafGrad.addColorStop(1.0, '#0d3811');
    lCtx.fillStyle = leafGrad;
    lCtx.fillRect(0, 0, 256, 256);

    // Central leaf spine / midrib
    lCtx.strokeStyle = 'rgba(138, 205, 120, 0.7)';
    lCtx.lineWidth = 4;
    lCtx.beginPath();
    lCtx.moveTo(128, 256);
    lCtx.lineTo(128, 0);
    lCtx.stroke();

    // Lateral secondary veins
    lCtx.strokeStyle = 'rgba(110, 185, 95, 0.45)';
    lCtx.lineWidth = 1.5;
    for (let v = 20; v < 250; v += 22) {
      lCtx.beginPath();
      lCtx.moveTo(128, v);
      lCtx.lineTo(30, v - 30);
      lCtx.moveTo(128, v);
      lCtx.lineTo(226, v - 30);
      lCtx.stroke();
    }

    const leafTexture = new THREE.CanvasTexture(leafCanvas);
    this.textures.push(leafTexture);

    // 4. Procedural Viscous Mud Puddle Texture & Bump Map
    const mudCanvas = document.createElement('canvas');
    mudCanvas.width = 512;
    mudCanvas.height = 512;
    const mCtx = mudCanvas.getContext('2d');

    // Deep saturated wet silt
    mCtx.fillStyle = '#1c130b';
    mCtx.fillRect(0, 0, 512, 512);

    // Murky undulating pool gradients
    const mudGrad = mCtx.createRadialGradient(256, 256, 30, 256, 256, 250);
    mudGrad.addColorStop(0, '#0d0905'); // deep puddle center
    mudGrad.addColorStop(0.6, '#281c11'); // murky water shelf
    mudGrad.addColorStop(1.0, '#382718'); // damp mud edge
    mCtx.fillStyle = mudGrad;
    mCtx.fillRect(0, 0, 512, 512);

    // Submerged decaying leaf flecks
    for (let i = 0; i < 60; i++) {
      const lx = Math.random() * 512;
      const ly = Math.random() * 512;
      mCtx.fillStyle = (Math.random() > 0.5) ? 'rgba(70, 55, 20, 0.45)' : 'rgba(35, 60, 25, 0.4)';
      mCtx.beginPath();
      mCtx.ellipse(lx, ly, 6 + Math.random() * 8, 3 + Math.random() * 4, Math.random() * Math.PI, 0, Math.PI * 2);
      mCtx.fill();
    }

    const mudTexture = new THREE.CanvasTexture(mudCanvas);
    this.textures.push(mudTexture);

    // Mud Bump Map for ripples & slick muddy contours
    const mudBumpCanvas = document.createElement('canvas');
    mudBumpCanvas.width = 256;
    mudBumpCanvas.height = 256;
    const mbCtx = mudBumpCanvas.getContext('2d');
    mbCtx.fillStyle = '#808080';
    mbCtx.fillRect(0, 0, 256, 256);

    for (let r = 20; r < 120; r += 18) {
      mbCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      mbCtx.lineWidth = 4;
      mbCtx.beginPath();
      mbCtx.arc(128, 128, r, 0, Math.PI * 2);
      mbCtx.stroke();
    }

    const mudBumpTexture = new THREE.CanvasTexture(mudBumpCanvas);
    this.textures.push(mudBumpTexture);

    // 5. Wood End Grain (Annual Growth Rings for fallen log ends)
    const ringsCanvas = document.createElement('canvas');
    ringsCanvas.width = 256;
    ringsCanvas.height = 256;
    const rCtx = ringsCanvas.getContext('2d');
    rCtx.fillStyle = '#6e5138';
    rCtx.fillRect(0, 0, 256, 256);

    for (let r = 8; r < 126; r += 6) {
      rCtx.strokeStyle = (r % 12 === 0) ? '#382516' : '#4d3722';
      rCtx.lineWidth = 1.5;
      rCtx.beginPath();
      rCtx.arc(128, 128, r, 0, Math.PI * 2);
      rCtx.stroke();
    }

    // Radiating drying split cracks
    rCtx.strokeStyle = '#1e120a';
    rCtx.lineWidth = 2.5;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 3 + Math.random() * 0.4) {
      rCtx.beginPath();
      rCtx.moveTo(128, 128);
      rCtx.lineTo(128 + Math.cos(a) * 110, 128 + Math.sin(a) * 110);
      rCtx.stroke();
    }

    const ringsTexture = new THREE.CanvasTexture(ringsCanvas);
    this.textures.push(ringsTexture);

    return {
      bark: new THREE.MeshStandardMaterial({
        map: barkTexture,
        bumpMap: barkBumpTexture,
        bumpScale: 0.07,
        roughness: 0.86,
        metalness: 0.04
      }),
      leaves: new THREE.MeshStandardMaterial({
        map: leafTexture,
        roughness: 0.42,
        metalness: 0.02,
        side: THREE.DoubleSide
      }),
      stone: new THREE.MeshStandardMaterial({
        map: stoneTexture,
        bumpMap: stoneBumpTexture,
        bumpScale: 0.085,
        roughness: 0.84,
        metalness: 0.08
      }),
      mud: new THREE.MeshPhysicalMaterial({
        map: mudTexture,
        bumpMap: mudBumpTexture,
        bumpScale: 0.04,
        roughness: 0.16,
        metalness: 0.06,
        clearcoat: 0.95,
        clearcoatRoughness: 0.12
      }),
      logMoss: new THREE.MeshStandardMaterial({
        map: barkTexture,
        bumpMap: barkBumpTexture,
        bumpScale: 0.075,
        roughness: 0.80,
        metalness: 0.04,
        color: 0xa6b294
      }),
      woodRings: new THREE.MeshStandardMaterial({
        map: ringsTexture,
        roughness: 0.78,
        metalness: 0.04
      }),
      shelfFungus: new THREE.MeshStandardMaterial({
        color: 0xd97526,
        roughness: 0.52,
        metalness: 0.06
      }),
      starOrchid: new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x0099cc,
        emissiveIntensity: 0.95,
        roughness: 0.18,
        metalness: 0.15
      }),
      relicGold: new THREE.MeshPhysicalMaterial({
        color: 0xffd700,
        emissive: 0xb8860b,
        emissiveIntensity: 0.65,
        roughness: 0.22,
        metalness: 0.92,
        clearcoat: 0.85
      })
    };
  }

  /**
   * Giant Ancient Kapok / Banyan Tree
   */
  createKapokTree(height = 16, radius = 1.6) {
    const group = new THREE.Group();

    // 1. Massive trunk with smooth cylinder geometry
    const trunkGeo = new THREE.CylinderGeometry(radius * 0.62, radius, height, 16);
    const trunk = new THREE.Mesh(trunkGeo, this.materials.bark);
    trunk.position.y = height / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);

    // 2. Realistic Curved Buttress Plank Roots (flaring naturally into soil)
    const numRoots = 4;
    for (let r = 0; r < numRoots; r++) {
      const angle = (r / numRoots) * Math.PI * 2 + (r % 2 === 0 ? 0.2 : -0.2);
      const rootLength = radius * 1.5;
      const rootHeight = height * 0.22;
      const rootThickness = 0.16;

      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(rootLength, 0);
      shape.quadraticCurveTo(rootLength * 0.22, rootHeight * 0.15, 0, rootHeight);
      shape.closePath();

      const rootGeo = new THREE.ExtrudeGeometry(shape, {
        depth: rootThickness,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.03,
        bevelThickness: 0.03
      });
      rootGeo.translate(0, 0, -rootThickness / 2);
      const root = new THREE.Mesh(rootGeo, this.materials.bark);
      root.position.set(Math.cos(angle) * (radius * 0.6), 0, Math.sin(angle) * (radius * 0.6));
      root.rotation.y = -angle;
      root.castShadow = true;
      root.receiveShadow = true;
      group.add(root);
    }

    // 3. Dense Multi-Lobed Canopy Clouds with Smooth Shading
    const canopyLevels = 3;
    for (let lvl = 0; lvl < canopyLevels; lvl++) {
      const domeR = radius * (3.0 - lvl * 0.55);
      const tierY = height * (0.82 + lvl * 0.14);

      // Central smooth foliage lobe
      const centerDome = new THREE.Mesh(
        new THREE.SphereGeometry(domeR, 14, 10),
        this.materials.leaves
      );
      centerDome.position.set(0, tierY, 0);
      centerDome.scale.set(1.35, 0.65, 1.35);
      centerDome.castShadow = true;
      group.add(centerDome);

      // Flanking foliage lobes for natural canopy silhouette
      for (let lobe = 0; lobe < 3; lobe++) {
        const lAngle = (lobe / 3) * Math.PI * 2 + lvl;
        const lDist = domeR * 0.55;
        const flankDome = new THREE.Mesh(
          new THREE.SphereGeometry(domeR * 0.75, 12, 8),
          this.materials.leaves
        );
        flankDome.position.set(
          Math.cos(lAngle) * lDist,
          tierY + (lobe - 1) * 0.4,
          Math.sin(lAngle) * lDist
        );
        flankDome.scale.set(1.25, 0.6, 1.25);
        flankDome.castShadow = true;
        group.add(flankDome);
      }
    }

    // 4. Hanging Lianas dangling naturally into mist
    const numVines = 4;
    for (let v = 0; v < numVines; v++) {
      const vineLen = 7 + Math.random() * 6;
      const vineGeo = new THREE.CylinderGeometry(0.035, 0.045, vineLen, 6);
      const vine = new THREE.Mesh(vineGeo, this.materials.bark);
      const vAngle = (v / numVines) * Math.PI * 2 + 0.3;
      const vDist = radius * 1.7 + Math.random() * 1.2;
      vine.position.set(
        Math.cos(vAngle) * vDist,
        height * 0.88 - vineLen / 2,
        Math.sin(vAngle) * vDist
      );
      vine.rotation.z = (Math.random() - 0.5) * 0.18;
      vine.rotation.x = (Math.random() - 0.5) * 0.18;
      vine.castShadow = true;
      group.add(vine);
    }

    return group;
  }

  /**
   * Giant Ancient Canopy Arch Tree (Branches stretch across track to form an overhead rainforest tunnel)
   */
  createCanopyArchTree(height = 18, radius = 1.6, isLeft = true) {
    const group = new THREE.Group();

    // 1. Massive trunk
    const trunkGeo = new THREE.CylinderGeometry(radius * 0.65, radius, height, 16);
    const trunk = new THREE.Mesh(trunkGeo, this.materials.bark);
    trunk.position.y = height / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);

    // 2. Buttress Roots
    for (let r = 0; r < 4; r++) {
      const angle = (r / 4) * Math.PI * 2 + 0.3;
      const rootGeo = new THREE.ConeGeometry(0.45, height * 0.28, 5);
      rootGeo.rotateX(Math.PI / 6);
      const root = new THREE.Mesh(rootGeo, this.materials.bark);
      root.position.set(Math.cos(angle) * (radius * 0.9), height * 0.12, Math.sin(angle) * (radius * 0.9));
      root.rotation.y = -angle;
      root.castShadow = true;
      group.add(root);
    }

    // 3. Massive Overarching Branch stretching ACROSS the path
    const archBranchGroup = new THREE.Group();
    archBranchGroup.position.set(0, height * 0.72, 0);

    const dir = isLeft ? 1 : -1;
    const branchLength = 11.5;
    const branchGeo = new THREE.CylinderGeometry(radius * 0.22, radius * 0.45, branchLength, 12);
    branchGeo.rotateZ(dir * (Math.PI / 3.2));
    branchGeo.translate(dir * (branchLength * 0.38), branchLength * 0.22, 0);

    const mainBranch = new THREE.Mesh(branchGeo, this.materials.bark);
    mainBranch.castShadow = true;
    archBranchGroup.add(mainBranch);

    // Canopy foliage masses along the arch
    for (let f = 0; f < 3; f++) {
      const foliageGeo = new THREE.SphereGeometry(2.8 + Math.random() * 1.2, 12, 8);
      foliageGeo.scale(1.4, 0.65, 1.4);
      const foliage = new THREE.Mesh(foliageGeo, this.materials.leaves);
      foliage.position.set(
        dir * (3.5 + f * 2.8),
        3.8 + f * 1.2,
        (Math.random() - 0.5) * 2.0
      );
      foliage.castShadow = true;
      archBranchGroup.add(foliage);
    }

    // Hanging lianas dangling over the track
    for (let v = 0; v < 3; v++) {
      const vLen = 6.0 + Math.random() * 4.0;
      const vGeo = new THREE.CylinderGeometry(0.04, 0.05, vLen, 5);
      const vine = new THREE.Mesh(vGeo, this.materials.bark);
      vine.position.set(
        dir * (4.0 + v * 2.4),
        3.5 - vLen / 2,
        (Math.random() - 0.5) * 1.5
      );
      vine.castShadow = true;
      archBranchGroup.add(vine);
    }

    group.add(archBranchGroup);
    return group;
  }

  /**
   * Tropical Giant Monstera / Broadleaf Plant
   */
  createMonsteraBush() {
    const group = new THREE.Group();
    const numLeaves = 6;
    for (let i = 0; i < numLeaves; i++) {
      const leafAngle = (i / numLeaves) * Math.PI * 2 + Math.random() * 0.3;
      const leafGeo = new THREE.PlaneGeometry(1.2, 2.0, 4, 6);
      leafGeo.translate(0, 1.0, 0);
      const leaf = new THREE.Mesh(leafGeo, this.materials.leaves);
      leaf.rotation.y = leafAngle;
      leaf.rotation.x = 0.55 + Math.random() * 0.25;
      leaf.rotation.z = (Math.random() - 0.5) * 0.2;
      leaf.castShadow = true;
      group.add(leaf);
    }
    return group;
  }

  /**
   * Tropical Fan Palm Tree
   */
  createFanPalm(height = 8.5) {
    const group = new THREE.Group();

    // Curved slender trunk
    const trunkGeo = new THREE.CylinderGeometry(0.22, 0.34, height, 10);
    const trunk = new THREE.Mesh(trunkGeo, this.materials.bark);
    trunk.position.y = height / 2;
    trunk.castShadow = true;
    group.add(trunk);

    // Crown of fan leaves
    const crownGroup = new THREE.Group();
    crownGroup.position.y = height;
    const numFronds = 10;
    for (let f = 0; f < numFronds; f++) {
      const angle = (f / numFronds) * Math.PI * 2;
      const frondGeo = new THREE.ConeGeometry(0.85, 2.4, 5);
      frondGeo.scale(1.2, 0.1, 1.0);
      frondGeo.translate(0, 1.2, 0);
      const frond = new THREE.Mesh(frondGeo, this.materials.leaves);
      frond.rotation.y = angle;
      frond.rotation.x = 0.75 + Math.random() * 0.15;
      frond.castShadow = true;
      crownGroup.add(frond);
    }
    group.add(crownGroup);
    return group;
  }

  /**
   * Tropical Fern Bush with Realistic Botanical Veined Fronds
   */
  createFernCluster() {
    const group = new THREE.Group();
    const numFronds = 9;

    for (let i = 0; i < numFronds; i++) {
      const angle = (i / numFronds) * Math.PI * 2 + Math.random() * 0.25;
      const frondGeo = new THREE.PlaneGeometry(0.55, 2.2, 4, 8);
      frondGeo.translate(0, 1.1, 0);
      const frond = new THREE.Mesh(frondGeo, this.materials.leaves);
      frond.rotation.y = angle;
      frond.rotation.x = 0.58 + Math.random() * 0.22;
      frond.rotation.z = (Math.random() - 0.5) * 0.25;
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
    const logGeo = new THREE.CylinderGeometry(0.48, 0.55, width, 12, 1, true); // open ends for ring caps
    logGeo.rotateZ(Math.PI / 2);
    const log = new THREE.Mesh(logGeo, this.materials.logMoss);
    log.position.y = 0.45;
    log.castShadow = true;
    log.receiveShadow = true;
    group.add(log);

    // Annual Growth Rings on cut/broken log ends
    const endCapGeo = new THREE.CircleGeometry(0.51, 12);
    const endCapL = new THREE.Mesh(endCapGeo, this.materials.woodRings);
    endCapL.position.set(-width / 2, 0.45, 0);
    endCapL.rotation.y = -Math.PI / 2;
    group.add(endCapL);

    const endCapR = new THREE.Mesh(endCapGeo, this.materials.woodRings);
    endCapR.position.set(width / 2, 0.45, 0);
    endCapR.rotation.y = Math.PI / 2;
    group.add(endCapR);

    // Broken splintered branch stubs
    for (let b = 0; b < 3; b++) {
      const stubGeo = new THREE.CylinderGeometry(0.08, 0.15, 0.55, 6);
      const stub = new THREE.Mesh(stubGeo, this.materials.bark);
      stub.position.set((b - 1) * 1.8, 0.78, (Math.random() - 0.5) * 0.3);
      stub.rotation.z = (Math.random() - 0.5) * 0.8;
      stub.castShadow = true;
      group.add(stub);
    }

    // Shelf bracket fungi (polypores) protruding from mossy bark
    for (let f = 0; f < 4; f++) {
      const fungus = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.18, 0.05, 8, 1, false, 0, Math.PI),
        this.materials.shelfFungus
      );
      fungus.rotation.x = Math.PI / 2;
      fungus.position.set(
        -width * 0.35 + f * (width * 0.24),
        0.35 + (f % 2) * 0.15,
        0.52
      );
      fungus.castShadow = true;
      group.add(fungus);
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

    // Left & Right stone pillars with stepped footing & capitals
    const pillarGeo = new THREE.BoxGeometry(0.7, 3.5, 0.8);
    const pillarL = new THREE.Mesh(pillarGeo, this.materials.stone);
    pillarL.position.set(-width / 2, 1.75, 0);
    pillarL.castShadow = true;
    pillarL.receiveShadow = true;
    group.add(pillarL);

    const pillarR = new THREE.Mesh(pillarGeo, this.materials.stone);
    pillarR.position.set(width / 2, 1.75, 0);
    pillarR.castShadow = true;
    pillarR.receiveShadow = true;
    group.add(pillarR);

    // Stone footing pedestals
    const baseGeo = new THREE.BoxGeometry(0.95, 0.45, 1.05);
    const baseL = new THREE.Mesh(baseGeo, this.materials.stone);
    baseL.position.set(-width / 2, 0.22, 0);
    baseL.castShadow = true;
    group.add(baseL);

    const baseR = new THREE.Mesh(baseGeo, this.materials.stone);
    baseR.position.set(width / 2, 0.22, 0);
    baseR.castShadow = true;
    group.add(baseR);

    // Low crossbeam with hanging curtain of thick vines
    const beamGeo = new THREE.BoxGeometry(width + 0.9, 0.6, 0.85);
    const beam = new THREE.Mesh(beamGeo, this.materials.stone);
    beam.position.set(0, 1.85, 0); // Bottom of beam is at ~1.55m, requiring slide
    beam.castShadow = true;
    beam.receiveShadow = true;
    group.add(beam);

    // Carved center keystone
    const keystoneGeo = new THREE.BoxGeometry(0.55, 0.75, 0.95);
    const keystone = new THREE.Mesh(keystoneGeo, this.materials.stone);
    keystone.position.set(0, 1.85, 0);
    keystone.castShadow = true;
    group.add(keystone);

    // Hanging tangled vines
    const numVines = 9;
    for (let v = 0; v < numVines; v++) {
      const x = -width * 0.42 + (v / (numVines - 1)) * (width * 0.84);
      const vLen = 0.95 + Math.sin(v * 1.5) * 0.35;
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
    bramble.receiveShadow = true;
    group.add(bramble);

    // Sharp spiky branches
    for (let i = 0; i < 6; i++) {
      const spikeGeo = new THREE.ConeGeometry(0.08, 0.9, 5);
      spikeGeo.rotateX(Math.PI / 4 + Math.random() * 0.5);
      const spike = new THREE.Mesh(spikeGeo, this.materials.bark);
      spike.position.set((Math.random() - 0.5) * 0.6, 0.8 + Math.random() * 0.6, (Math.random() - 0.5) * 0.4);
      spike.rotation.y = Math.random() * Math.PI * 2;
      spike.castShadow = true;
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
   * OBSTACLE 3B: Ancient Jungle Boulder / Rock (Requires LANE DODGE)
   */
  createRockObstacle(width = 1.9) {
    const group = new THREE.Group();

    // Main jagged mossy boulder with sharp geological facets
    const rockGeo = new THREE.DodecahedronGeometry(width * 0.55, 1);
    rockGeo.scale(1.0, 0.9, 0.85);
    const rock = new THREE.Mesh(rockGeo, this.materials.stone);
    rock.position.y = width * 0.45;
    rock.castShadow = true;
    rock.receiveShadow = true;
    group.add(rock);

    // Weathered moss carpet on upper crown
    const mossGeo = new THREE.SphereGeometry(width * 0.36, 8, 6);
    mossGeo.scale(1.2, 0.38, 1.1);
    const moss = new THREE.Mesh(mossGeo, this.materials.leaves);
    moss.position.set(0, width * 0.76, 0);
    group.add(moss);

    // Clustered scree & talus companion stones at the base
    const screeOffsets = [
      { x: -width * 0.4, z: width * 0.28, s: 0.26 },
      { x: width * 0.38, z: -width * 0.22, s: 0.32 },
      { x: 0.1, z: width * 0.35, s: 0.22 }
    ];
    screeOffsets.forEach(sc => {
      const screeGeo = new THREE.DodecahedronGeometry(sc.s, 0);
      const screeMesh = new THREE.Mesh(screeGeo, this.materials.stone);
      screeMesh.position.set(sc.x, sc.s * 0.6, sc.z);
      screeMesh.castShadow = true;
      screeMesh.receiveShadow = true;
      group.add(screeMesh);
    });

    group.userData = {
      type: 'obstacle',
      subType: 'dodge',
      height: width * 0.9,
      width: width,
      depth: 1.2
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

  destroy() {
    for (const mat of Object.values(this.materials)) {
      mat.dispose();
    }
    for (const tex of this.textures) {
      tex.dispose();
    }
    this.textures = [];
  }
}
