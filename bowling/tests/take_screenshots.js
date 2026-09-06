import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';

const BRAVE_PATH = '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser';
const PORT = 8092;
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function startServer() {
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
    server.listen(PORT, () => resolve(server));
  });
}

async function capture() {
  const server = await startServer();
  const browser = await puppeteer.launch({
    executablePath: BRAVE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=swiftshader']
  });

  try {
    const page = await browser.newPage();

    // 1. Mobile iPhone
    await page.setViewport({ width: 393, height: 852, isMobile: true, hasTouch: true });
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'mobile.png') });
    console.log('Saved screenshots/mobile.png');

    // 2. Tablet iPad
    await page.setViewport({ width: 820, height: 1180, isMobile: true, hasTouch: true });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'tablet.png') });
    console.log('Saved screenshots/tablet.png');

    // 3. Laptop / Desktop
    await page.setViewport({ width: 1440, height: 900 });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'laptop.png') });
    console.log('Saved screenshots/laptop.png');

    // 4. Modal Open Screenshot (Difficulty & Ball Select)
    await page.click('#diff-badge-btn');
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'modal_difficulty.png') });
    console.log('Saved screenshots/modal_difficulty.png');

  } finally {
    await browser.close();
    server.close();
  }
}

capture().catch(console.error);
