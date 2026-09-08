/**
 * Core Game Engine for Cat and Snake
 * Coordinates game loop, state transitions, physics, distance, scoring, snake AI, and powerups.
 */

import * as THREE from 'three';
import { GAME_MODES, CAT_SKINS, POWERUPS, CAMERA_VIEWS } from '../config.js';
import { SceneManager } from './SceneManager.js';
import { AudioManager } from './AudioManager.js';
import { InputManager } from './InputManager.js';
import { UIManager } from '../ui/UIManager.js';
import { Cat } from '../entities/Cat.js';
import { Snake } from '../entities/Snake.js';
import { JungleWorld } from '../world/JungleWorld.js';
import { ParticleSystem } from '../world/ParticleSystem.js';

export const GAME_STATES = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over'
};

export class GameEngine {
  constructor(canvasContainer, uiContainer) {
    this.canvasContainer = canvasContainer;
    this.uiContainer = uiContainer;

    // Subsystems
    this.sceneManager = new SceneManager(this.canvasContainer);
    this.audioManager = new AudioManager();
    this.inputManager = new InputManager(window);
    this.uiManager = new UIManager(this.uiContainer);

    // Gameplay parameters
    this.state = GAME_STATES.MENU;
    this.currentMode = GAME_MODES.predator;
    this.currentSkin = 'leopard';

    this.speed = this.currentMode.baseSpeed;
    this.distanceRan = 0;
    this.score = 0;
    this.highScore = this.loadHighScore();
    this.berriesCollected = 0;

    // Active powerup state
    this.activePowerup = null;
    this.powerupTimer = 0;
    this.currentMultiplier = this.currentMode.scoreMultiplier;

    // Mud slow timer
    this.mudSlowTimer = 0;

    // Entities
    this.cat = null;
    this.snake = null;
    this.world = null;
    this.particles = null;

    // Animation frame tracking
    this.lastFrameTime = performance.now();
    this.isDestroyed = false;

    this.bindEvents();
    this.initEntities();
    this.startLoop();
  }

  loadHighScore() {
    try {
      return parseFloat(localStorage.getItem('cat_snake_highscore') || '0');
    } catch {
      return 0;
    }
  }

  saveHighScore(val) {
    this.highScore = Math.max(this.highScore, val);
    try {
      localStorage.setItem('cat_snake_highscore', this.highScore.toString());
    } catch {}
  }

  initEntities() {
    // Clear old entities if any
    if (this.cat) this.cat.destroy();
    if (this.snake) this.snake.destroy();
    if (this.world) this.world.destroy();
    if (this.particles) this.particles.destroy();

    // Spawn fresh world and entities
    this.world = new JungleWorld(this.sceneManager.scene, this.currentMode);
    this.particles = new ParticleSystem(this.sceneManager.scene);
    this.cat = new Cat(this.sceneManager.scene, this.currentSkin);
    this.snake = new Snake(this.sceneManager.scene);

    // Initial positioning
    this.cat.group.position.set(0, 0, 0);
    this.snake.setDistance(this.currentMode.snakeBaseDist);

    // Connect paw strike particles & footsteps
    this.cat.onPawStrike = (pos, isMud) => {
      this.particles.emitPawPuff(pos, isMud, 5);
      this.audioManager.playGallopStep(this.speed / 20.0);
    };

    // Connect world collision hooks
    this.world.onHitObstacle = (type, obs) => {
      this.handleObstacleHit(type, obs);
    };

    this.world.onEnterHazard = (hazardType) => {
      this.handleHazard(hazardType);
    };

    this.world.onCollectItem = (type, item) => {
      this.handleCollectItem(type, item);
    };
  }

  bindEvents() {
    // Input manager events
    this.inputManager.on('moveLeft', () => {
      if (this.state === GAME_STATES.PLAYING) {
        this.cat.setLane(this.cat.lane - 1);
      }
    });

    this.inputManager.on('moveRight', () => {
      if (this.state === GAME_STATES.PLAYING) {
        this.cat.setLane(this.cat.lane + 1);
      }
    });

    this.inputManager.on('jump', () => {
      if (this.state === GAME_STATES.PLAYING) {
        if (this.cat.jump()) {
          this.audioManager.playJump();
        }
      }
    });

    this.inputManager.on('slide', () => {
      if (this.state === GAME_STATES.PLAYING) {
        if (this.cat.slide()) {
          this.audioManager.playSlide();
        }
      }
    });

    this.inputManager.on('boost', (isDown) => {
      if (this.state === GAME_STATES.PLAYING && isDown) {
        // Boost action (if berry or sprint available)
      }
    });

    this.inputManager.on('pause', () => {
      if (this.state === GAME_STATES.PLAYING) {
        this.pauseGame();
      } else if (this.state === GAME_STATES.PAUSED) {
        this.resumeGame();
      }
    });

    this.inputManager.on('restart', () => {
      if (this.state === GAME_STATES.GAME_OVER || this.state === GAME_STATES.PAUSED) {
        this.restartGame();
      }
    });

    // Connect UI action triggers (Touch buttons)
    this.uiManager.onTriggerJump = () => {
      if (this.state === GAME_STATES.PLAYING) {
        if (this.cat.jump()) this.audioManager.playJump();
      }
    };

    this.uiManager.onTriggerSlide = () => {
      if (this.state === GAME_STATES.PLAYING) {
        if (this.cat.slide()) this.audioManager.playSlide();
      }
    };

    this.uiManager.onTriggerBoost = (isDown) => {
      if (this.state === GAME_STATES.PLAYING && isDown) {
        // Quick burst
        this.particles.emitBoostSparks(this.cat.group.position, 6);
      }
    };

    // UI Menu Hooks
    this.uiManager.onStartGame = (modeKey, skinKey) => {
      this.audioManager.resume();
      this.setMode(modeKey);
      this.setSkin(skinKey);
      this.startGame();
    };

    this.uiManager.onPauseGame = () => {
      this.pauseGame();
    };

    this.uiManager.onResumeGame = () => {
      this.resumeGame();
    };

    this.uiManager.onRestartGame = () => {
      this.restartGame();
    };

    this.uiManager.onToggleAudio = () => {
      return this.audioManager.toggleMute();
    };

    this.uiManager.onToggleCamera = (viewKey) => {
      this.sceneManager.setCameraView(viewKey);
    };

    this.uiManager.onChangeQuality = (quality) => {
      this.sceneManager.setQuality(quality);
    };

    this.uiManager.onSelectMode = (modeKey) => {
      this.setMode(modeKey);
    };

    this.uiManager.onSelectSkin = (skinKey) => {
      this.setSkin(skinKey);
    };
  }

  setMode(modeKey) {
    if (GAME_MODES[modeKey]) {
      this.currentMode = GAME_MODES[modeKey];
      this.speed = this.currentMode.baseSpeed;
      this.currentMultiplier = this.currentMode.scoreMultiplier;
    }
  }

  setSkin(skinKey) {
    if (CAT_SKINS[skinKey]) {
      this.currentSkin = skinKey;
      if (this.cat) this.cat.setSkin(skinKey);
    }
  }

  startGame() {
    this.state = GAME_STATES.PLAYING;
    this.distanceRan = 0;
    this.score = 0;
    this.berriesCollected = 0;
    this.speed = this.currentMode.baseSpeed;
    this.initEntities();
  }

  pauseGame() {
    if (this.state !== GAME_STATES.PLAYING) return;
    this.state = GAME_STATES.PAUSED;
    this.uiManager.showPauseModal();
  }

  resumeGame() {
    if (this.state !== GAME_STATES.PAUSED) return;
    this.state = GAME_STATES.PLAYING;
    this.uiManager.hidePauseModal();
    this.lastFrameTime = performance.now();
  }

  restartGame() {
    this.startGame();
    this.uiManager.hidePauseModal();
    this.uiManager.modalGameOver.classList.remove('modal-visible');
    this.uiManager.hud.style.display = 'flex';
  }

  handleObstacleHit(type, obs) {
    // Cat stumbles on obstacle
    this.audioManager.playStumble();
    this.sceneManager.triggerCameraShake(0.55);

    // Speed temporarily dips
    this.speed = Math.max(this.currentMode.baseSpeed * 0.7, this.speed - 6.0);

    // Snake lunges closer!
    this.snake.surgeForward(3.2 * this.currentMode.snakeAggression);

    // Check if snake immediately caught cat
    if (this.snake.isCaught()) {
      this.triggerGameOver();
    }
  }

  handleHazard(hazardType) {
    if (hazardType === 'mud') {
      this.mudSlowTimer = 0.5;
      this.particles.emitPawPuff(this.cat.group.position, true, 3);
      // Snake gradually gains ground while cat is bogged down in mud
      this.snake.surgeForward(0.08);
    }
  }

  handleCollectItem(type, item) {
    if (type === 'sun_berry') {
      this.berriesCollected++;
      this.audioManager.playPickup('sun_berry');
      this.score += 100 * this.currentMultiplier;

      // Activate Sun Berry powerup: Speed boost & invincibility!
      this.activePowerup = POWERUPS.SUN_BERRY;
      this.powerupTimer = POWERUPS.SUN_BERRY.duration;
      this.cat.setInvincible(POWERUPS.SUN_BERRY.duration);
      this.snake.pushBack(2.5);

      this.uiManager.showPowerup('SUN BERRY BOOST!', '⚡');
    } else if (type === 'star_orchid') {
      this.audioManager.playPickup('star_orchid');
      this.score += 150 * this.currentMultiplier;

      this.activePowerup = POWERUPS.STAR_ORCHID;
      this.powerupTimer = POWERUPS.STAR_ORCHID.duration;
      this.uiManager.showPowerup('STAR ORCHID (3X PTS)', '🌸');
    } else if (type === 'relic') {
      this.audioManager.playPickup('relic');
      this.score += POWERUPS.RELIC.bonusPoints * this.currentMultiplier;
      this.snake.pushBack(POWERUPS.RELIC.pushSnakeBack);
      this.sceneManager.triggerCameraShake(0.2);
    }
  }

  triggerGameOver() {
    this.state = GAME_STATES.GAME_OVER;
    this.audioManager.playGameOver();
    this.sceneManager.triggerCameraShake(0.85);

    const isNewRecord = this.score > this.highScore;
    if (isNewRecord) {
      this.saveHighScore(this.score);
    }

    this.uiManager.showGameOver(
      this.distanceRan,
      this.score,
      this.highScore,
      this.berriesCollected,
      isNewRecord
    );
  }

  update(dt) {
    // 1. Powerup timers
    let activeSpeedMult = 1.0;
    this.currentMultiplier = this.currentMode.scoreMultiplier;

    if (this.activePowerup) {
      this.powerupTimer -= dt;
      if (this.activePowerup.type === 'sun_berry') {
        activeSpeedMult = this.activePowerup.speedBoost;
        this.particles.emitBoostSparks(this.cat.group.position, 2);
      } else if (this.activePowerup.type === 'star_orchid') {
        this.currentMultiplier *= this.activePowerup.scoreMultiplier;
      }

      if (this.powerupTimer <= 0) {
        this.activePowerup = null;
        this.uiManager.hidePowerup();
      }
    }

    // 2. Mud slow penalty
    if (this.mudSlowTimer > 0) {
      this.mudSlowTimer -= dt;
      activeSpeedMult *= 0.65;
    }

    // 3. Accelerate game speed naturally over distance
    if (this.speed < this.currentMode.maxSpeed) {
      this.speed += this.currentMode.speedAccel * dt;
    }

    const currentEffectiveSpeed = this.speed * activeSpeedMult;

    // 4. Advance distance & score
    const forwardStep = currentEffectiveSpeed * dt;
    this.distanceRan += forwardStep;
    this.score += forwardStep * this.currentMultiplier;

    // Move cat along Z axis
    this.cat.group.position.z += forwardStep;
    this.cat.update(dt, currentEffectiveSpeed);

    // 5. Update Snake AI & Undulation
    this.snake.update(dt, this.cat.group.position, currentEffectiveSpeed, this.currentMode.snakeAggression);

    // Snake proximity tension audio & effects
    if (this.snake.distance < 4.2) {
      const dangerLevel = Math.max(0, Math.min(1.0, 1.0 - (this.snake.distance / 4.2)));
      this.audioManager.triggerHeartbeat(dangerLevel);
      if (Math.random() < 0.03) {
        this.audioManager.playSnakeHiss(dangerLevel);
      }
    }

    // Check if snake caught cat
    if (this.snake.isCaught() && !this.cat.isInvincible) {
      this.triggerGameOver();
      return;
    }

    // 6. World Chunk Streaming & Collision
    const catBounds = this.cat.getBounds();
    this.world.update(this.cat.group.position.z, catBounds, this.cat.isInvincible);

    // 7. Particles
    this.particles.update(dt, this.cat.group.position.z);

    // 8. Update HUD
    this.uiManager.updateHUD(this.distanceRan, this.score, this.highScore, this.snake.distance);

    // 9. Camera Tracking
    this.sceneManager.updateCamera(
      dt,
      this.cat.group.position,
      this.snake.headGroup.position,
      currentEffectiveSpeed
    );
  }

  startLoop() {
    const loop = (time) => {
      if (this.isDestroyed) return;

      const rawDt = (time - this.lastFrameTime) / 1000.0;
      this.lastFrameTime = time;

      // Clamp delta time to avoid large jumps when tab is inactive
      const dt = Math.min(0.05, Math.max(0.001, rawDt));

      if (this.state === GAME_STATES.PLAYING) {
        this.update(dt);
      } else if (this.state === GAME_STATES.MENU || this.state === GAME_STATES.GAME_OVER) {
        // Idle ambient rendering
        if (this.particles && this.cat) {
          this.particles.update(dt, this.cat.group.position.z);
        }
      }

      // Render Three.js scene
      this.sceneManager.render();

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  destroy() {
    this.isDestroyed = true;
    this.inputManager.detach();
    this.audioManager.destroy();
    this.sceneManager.destroy();
    if (this.world) this.world.destroy();
    if (this.cat) this.cat.destroy();
    if (this.snake) this.snake.destroy();
    if (this.particles) this.particles.destroy();
  }
}
