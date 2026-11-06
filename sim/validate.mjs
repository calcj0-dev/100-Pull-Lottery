// 検証：100回モードを N 回遊んだ結果を、厳密な計算（称号の割合・運の良さの表）と比べる
// 使い方：node validate.mjs 10000  → validate_10000.md
import fs from 'node:fs';
import { PRIZES, TITLES, CONFIG, mulberry32, playHundred, titleOf, upperOf, luckLabel } from './lottery.mjs';
const table = JSON.parse(fs.readFileSync(new URL('../src/data/luck_table.json', import.meta.url), 'utf8'));
const N = +(process.argv[2] || 10000), SEED = 40040, rng = mulberry32(SEED);
const n = CONFIG.modes.hundred.presses * CONFIG.modes.hundred.ticketsPerPress;
const yen = (v) => v.toLocaleString('ja-JP') + '円';

// 厳密：称号の割合。当せん金の大きい順に並べ、「それより大きい当たりが1枚も出ない確率」の差で求める
const byAmt = [...PRIZES.prizes].sort((a, b) => b.amount - a.amount);
const pOf = (pr) => pr.perUnit / PRIZES.unitTickets;
const exactBest = {}; let higher = 0;
for (const pr of byAmt) { const p = pOf(pr); exactBest[pr.id] = Math.pow(1 - higher, n) - Math.pow(1 - higher - p, n); higher += p; }
exactBest.none = Math.pow(1 - higher, n);
const exactTitle = {};
for (const t of TITLES.titles) exactTitle[t.id] = t.prizes.length ? t.prizes.reduce((s, id) => s + exactBest[id], 0) : exactBest.none;

// 試す
const tc = {}, totals = [], lab = {}; let won = 0, plus = 0, upperHit = { 10: 0, 50: 0, 90: 0 };
for (let i = 0; i < N; i++) {
  const s = playHundred(rng); const t = titleOf(s.best); tc[t] = (tc[t] || 0) + 1;
  totals.push(s.won); won += s.won; if (s.won > s.spent) plus++;
  const u = upperOf(s.won, table); for (const k of Object.keys(upperHit)) if (u <= k / 100) upperHit[k]++;
}
totals.sort((a, b) => b - a);
const pct = (x) => (100 * x).toFixed(4) + '%';
let md = `# 検証：100回モード ${N.toLocaleString()}回（シード ${SEED}）\n\n`;
md += `- 1回＝1枚×${n}回＝${yen(n * PRIZES.price)}。数字は data/prizes.json（${PRIZES.source.basis}）\n`;
md += `- 払い戻しの割合（当たりの合計÷使ったお金）：${(100 * won / (N * n * PRIZES.price)).toFixed(1)}%（理論値 ${(100 * PRIZES.prizes.reduce((s, p) => s + p.amount * pOf(p), 0) / PRIZES.price).toFixed(1)}%）\n`;
md += `- 差し引きがプラスになった割合：${(100 * plus / N).toFixed(2)}%\n\n`;
md += `## 称号の割合\n| 称号ID | 試した結果 | 厳密な計算 |\n| --- | --- | --- |\n`;
for (const t of TITLES.titles) md += `| ${t.id} | ${pct((tc[t.id] || 0) / N)} | ${pct(exactTitle[t.id])} |\n`;
md += `\n## 当たりの合計（上位〇%の境目）\n| 上位 | 試した結果 | 厳密な計算（その%以内に入る最小の合計） |\n| --- | --- | --- |\n`;
for (const p of [1, 10, 25, 50, 75, 90]) { const e = table.entries.find((x) => x[1] <= p / 100); md += `| ${p}% | ${yen(totals[Math.floor(N * p / 100)])} | ${yen(e[0])} |\n`; }
md += `\n## 運の良さの表の確認\n「上位k%以内」と表示された人の割合が、ほぼ k% 以下になっていること（同じ合計の人が多いため、ちょうどにはならない）\n| k | 上位k%以内と出た人 |\n| --- | --- |\n`;
for (const k of Object.keys(upperHit)) md += `| ${k}% | ${(100 * upperHit[k] / N).toFixed(1)}% |\n`;
md += `\n## 表示の例\n| 当たりの合計 | 上位の割合 | 表示 |\n| --- | --- | --- |\n`;
for (const w of [0, 300, 3000, 6900, 12700, 29000, 105000, 700000000]) { const u = upperOf(w, table); const l = luckLabel(u); md += `| ${yen(w)} | ${(100 * u).toPrecision(4)}% | ${l.key === 'pct' ? '上位' + l.value + '%' : '上位' + l.value + '%未満'} |\n`; }
fs.writeFileSync(new URL(`./validate_${N}.md`, import.meta.url), md);
console.log(md);
