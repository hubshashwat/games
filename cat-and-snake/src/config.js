/**
 * Configuration & Constants for Cat and Snake: Endless Jungle Runner
 */

export const GAME_MODES = {
  explorer: {
    id: 'explorer',
    name: 'Explorer Mode',
    description: 'Relaxed pace, forgiving obstacles, snake keeps safe distance.',
    badge: '🌿 EASY',
    baseSpeed: 16,
    maxSpeed: 28,
    speedAccel: 0.08,
    snakeBaseDist: 7.5,
    snakeCatchDist: 1.2,
    snakeAggression: 0.7,
    obstacleDensity: 0.35,
    scoreMultiplier: 1.0,
  },
  predator: {
    id: 'predator',
    name: 'Predator Mode',
    description: 'Authentic wild chase! Fast pace, agile serpent, sharp reflexes.',
    badge: '🐆 NORMAL',
    baseSpeed: 22,
    maxSpeed: 38,
    speedAccel: 0.14,
    snakeBaseDist: 6.0,
    snakeCatchDist: 1.3,
    snakeAggression: 1.0,
    obstacleDensity: 0.55,
    scoreMultiplier: 1.5,
  },
  nightmare: {
    id: 'nightmare',
    name: 'Nightmare Serpent',
    description: 'Relentless giant predator breathing down your neck. High speed!',
    badge: '🐍 HARDCORE',
    baseSpeed: 28,
    maxSpeed: 48,
    speedAccel: 0.22,
    snakeBaseDist: 4.8,
    snakeCatchDist: 1.4,
    snakeAggression: 1.4,
    obstacleDensity: 0.75,
    scoreMultiplier: 2.5,
  }
};

export const CAT_SKINS = {
  leopard: {
    id: 'leopard',
    name: 'Jungle Leopard',
    description: 'Golden pelt with spotted jungle rosettes',
    primaryColor: 0xd49b42,
    spotColor: 0x2e1a0b,
    bellyColor: 0xf5eedc,
    eyeColor: 0x48e068,
    noseColor: 0xd97575,
    icon: '🐆'
  },
  panther: {
    id: 'panther',
    name: 'Midnight Panther',
    description: 'Sleek obsidian coat with piercing emerald eyes',
    primaryColor: 0x18181a,
    spotColor: 0x0c0c0e,
    bellyColor: 0x242428,
    eyeColor: 0x10f760,
    noseColor: 0x332a2e,
    icon: '🐈‍⬛'
  },
  tiger: {
    id: 'tiger',
    name: 'Bengal Tiger Cat',
    description: 'Fierce fiery orange with bold predatory stripes',
    primaryColor: 0xe07222,
    spotColor: 0x1f140d,
    bellyColor: 0xffeedb,
    eyeColor: 0xebb31e,
    noseColor: 0xd86262,
    icon: '🐅'
  },
  mystic: {
    id: 'mystic',
    name: 'Clouded Spirit',
    description: 'Silvery mist pelt with glowing turquoise eyes',
    primaryColor: 0x9fa8a3,
    spotColor: 0x3d4744,
    bellyColor: 0xe4ebe7,
    eyeColor: 0x00f0ff,
    noseColor: 0x6e6e80,
    icon: '❄️'
  }
};

export const CAMERA_VIEWS = {
  CINEMATIC: 'cinematic',
  CLOSE: 'close',
  BEHIND_SNAKE: 'behind_snake'
};

export const DIMENSIONS = {
  LANE_WIDTH: 2.2,
  NUM_LANES: 3, // -1 (Left), 0 (Center), 1 (Right)
  CHUNK_LENGTH: 60,
  VISIBLE_CHUNKS: 6,
  CAT_BOUNDS: { width: 0.7, height: 0.8, length: 1.2 },
  JUMP_HEIGHT: 2.6,
  JUMP_DURATION: 0.65,
  SLIDE_DURATION: 0.65,
  SLIDE_HEIGHT: 0.35,
};

export const POWERUPS = {
  SUN_BERRY: {
    type: 'sun_berry',
    name: 'Sun Berry',
    duration: 5.0,
    speedBoost: 1.45,
    invincible: true,
    scoreMultiplier: 2.0,
    color: 0xffaa00
  },
  STAR_ORCHID: {
    type: 'star_orchid',
    name: 'Star Orchid',
    duration: 8.0,
    speedBoost: 1.1,
    invincible: false,
    scoreMultiplier: 3.0,
    color: 0x00ffcc
  },
  RELIC: {
    type: 'relic',
    name: 'Golden Paw Relic',
    bonusPoints: 500,
    pushSnakeBack: 2.5,
    color: 0xffd700
  }
};
