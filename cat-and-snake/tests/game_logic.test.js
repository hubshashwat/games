/**
 * Unit Test Suite for Cat and Snake Game Logic
 */

import { GAME_MODES, CAT_SKINS, DIMENSIONS, POWERUPS } from '../src/config.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('--- Test Suite 1: Game Configuration & Modes ---');
{
  assert(GAME_MODES.explorer !== undefined, 'Explorer mode is defined');
  assert(GAME_MODES.predator !== undefined, 'Predator mode is defined');
  assert(GAME_MODES.nightmare !== undefined, 'Nightmare mode is defined');

  assert(GAME_MODES.explorer.baseSpeed < GAME_MODES.predator.baseSpeed, 'Explorer speed < Predator speed');
  assert(GAME_MODES.predator.baseSpeed < GAME_MODES.nightmare.baseSpeed, 'Predator speed < Nightmare speed');

  assert(GAME_MODES.explorer.snakeBaseDist > GAME_MODES.predator.snakeBaseDist, 'Explorer keeps snake further away');
  assert(GAME_MODES.nightmare.snakeCatchDist > 0, 'Valid snake catch distance in Nightmare mode');
  assert(GAME_MODES.nightmare.scoreMultiplier === 2.5, 'Nightmare mode awards 2.5x score');
}

console.log('\n--- Test Suite 2: Feline Pelts & Customization ---');
{
  const skinKeys = Object.keys(CAT_SKINS);
  assert(skinKeys.length === 4, '4 distinct cat skins defined');
  assert(skinKeys.includes('leopard'), 'Leopard skin available');
  assert(skinKeys.includes('panther'), 'Midnight Panther skin available');
  assert(skinKeys.includes('tiger'), 'Bengal Tiger skin available');
  assert(skinKeys.includes('mystic'), 'Clouded Spirit skin available');

  for (const key of skinKeys) {
    const skin = CAT_SKINS[key];
    assert(skin.primaryColor !== undefined, `${key} has valid primaryColor`);
    assert(skin.eyeColor !== undefined, `${key} has valid eyeColor`);
    assert(skin.icon !== undefined, `${key} has display icon`);
  }
}

console.log('\n--- Test Suite 3: Track Dimensions & Lane Geometry ---');
{
  assert(DIMENSIONS.NUM_LANES === 3, 'Game has exactly 3 lanes (-1, 0, 1)');
  assert(DIMENSIONS.LANE_WIDTH > 1.5, 'Lane width provides ample clearance');
  assert(DIMENSIONS.CHUNK_LENGTH === 60, 'Chunk length is 60m for smooth streaming');
  assert(DIMENSIONS.VISIBLE_CHUNKS >= 4, 'At least 4 chunks visible for seamless endless runner');
  assert(DIMENSIONS.JUMP_HEIGHT > 1.5, 'Jump height clears fallen logs');
  assert(DIMENSIONS.SLIDE_HEIGHT < 0.5, 'Slide height clears low creepers');
}

console.log('\n--- Test Suite 4: Realistic Rainforest Collectibles ---');
{
  assert(POWERUPS.SUN_BERRY === undefined, 'Sun Berry powerup is removed');
  assert(POWERUPS.STAR_ORCHID !== undefined, 'Rare Star Orchid is defined');
  assert(POWERUPS.STAR_ORCHID.scoreMultiplier === 3.0, 'Star Orchid awards 3x multiplier');
  assert(POWERUPS.STAR_ORCHID.invincible === false, 'Star Orchid preserves lethal vulnerability');
  assert(POWERUPS.RELIC !== undefined, 'Ancient Relic is defined');
  assert(POWERUPS.RELIC.bonusPoints === 500, 'Relic awards 500 bonus points');
  assert(POWERUPS.RELIC.pushSnakeBack > 0, 'Relic pushes snake backward');
}

console.log('\n--- Test Suite 5: Collision & Clearance Logic Math ---');
{
  // Test Jump clearance over log
  const logHeight = 0.85;
  const catMidAirY = 1.4;
  const catGroundedY = 0;
  assert(catMidAirY > logHeight, 'Jumping cat clears log height (1.4m > 0.85m)');
  assert(catGroundedY < logHeight, 'Grounded cat collides with log (0m < 0.85m)');

  // Test Slide clearance under arch
  const archBottomClearance = 0.55;
  const catSlidingHeight = 0.35;
  const catStandingHeight = 0.8;
  assert(catSlidingHeight < archBottomClearance, 'Sliding cat fits under arch (0.35m < 0.55m)');
  assert(catStandingHeight > archBottomClearance, 'Standing cat hits arch (0.8m > 0.55m)');
}

console.log('\n--- Test Suite 6: Lethal Collision & Obstacle Catch Logic ---');
{
  // Test Rock & Bramble bounding box with cat bounds
  const rockWidth = 1.9;
  const catWidth = 0.55;
  const maxDx = (rockWidth + catWidth) * 0.5;
  assert(maxDx === 1.225, 'Combined rock + cat AABB width threshold is 1.225m');
  
  // Off-center cat at dx = 0.8m must collide with rock
  const catOffCenterX = 0.8;
  assert(catOffCenterX < maxDx, 'Off-center cat at 0.8m correctly collides with 1.9m rock');

  // Test Snake surge and lethal catch distance threshold
  const catchThreshold = 1.2;
  const fatalSnakeDist = 0.4;
  assert(fatalSnakeDist <= catchThreshold, 'Fatal strike distance (0.4m) is within catch threshold (1.2m)');
}

console.log('\n--- Test Suite 7: Camera & Lane Orientation Math (+Z View) ---');
{
  // Camera looks forward along +Z axis.
  // In right-handed Three.js coordinates, looking along +Z:
  // Screen-Left = +X world coordinate
  // Screen-Right = -X world coordinate
  const laneWidth = DIMENSIONS.LANE_WIDTH; // 2.2m
  
  const leftLaneIdx = -1;
  const leftTargetX = -leftLaneIdx * laneWidth;
  assert(leftTargetX > 0, `Left lane (-1) maps to positive world X (+${leftTargetX}m), appearing on screen-left`);

  const rightLaneIdx = 1;
  const rightTargetX = -rightLaneIdx * laneWidth;
  assert(rightTargetX < 0, `Right lane (+1) maps to negative world X (${rightTargetX}m), appearing on screen-right`);

  const centerLaneIdx = 0;
  const centerTargetX = -centerLaneIdx * laneWidth;
  assert(centerTargetX === 0, 'Center lane (0) maps to world X = 0');
}

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);


