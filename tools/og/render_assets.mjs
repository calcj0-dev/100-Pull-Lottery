// OGP 画像とアイコンを PNG にする（前作 tools/og を流用。Chrome がインストールされている前提）
//   npm i --no-save puppeteer-core@24.10.0
//   node tools/og/render_assets.mjs
// og.html は ticket.ts を fetch するため、リポジトリの直下を簡単なサーバーで配る
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUT = join(ROOT, 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.ts': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml' };
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const server = createServer((req, res) => {
  const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
  if (!p.startsWith(ROOT) || !existsSync(p)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(p)] ?? 'application/octet-stream' }).end(readFileSync(p));
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await page.goto(`${base}/tools/og/og.html`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('body[data-ready]');
  await page.screenshot({ path: join(OUT, 'og-default.png') });

  const svg = readFileSync(join(OUT, 'favicon.svg'), 'utf-8');
  for (const size of [180, 192, 512]) {
    const p = await browser.newPage();
    await p.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
    await p.setContent(`<html><body style="margin:0;background:#fffdf8">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
    const name = size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`;
    await p.screenshot({ path: join(OUT, name) });
  }
} finally {
  await browser.close();
  server.close();
}
console.log('ok');
