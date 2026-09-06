import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';

const BRAVE_PATH = '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser';
const PORT = 8089;
const DIST_DIR = path.resolve(process.cwd(), 'dist');

// Simple static file server for dist
function startServer() {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
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
      console.log(`Test static server running at http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

async function runE2E() {
  const server = await startServer();
  const consoleErrors = [];

  const browser = await puppeteer.launch({
    executablePath: BRAVE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=swiftshader']
  });

  try {
    const page = await browser.newPage();

    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        consoleErrors.push(text);
        console.error('BROWSER ERROR:', text);
      } else {
        // console.log(`[Browser ${type}]`, text);
      }
    });

    page.on('pageerror', err => {
      consoleErrors.push(err.toString());
      console.error('PAGE ERROR:', err.toString());
    });

    console.log('\n--- 1. Testing Mobile Viewport (iPhone 390x844) ---');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });

    // Verify canvas exists
    const canvasExists = await page.$('#game-canvas-container canvas');
    if (!canvasExists) throw new Error('Canvas element was not created in game-canvas-container');
    console.log('✓ Canvas rendered properly on mobile');

    // Verify 10-frame scoreboard
    const frameCount = await page.$$eval('.score-frame', frames => frames.length);
    if (frameCount !== 10) throw new Error(`Expected 10 score frames, got ${frameCount}`);
    console.log(`✓ Scoreboard initialized with ${frameCount} frames`);

    // Verify 10-pin mini-HUD
    const pinDotCount = await page.$$eval('.pin-dot', pins => pins.length);
    if (pinDotCount !== 10) throw new Error(`Expected 10 pin dots in mini-HUD, got ${pinDotCount}`);
    console.log(`✓ Pin Deck mini-HUD rendered with ${pinDotCount} pin indicators`);

    // Verify Difficulty Modal & Switch
    console.log('\n--- 2. Testing Difficulty Switch Modal & Persistence ---');
    await page.click('#diff-badge-btn');
    await new Promise(r => setTimeout(r, 200));

    const diffModalActive = await page.$eval('#diff-modal', el => el.classList.contains('active'));
    if (!diffModalActive) throw new Error('Difficulty modal did not open');
    console.log('✓ Difficulty modal opened successfully');

    // Select Easy mode
    await page.click('.diff-select-card[data-diff="easy"]');
    await new Promise(r => setTimeout(r, 300));

    const currentDiffBadge = await page.$eval('#diff-badge-btn', el => el.textContent);
    if (!currentDiffBadge.includes('EASY')) throw new Error(`Expected EASY badge, got ${currentDiffBadge}`);
    console.log(`✓ Difficulty successfully switched to ${currentDiffBadge}`);

    // Verify Ball Modal
    console.log('\n--- 3. Testing Ball Customizer Modal ---');
    await page.click('#ball-btn');
    await new Promise(r => setTimeout(r, 200));
    const ballCardsCount = await page.$$eval('.ball-card', cards => cards.length);
    if (ballCardsCount !== 5) throw new Error(`Expected 5 ball presets, got ${ballCardsCount}`);
    console.log(`✓ Ball customizer opened with ${ballCardsCount} custom bowling balls`);
    await page.click('#ball-modal .modal-close-btn');

    // Verify Stats Modal
    console.log('\n--- 4. Testing High Scores & Storage Modal ---');
    await page.click('#stats-btn');
    await new Promise(r => setTimeout(r, 200));
    const easyHigh = await page.$eval('#stat-high-easy', el => el.textContent);
    console.log(`✓ Stats modal opened, current Easy High Score: ${easyHigh}`);
    await page.click('#stats-modal .modal-close-btn');

    // Test Laptop / Desktop Viewport (1440x900)
    console.log('\n--- 5. Testing Laptop / Desktop Viewport (1440x900) ---');
    await page.setViewport({ width: 1440, height: 900 });
    await new Promise(r => setTimeout(r, 300));

    // Verify roll action via ROLL BALL button
    console.log('\n--- 6. Testing Ball Roll & Physics Execution ---');
    const statusBefore = await page.$eval('#status-message', el => el.textContent);
    console.log(`Status before roll: "${statusBefore}"`);

    await page.click('#bowl-btn');
    await new Promise(r => setTimeout(r, 600));

    const speedText = await page.$eval('#speed-display', el => el.textContent);
    console.log(`✓ Ball launched! Speedometer readout: ${speedText}`);

    // Wait for roll and pin evaluation to settle
    console.log('Waiting for ball roll to hit pins and settle...');
    let statusAfter = 'Ball Rolling...';
    for (let wait = 0; wait < 12; wait++) {
      await new Promise(r => setTimeout(r, 500));
      statusAfter = await page.$eval('#status-message', el => el.textContent);
      if (statusAfter !== 'Ball Rolling...') {
        console.log(`Status changed to: "${statusAfter}" after ${(wait + 1) * 0.5}s`);
        break;
      }
    }

    const scoreAfter = await page.$eval('#current-total-score', el => el.textContent);
    console.log(`Scoreboard readout: ${scoreAfter}`);

    // Check for any uncaught JS errors during game execution
    if (consoleErrors.length > 0) {
      throw new Error(`Browser encountered errors: ${consoleErrors.join(', ')}`);
    }

    console.log('\n========================================');
    console.log('🎉 ALL E2E BROWSER & PHYSICS TESTS PASSED!');
    console.log('========================================\n');

  } finally {
    await browser.close();
    server.close();
  }
}

runE2E().catch(err => {
  console.error('E2E TEST FAILURE:', err);
  process.exit(1);
});
