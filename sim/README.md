# sim：計算の参照実装と検証

すべて Node.js（18以上）で動く。数字は `../src/data/*.json` から読む（コードに数字を書かない）。

| ファイル | 中身 |
| --- | --- |
| `lottery.mjs` | **参照実装**。1枚の抽選 `drawTicket`、1回押す `press`、100回遊ぶ `playHundred`、称号 `titleOf`、運の良さ `upperOf`・表示 `luckLabel`。無限モード用の `playInfinite`（今は使わない） |
| `format.mjs` | 金額の書き方 `formatYen`、文言の差し込み `fill`、Xの文字数 `xLength` |
| `luck_table.mjs` | `../src/data/luck_table.json` を厳密に計算して作る（乱数なし） |
| `validate.mjs` | 100回モードを N 回遊び、厳密な計算と比べる。`node validate.mjs 10000` |
| `validate_10000.md`・`validate_1000000.md` | 上の結果 |
| `share_check.mjs` | 投稿文がXの上限に収まるか、金額の書き方の例 |
| `infinite/` | 無限モード（後で追加）の試算。`simulate.mjs`（20万回）・`p2check.mjs`（2等の称号の割合）・`result_200000.md`。設計時の古い参照実装（`infinite/lottery.mjs`・`infinite/prizes.json`）で動く。実装するときは `lottery.mjs` の `playInfinite` と `../src/data/prizes.json` に合わせる |

## 数字を変えたとき（公式の発表で直したときなど）
1. `../src/data/prizes.json` を直す
2. `node luck_table.mjs` で `luck_table.json` を作り直す
3. `node validate.mjs 1000000` で、払い戻しの割合が理論値に近いこと・称号の割合が厳密な計算に近いことを確かめる
4. `node share_check.mjs` で投稿文の長さを確かめる
5. 設計書 04章の表を直す
