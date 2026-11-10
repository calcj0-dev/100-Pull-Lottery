# OGP 画像とアイコンの作り方

`public/og-default.png`（1200×630）、`public/icon-192.png`・`icon-512.png`・`apple-touch-icon.png` は、ここの `og.html` と `public/favicon.svg` から作る。
作品名・一言（`src/data/i18n/ja.json` の `app.name`・`app.tagline`）やくじ券の絵（`src/ui/ticket.ts`）を変えたら作り直す。

```
npm i --no-save puppeteer-core@24.10.0   # Chrome がインストールされている前提（CHROME_PATH で場所を変えられる）
node tools/og/render_assets.mjs
```
