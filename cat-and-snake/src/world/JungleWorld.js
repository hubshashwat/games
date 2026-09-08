/**
 * Endless Procedural Jungle World Chunk Manager
 * Generates continuous lush terrain chunks, trees, vegetation, obstacles, and collectibles with seamless recycling.
 */

import * as THREE from 'three';
import { DIMENSIONS, POWERUPS } from '../config.js';
import { EnvironmentAssets } from './EnvironmentAssets.js';

export class JungleWorld {
  constructor(scene, difficultySettings) {
    this.scene = scene;
    this.difficulty = difficultySettings;
    this.assets = new EnvironmentAssets();

    this.chunkLength = DIMENSIONS.CHUNK_LENGTH;
    this.visibleChunks = DIMENSIONS.VISIBLE_CHUNKS;
    this.chunks = [];
    this.nextChunkIndex = 0;

    // Track active collision entities
    this.activeObstacles = [];
    this.activeCollectibles = [];
    this.activeHazards = [];

    // Shared Ground Texture & Material
    this.groundMaterial = this.createGroundMaterial();

    // Event hooks
    this.onHitObstacle = null;
    this.onCollectItem = null;
    this.onEnterHazard = null;

    // Initial world generation
    for (let i = 0; i < this.visibleChunks; i++) {
      this.spawnChunk(i === 0); // first chunk is obstacle-free for smooth start
    }
  }

  createGroundMaterial() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Rich jungle soil & damp earth
    ctx.fillStyle = '#261b11';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle path trails (center path is more trodden)
    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, '#1c2813'); // green moss edge
    grad.addColorStop(0.2, '#312217'); // dirt trail
    grad.addColorStop(0.5, '#423021'); // worn path center
    grad.addColorStop(0.8, '#312217');
    grad.addColorStop(1.0, '#1c2813');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Soil grain & pebbles
    for (let i = 0; i < 3000; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(80, 60, 40, 0.25)' : 'rgba(20, 15, 10, 0.35)';
      ctx.fillRect(rx, ry, 2 + Math.random() * 3, 2 + Math.random() * 3);
    }

    // Moss patches along edges
    ctx.fillStyle = 'rgba(40, 95, 30, 0.4)';
    for (let i = 0; i < 50; i++) {
      const cx = (Math.random() > 0.5) ? Math.random() * 100 : 412 + Math.random() * 100;
      const cy = Math.random() * 512;
      ctx.beginPath();
      ctx.arc(cx, cy, 12 + Math.random() * 24, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 6);

    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.82,
      metalness: 0.05
    });
  }

  spawnChunk(isFirstChunk = false) {
    const chunkZ = this.nextChunkIndex * this.chunkLength;
    const chunkGroup = new THREE.Group();
    chunkGroup.position.z = chunkZ;

    // 1. Ground Mesh (Width 16m total, middle 7.2m is main path)
    const groundGeo = new THREE.PlaneGeometry(16, this.chunkLength, 8, 8);
    groundGeo.rotateX(-Math.PI / 2);
    const ground = new THREE.Mesh(groundGeo, this.groundMaterial);
    ground.receiveShadow = true;
    ground.position.z = this.chunkLength / 2;
    chunkGroup.add(ground);

    // 2. Dense Border Trees & Ferns
    const numTreesPerSide = 5;
    for (let t = 0; t < numTreesPerSide; t++) {
      const zOffset = (t / numTreesPerSide) * this.chunkLength + (Math.random() - 0.5) * 4;

      // Left Kapok Tree
      const treeL = this.assets.createKapokTree(14 + Math.random() * 4, 1.4 + Math.random() * 0.4);
      treeL.position.set(-6.5 - Math.random() * 3.5, 0, zOffset);
      treeL.rotation.y = Math.random() * Math.PI * 2;
      chunkGroup.add(treeL);

      // Right Kapok Tree
      const treeR = this.assets.createKapokTree(14 + Math.random() * 4, 1.4 + Math.random() * 0.4);
      treeR.position.set(6.5 + Math.random() * 3.5, 0, zOffset);
      treeR.rotation.y = Math.random() * Math.PI * 2;
      chunkGroup.add(treeR);

      // Fern Clusters along edge
      const fernL = this.assets.createFernCluster();
      fernL.position.set(-4.2 - Math.random() * 1.5, 0, zOffset + 2);
      chunkGroup.add(fernL);

      const fernR = this.assets.createFernCluster();
      fernR.position.set(4.2 + Math.random() * 1.5, 0, zOffset + 2);
      chunkGroup.add(fernR);
    }

    // 3. Obstacles & Collectibles
    const chunkObstacles = [];
    const chunkCollectibles = [];
    const chunkHazards = [];

    if (!isFirstChunk) {
      this.populateChunkGameplay(chunkGroup, chunkZ, chunkObstacles, chunkCollectibles, chunkHazards);
    } else {
      // Gentle start: place standard score orchids (no automatic invincibility on starting line)
      for (let b = 0; b < 2; b++) {
        const flower = this.assets.createStarOrchid();
        flower.position.set(0, 1.1, 28 + b * 12);
        chunkGroup.add(flower);
        chunkCollectibles.push(flower);
      }
    }

    this.scene.add(chunkGroup);

    const chunkData = {
      index: this.nextChunkIndex,
      zStart: chunkZ,
      zEnd: chunkZ + this.chunkLength,
      group: chunkGroup,
      obstacles: chunkObstacles,
      collectibles: chunkCollectibles,
      hazards: chunkHazards
    };

    this.chunks.push(chunkData);
    this.activeObstacles.push(...chunkObstacles);
    this.activeCollectibles.push(...chunkCollectibles);
    this.activeHazards.push(...chunkHazards);

    this.nextChunkIndex++;
  }

  populateChunkGameplay(chunkGroup, chunkZ, obstacles, collectibles, hazards) {
    const lanes = [-DIMENSIONS.LANE_WIDTH, 0, DIMENSIONS.LANE_WIDTH];
    const density = this.difficulty.obstacleDensity;

    // Decide obstacle patterns for this chunk
    // 2 sections per chunk
    const sectionLength = this.chunkLength / 2;

    for (let s = 0; s < 2; s++) {
      const sectionZ = s * sectionLength + 15 + Math.random() * 8;
      const roll = Math.random();

      if (roll < density) {
        const obsTypeRoll = Math.random();

        if (obsTypeRoll < 0.35) {
          // Fallen Log (JUMP required)
          const log = this.assets.createFallenLog(DIMENSIONS.LANE_WIDTH * 3.2);
          log.position.set(0, 0, sectionZ);
          chunkGroup.add(log);
          obstacles.push(log);
        } else if (obsTypeRoll < 0.62) {
          // Low Arch / Vines (SLIDE required)
          const arch = this.assets.createLowArch(DIMENSIONS.LANE_WIDTH * 3.2);
          arch.position.set(0, 0, sectionZ);
          chunkGroup.add(arch);
          obstacles.push(arch);
        } else if (obsTypeRoll < 0.88) {
          // Bramble Clusters in 1 or 2 lanes (DODGE required)
          // Always ensure at least ONE lane is free!
          const blockedLanes = [Math.floor(Math.random() * 3)];
          if (density > 0.5 && Math.random() > 0.4) {
            // Block 2nd lane
            let secondLane = Math.floor(Math.random() * 3);
            while (secondLane === blockedLanes[0]) {
              secondLane = Math.floor(Math.random() * 3);
            }
            blockedLanes.push(secondLane);
          }

          blockedLanes.forEach(lIdx => {
            // Alternate between mossy jungle boulders/rocks and thorny brambles
            const obstacleObj = (Math.random() > 0.45)
              ? this.assets.createRockObstacle(DIMENSIONS.LANE_WIDTH * 0.95)
              : this.assets.createBrambleObstacle(DIMENSIONS.LANE_WIDTH * 0.95);
            obstacleObj.position.set(lanes[lIdx], 0, sectionZ);
            chunkGroup.add(obstacleObj);
            obstacles.push(obstacleObj);
          });

          // Place reward in the open lane
          const openLane = [0, 1, 2].find(idx => !blockedLanes.includes(idx));
          if (openLane !== undefined) {
            const flower = (Math.random() > 0.4) ? this.assets.createStarOrchid() : this.assets.createGoldenRelic();
            flower.position.set(lanes[openLane], 1.1, sectionZ);
            chunkGroup.add(flower);
            collectibles.push(flower);
          }
        } else {
          // Mud Quagmire (Slow hazard)
          const mudLane = Math.floor(Math.random() * 3);
          const mud = this.assets.createMudPuddle(DIMENSIONS.LANE_WIDTH * 1.1, 8.0);
          mud.position.set(lanes[mudLane], 0, sectionZ);
          chunkGroup.add(mud);
          hazards.push(mud);
        }
      } else {
        // Safe section: Place rare exotic Star Orchid
        const itemLane = Math.floor(Math.random() * 3);
        const flower = this.assets.createStarOrchid();
        flower.position.set(lanes[itemLane], 1.1, sectionZ);
        chunkGroup.add(flower);
        collectibles.push(flower);
      }
    }
  }

  update(playerZ, catBounds) {
    // 1. Recycle chunks that fell far behind the player (behind snake)
    const recycleThreshold = playerZ - 35;
    while (this.chunks.length > 0 && this.chunks[0].zEnd < recycleThreshold) {
      const oldChunk = this.chunks.shift();

      // Remove its obstacles & collectibles from active arrays
      this.activeObstacles = this.activeObstacles.filter(o => !oldChunk.obstacles.includes(o));
      this.activeCollectibles = this.activeCollectibles.filter(c => !oldChunk.collectibles.includes(c));
      this.activeHazards = this.activeHazards.filter(h => !oldChunk.hazards.includes(h));

      // Remove from scene
      this.scene.remove(oldChunk.group);

      // Spawn next chunk ahead
      this.spawnChunk(false);
    }

    // 2. Floating animation for collectible flowers and relics
    const time = performance.now() * 0.003;
    for (let i = 0; i < this.activeCollectibles.length; i++) {
      const col = this.activeCollectibles[i];
      col.rotation.y = time * 2.0;
      col.position.y = 1.0 + Math.sin(time * 3.0 + col.position.z) * 0.18;
    }

    // 3. Collision Checks: Player vs Obstacles
    for (let i = this.activeObstacles.length - 1; i >= 0; i--) {
      const obs = this.activeObstacles[i];
      if (obs.userData.hasHit) continue; // Already processed collision

      const worldPos = new THREE.Vector3();
      obs.getWorldPosition(worldPos);

      const dz = Math.abs(worldPos.z - catBounds.z);
      const dx = Math.abs(worldPos.x - catBounds.x);

      const maxDz = ((obs.userData.depth || 1.2) + catBounds.length) * 0.5;
      const maxDx = ((obs.userData.width || 2.0) + catBounds.width) * 0.5;

      // Accurate 3D AABB bounding check
      if (dz < maxDz && dx < maxDx) {
        // Detailed height / state collision
        const subType = obs.userData.subType;

        if (subType === 'jump') {
          // Jumpable log: If cat's Y is high enough, we clear it!
          if (catBounds.y < (obs.userData.height || 0.85)) {
            if (this.onHitObstacle) {
              obs.userData.hasHit = true;
              this.onHitObstacle('jump', obs);
            }
          }
        } else if (subType === 'slide') {
          // Low arch: Cat must be sliding low!
          if (!catBounds.isSliding) {
            if (this.onHitObstacle) {
              obs.userData.hasHit = true;
              this.onHitObstacle('slide', obs);
            }
          }
        } else if (subType === 'dodge') {
          // Rock or Bramble in lane: collision!
          if (this.onHitObstacle) {
            obs.userData.hasHit = true;
            this.onHitObstacle('dodge', obs);
          }
        }
      }
    }

    // 4. Collision Checks: Player vs Hazards (Mud)
    for (let i = 0; i < this.activeHazards.length; i++) {
      const haz = this.activeHazards[i];
      const worldPos = new THREE.Vector3();
      haz.getWorldPosition(worldPos);

      const dz = Math.abs(worldPos.z - catBounds.z);
      const dx = Math.abs(worldPos.x - catBounds.x);

      if (dz < (haz.userData.length || 4.0) / 2 && dx < (haz.userData.width || 2.0) / 2) {
        if (catBounds.y < 0.25) { // on ground
          if (this.onEnterHazard) {
            this.onEnterHazard(haz.userData.subType);
          }
        }
      }
    }

    // 5. Collision Checks: Player vs Collectibles
    for (let i = this.activeCollectibles.length - 1; i >= 0; i--) {
      const item = this.activeCollectibles[i];
      const worldPos = new THREE.Vector3();
      item.getWorldPosition(worldPos);

      const dist = worldPos.distanceTo(new THREE.Vector3(catBounds.x, catBounds.y + 0.5, catBounds.z));
      if (dist < (item.userData.radius || 0.5) + 0.7) {
        // Collect!
        if (this.onCollectItem) {
          this.onCollectItem(item.userData.collectibleType, item);
        }

        // Remove item mesh
        item.parent.remove(item);
        this.activeCollectibles.splice(i, 1);
      }
    }
  }

  destroy() {
    for (const chunk of this.chunks) {
      this.scene.remove(chunk.group);
    }
    this.chunks = [];
    this.activeObstacles = [];
    this.activeCollectibles = [];
    this.activeHazards = [];
    if (this.groundMaterial.map) this.groundMaterial.map.dispose();
    this.groundMaterial.dispose();
  }
}
