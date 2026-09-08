/**
 * UI Manager for Cat and Snake
 * Coordinates HUD, Danger Radar, Start Menu, Pause Menu, Game Over Modal, and Touch Controls.
 */

import confetti from 'canvas-confetti';
import { GAME_MODES, CAT_SKINS, CAMERA_VIEWS } from '../config.js';

export class UIManager {
  constructor(rootContainer) {
    this.root = rootContainer;
    
    // Callbacks
    this.onStartGame = null;
    this.onResumeGame = null;
    this.onRestartGame = null;
    this.onToggleAudio = null;
    this.onToggleCamera = null;
    this.onChangeQuality = null;
    this.onSelectMode = null;
    this.onSelectSkin = null;

    // Action button triggers (for InputManager integration)
    this.onTriggerJump = null;
    this.onTriggerSlide = null;
    this.onTriggerBoost = null;

    // State
    this.currentModeKey = 'predator';
    this.currentSkinKey = 'leopard';
    this.currentCameraView = CAMERA_VIEWS.CINEMATIC;
    this.currentQuality = 'high';
    this.isMuted = false;

    this.initDOM();
  }

  initDOM() {
    this.root.innerHTML = `
      <div id="danger-vignette"></div>

      <!-- In-Game HUD -->
      <div id="hud-overlay" style="display: none;">
        <div class="hud-top-bar">
          <!-- Distance & Score -->
          <div class="hud-score-card">
            <div class="hud-distance-label">Distance Ran</div>
            <div class="hud-distance-value"><span id="hud-meters">0</span><span class="hud-meters-unit">m</span></div>
            <div class="hud-score-secondary">Score: <span id="hud-score">0</span> • High: <span id="hud-highscore">0</span></div>
          </div>

          <!-- Snake Proximity Radar -->
          <div class="hud-danger-radar">
            <div class="radar-header">
              <span class="radar-icon">🐍</span>
              <span id="radar-status-text" class="radar-status-text" style="color: var(--neon-emerald);">SERPENT: SAFE</span>
            </div>
            <div class="radar-bar-track">
              <div id="radar-bar-fill" class="radar-bar-fill" style="width: 25%;"></div>
            </div>
          </div>

          <!-- Top-Right Actions -->
          <div class="hud-actions">
            <button id="btn-camera-toggle" class="hud-icon-btn" aria-label="Toggle Camera View" title="Change Camera View">🎥</button>
            <button id="btn-audio-toggle" class="hud-icon-btn" aria-label="Toggle Sound" title="Sound Mute/Unmute">🔊</button>
            <button id="btn-pause" class="hud-icon-btn" aria-label="Pause Game" title="Pause Game">⏸️</button>
          </div>
        </div>

        <!-- Active Powerup Banner -->
        <div id="hud-powerup" class="hud-powerup-pill">
          <span id="powerup-icon">⚡</span>
          <span id="powerup-text">SUN BERRY BOOST</span>
        </div>

        <!-- Bottom Touch Buttons (Accessible on mobile/tablet) -->
        <div class="hud-bottom-controls">
          <div class="touch-btn-group">
            <button id="touch-slide-btn" class="touch-action-btn btn-slide" aria-label="Slide / Duck">
              <span class="btn-icon">🔻</span>
              <span>SLIDE</span>
            </button>
          </div>

          <div class="touch-btn-group">
            <button id="touch-boost-btn" class="touch-action-btn btn-boost" aria-label="Speed Boost">
              <span class="btn-icon">⚡</span>
              <span>SPRINT</span>
            </button>
            <button id="touch-jump-btn" class="touch-action-btn btn-jump" aria-label="Jump / Leap">
              <span class="btn-icon">🔺</span>
              <span>JUMP</span>
            </button>
          </div>
        </div>
      </div>

      <!-- START MENU MODAL -->
      <div id="modal-start" class="modal-backdrop modal-visible">
        <div class="modal-dialog">
          <div class="brand-badge">Endless Jungle Chase</div>
          <h1 class="modal-title">CAT & SNAKE</h1>
          <p class="modal-subtitle">Run for your life through the endless rainforest. Keep running, don't look back!</p>

          <!-- Mode Selector -->
          <div class="selection-section">
            <span class="section-label">Select Difficulty</span>
            <div class="options-grid" id="mode-grid">
              ${Object.values(GAME_MODES).map(mode => `
                <div class="option-card ${mode.id === this.currentModeKey ? 'selected' : ''}" data-mode="${mode.id}">
                  <div class="option-title">${mode.badge}</div>
                  <div class="option-desc">${mode.name}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Skin Selector -->
          <div class="selection-section">
            <span class="section-label">Choose Your Feline Pelt</span>
            <div class="options-grid" id="skin-grid">
              ${Object.values(CAT_SKINS).map(skin => `
                <div class="option-card ${skin.id === this.currentSkinKey ? 'selected' : ''}" data-skin="${skin.id}">
                  <div class="option-icon">${skin.icon}</div>
                  <div class="option-title">${skin.name}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Controls Guide -->
          <div class="controls-guide">
            <div class="control-item">
              <span class="control-key">A / D or Swipe</span>
              <span class="control-desc">Dodge Lanes</span>
            </div>
            <div class="control-item">
              <span class="control-key">W / Space / Up</span>
              <span class="control-desc">Leap Over Logs</span>
            </div>
            <div class="control-item">
              <span class="control-key">S / Down</span>
              <span class="control-desc">Slide Under Vines</span>
            </div>
          </div>

          <button id="btn-start-run" class="btn-primary">START RUN &nbsp;→</button>
        </div>
      </div>

      <!-- PAUSE MODAL -->
      <div id="modal-pause" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="brand-badge">Game Paused</div>
          <h2 class="modal-title" style="font-size: 2rem;">TAKE A BREATH</h2>
          <p class="modal-subtitle">The serpent waits in the shadows...</p>

          <div class="selection-section">
            <div class="setting-row">
              <span class="setting-title">Audio FX & Music</span>
              <button id="setting-audio-toggle" class="setting-btn active">Sound ON</button>
            </div>
            <div class="setting-row">
              <span class="setting-title">Camera Perspective</span>
              <div class="setting-btn-group" id="camera-settings-group">
                <button class="setting-btn active" data-view="cinematic">Cinematic</button>
                <button class="setting-btn" data-view="close">Close</button>
                <button class="setting-btn" data-view="behind_snake">Serpent Cam</button>
              </div>
            </div>
            <div class="setting-row">
              <span class="setting-title">Graphics Quality</span>
              <div class="setting-btn-group" id="quality-settings-group">
                <button class="setting-btn active" data-quality="high">Ultra</button>
                <button class="setting-btn" data-quality="medium">Medium</button>
                <button class="setting-btn" data-quality="low">Low</button>
              </div>
            </div>
          </div>

          <button id="btn-resume-run" class="btn-primary">RESUME RUN</button>
          <button id="btn-pause-restart" class="btn-secondary">RESTART RUN</button>
        </div>
      </div>

      <!-- GAME OVER MODAL -->
      <div id="modal-gameover" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="brand-badge" style="color: var(--danger-red); border-color: var(--danger-red); background: rgba(255, 51, 75, 0.12);">
            Caught by the Serpent!
          </div>
          <h2 class="modal-title" style="background: linear-gradient(135deg, #ffffff, #ff334b); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
            RUN TERMINATED
          </h2>
          <p id="gameover-quote" class="modal-subtitle">The venomous coils were swifter this time...</p>

          <!-- Score Table -->
          <div class="gameover-stats-grid">
            <div class="stat-box">
              <div class="stat-label">Distance Ran</div>
              <div id="stat-gameover-dist" class="stat-value">0 m</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Total Score</div>
              <div id="stat-gameover-score" class="stat-value highlight">0</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">High Score</div>
              <div id="stat-gameover-high" class="stat-value">0</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Berries Eaten</div>
              <div id="stat-gameover-berries" class="stat-value">0</div>
            </div>
          </div>

          <button id="btn-gameover-restart" class="btn-primary">RUN AGAIN &nbsp;↺</button>
          <button id="btn-gameover-menu" class="btn-secondary">CHANGE MODE / SKIN</button>
        </div>
      </div>
    `;

    this.cacheElements();
    this.bindEvents();
  }

  cacheElements() {
    this.hud = document.getElementById('hud-overlay');
    this.vignette = document.getElementById('danger-vignette');
    this.metersEl = document.getElementById('hud-meters');
    this.scoreEl = document.getElementById('hud-score');
    this.highScoreEl = document.getElementById('hud-highscore');
    this.radarFill = document.getElementById('radar-bar-fill');
    this.radarText = document.getElementById('radar-status-text');
    this.powerupPill = document.getElementById('hud-powerup');
    this.powerupIcon = document.getElementById('powerup-icon');
    this.powerupText = document.getElementById('powerup-text');

    this.modalStart = document.getElementById('modal-start');
    this.modalPause = document.getElementById('modal-pause');
    this.modalGameOver = document.getElementById('modal-gameover');

    this.statDist = document.getElementById('stat-gameover-dist');
    this.statScore = document.getElementById('stat-gameover-score');
    this.statHigh = document.getElementById('stat-gameover-high');
    this.statBerries = document.getElementById('stat-gameover-berries');
  }

  bindEvents() {
    // Mode selection
    const modeCards = document.querySelectorAll('#mode-grid .option-card');
    modeCards.forEach(card => {
      card.addEventListener('click', () => {
        modeCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.currentModeKey = card.dataset.mode;
        if (this.onSelectMode) this.onSelectMode(this.currentModeKey);
      });
    });

    // Skin selection
    const skinCards = document.querySelectorAll('#skin-grid .option-card');
    skinCards.forEach(card => {
      card.addEventListener('click', () => {
        skinCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.currentSkinKey = card.dataset.skin;
        if (this.onSelectSkin) this.onSelectSkin(this.currentSkinKey);
      });
    });

    // Start Button
    document.getElementById('btn-start-run').addEventListener('click', () => {
      this.modalStart.classList.remove('modal-visible');
      this.hud.style.display = 'flex';
      if (this.onStartGame) this.onStartGame(this.currentModeKey, this.currentSkinKey);
    });

    // Pause Buttons
    document.getElementById('btn-pause').addEventListener('click', () => {
      this.showPauseModal();
      if (this.onPauseGame) this.onPauseGame();
    });

    document.getElementById('btn-resume-run').addEventListener('click', () => {
      this.hidePauseModal();
      if (this.onResumeGame) this.onResumeGame();
    });

    document.getElementById('btn-pause-restart').addEventListener('click', () => {
      this.hidePauseModal();
      if (this.onRestartGame) this.onRestartGame();
    });

    // Game Over Buttons
    document.getElementById('btn-gameover-restart').addEventListener('click', () => {
      this.modalGameOver.classList.remove('modal-visible');
      if (this.onRestartGame) this.onRestartGame();
    });

    document.getElementById('btn-gameover-menu').addEventListener('click', () => {
      this.modalGameOver.classList.remove('modal-visible');
      this.hud.style.display = 'none';
      this.modalStart.classList.add('modal-visible');
    });

    // Audio Toggles
    const toggleAudioHandler = () => {
      if (this.onToggleAudio) {
        this.isMuted = this.onToggleAudio();
        const btn = document.getElementById('btn-audio-toggle');
        const settingBtn = document.getElementById('setting-audio-toggle');
        if (this.isMuted) {
          btn.textContent = '🔇';
          settingBtn.textContent = 'Sound OFF';
          settingBtn.classList.remove('active');
        } else {
          btn.textContent = '🔊';
          settingBtn.textContent = 'Sound ON';
          settingBtn.classList.add('active');
        }
      }
    };
    document.getElementById('btn-audio-toggle').addEventListener('click', toggleAudioHandler);
    document.getElementById('setting-audio-toggle').addEventListener('click', toggleAudioHandler);

    // Camera Toggle
    document.getElementById('btn-camera-toggle').addEventListener('click', () => {
      const views = [CAMERA_VIEWS.CINEMATIC, CAMERA_VIEWS.CLOSE, CAMERA_VIEWS.BEHIND_SNAKE];
      const nextIdx = (views.indexOf(this.currentCameraView) + 1) % views.length;
      this.currentCameraView = views[nextIdx];
      if (this.onToggleCamera) this.onToggleCamera(this.currentCameraView);
    });

    // Camera Setting buttons in Pause
    const camBtns = document.querySelectorAll('#camera-settings-group .setting-btn');
    camBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        camBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentCameraView = btn.dataset.view;
        if (this.onToggleCamera) this.onToggleCamera(this.currentCameraView);
      });
    });

    // Quality Setting buttons in Pause
    const qualBtns = document.querySelectorAll('#quality-settings-group .setting-btn');
    qualBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        qualBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentQuality = btn.dataset.quality;
        if (this.onChangeQuality) this.onChangeQuality(this.currentQuality);
      });
    });

    // Touch Action Buttons
    const jumpBtn = document.getElementById('touch-jump-btn');
    const slideBtn = document.getElementById('touch-slide-btn');
    const boostBtn = document.getElementById('touch-boost-btn');

    jumpBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.onTriggerJump) this.onTriggerJump();
    });
    jumpBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.onTriggerJump) this.onTriggerJump();
    });

    slideBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.onTriggerSlide) this.onTriggerSlide();
    });
    slideBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.onTriggerSlide) this.onTriggerSlide();
    });

    boostBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.onTriggerBoost) this.onTriggerBoost(true);
    });
    boostBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (this.onTriggerBoost) this.onTriggerBoost(false);
    });
    boostBtn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      if (this.onTriggerBoost) this.onTriggerBoost(true);
    });
    boostBtn.addEventListener('mouseup', (e) => {
      e.preventDefault();
      if (this.onTriggerBoost) this.onTriggerBoost(false);
    });
  }

  updateHUD(distanceMeters, score, highScore, snakeDist) {
    this.metersEl.textContent = Math.floor(distanceMeters).toLocaleString();
    this.scoreEl.textContent = Math.floor(score).toLocaleString();
    this.highScoreEl.textContent = Math.floor(highScore).toLocaleString();

    // Snake proximity radar
    // Safe: > 7m (Fill 15-30%, green)
    // Caution: 4m - 7m (Fill 35-70%, yellow)
    // Danger: < 4m (Fill 75-100%, red pulsing)
    const maxSafeDist = 11.0;
    const proximityRatio = Math.max(0, Math.min(1.0, 1.0 - (snakeDist / maxSafeDist)));
    const fillPercent = Math.max(10, Math.min(100, Math.round(proximityRatio * 100)));
    this.radarFill.style.width = `${fillPercent}%`;

    if (snakeDist < 3.8) {
      this.radarFill.className = 'radar-bar-fill danger';
      this.radarText.textContent = `SERPENT: ${snakeDist.toFixed(1)}m (LUNGE!)`;
      this.radarText.style.color = 'var(--danger-red)';
      this.vignette.classList.add('danger-active');
    } else if (snakeDist < 6.5) {
      this.radarFill.className = 'radar-bar-fill caution';
      this.radarText.textContent = `SERPENT: ${snakeDist.toFixed(1)}m (CLOSE)`;
      this.radarText.style.color = 'var(--neon-gold)';
      this.vignette.classList.remove('danger-active');
    } else {
      this.radarFill.className = 'radar-bar-fill';
      this.radarText.textContent = `SERPENT: ${snakeDist.toFixed(1)}m (SAFE)`;
      this.radarText.style.color = 'var(--neon-emerald)';
      this.vignette.classList.remove('danger-active');
    }
  }

  showPowerup(name, icon = '⚡') {
    this.powerupIcon.textContent = icon;
    this.powerupText.textContent = name;
    this.powerupPill.classList.add('active');
  }

  hidePowerup() {
    this.powerupPill.classList.remove('active');
  }

  showPauseModal() {
    this.modalPause.classList.add('modal-visible');
  }

  hidePauseModal() {
    this.modalPause.classList.remove('modal-visible');
  }

  showGameOver(dist, score, high, berries, isNewRecord = false) {
    this.statDist.textContent = `${Math.floor(dist).toLocaleString()} m`;
    this.statScore.textContent = Math.floor(score).toLocaleString();
    this.statHigh.innerHTML = `${Math.floor(high).toLocaleString()}${isNewRecord ? ' <span class="new-record-tag">NEW BEST!</span>' : ''}`;
    this.statBerries.textContent = berries.toString();

    this.vignette.classList.remove('danger-active');
    this.modalGameOver.classList.add('modal-visible');

    if (isNewRecord && score > 200) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#48ff85', '#ffc83b', '#00f0ff']
      });
    }
  }
}
