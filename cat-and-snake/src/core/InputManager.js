/**
 * Unified Input Manager for Cat and Snake
 * Seamlessly coordinates Keyboard, Touch Gestures (Swipes + Drag Steering), and On-Screen HUD Buttons.
 */

export class InputManager {
  constructor(domElement) {
    this.domElement = domElement || window;
    
    // Actions
    this.callbacks = {
      moveLeft: [],
      moveRight: [],
      jump: [],
      slide: [],
      boost: [],
      pause: [],
      steer: [], // Analog steering value -1.0 to 1.0
      restart: []
    };

    // State
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;
    this.isSwiping = false;
    this.isTouching = false;
    this.swipeThreshold = 30; // Min px for swipe
    this.keysDown = new Set();

    // Bind event handlers
    this.onKeyDown = this.handleKeyDown.bind(this);
    this.onKeyUp = this.handleKeyUp.bind(this);
    this.onTouchStart = this.handleTouchStart.bind(this);
    this.onTouchMove = this.handleTouchMove.bind(this);
    this.onTouchEnd = this.handleTouchEnd.bind(this);

    this.attach();
  }

  attach() {
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    window.addEventListener('keyup', this.onKeyUp, { passive: true });

    if (this.domElement) {
      this.domElement.addEventListener('touchstart', this.onTouchStart, { passive: false });
      this.domElement.addEventListener('touchmove', this.onTouchMove, { passive: false });
      this.domElement.addEventListener('touchend', this.onTouchEnd, { passive: false });
      this.domElement.addEventListener('touchcancel', this.onTouchEnd, { passive: false });
    }
  }

  detach() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);

    if (this.domElement) {
      this.domElement.removeEventListener('touchstart', this.onTouchStart);
      this.domElement.removeEventListener('touchmove', this.onTouchMove);
      this.domElement.removeEventListener('touchend', this.onTouchEnd);
      this.domElement.removeEventListener('touchcancel', this.onTouchEnd);
    }
  }

  on(event, cb) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(cb);
    }
    return () => {
      this.callbacks[event] = this.callbacks[event].filter(fn => fn !== cb);
    };
  }

  emit(event, ...args) {
    if (this.callbacks[event]) {
      for (const cb of this.callbacks[event]) {
        cb(...args);
      }
    }
  }

  handleKeyDown(e) {
    // Ignore when typing into an input field or textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    this.keysDown.add(e.code);

    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        e.preventDefault();
        this.emit('moveLeft');
        break;

      case 'ArrowRight':
      case 'KeyD':
        e.preventDefault();
        this.emit('moveRight');
        break;

      case 'ArrowUp':
      case 'KeyW':
      case 'Space':
        e.preventDefault();
        this.emit('jump');
        break;

      case 'ArrowDown':
      case 'KeyS':
        e.preventDefault();
        this.emit('slide');
        break;

      case 'ShiftLeft':
      case 'ShiftRight':
        e.preventDefault();
        this.emit('boost', true);
        break;

      case 'Escape':
      case 'KeyP':
        e.preventDefault();
        this.emit('pause');
        break;

      case 'KeyR':
        this.emit('restart');
        break;
    }
  }

  handleKeyUp(e) {
    this.keysDown.delete(e.code);
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      this.emit('boost', false);
    }
  }

  handleTouchStart(e) {
    // Check if target is a UI button; if so, let the UI button handle it
    if (e.target.closest('button') || e.target.closest('.interactive-ui')) {
      return;
    }

    if (e.touches.length > 0) {
      const touch = e.touches[0];
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      this.touchStartTime = performance.now();
      this.isSwiping = false;
      this.isTouching = true;
    }
  }

  handleTouchMove(e) {
    if (!this.isTouching || e.touches.length === 0) return;
    
    // Check if on UI element
    if (e.target.closest('button') || e.target.closest('.interactive-ui')) {
      return;
    }

    e.preventDefault(); // Prevent page scroll / refresh bounce
    const touch = e.touches[0];
    const dx = touch.clientX - this.touchStartX;
    const dy = touch.clientY - this.touchStartY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (!this.isSwiping && (absX > this.swipeThreshold || absY > this.swipeThreshold)) {
      this.isSwiping = true;

      if (absX > absY) {
        // Horizontal swipe
        if (dx > 0) {
          this.emit('moveRight');
        } else {
          this.emit('moveLeft');
        }
      } else {
        // Vertical swipe
        if (dy < 0) {
          this.emit('jump');
        } else {
          this.emit('slide');
        }
      }
    }
  }

  handleTouchEnd(e) {
    this.isTouching = false;
    this.isSwiping = false;
    this.emit('steer', 0);
  }

  triggerAction(action) {
    this.emit(action);
  }
}
