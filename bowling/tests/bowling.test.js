import { BowlingRules } from '../src/gameplay/BowlingRules.js';
import { PIN_SPOTS, DIFFICULTY_SETTINGS, BALL_PRESETS, DIMENSIONS } from '../src/config.js';

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

console.log('--- Test Suite 1: Bowling Rules & Scoring ---');

// Test 1: Perfect Game (300)
{
  const rules = new BowlingRules();
  for (let i = 0; i < 9; i++) {
    const res = rules.recordRoll(10, []);
    assert(res.type === 'strike', `Frame ${i + 1} is strike`);
    assert(res.isFrameOver === true, `Frame ${i + 1} is frame over`);
  }

  // 10th frame: 3 strikes
  const res10_1 = rules.recordRoll(10, []);
  assert(res10_1.type === 'strike' && !res10_1.isGameOver && res10_1.resetPins, '10th frame roll 1 strike');

  const res10_2 = rules.recordRoll(10, []);
  assert(res10_2.type === 'strike' && !res10_2.isGameOver && res10_2.resetPins, '10th frame roll 2 strike');

  const res10_3 = rules.recordRoll(10, []);
  assert(res10_3.type === 'strike' && res10_3.isGameOver, '10th frame roll 3 strike ends game');

  const finalScore = rules.getFinalScore();
  assert(finalScore === 300, `Perfect game score must be 300 (got ${finalScore})`);
  assert(rules.totalStrikes === 12, `Total strikes must be 12 (got ${rules.totalStrikes})`);
}

// Test 2: All Spares (9 and / on all 10 frames + 9 bonus)
// Score: each frame 1-9 is 10 + 9 = 19. Total for frames 1-9 = 171. Frame 10 is 10 + 9 = 19. Grand total = 190.
{
  const rules = new BowlingRules();
  for (let f = 0; f < 9; f++) {
    rules.recordRoll(9, [10]);
    rules.recordRoll(1, []);
    assert(rules.frames[f].isSpare === true, `Frame ${f + 1} is spare`);
  }

  // 10th frame
  rules.recordRoll(9, [10]);
  rules.recordRoll(1, []); // Spare
  const resBonus = rules.recordRoll(9, [10]); // Bonus ball
  assert(resBonus.isGameOver === true, '10th frame spare bonus roll ends game');

  const score = rules.getFinalScore();
  assert(score === 190, `All spares (9-/) game score must be 190 (got ${score})`);
}

// Test 3: Open Game with Gutters
{
  const rules = new BowlingRules();
  for (let f = 0; f < 10; f++) {
    rules.recordRoll(0, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]); // Gutter
    rules.recordRoll(0, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]); // Gutter
  }
  assert(rules.isGameOver === true, 'Game is over after 10 open frames');
  assert(rules.getFinalScore() === 0, `All gutter score must be 0 (got ${rules.getFinalScore()})`);
  assert(rules.totalGutters === 20, `Total gutters recorded must be 20 (got ${rules.totalGutters})`);
}

// Test 4: Split Detection
{
  const rules = new BowlingRules();
  // Knocked down pin 1 and others, left 7 and 10 standing
  assert(rules.checkIsSplit([7, 10]) === true, '7-10 is a split');
  assert(rules.checkIsSplit([4, 6, 7, 10]) === true, 'Big Four (4-6-7-10) is a split');
  assert(rules.checkIsSplit([1, 7, 10]) === false, 'If Pin 1 stands, it is NOT a split');
  assert(rules.checkIsSplit([10]) === false, 'Single pin remaining is NOT a split');
}

console.log('\n--- Test Suite 2: Config & Dimensions ---');
{
  assert(PIN_SPOTS.length === 10, 'There are 10 pin spots');
  assert(PIN_SPOTS[0].id === 1 && PIN_SPOTS[0].x === 0, 'Pin 1 is centered');
  assert(PIN_SPOTS[9].id === 10, 'Pin 10 spot exists');

  assert(DIFFICULTY_SETTINGS.easy.hasBumpers === true, 'Easy mode has bumpers enabled');
  assert(DIFFICULTY_SETTINGS.medium.hasBumpers === false, 'Medium mode has bumpers disabled');
  assert(DIFFICULTY_SETTINGS.hard.hasBumpers === false, 'Hard mode has bumpers disabled');

  assert(BALL_PRESETS.length === 5, '5 custom bowling ball presets defined');
}

console.log(`\nTests finished: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
