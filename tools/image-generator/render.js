#!/usr/bin/env node
'use strict';
// Renders the SVG sample scenes to JPG with headless Chromium (playwright-core).
// Usage: node render.js [--only name1,name2] [--svg-only] [--out DIR]
// Env: PLAYWRIGHT_CORE (path to playwright-core module), CHROMIUM (executable path)
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const only = opt('--only', '') ? opt('--only').split(',') : null;
const outRoot = path.resolve(opt('--out', path.join(__dirname, '../../hyt-website/assets/images')));
const svgOnly = args.includes('--svg-only');

function loadPlaywright() {
  const cands = [process.env.PLAYWRIGHT_CORE, 'playwright-core', path.join(__dirname, 'node_modules/playwright-core')].filter(Boolean);
  for (const c of cands) { try { return require(c); } catch (e) { /* next */ } }
  throw new Error('playwright-core not found: run `npm i playwright-core@1.56.1` in tools/image-generator or set PLAYWRIGHT_CORE');
}

const LABEL = (W) => {
  const fs_ = Math.max(9, Math.round((14 * W) / 1600));
  return `<div style="position:absolute;right:${Math.round(fs_ * 1.3)}px;bottom:${Math.round(fs_ * 1.1)}px;padding:${Math.round(fs_ * 0.38)}px ${Math.round(fs_ * 0.85)}px;border-radius:999px;background:rgba(0,0,0,0.35);color:rgba(255,255,255,0.6);font:600 ${fs_}px/1 Inter,'DejaVu Sans',sans-serif;letter-spacing:0.08em;">SAMPLE IMAGE</div>`;
};

async function main() {
  const scenes = require('./scenes');
  const names = Object.keys(scenes).filter((n) => !only || only.includes(n));
  const builds = [];
  for (const name of names) {
    const sc = scenes[name];
    const t = Date.now();
    const svg = sc.build();
    builds.push({ name, sc, svg });
    if (svgOnly || process.env.KEEP_SVG) {
      const p = path.join(process.env.KEEP_SVG || '/tmp', name + '.svg'); fs.writeFileSync(p, svg);
    }
    console.log(`built ${name} (${(svg.length / 1024).toFixed(0)} KB svg, ${Date.now() - t} ms)`);
  }
  if (svgOnly) return;
  const pw = loadPlaywright();
  const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--force-color-profile=srgb'] });
  const page = await browser.newPage();
  for (const { name, sc, svg } of builds) {
    const dir = path.join(outRoot, sc.folder); fs.mkdirSync(dir, { recursive: true });
    const sizes = sc.sizes || [[1600, 1000, ''], [800, 500, '-800']];
    for (const [W, H, suf] of sizes) {
      await page.setViewportSize({ width: W, height: H });
      await page.setContent(`<!doctype html><html><head><style>html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:#fff}svg{display:block;width:${W}px;height:${H}px}</style></head><body><div style="position:relative;width:${W}px;height:${H}px">${svg}${LABEL(W)}</div></body></html>`);
      await page.evaluate(() => document.fonts.ready);
      let q = 82; let file = path.join(dir, `${name}${suf}.jpg`);
      for (;;) {
        await page.screenshot({ path: file, type: 'jpeg', quality: q, fullPage: false });
        const kb = fs.statSync(file).size / 1024;
        const limit = W >= 2400 ? 600 : W >= 1600 ? 340 : 150;
        if (kb <= limit || q <= 66) { console.log(`  ${sc.folder}/${name}${suf}.jpg ${W}x${H} q${q} ${kb.toFixed(0)} KB`); break; }
        q -= 4;
      }
    }
  }
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
