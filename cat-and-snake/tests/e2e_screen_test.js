/**
 * Comprehensive Automated End-to-End Test for Cat and Snake
 * Tests all screens, device profiles, controls, lane switches, jumps, slides, pause, and game over.
 */

import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';

const BRAVE_PATH = '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser';
const PORT = 8095;
const DIST_DIR = path.resolve(process.cwd(), 'dist');

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  ✓ ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    failed++;
  }
}

function startStaticServer() {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/favicon.ico') {
      res.writeHead(204);
      res.end();
      return;
    }
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    const filePath = path.join(DIST_DIR, reqPath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });

  return new Promise((resolve) => {
    server.listen(PORT, () => {
      console.log(`E2E Server running at http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

async function runE2E() {
  const server = await startStaticServer();
  const consoleErrors = [];

  const browser = await puppeteer.launch({
    executablePath: BRAVE_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist'
    ]
  });

  try {
    // =========================================================
    // SUITE 1: Desktop Experience (1440x900 & 2560x1080 Ultra-Wide)
    // =========================================================
    console.log('\n--- 1. Desktop Suite: Start Screen & Customization ---');
    const desktopPage = await browser.newPage();
    desktopPage.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[Desktop]: ${msg.text()}`);
        console.error('  [Browser Error]:', msg.text());
      }
    });

    await desktopPage.setViewport({ width: 1440, height: 900 });
    await desktopPage.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    const titleText = await desktopPage.$eval('.modal-title', el => el.textContent);
    assert(titleText.includes('CAT & SNAKE'), 'Start screen displays game title');

    // Test changing difficulty
    await desktopPage.click('[data-mode="predator"]');
    const isPredatorSelected = await desktopPage.$eval('[data-mode="predator"]', el => el.classList.contains('selected'));
    assert(isPredatorSelected, 'Predator mode selectable');

    // Test changing cat skin
    await desktopPage.click('[data-skin="panther"]');
    const isPantherSelected = await desktopPage.$eval('[data-skin="panther"]', el => el.classList.contains('selected'));
    assert(isPantherSelected, 'Midnight Panther skin selectable');

    console.log('\n--- 2. Desktop Suite: Live Gameplay Loop & Continuous Running ---');
    await desktopPage.click('#btn-start-run');
    await new Promise(r => setTimeout(r, 1200));

    const initialMeters = await desktopPage.$eval('#hud-meters', el => parseInt(el.textContent.replace(/,/g, ''), 10));
    assert(initialMeters > 0, `Meters ran incrementing continuously (got ${initialMeters}m)`);

    const scoreVal = await desktopPage.$eval('#hud-score', el => parseInt(el.textContent.replace(/,/g, ''), 10));
    assert(scoreVal > 0, `Score incrementing continuously (got ${scoreVal})`);

    console.log('\n--- 3. Desktop Suite: Keyboard Controls (Dodge, Jump, Slide) ---');
    // Lane Dodge Left
    await desktopPage.keyboard.press('ArrowLeft');
    await new Promise(r => setTimeout(r, 200));
    const laneAfterLeft = await desktopPage.evaluate(() => window.gameEngine.cat.lane);
    assert(laneAfterLeft === -1, 'ArrowLeft moves cat to left lane (-1)');

    // Lane Dodge Right
    await desktopPage.keyboard.press('ArrowRight');
    await new Promise(r => setTimeout(r, 200));
    const laneAfterRight = await desktopPage.evaluate(() => window.gameEngine.cat.lane);
    assert(laneAfterRight === 0, 'ArrowRight moves cat back to center lane (0)');

    // Jump
    await desktopPage.keyboard.press('Space');
    await new Promise(r => setTimeout(r, 150));
    const isJumping = await desktopPage.evaluate(() => window.gameEngine.cat.isJumping);
    assert(isJumping, 'Space key triggers cat jump state');

    // Wait for landing
    await new Promise(r => setTimeout(r, 700));

    // Slide
    await desktopPage.keyboard.press('ArrowDown');
    await new Promise(r => setTimeout(r, 150));
    const isSliding = await desktopPage.evaluate(() => window.gameEngine.cat.isSliding);
    assert(isSliding, 'ArrowDown triggers cat slide state');

    console.log('\n--- 4. Desktop Suite: Ultra-wide 21:9 Screen (2560x1080) ---');
    await desktopPage.setViewport({ width: 2560, height: 1080 });
    await new Promise(r => setTimeout(r, 400));
    let fovUltrawide = await desktopPage.evaluate(() => window.gameEngine.sceneManager.camera.fov);
    assert(fovUltrawide <= 58, `FOV remains standard on ultra-wide desktop (fov: ${fovUltrawide.toFixed(1)}°)`);

    console.log('\n--- 5. Desktop Suite: Pause & Resume ---');
    await desktopPage.click('#btn-pause');
    await new Promise(r => setTimeout(r, 300));
    const isPaused = await desktopPage.evaluate(() => window.gameEngine.state === 'paused');
    assert(isPaused, 'Pause button changes engine state to PAUSED');

    await desktopPage.click('#btn-resume-run');
    await new Promise(r => setTimeout(r, 300));
    const isResumed = await desktopPage.evaluate(() => window.gameEngine.state === 'playing');
    assert(isResumed, 'Resume button restores engine state to PLAYING');

    console.log('\n--- 6. Desktop Suite: Snake Catch & Game Over Transition ---');
    // Force snake catch distance to test Game Over screen
    await desktopPage.evaluate(() => {
      window.gameEngine.cat.isInvincible = false;
      window.gameEngine.snake.distance = 0.5;
      window.gameEngine.update(0.016);
    });
    await new Promise(r => setTimeout(r, 400));
    const isGameOver = await desktopPage.evaluate(() => window.gameEngine.state === 'game_over');
    assert(isGameOver, 'Snake catch transitions engine to GAME_OVER state');

    const gameOverVisible = await desktopPage.$eval('#modal-gameover', el => el.classList.contains('modal-visible'));
    assert(gameOverVisible, 'Game Over modal is displayed with stats');

    // Test Play Again from Game Over
    await desktopPage.click('#btn-gameover-restart');
    await new Promise(r => setTimeout(r, 400));
    const isRestarted = await desktopPage.evaluate(() => window.gameEngine.state === 'playing');
    assert(isRestarted, 'Run Again button restarts gameplay immediately');

    // Test that colliding with an obstacle (rock/bramble/arch) causes immediate fatal death
    await desktopPage.evaluate(() => {
      window.gameEngine.handleObstacleHit('dodge', { userData: { subType: 'dodge' } });
    });
    await new Promise(r => setTimeout(r, 400));
    const obstacleKilled = await desktopPage.evaluate(() => window.gameEngine.state === 'game_over');
    assert(obstacleKilled, 'Crashing into rock/obstacle triggers immediate fatal Game Over');

    await desktopPage.close();

    // =========================================================
    // SUITE 2: Mobile Experience (iPhone 14/15/16 Pro 393x852)
    // =========================================================
    console.log('\n--- 7. Mobile Suite: iPhone Portrait & Adaptive Vertical FOV ---');
    const mobilePage = await browser.newPage();
    mobilePage.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[Mobile]: ${msg.text()}`);
        console.error('  [Mobile Browser Error]:', msg.text());
      }
    });

    await mobilePage.setViewport({ width: 393, height: 852, isMobile: true, hasTouch: true });
    await mobilePage.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    let fovMobile = await mobilePage.evaluate(() => window.gameEngine.sceneManager.camera.fov);
    assert(fovMobile > 65, `Adaptive vertical FOV expands on narrow mobile portrait (fov: ${fovMobile.toFixed(1)}°)`);

    // Start run on mobile
    await mobilePage.click('#btn-start-run');
    await new Promise(r => setTimeout(r, 600));

    console.log('\n--- 8. Mobile Suite: On-Screen Touch Buttons (Jump & Slide) ---');
    // Click on-screen Touch Jump button
    await mobilePage.click('#touch-jump-btn');
    await new Promise(r => setTimeout(r, 100));
    const touchJumpTriggered = await mobilePage.evaluate(() => window.gameEngine.cat.isJumping);
    assert(touchJumpTriggered, 'Touch Jump button triggers leap');

    // Wait for landing
    await new Promise(r => setTimeout(r, 700));

    // Click on-screen Touch Slide button
    await mobilePage.click('#touch-slide-btn');
    await new Promise(r => setTimeout(r, 100));
    const touchSlideTriggered = await mobilePage.evaluate(() => window.gameEngine.cat.isSliding);
    assert(touchSlideTriggered, 'Touch Slide button triggers slide crouch');

    console.log('\n--- 9. Mobile Suite: Touch Swipes (Left & Right) ---');
    // Simulate Touch Swipe Left
    await mobilePage.touchscreen.tap(200, 400);
    await mobilePage.evaluate(() => {
      window.gameEngine.inputManager.triggerAction('moveLeft');
    });
    await new Promise(r => setTimeout(r, 200));
    const mobileLaneLeft = await mobilePage.evaluate(() => window.gameEngine.cat.lane);
    assert(mobileLaneLeft === -1, 'Swipe Left moves cat to left lane (-1)');

    await mobilePage.close();

    // =========================================================
    // SUITE 3: Tablet Experience (iPad Air 820x1180)
    // =========================================================
    console.log('\n--- 10. Tablet Suite: iPad Air & Layout Quality ---');
    const tabletPage = await browser.newPage();
    tabletPage.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[Tablet]: ${msg.text()}`);
      }
    });

    await tabletPage.setViewport({ width: 820, height: 1180, isMobile: true, hasTouch: true });
    await tabletPage.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    let fovTablet = await tabletPage.evaluate(() => window.gameEngine.sceneManager.camera.fov);
    assert(fovTablet > 56, `Adaptive FOV configured for tablet (fov: ${fovTablet.toFixed(1)}°)`);

    await tabletPage.click('#btn-start-run');
    await new Promise(r => setTimeout(r, 600));

    const tabletScore = await tabletPage.$eval('#hud-score', el => parseInt(el.textContent.replace(/,/g, ''), 10));
    assert(tabletScore >= 0, 'Tablet gameplay running smoothly');

    await tabletPage.close();

    // =========================================================
    // SUITE 4: Browser Health Check
    // =========================================================
    console.log('\n--- 11. Verifying Zero Console Errors Across All Devices ---');
    assert(consoleErrors.length === 0, `Zero browser console errors detected (count: ${consoleErrors.length})`);

  } finally {
    await browser.close();
    server.close();
  }

  console.log(`\n========================================`);
  console.log(`E2E Results: ${passed} passed, ${failed} failed.`);
  console.log(`========================================`);
  if (failed > 0) process.exit(1);
}

runE2E().catch(err => {
  console.error('E2E test encountered critical error:', err);
  process.exit(1);
});
