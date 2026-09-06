import confetti from 'canvas-confetti';
import { DIFFICULTY_SETTINGS, BALL_PRESETS } from '../config.js';
import { ScoreStorage } from '../storage/ScoreStorage.js';
import { soundManager } from '../audio/SoundManager.js';

/**
 * UI Overlay Manager
 * Manages official score sheets, pin deck mini-HUD, modals, banners, and touch controls.
 */
export class UIOverlay {
  constructor(callbacks) {
    this.callbacks = callbacks; // { onDifficultyChange, onBallChange, onCameraToggle, onSoundToggle, onRestart, onStanceChange, onManualBowl }

    this.currentDifficulty = 'medium';
    this.currentBallId = 'cosmic';

    this.cacheDomElements();
    this.setupEventListeners();
    this.initScoreboard();
    this.renderPinHud([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  }

  cacheDomElements() {
    // Scoreboard
    this.scoreboardEl = document.getElementById('scoreboard-frames');
    this.currentScoreEl = document.getElementById('current-total-score');
    this.maxScoreEl = document.getElementById('max-possible-score');

    // Pin HUD
    this.pinHudEl = document.getElementById('pin-deck-hud');

    // Stats readout
    this.speedDisplayEl = document.getElementById('speed-display');
    this.spinDisplayEl = document.getElementById('spin-display');
    this.statusMessageEl = document.getElementById('status-message');
    this.announcementBannerEl = document.getElementById('announcement-banner');

    // Bottom controls
    this.positionSlider = document.getElementById('position-slider');
    this.spinSlider = document.getElementById('spin-slider');
    this.spinValueLabel = document.getElementById('spin-value-label');
    this.bowlBtn = document.getElementById('bowl-btn');

    // Header buttons
    this.diffBadgeBtn = document.getElementById('diff-badge-btn');
    this.soundBtn = document.getElementById('sound-btn');
    this.ballBtn = document.getElementById('ball-btn');
    this.statsBtn = document.getElementById('stats-btn');
    this.helpBtn = document.getElementById('help-btn');
    this.fullscreenBtn = document.getElementById('fullscreen-btn');

    // Modals
    this.diffModal = document.getElementById('diff-modal');
    this.ballModal = document.getElementById('ball-modal');
    this.statsModal = document.getElementById('stats-modal');
    this.helpModal = document.getElementById('help-modal');
    this.gameOverModal = document.getElementById('game-over-modal');
  }

  setupEventListeners() {
    // Sliders
    if (this.positionSlider) {
      this.positionSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value); // -1 to +1
        if (this.callbacks.onStanceChange) this.callbacks.onStanceChange(val);
      });
    }

    if (this.spinSlider) {
      this.spinSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10); // -350 to +350
        this.updateSpinLabel(val);
        if (this.callbacks.onSpinChange) this.callbacks.onSpinChange(val);
      });
    }

    if (this.bowlBtn) {
      this.bowlBtn.addEventListener('click', () => {
        if (this.callbacks.onManualBowl) this.callbacks.onManualBowl();
      });
    }

    // Header buttons
    this.diffBadgeBtn.addEventListener('click', () => this.openModal(this.diffModal));
    this.ballBtn.addEventListener('click', () => {
      this.renderBallSelectorList();
      this.openModal(this.ballModal);
    });
    this.statsBtn.addEventListener('click', () => {
      this.renderStatsView();
      this.openModal(this.statsModal);
    });
    this.helpBtn.addEventListener('click', () => this.openModal(this.helpModal));

    this.soundBtn.addEventListener('click', () => {
      if (this.callbacks.onSoundToggle) {
        const isMuted = this.callbacks.onSoundToggle();
        this.soundBtn.textContent = isMuted ? '🔇' : '🔊';
        this.soundBtn.setAttribute('aria-label', isMuted ? 'Unmute audio' : 'Mute audio');
      }
    });

    this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());

    // Modal close buttons
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        soundManager.playClick();
        const modal = e.target.closest('.modal');
        if (modal) this.closeModal(modal);
      });
    });

    // Modal background clicks
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal(modal);
      });
    });

    // Difficulty selection cards inside modal
    document.querySelectorAll('.diff-select-card').forEach(card => {
      card.addEventListener('click', () => {
        soundManager.playClick();
        const diff = card.dataset.diff;
        this.setDifficulty(diff);
        this.closeModal(this.diffModal);
        if (this.callbacks.onDifficultyChange) this.callbacks.onDifficultyChange(diff);
      });
    });

    // Game Over modal restart button
    const restartBtn = document.getElementById('game-over-restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        soundManager.playClick();
        this.closeModal(this.gameOverModal);
        if (this.callbacks.onRestart) this.callbacks.onRestart();
      });
    }

    // Reset stats button
    const clearStatsBtn = document.getElementById('clear-stats-btn');
    if (clearStatsBtn) {
      clearStatsBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all saved high scores and history?')) {
          ScoreStorage.resetStats();
          this.renderStatsView();
        }
      });
    }
  }

  toggleFullscreen() {
    soundManager.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      this.fullscreenBtn.textContent = '⤓';
    } else {
      document.exitFullscreen().catch(() => {});
      this.fullscreenBtn.textContent = '⛶';
    }
  }

  openModal(modal) {
    if (!modal) return;
    soundManager.playClick();
    modal.classList.add('active');
  }

  closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
  }

  updateSpinLabel(rpm) {
    if (rpm === 0) {
      this.spinValueLabel.textContent = '0 (Straight)';
    } else if (rpm > 0) {
      this.spinValueLabel.textContent = `+${rpm} (Hook Right)`;
    } else {
      this.spinValueLabel.textContent = `${rpm} (Hook Left)`;
    }
  }

  resetControls() {
    if (this.positionSlider) this.positionSlider.value = '0';
    if (this.spinSlider) this.spinSlider.value = '0';
    this.updateSpinLabel(0);
  }

  setDifficulty(diff) {
    this.currentDifficulty = diff;
    const cfg = DIFFICULTY_SETTINGS[diff];
    this.diffBadgeBtn.textContent = `LVL: ${cfg.name.toUpperCase()}`;
    this.diffBadgeBtn.className = `badge badge-${diff}`;

    document.querySelectorAll('.diff-select-card').forEach(card => {
      card.classList.toggle('active', card.dataset.diff === diff);
    });

    if (this.maxScoreEl) {
      this.maxScoreEl.textContent = `${ScoreStorage.getHighScore(diff)}`;
    }
  }

  initScoreboard() {
    this.scoreboardEl.innerHTML = '';
    if (this.maxScoreEl) {
      this.maxScoreEl.textContent = `${ScoreStorage.getHighScore(this.currentDifficulty)}`;
    }

    for (let f = 1; f <= 10; f++) {
      const frameDiv = document.createElement('div');
      frameDiv.className = `score-frame frame-${f}`;
      frameDiv.id = `score-frame-${f}`;

      const header = document.createElement('div');
      header.className = 'frame-number';
      header.textContent = `${f}`;

      const rollsContainer = document.createElement('div');
      rollsContainer.className = 'rolls-container';

      if (f < 10) {
        rollsContainer.innerHTML = `
          <div class="roll-box roll-1" id="roll-${f}-1">&nbsp;</div>
          <div class="roll-box roll-2" id="roll-${f}-2">&nbsp;</div>
        `;
      } else {
        // 10th frame has 3 potential roll boxes
        rollsContainer.innerHTML = `
          <div class="roll-box roll-1" id="roll-10-1">&nbsp;</div>
          <div class="roll-box roll-2" id="roll-10-2">&nbsp;</div>
          <div class="roll-box roll-3" id="roll-10-3">&nbsp;</div>
        `;
      }

      const totalBox = document.createElement('div');
      totalBox.className = 'frame-total';
      totalBox.id = `frame-total-${f}`;
      totalBox.textContent = '-';

      frameDiv.appendChild(header);
      frameDiv.appendChild(rollsContainer);
      frameDiv.appendChild(totalBox);

      this.scoreboardEl.appendChild(frameDiv);
    }
  }

  updateScoreboard(bowlingRules) {
    const frames = bowlingRules.frames;
    const currentFrameIdx = bowlingRules.currentFrameIndex;
    const currentRollIdx = bowlingRules.currentRollIndex;

    for (let f = 0; f < 10; f++) {
      const frame = frames[f];
      const frameNum = f + 1;
      const frameDiv = document.getElementById(`score-frame-${frameNum}`);

      if (frameDiv) {
        const isActive = f === currentFrameIdx && !bowlingRules.isGameOver;
        frameDiv.classList.toggle('active-frame', isActive);
        if (isActive && this.scoreboardEl) {
          frameDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }

      if (f < 9) {
        const roll1El = document.getElementById(`roll-${frameNum}-1`);
        const roll2El = document.getElementById(`roll-${frameNum}-2`);

        if (frame.rolls.length > 0) {
          const r1 = frame.rolls[0];
          if (frame.isStrike) {
            roll1El.innerHTML = '&nbsp;';
            roll2El.innerHTML = '<span class="strike-mark">X</span>';
          } else {
            roll1El.textContent = r1 === 0 ? '-' : `${r1}`;
            if (frame.isSplit) roll1El.classList.add('split-mark');

            if (frame.rolls.length > 1) {
              const r2 = frame.rolls[1];
              if (frame.isSpare) {
                roll2El.innerHTML = '<span class="spare-mark">/</span>';
              } else {
                roll2El.textContent = r2 === 0 ? '-' : `${r2}`;
              }
            } else {
              roll2El.innerHTML = '&nbsp;';
            }
          }
        } else {
          roll1El.innerHTML = '&nbsp;';
          roll2El.innerHTML = '&nbsp;';
        }
      } else {
        // Frame 10
        const r1El = document.getElementById('roll-10-1');
        const r2El = document.getElementById('roll-10-2');
        const r3El = document.getElementById('roll-10-3');

        // Roll 1
        if (frame.rolls.length > 0) {
          r1El.innerHTML = frame.rolls[0] === 10 ? '<span class="strike-mark">X</span>' : (frame.rolls[0] === 0 ? '-' : `${frame.rolls[0]}`);
          if (frame.isSplit) r1El.classList.add('split-mark');
        } else {
          r1El.innerHTML = '&nbsp;';
        }

        // Roll 2
        if (frame.rolls.length > 1) {
          const r1 = frame.rolls[0];
          const r2 = frame.rolls[1];
          if (r1 === 10 && r2 === 10) {
            r2El.innerHTML = '<span class="strike-mark">X</span>';
          } else if (r1 !== 10 && r1 + r2 === 10) {
            r2El.innerHTML = '<span class="spare-mark">/</span>';
          } else {
            r2El.textContent = r2 === 0 ? '-' : `${r2}`;
          }
        } else {
          r2El.innerHTML = '&nbsp;';
        }

        // Roll 3
        if (frame.rolls.length > 2) {
          const r2 = frame.rolls[1];
          const r3 = frame.rolls[2];
          if (r3 === 10) {
            r3El.innerHTML = '<span class="strike-mark">X</span>';
          } else if (r2 !== 10 && r2 + r3 === 10) {
            r3El.innerHTML = '<span class="spare-mark">/</span>';
          } else {
            r3El.textContent = r3 === 0 ? '-' : `${r3}`;
          }
        } else {
          r3El.innerHTML = '&nbsp;';
        }
      }

      // Frame cumulative total
      const totalEl = document.getElementById(`frame-total-${frameNum}`);
      if (totalEl) {
        totalEl.textContent = frame.score !== null ? `${frame.score}` : '';
      }
    }

    const finalScore = bowlingRules.getFinalScore();
    this.currentScoreEl.textContent = `${finalScore}`;
    const savedHigh = ScoreStorage.getHighScore(this.currentDifficulty);
    const displayBest = Math.max(savedHigh, finalScore);
    this.maxScoreEl.textContent = `${displayBest}`;
  }

  /**
   * Renders the miniature overhead 10-pin triangle HUD
   */
  renderPinHud(standingPinIds = []) {
    const standingSet = new Set(standingPinIds);

    // 10 pins layout:
    // Row 4: 7, 8, 9, 10
    // Row 3: 4, 5, 6
    // Row 2: 2, 3
    // Row 1: 1
    const pins = [
      { id: 7, row: 4, col: 1 }, { id: 8, row: 4, col: 2 }, { id: 9, row: 4, col: 3 }, { id: 10, row: 4, col: 4 },
      { id: 4, row: 3, col: 1.5 }, { id: 5, row: 3, col: 2.5 }, { id: 6, row: 3, col: 3.5 },
      { id: 2, row: 2, col: 2 }, { id: 3, row: 2, col: 3 },
      { id: 1, row: 1, col: 2.5 }
    ];

    let html = '';
    pins.forEach(p => {
      const isStanding = standingSet.has(p.id);
      const cls = isStanding ? 'pin-dot standing' : 'pin-dot knocked-down';
      html += `<div class="${cls}" data-pin="${p.id}" style="grid-row: ${5 - p.row}; grid-column: ${Math.round(p.col * 2)};">${p.id}</div>`;
    });

    this.pinHudEl.innerHTML = html;
  }

  setStatus(text) {
    this.statusMessageEl.textContent = text;
  }

  showSpeedAndSpin(speedMps, spinRpm) {
    const mph = (speedMps * 2.23694).toFixed(1);
    this.speedDisplayEl.textContent = `${mph} MPH`;
    this.spinDisplayEl.textContent = `${Math.abs(spinRpm)} RPM`;
  }

  /**
   * Displays celebratory animated banner (Strike, Spare, Split, etc.)
   */
  showAnnouncement(type, text) {
    this.announcementBannerEl.className = `announcement-banner banner-${type} active`;
    this.announcementBannerEl.textContent = text;

    if (type === 'strike') {
      soundManager.playStrikeFanfare();
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#ffd166', '#ef476f', '#06d6a0', '#118ab2', '#ffffff']
      });
    } else if (type === 'spare') {
      soundManager.playSpareJingle();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#00f0ff', '#ffd166', '#ffffff']
      });
    }

    setTimeout(() => {
      this.announcementBannerEl.classList.remove('active');
    }, 2400);
  }

  renderBallSelectorList() {
    const listEl = document.getElementById('ball-list-container');
    if (!listEl) return;

    listEl.innerHTML = '';
    BALL_PRESETS.forEach(preset => {
      const card = document.createElement('div');
      card.className = `ball-card ${preset.id === this.currentBallId ? 'active' : ''}`;
      card.innerHTML = `
        <div class="ball-preview" style="background: radial-gradient(circle at 35% 35%, ${preset.primaryColor}, ${preset.secondaryColor} 60%, ${preset.swirlColor});"></div>
        <div class="ball-info">
          <div class="ball-name">${preset.name}</div>
          <div class="ball-specs">Weight: ${preset.weight} lbs • Hook: ${preset.hookRating}</div>
        </div>
      `;

      card.addEventListener('click', () => {
        soundManager.playClick();
        this.currentBallId = preset.id;
        ScoreStorage.saveSettings({ ballId: preset.id });
        if (this.callbacks.onBallChange) this.callbacks.onBallChange(preset);
        this.closeModal(this.ballModal);
      });

      listEl.appendChild(card);
    });
  }

  renderStatsView() {
    const stats = ScoreStorage.loadStats();

    document.getElementById('stat-high-easy').textContent = stats.highScores.easy || 0;
    document.getElementById('stat-high-medium').textContent = stats.highScores.medium || 0;
    document.getElementById('stat-high-hard').textContent = stats.highScores.hard || 0;

    document.getElementById('stat-games-played').textContent = stats.gamesPlayed || 0;
    document.getElementById('stat-best-overall').textContent = stats.bestScoreOverall || 0;
    document.getElementById('stat-total-strikes').textContent = stats.totalStrikes || 0;
    document.getElementById('stat-total-spares').textContent = stats.totalSpares || 0;

    const avg = stats.gamesPlayed > 0 ? Math.round(stats.totalScore / stats.gamesPlayed) : 0;
    document.getElementById('stat-average').textContent = avg;

    // Recent Match History List
    const historyList = document.getElementById('match-history-list');
    if (historyList) {
      if (!stats.history || stats.history.length === 0) {
        historyList.innerHTML = '<div class="no-history">No games recorded yet. Finish a 10-frame game to see your stats!</div>';
      } else {
        let historyHtml = '<div class="history-table-header"><span>Date</span><span>Level</span><span>Score</span><span>Strikes/Spares</span></div>';
        stats.history.forEach(item => {
          historyHtml += `
            <div class="history-row">
              <span>${item.date}</span>
              <span class="diff-tag diff-${item.difficulty}">${item.difficulty.toUpperCase()}</span>
              <span class="history-score">${item.score}</span>
              <span>${item.strikes} ✕ / ${item.spares} /</span>
            </div>
          `;
        });
        historyList.innerHTML = historyHtml;
      }
    }
  }

  showGameOver(resultData) {
    const { finalScore, difficulty, strikes, spares, isNewHighScore, diffHighScore, bestOverall } = resultData;

    document.getElementById('game-over-final-score').textContent = `${finalScore}`;
    document.getElementById('game-over-level').textContent = difficulty.toUpperCase();
    document.getElementById('game-over-strikes').textContent = `${strikes}`;
    document.getElementById('game-over-spares').textContent = `${spares}`;
    document.getElementById('game-over-high').textContent = `${diffHighScore}`;

    const newRecordBanner = document.getElementById('new-record-banner');
    if (newRecordBanner) {
      newRecordBanner.style.display = isNewHighScore ? 'block' : 'none';
    }

    if (isNewHighScore || finalScore >= 200) {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 }
      });
    }

    this.openModal(this.gameOverModal);
  }
}
