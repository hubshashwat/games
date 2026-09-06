import { DIMENSIONS, DIFFICULTY_SETTINGS, BALL_PRESETS } from './config.js';
import { ScoreStorage } from './storage/ScoreStorage.js';
import { soundManager } from './audio/SoundManager.js';
import { PhysicsWorld } from './physics/PhysicsWorld.js';
import { AlleyScene } from './graphics/AlleyScene.js';
import { BowlingRules } from './gameplay/BowlingRules.js';
import { InputController } from './controls/InputController.js';
import { UIOverlay } from './ui/UIOverlay.js';

// Game States
const STATE = {
  AIMING: 'AIMING',
  ROLLING: 'ROLLING',
  EVALUATING: 'EVALUATING',
  RESETTING: 'RESETTING',
  GAMEOVER: 'GAMEOVER'
};

class BowlingGame {
  constructor() {
    this.state = STATE.AIMING;
    this.lastTime = performance.now();

    // Load saved settings
    this.settings = ScoreStorage.loadSettings();
    this.difficulty = this.settings.difficulty || 'medium';
    this.currentBall = BALL_PRESETS.find(b => b.id === this.settings.ballId) || BALL_PRESETS[1];

    // Sound settings
    soundManager.setMuted(this.settings.muted);
    soundManager.setVolume(this.settings.volume);

    // Initialize systems
    const canvasContainer = document.getElementById('game-canvas-container');
    this.scene = new AlleyScene(canvasContainer);
    this.physics = new PhysicsWorld();
    this.rules = new BowlingRules();

    // Apply initial settings
    this.scene.setBallPreset(this.currentBall);
    this.scene.cameraMode = 'follow';
    this.physics.setDifficulty(this.difficulty);

    // Roll state tracking
    this.rollStartTime = 0;
    this.lastStandingPins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    this.consecutiveStrikes = 0;

    // UI Overlay
    this.ui = new UIOverlay({
      onDifficultyChange: (diff) => this.setDifficulty(diff),
      onBallChange: (ballPreset) => this.setBall(ballPreset),
      onSoundToggle: () => this.toggleSound(),
      onRestart: () => this.restartGame(),
      onStanceChange: (posNorm) => this.input.setPosition(posNorm),
      onSpinChange: (rpm) => this.input.setSpin(rpm),
      onManualBowl: () => this.triggerManualBowl()
    });

    this.ui.setDifficulty(this.difficulty);
    this.ui.currentBallId = this.currentBall.id;

    // Input Controller
    this.input = new InputController(
      canvasContainer,
      (launchData) => this.handleLaunch(launchData),
      (startX, angle, spinRpm) => this.handleAimChange(startX, angle, spinRpm)
    );
    this.input.setDifficulty(this.difficulty);

    // Set initial pins
    this.resetAllPins();

    // Start in Aiming state
    this.enterAimingState();

    // Bind interaction for audio unlock
    const unlockAudio = () => {
      soundManager.init();
      soundManager.resumeContext();
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    // Start loop
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  setDifficulty(diff) {
    this.difficulty = diff;
    this.settings.difficulty = diff;
    ScoreStorage.saveSettings({ difficulty: diff });

    this.physics.setDifficulty(diff);
    this.input.setDifficulty(diff);
    this.ui.setDifficulty(diff);

    // Switching difficulty level starts fresh from the beginning (Frame 1, Roll 1)
    this.restartGame();
  }

  setBall(ballPreset) {
    this.currentBall = ballPreset;
    this.settings.ballId = ballPreset.id;
    ScoreStorage.saveSettings({ ballId: ballPreset.id });
    this.scene.setBallPreset(ballPreset);
  }

  toggleSound() {
    const newMute = !soundManager.muted;
    soundManager.setMuted(newMute);
    ScoreStorage.saveSettings({ muted: newMute });
    return newMute;
  }

  restartGame() {
    this.rules.reset();
    this.consecutiveStrikes = 0;
    this.lastStandingPins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    this.physics.removeBall();
    this.input.resetStance();
    this.ui.resetControls();
    this.resetAllPins();
    this.ui.updateScoreboard(this.rules);
    this.ui.renderPinHud(this.lastStandingPins);
    this.enterAimingState();
  }

  resetAllPins() {
    this.physics.setupPins([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    this.lastStandingPins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    this.scene.syncPhysics(this.physics);
  }

  enterAimingState() {
    this.state = STATE.AIMING;
    this.physics.removeBall();

    // Place visual ball at approach line
    this.scene.ballMesh.visible = true;
    this.scene.ballMesh.position.set(this.input.startX, DIMENSIONS.BALL_RADIUS, -0.6);
    this.scene.ballMesh.rotation.set(-Math.PI * 0.35, 0, 0);

    this.scene.resetCameraToAim();

    this.input.setEnabled(true);
    this.ui.setStatus(`Frame ${this.rules.getCurrentFrameNumber()} • Roll ${this.rules.getCurrentRollNumber()}`);
    this.scene.updateAimGuide(this.input.startX, this.input.aimAngle, this.input.spinRpm, this.difficulty);
  }

  handleAimChange(startX, angle, spinRpm) {
    if (this.state !== STATE.AIMING) return;
    this.scene.ballMesh.position.x = startX;
    this.scene.updateAimGuide(startX, angle, spinRpm, this.difficulty);
  }

  triggerManualBowl() {
    if (this.state !== STATE.AIMING) return;
    const cfg = DIFFICULTY_SETTINGS[this.difficulty];
    const speed = (cfg.minVelocity + cfg.maxVelocity) * 0.52;
    this.input.executeLaunch(this.input.startX, this.input.aimAngle, speed, this.input.spinRpm);
  }

  handleLaunch({ startX, angle, speed, spinRpm }) {
    if (this.state !== STATE.AIMING) return;

    this.state = STATE.ROLLING;
    this.rollPhysicsTime = 0;
    this.pinImpactPhysicsTime = null;
    this.scene.hideAimGuide();

    // Launch ball in physics world
    this.physics.launchBall(this.currentBall, startX, angle, speed, spinRpm);
    this.ui.showSpeedAndSpin(speed, spinRpm);
    this.ui.setStatus('Ball Rolling...');
  }

  checkRollFinished(dt) {
    if (!this.physics.ballBody) return true;

    const bp = this.physics.ballBody.position;
    const bv = this.physics.ballBody.velocity;
    const elapsedSec = this.rollPhysicsTime;

    // Track when pin impact occurs in simulation time
    if (this.physics.firstImpactOccurred && this.pinImpactPhysicsTime === null) {
      this.pinImpactPhysicsTime = elapsedSec;
    }

    // 1. If ball impacted pins, give pins 1.2 seconds of physics time to scatter, topple, and settle
    if (this.pinImpactPhysicsTime !== null) {
      return (elapsedSec - this.pinImpactPhysicsTime) > 1.2;
    }

    // 2. If ball went into gutter and reached back of pit
    if (this.physics.ballInGutter) {
      if (bp.z < -(DIMENSIONS.LANE_LENGTH + DIMENSIONS.PIN_DECK_LENGTH) || elapsedSec > 3.0) {
        return true;
      }
    }

    // 3. Ball went completely past pin deck into back pit without hitting pins
    if (bp.z < -(DIMENSIONS.LANE_LENGTH + DIMENSIONS.PIN_DECK_LENGTH + 0.3)) {
      return elapsedSec > 2.6;
    }

    // 4. Fallback simulation safety timeout: allows full travel even under slow frame rates
    return elapsedSec > 5.0;
  }

  evaluateRoll() {
    this.state = STATE.EVALUATING;
    this.ui.setStatus('Checking Pins...');

    const { standingPins, fallenPins, fallenCount } = this.physics.evaluatePinStatus();

    // Number of pins knocked down ON THIS SPECIFIC ROLL
    const pinsHitThisRoll = this.lastStandingPins.length - standingPins.length;
    const actualHit = Math.max(0, Math.min(10, pinsHitThisRoll));

    // Update rules engine
    const rollResult = this.rules.recordRoll(actualHit, standingPins, this.physics.ballInGutter);
    this.lastStandingPins = standingPins;

    // Update Scoreboard & Pin Mini-HUD
    this.ui.updateScoreboard(this.rules);
    this.ui.renderPinHud(standingPins);

    // Announce result
    if (rollResult.type === 'strike') {
      this.consecutiveStrikes++;
      if (this.consecutiveStrikes === 2) {
        this.ui.showAnnouncement('strike', '🔥 DOUBLE! 🔥');
      } else if (this.consecutiveStrikes >= 3) {
        this.ui.showAnnouncement('strike', '🦃 TURKEY! 🦃');
      } else {
        this.ui.showAnnouncement('strike', '★ STRIKE! ★');
      }
    } else if (rollResult.type === 'spare') {
      this.consecutiveStrikes = 0;
      this.ui.showAnnouncement('spare', '★ SPARE! ★');
    } else if (rollResult.type === 'split') {
      this.consecutiveStrikes = 0;
      this.ui.showAnnouncement('split', '⚡ SPLIT! ⚡');
    } else if (rollResult.type === 'gutter') {
      this.consecutiveStrikes = 0;
      this.ui.showAnnouncement('gutter', 'GUTTER BALL');
    } else if (rollResult.type === 'miss') {
      this.consecutiveStrikes = 0;
      this.ui.showAnnouncement('open', 'MISS (0 PINS)');
    } else {
      this.consecutiveStrikes = 0;
      if (actualHit > 0) {
        this.ui.showAnnouncement('open', `${actualHit} PINS`);
      }
    }

    // Move to resetting
    setTimeout(() => {
      this.handlePostRoll(rollResult, fallenPins, standingPins);
    }, 1800);
  }

  handlePostRoll(rollResult, fallenPins, standingPins) {
    this.state = STATE.RESETTING;
    this.physics.removeBall();
    this.scene.ballMesh.visible = false;

    if (rollResult.isGameOver) {
      // Game Complete!
      this.state = STATE.GAMEOVER;
      const finalScore = this.rules.getFinalScore();
      const statsResult = ScoreStorage.recordGame({
        score: finalScore,
        difficulty: this.difficulty,
        strikes: this.rules.totalStrikes,
        spares: this.rules.totalSpares,
        gutters: this.rules.totalGutters
      });

      this.ui.showGameOver({
        finalScore,
        difficulty: this.difficulty,
        strikes: this.rules.totalStrikes,
        spares: this.rules.totalSpares,
        isNewHighScore: statsResult.isNewHighScore,
        diffHighScore: statsResult.difficultyHighScore,
        bestOverall: statsResult.overallBest
      });
      return;
    }

    if (rollResult.isFrameOver || rollResult.resetPins) {
      // Frame ended or 10th frame reset (after strike/spare)
      // Pinsetter sweep rake clears deck, then sets fresh 10 pins
      this.scene.startPinsetterSweep(() => {
        soundManager.playPinsetterDrop();
        this.resetAllPins();
        this.ui.renderPinHud(this.lastStandingPins);
        this.enterAimingState();
      });
    } else {
      // Roll 2 coming up: sweep only the dead fallen pins, keep standing pins!
      this.scene.startPinsetterSweep(() => {
        this.physics.clearFallenPins(fallenPins);
        this.physics.stabilizeStandingPins();
        this.scene.syncPhysics(this.physics);
        this.enterAimingState();
      });
    }
  }

  loop(timestamp) {
    const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    // 1. Physics Step
    this.physics.step(dt);

    // 2. Graphic Sync
    this.scene.syncPhysics(this.physics);
    this.scene.updateBumpers(this.physics.bumpersEnabled, dt);
    this.scene.updateCamera(this.physics.ballBody, dt);

    // 3. State Check
    if (this.state === STATE.ROLLING) {
      this.rollPhysicsTime += dt;
      if (this.checkRollFinished(dt)) {
        this.evaluateRoll();
      }
    }

    // 4. Render
    this.scene.render();

    requestAnimationFrame(this.loop);
  }
}

// Instantiate game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.bowlingGame = new BowlingGame();
});
