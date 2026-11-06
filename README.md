# 宝くじ100連ガチャ（100-Pull Lottery）

1枚300円の架空の宝くじ「いつでもジャンボ宝くじ」を、「買う」ボタンで100回引くブラウザゲーム（BAKA-040）。当せん金と本数は2026年の年末ジャンボ宝くじ（第1134回全国）と同じ比率。

- 設計書：`Development\design\BAKA-040_宝くじ100連ガチャ\`（01〜07章）
- 参照実装：[sim/](sim/)（計算と検証。`src/core/` はこれと同じ結果にする）

## 開発
Node.js 24 以降。

```
npm install
npm run dev        # 開発サーバー
npm test           # テスト
npm run build      # 型チェック＋ビルド（dist/）
```

- くじの数字・称号・設定・文言は `src/data/` の JSON で持つ（技術設計 2.1）
- `src/data/luck_table.json` は手で直さない。`prizes.json` を直したら `sim/README.md` の手順で作り直す
- バージョンは `package.json` の `version` で持ち、タイトル画面の右上に出る（技術設計 13.1）
- 環境変数：`VITE_SITE_URL`（作品のURL。末尾は /）、`VITE_GA_ID`（GA4 の測定ID。空なら読み込まない）

本作はジョークであり、投資・税務の助言ではありません。宝くじの購入をすすめるものでも、否定するものでもありません。
