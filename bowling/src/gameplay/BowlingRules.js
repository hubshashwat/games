/**
 * Official USBC Bowling Rules & Score Calculation Engine
 */

export class BowlingRules {
  constructor() {
    this.reset();
  }

  reset() {
    // 10 frames
    // Each frame: { rolls: [], score: null, isStrike: false, isSpare: false, isSplit: false }
    this.frames = Array.from({ length: 10 }, () => ({
      rolls: [],
      score: null,
      isStrike: false,
      isSpare: false,
      isSplit: false
    }));

    this.currentFrameIndex = 0; // 0 to 9
    this.currentRollIndex = 0;  // 0 to 1 (or 0 to 2 in frame 10)
    this.isGameOver = false;

    // Track total stats for current match
    this.totalStrikes = 0;
    this.totalSpares = 0;
    this.totalGutters = 0;
  }

  getCurrentFrame() {
    return this.frames[this.currentFrameIndex];
  }

  getCurrentFrameNumber() {
    return this.currentFrameIndex + 1; // 1 to 10
  }

  getCurrentRollNumber() {
    return this.currentRollIndex + 1; // 1, 2, or 3
  }

  /**
   * Record a roll's pinfall
   * @param {number} pinsHit - Number of pins knocked down on this roll
   * @param {number[]} remainingPinIds - Array of pin IDs (1-10) still standing
   * @returns {Object} result metadata { type: 'strike'|'spare'|'split'|'open'|'gutter', isFrameOver, isGameOver }
   */
  recordRoll(pinsHit, remainingPinIds = [], isGutterBall = null) {
    if (this.isGameOver) return { isGameOver: true };

    const frame = this.frames[this.currentFrameIndex];
    frame.rolls.push(pinsHit);

    let rollType = 'open';
    const isGutter = isGutterBall !== null ? isGutterBall : (pinsHit === 0);
    if (pinsHit === 0) {
      if (isGutter) {
        rollType = 'gutter';
        this.totalGutters++;
      } else {
        rollType = 'miss';
      }
    }

    const isTenthFrame = this.currentFrameIndex === 9;

    if (!isTenthFrame) {
      // Frames 1-9
      if (this.currentRollIndex === 0) {
        if (pinsHit === 10) {
          // Strike!
          frame.isStrike = true;
          this.totalStrikes++;
          rollType = 'strike';
          this.endFrame();
          return { type: rollType, isFrameOver: true, isGameOver: false };
        } else {
          // Check for split on first roll
          if (this.checkIsSplit(remainingPinIds)) {
            frame.isSplit = true;
            rollType = 'split';
          }
          this.currentRollIndex = 1;
          return { type: rollType, isFrameOver: false, isGameOver: false };
        }
      } else {
        // Roll 2
        const firstRoll = frame.rolls[0];
        if (firstRoll + pinsHit === 10) {
          frame.isSpare = true;
          this.totalSpares++;
          rollType = 'spare';
        }
        this.endFrame();
        return { type: rollType, isFrameOver: true, isGameOver: false };
      }
    } else {
      // 10th Frame
      if (this.currentRollIndex === 0) {
        if (pinsHit === 10) {
          frame.isStrike = true;
          this.totalStrikes++;
          rollType = 'strike';
        } else if (this.checkIsSplit(remainingPinIds)) {
          frame.isSplit = true;
          rollType = 'split';
        }
        this.currentRollIndex = 1;
        return { type: rollType, isFrameOver: false, isGameOver: false, resetPins: pinsHit === 10 };
      } else if (this.currentRollIndex === 1) {
        const roll1 = frame.rolls[0];
        let resetPins = false;

        if (roll1 === 10) {
          // Bowler got a strike on roll 1
          if (pinsHit === 10) {
            this.totalStrikes++;
            rollType = 'strike';
            resetPins = true;
          }
          this.currentRollIndex = 2; // Earned 3rd roll
          return { type: rollType, isFrameOver: false, isGameOver: false, resetPins };
        } else if (roll1 + pinsHit === 10) {
          // Bowler got a spare on roll 2! Earns 3rd roll
          frame.isSpare = true;
          this.totalSpares++;
          rollType = 'spare';
          this.currentRollIndex = 2;
          return { type: rollType, isFrameOver: false, isGameOver: false, resetPins: true };
        } else {
          // Open 10th frame after 2 rolls -> game over!
          this.endGame();
          return { type: rollType, isFrameOver: true, isGameOver: true };
        }
      } else {
        // Roll 3 (bonus roll)
        if (pinsHit === 10) {
          this.totalStrikes++;
          rollType = 'strike';
        }
        this.endGame();
        return { type: rollType, isFrameOver: true, isGameOver: true };
      }
    }
  }

  endFrame() {
    this.recalculateScores();
    if (this.currentFrameIndex < 9) {
      this.currentFrameIndex++;
      this.currentRollIndex = 0;
    } else {
      this.endGame();
    }
  }

  endGame() {
    this.isGameOver = true;
    this.recalculateScores();
  }

  /**
   * Official Bowling Split Detection:
   * 1. Headpin (Pin 1) must be knocked down.
   * 2. At least two pins must remain standing.
   * 3. At least one intermediate pin between them is knocked down (leaving a gap).
   */
  checkIsSplit(remainingPins) {
    if (remainingPins.length < 2 || remainingPins.includes(1)) {
      return false;
    }

    const standingSet = new Set(remainingPins);

    // Classic split pairs/combinations
    const classicSplits = [
      [7, 10],
      [4, 6],
      [4, 10],
      [6, 7],
      [7, 9],
      [8, 10],
      [5, 7],
      [5, 10],
      [4, 6, 7, 10], // Big Four
      [3, 10],       // Baby split
      [2, 7],        // Baby split
      [4, 7, 10],
      [6, 7, 10]
    ];

    for (const pattern of classicSplits) {
      if (pattern.every(pin => standingSet.has(pin))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Recalculates standard cumulative running bowling score for each frame.
   */
  recalculateScores() {
    // Flatten all rolls into a sequence
    const allRolls = [];
    for (let f = 0; f < 10; f++) {
      allRolls.push(...this.frames[f].rolls);
    }

    let rollPtr = 0;
    let runningTotal = 0;

    for (let f = 0; f < 10; f++) {
      const frame = this.frames[f];

      if (f < 9) {
        // Frames 1-9
        if (frame.rolls.length === 0) {
          frame.score = null;
          continue;
        }

        if (frame.isStrike) {
          // Strike: 10 + next 2 rolls
          if (allRolls.length > rollPtr + 2) {
            const bonus1 = allRolls[rollPtr + 1];
            const bonus2 = allRolls[rollPtr + 2];
            runningTotal += 10 + bonus1 + bonus2;
            frame.score = runningTotal;
          } else {
            frame.score = null; // Pending future rolls
          }
          rollPtr += 1;
        } else if (frame.isSpare) {
          // Spare: 10 + next 1 roll
          if (allRolls.length > rollPtr + 2) {
            const bonus = allRolls[rollPtr + 2];
            runningTotal += 10 + bonus;
            frame.score = runningTotal;
          } else {
            frame.score = null; // Pending future roll
          }
          rollPtr += 2;
        } else if (frame.rolls.length === 2) {
          // Open frame
          runningTotal += frame.rolls[0] + frame.rolls[1];
          frame.score = runningTotal;
          rollPtr += 2;
        } else {
          // First roll of open frame
          frame.score = null;
          rollPtr += 1;
        }
      } else {
        // 10th Frame
        if (frame.rolls.length > 0) {
          const frameSum = frame.rolls.reduce((sum, r) => sum + r, 0);
          // If frame 10 is finished or has completed required rolls
          const isDone =
            (frame.rolls.length === 2 && !frame.isStrike && !frame.isSpare) ||
            frame.rolls.length === 3;

          if (isDone || this.isGameOver) {
            frame.score = runningTotal + frameSum;
          } else {
            frame.score = null;
          }
        } else {
          frame.score = null;
        }
      }
    }
  }

  getFinalScore() {
    this.recalculateScores();
    // Return last valid frame score or calculated sum
    for (let f = 9; f >= 0; f--) {
      if (this.frames[f].score !== null) {
        return this.frames[f].score;
      }
    }
    // Fallback: sum of all recorded rolls
    let total = 0;
    for (const f of this.frames) {
      total += f.rolls.reduce((a, b) => a + b, 0);
    }
    return total;
  }

  /**
   * Maximum possible remaining score if bowler strikes out
   */
  getMaxPossibleScore() {
    // Clones state to simulate strikes on all remaining rolls
    const simRules = new BowlingRules();
    simRules.frames = JSON.parse(JSON.stringify(this.frames));
    simRules.currentFrameIndex = this.currentFrameIndex;
    simRules.currentRollIndex = this.currentRollIndex;
    simRules.isGameOver = this.isGameOver;

    if (simRules.isGameOver) {
      return this.getFinalScore();
    }

    while (!simRules.isGameOver) {
      simRules.recordRoll(10, []);
    }

    return simRules.getFinalScore();
  }
}
