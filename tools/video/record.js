// Records tools/video/slideshow.html to hyt-website/assets/videos/hyt-sample-machine-video.webm
// Usage: node tools/video/record.js   (needs playwright-core; set PLAYWRIGHT_CORE / CHROMIUM if not installed globally)
const path = require('path');
const fs = require('fs');
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
(async () => {
  const out = path.resolve(__dirname, '../../hyt-website/assets/videos');
  const tmp = path.join(out, '.rec');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: tmp, size: { width: 1280, height: 720 } } });
  const page = await ctx.newPage();
  await page.goto('file://' + path.resolve(__dirname, 'slideshow.html'));
  await page.waitForTimeout(14200);
  const video = page.video();
  await ctx.close();
  await browser.close();
  fs.renameSync(await video.path(), path.join(out, 'hyt-sample-machine-video.webm'));
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('written', fs.statSync(path.join(out, 'hyt-sample-machine-video.webm')).size, 'bytes');
})();
