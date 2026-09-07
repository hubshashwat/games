import { DIMENSIONS, DIFFICULTY_SETTINGS } from '../config.js';
import { soundManager } from '../audio/SoundManager.js';

/**
 * Universal Multi-Platform Input Controller
 * Supports: Touch flick/swipe on mobile & tablet, Mouse drag on laptop, Keyboard controls, and Precision sliders.
 */
export class InputController {
  constructor(containerElement, onLaunchCallback, onAimChangeCallback) {
    this.container = containerElement;
    this.onLaunch = onLaunchCallback;
    this.onAimChange = onAimChangeCallback;

    this.enabled = false;
    this.difficulty = 'medium';

    // Aim & launch parameters
    this.startX = 0;       // -0.42 to +0.42 meters
    this.aimAngle = 0;     // -0.12 to +0.12 radians
    this.spinRpm = 0;      // -350 to +350 rpm (+ = hook right, - = hook left)
    this.speed = 7.6;      // m/s (~17.0 MPH regulation USBC strike speed)

    // Gesture tracking state
    this.isDragging = false;
    this.dragMode = 'none'; // 'position' | 'flick'
    this.touchStartTime = 0;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.lastX = 0;
    this.lastY = 0;

    this.setupListeners();
  }

  setDifficulty(difficulty) {
    this.difficulty = difficulty;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.isDragging = false;
    this.dragMode = 'none';
  }

  setupListeners() {
    // 1. Pointer Events (Touch, Pen, and Mouse unified)
    this.container.addEventListener('pointerdown', (e) => this.handlePointerDown(e), { passive: false });
    window.addEventListener('pointermove', (e) => this.handlePointerMove(e), { passive: false });
    window.addEventListener('pointerup', (e) => this.handlePointerUp(e), { passive: false });
    window.addEventListener('pointercancel', (e) => this.handlePointerCancel(e), { passive: false });

    // 2. Keyboard shortcuts for laptop / desktop
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  handlePointerDown(e) {
    if (!this.enabled) return;
    // If clicking on UI overlay buttons, ignore
    if (e.target.closest('.no-pointer-game') || e.target.tagName === 'BUTTON') return;

    this.isDragging = true;
    this.touchStartTime = performance.now();
    this.touchStartX = e.clientX;
    this.touchStartY = e.clientY;
    this.lastX = e.clientX;
    this.lastY = e.clientY;

    const rect = this.container.getBoundingClientRect();
    const relativeY = (e.clientY - rect.top) / rect.height;

    // If tapped near bottom 25% of screen, initial intent is position stance
    if (relativeY > 0.75) {
      this.dragMode = 'position';
    } else {
      this.dragMode = 'flick';
    }
  }

  handlePointerMove(e) {
    if (!this.enabled || !this.isDragging) return;

    const deltaX = e.clientX - this.lastX;
    const deltaY = e.clientY - this.lastY;
    const totalDeltaX = e.clientX - this.touchStartX;
    const totalDeltaY = e.clientY - this.touchStartY;

    const maxBoardX = DIMENSIONS.LANE_WIDTH / 2 - DIMENSIONS.BALL_RADIUS - 0.04;

    if (this.dragMode === 'position') {
      // Horizontal slide adjusts starting position across approach
      const sensitivity = 0.0022;
      this.startX = Math.max(-maxBoardX, Math.min(maxBoardX, this.startX + deltaX * sensitivity));

      // If user drags upward substantially while positioning, switch to flick
      if (totalDeltaY < -40) {
        this.dragMode = 'flick';
      }
    } else if (this.dragMode === 'flick') {
      // Upward drag aims the ball with finger-jitter deadzone
      const rawRatio = totalDeltaX / Math.max(50, -Math.min(-20, totalDeltaY));
      const deadzone = 0.08;
      let scaledAngle = 0;
      if (Math.abs(rawRatio) > deadzone) {
        scaledAngle = Math.sign(rawRatio) * (Math.abs(rawRatio) - deadzone) * 0.06;
      }
      const maxAngle = this.difficulty === 'easy' ? 0.028 : (this.difficulty === 'medium' ? 0.038 : 0.045);
      this.aimAngle = Math.max(-maxAngle, Math.min(maxAngle, scaledAngle));
    }

    this.lastX = e.clientX;
    this.lastY = e.clientY;

    if (this.onAimChange) {
      this.onAimChange(this.startX, this.aimAngle, this.spinRpm);
    }
  }

  handlePointerUp(e) {
    if (!this.enabled || !this.isDragging) return;
    this.isDragging = false;

    const dt = performance.now() - this.touchStartTime;
    const deltaX = e.clientX - this.touchStartX;
    const deltaY = e.clientY - this.touchStartY;

    // Upward swipe constitutes a release/throw
    // deltaY must be negative (upward on screen) and of sufficient displacement
    if (deltaY < -35 && dt < 900) {
      this.triggerThrowFromSwipe(deltaX, deltaY, dt);
    } else {
      // Just a tap or stance adjustment; keep aiming
      this.dragMode = 'none';
    }
  }

  handlePointerCancel() {
    this.isDragging = false;
    this.dragMode = 'none';
  }

  triggerThrowFromSwipe(deltaX, deltaY, dtMs) {
    const cfg = DIFFICULTY_SETTINGS[this.difficulty];

    // Speed calculation from swipe velocity (pixels per ms)
    const distancePx = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const speedPxPerMs = distancePx / Math.max(40, dtMs);

    // Map swipe speed to physical bowling speed (~13 to 21 mph)
    const normalizedSpeed = Math.min(1.0, Math.max(0.1, (speedPxPerMs - 0.35) / 1.9));
    const finalSpeed = cfg.minVelocity + normalizedSpeed * (cfg.maxVelocity - cfg.minVelocity);

    // Angle calculation:
    // Ratio of horizontal displacement to vertical displacement with jitter deadzone
    const rawRatio = deltaX / Math.max(50, -deltaY);
    const deadzone = 0.08; // ~4.5 degree deadzone prevents natural finger wobble from guttering
    let scaledAngle = 0;
    if (Math.abs(rawRatio) > deadzone) {
      scaledAngle = Math.sign(rawRatio) * (Math.abs(rawRatio) - deadzone) * 0.06;
    }

    const maxAngle = this.difficulty === 'easy' ? 0.028 : (this.difficulty === 'medium' ? 0.038 : 0.045);
    const finalAngle = Math.max(-maxAngle, Math.min(maxAngle, scaledAngle));

    // Execute launch!
    this.executeLaunch(this.startX, finalAngle, finalSpeed, this.spinRpm);
  }

  executeLaunch(startX, angle, speed, spinRpm) {
    if (!this.enabled) return;
    this.enabled = false; // Lock until next roll
    soundManager.playClick();

    if (this.onLaunch) {
      this.onLaunch({
        startX,
        angle,
        speed,
        spinRpm
      });
    }
  }

  /**
   * Keyboard controls for desktop / laptop
   */
  handleKeyDown(e) {
    if (!this.enabled) return;

    const maxBoardX = DIMENSIONS.LANE_WIDTH / 2 - DIMENSIONS.BALL_RADIUS - 0.04;
    let changed = false;

    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      // Step left
      this.startX = Math.max(-maxBoardX, this.startX - 0.03);
      changed = true;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      // Step right
      this.startX = Math.min(maxBoardX, this.startX + 0.03);
      changed = true;
    } else if (e.key === 'q' || e.key === 'Q') {
      // Add left hook spin
      this.spinRpm = Math.max(-350, this.spinRpm - 40);
      changed = true;
    } else if (e.key === 'e' || e.key === 'E') {
      // Add right hook spin
      this.spinRpm = Math.min(350, this.spinRpm + 40);
      changed = true;
    } else if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp') {
      // Space / Enter: Fire throw!
      e.preventDefault();
      const cfg = DIFFICULTY_SETTINGS[this.difficulty];
      this.executeLaunch(this.startX, this.aimAngle, this.speed, this.spinRpm);
      return;
    }

    if (changed && this.onAimChange) {
      this.onAimChange(this.startX, this.aimAngle, this.spinRpm);
    }
  }

  // Setters for UI controls (Sliders & Buttons)
  setPosition(posNorm) {
    // posNorm is -1.0 (far left) to +1.0 (far right)
    const maxBoardX = DIMENSIONS.LANE_WIDTH / 2 - DIMENSIONS.BALL_RADIUS - 0.04;
    this.startX = posNorm * maxBoardX;
    if (this.onAimChange) {
      this.onAimChange(this.startX, this.aimAngle, this.spinRpm);
    }
  }

  setAngle(angleRad) {
    const maxAngle = this.difficulty === 'easy' ? 0.028 : (this.difficulty === 'medium' ? 0.038 : 0.045);
    this.aimAngle = Math.max(-maxAngle, Math.min(maxAngle, angleRad));
    if (this.onAimChange) {
      this.onAimChange(this.startX, this.aimAngle, this.spinRpm);
    }
  }

  setSpin(rpm) {
    this.spinRpm = Math.max(-350, Math.min(350, rpm));
    if (this.onAimChange) {
      this.onAimChange(this.startX, this.aimAngle, this.spinRpm);
    }
  }

  setSpeed(speedVal) {
    this.speed = speedVal;
  }

  resetStance() {
    this.startX = 0;
    this.aimAngle = 0;
    this.spinRpm = 0;
    if (this.onAimChange) {
      this.onAimChange(this.startX, this.aimAngle, this.spinRpm);
    }
  }
}
