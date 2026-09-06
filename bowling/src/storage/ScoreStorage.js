/**
 * Score & Settings Storage
 * Uses localStorage with automatic cookie fallback.
 */

const STORAGE_KEY = 'hubshashwat_bowling_stats_v1';
const SETTINGS_KEY = 'hubshashwat_bowling_settings_v1';
const LEGACY_STORAGE_KEY = 'threejs_bowling_stats_v1';
const LEGACY_SETTINGS_KEY = 'threejs_bowling_settings_v1';

function isLocalStorageAvailable() {
  try {
    const testKey = '__test__storage__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

const hasLocalStorage = isLocalStorageAvailable();

function setCookie(name, value, days = 365) {
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(JSON.stringify(value))}; expires=${expires}; path=/; SameSite=Lax`;
  } catch (e) {
    console.warn('Could not write cookie:', e);
  }
}

function getCookie(name) {
  try {
    const nameEQ = encodeURIComponent(name) + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        return JSON.parse(decodeURIComponent(c.substring(nameEQ.length, c.length)));
      }
    }
  } catch (e) {
    console.warn('Could not read cookie:', e);
  }
  return null;
}

const DEFAULT_STATS = {
  highScores: {
    easy: 0,
    medium: 0,
    hard: 0
  },
  gamesPlayed: 0,
  totalScore: 0,
  bestScoreOverall: 0,
  totalStrikes: 0,
  totalSpares: 0,
  totalGutters: 0,
  history: [] // Last 15 games
};

const DEFAULT_SETTINGS = {
  difficulty: 'medium',
  ballId: 'cosmic',
  muted: false,
  volume: 0.8,
  cameraMode: 'follow', // 'follow', 'aim', 'pin', 'overhead'
  bumpersEnabled: false // user override
};

export class ScoreStorage {
  static loadStats() {
    try {
      if (hasLocalStorage) {
        let data = window.localStorage.getItem(STORAGE_KEY);
        if (!data) data = window.localStorage.getItem(LEGACY_STORAGE_KEY);
        if (data) return { ...DEFAULT_STATS, ...JSON.parse(data) };
      } else {
        const cookieData = getCookie(STORAGE_KEY) || getCookie(LEGACY_STORAGE_KEY);
        if (cookieData) return { ...DEFAULT_STATS, ...cookieData };
      }
    } catch (e) {
      console.warn('Failed to load stats:', e);
    }
    return { ...DEFAULT_STATS };
  }

  static saveStats(stats) {
    try {
      const serialized = JSON.stringify(stats);
      if (hasLocalStorage) {
        window.localStorage.setItem(STORAGE_KEY, serialized);
      }
      // Always sync to cookie as backup
      setCookie(STORAGE_KEY, stats, 365);
    } catch (e) {
      console.warn('Failed to save stats:', e);
    }
  }

  static recordGame({ score, difficulty, strikes, spares, gutters }) {
    const stats = this.loadStats();
    stats.gamesPlayed += 1;
    stats.totalScore += score;
    stats.totalStrikes += strikes;
    stats.totalSpares += spares;
    stats.totalGutters += (gutters || 0);

    if (score > stats.bestScoreOverall) {
      stats.bestScoreOverall = score;
    }

    const currentDiffHigh = stats.highScores[difficulty] || 0;
    const isNewHighScore = score > currentDiffHigh;
    if (isNewHighScore) {
      stats.highScores[difficulty] = score;
    }

    // Record in history log
    stats.history.unshift({
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      difficulty,
      score,
      strikes,
      spares
    });

    if (stats.history.length > 15) {
      stats.history.length = 15;
    }

    this.saveStats(stats);
    return {
      isNewHighScore,
      difficultyHighScore: stats.highScores[difficulty],
      overallBest: stats.bestScoreOverall,
      averageScore: Math.round(stats.totalScore / stats.gamesPlayed)
    };
  }

  static getHighScore(difficulty) {
    const stats = this.loadStats();
    return stats.highScores[difficulty] || 0;
  }

  static loadSettings() {
    try {
      if (hasLocalStorage) {
        let data = window.localStorage.getItem(SETTINGS_KEY);
        if (!data) data = window.localStorage.getItem(LEGACY_SETTINGS_KEY);
        if (data) return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      } else {
        const cookieData = getCookie(SETTINGS_KEY) || getCookie(LEGACY_SETTINGS_KEY);
        if (cookieData) return { ...DEFAULT_SETTINGS, ...cookieData };
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
    return { ...DEFAULT_SETTINGS };
  }

  static saveSettings(settings) {
    try {
      const merged = { ...this.loadSettings(), ...settings };
      const serialized = JSON.stringify(merged);
      if (hasLocalStorage) {
        window.localStorage.setItem(SETTINGS_KEY, serialized);
      }
      setCookie(SETTINGS_KEY, merged, 365);
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }

  static resetStats() {
    this.saveStats({ ...DEFAULT_STATS });
  }
}
