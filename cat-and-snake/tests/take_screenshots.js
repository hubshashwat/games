/**
 * Automated Multi-Device Screenshot Capture for Cat and Snake
 * Uses Brave Browser and Puppeteer to photograph the game across all screen form factors and UI states.
 */

import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';

const BRAVE_PATH = '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser';
const PORT = 8094;
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
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
      console.log(`Server running at http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

async function captureScreenshots() {
  const server = await startStaticServer();
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
    // 1. Desktop Suite (1920x1080, 2560x1080, Pause, Game Over)
    console.log('--- 1. Capturing Desktop 1080p Gameplay ---');
    const deskPage = await browser.newPage();
    await deskPage.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    await deskPage.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Start run
    await deskPage.click('#btn-start-run');
    await new Promise(r => setTimeout(r, 1800));

    // Capture Desktop 1080p
    await deskPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'desktop_1080p.png') });
    console.log('Saved screenshots/desktop_1080p.png');

    // Capture Ultra-wide 21:9
    console.log('--- 2. Capturing Ultra-wide 21:9 Screen (2560x1080) ---');
    await deskPage.setViewport({ width: 2560, height: 1080, deviceScaleFactor: 1 });
    await new Promise(r => setTimeout(r, 500));
    await deskPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'desktop_ultrawide.png') });
    console.log('Saved screenshots/desktop_ultrawide.png');

    // Capture Pause Menu
    console.log('--- 3. Capturing Pause Menu Modal ---');
    await deskPage.setViewport({ width: 1440, height: 900 });
    await deskPage.click('#btn-pause');
    await new Promise(r => setTimeout(r, 400));
    await deskPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'modal_pause.png') });
    console.log('Saved screenshots/modal_pause.png');

    // Resume and capture Game Over
    console.log('--- 4. Capturing Game Over Modal ---');
    await deskPage.click('#btn-resume-run');
    await new Promise(r => setTimeout(r, 300));
    await deskPage.evaluate(() => {
      window.gameEngine.cat.isInvincible = false;
      window.gameEngine.snake.distance = 0.5;
      window.gameEngine.update(0.016);
    });
    await new Promise(r => setTimeout(r, 400));
    await deskPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'modal_gameover.png') });
    console.log('Saved screenshots/modal_gameover.png');
    await deskPage.close();

    // 2. Mobile Suite (iPhone 14/15/16 Pro 393x852)
    console.log('--- 5. Capturing Mobile Start Screen ---');
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({ width: 393, height: 852, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await mobilePage.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));
    await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, 'modal_start.png') });
    console.log('Saved screenshots/modal_start.png');

    console.log('--- 6. Capturing Mobile Portrait Gameplay ---');
    await mobilePage.click('#btn-start-run');
    await new Promise(r => setTimeout(r, 1600));
    await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, 'mobile_portrait.png') });
    console.log('Saved screenshots/mobile_portrait.png');
    await mobilePage.close();

    // 3. Mobile Landscape Suite (852x393)
    console.log('--- 7. Capturing Mobile Landscape Gameplay ---');
    const landPage = await browser.newPage();
    await landPage.setViewport({ width: 852, height: 393, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await landPage.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 500));
    await landPage.click('#btn-start-run');
    await new Promise(r => setTimeout(r, 1600));
    await landPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'mobile_landscape.png') });
    console.log('Saved screenshots/mobile_landscape.png');
    await landPage.close();

    // 4. Tablet Suite (iPad Air 820x1180)
    console.log('--- 8. Capturing Tablet iPad Air Gameplay ---');
    const tabPage = await browser.newPage();
    await tabPage.setViewport({ width: 820, height: 1180, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await tabPage.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 500));
    await tabPage.click('#btn-start-run');
    await new Promise(r => setTimeout(r, 1600));
    await tabPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'tablet_portrait.png') });
    console.log('Saved screenshots/tablet_portrait.png');
    await tabPage.close();

  } finally {
    await browser.close();
    server.close();
  }
}

captureScreenshots().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
