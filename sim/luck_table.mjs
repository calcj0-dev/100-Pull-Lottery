// 運の良さの対応表（data/luck_table.json）を厳密に計算する
// 1枚ずつの等級の確率から、100枚の当たりの合計の分布を畳み込みで求め、
// 「その合計以上になる人の割合」を合計ごとに出す。乱数を使わないので、何度作っても同じ表になる
import fs from 'node:fs';
import { PRIZES, CONFIG } from './lottery.mjs';
const UNIT = 100;                 // 当せん金はすべて100円の倍数
const CAP = 300000;               // これを超える合計は「上限以上」にまとめる（上位0.1%より十分小さい）
const MIN_P = 1e-12;              // これより起きにくい合計は表に入れない（引くときは1つ下の合計の値を使う）
const capU = CAP / UNIT, n = CONFIG.modes.hundred.presses * CONFIG.modes.hundred.ticketsPerPress;
const one = new Map(); let pHit = 0;
for (const pr of PRIZES.prizes) { const p = pr.perUnit / PRIZES.unitTickets; pHit += p; one.set(pr.amount / UNIT, (one.get(pr.amount / UNIT) || 0) + p); }
one.set(0, 1 - pHit);
let dist = new Float64Array(capU + 2); dist[0] = 1; // 最後の要素＝上限超え
for (let k = 0; k < n; k++) {
  const next = new Float64Array(capU + 2);
  for (let s = 0; s <= capU + 1; s++) {
    const q = dist[s]; if (q === 0) continue;
    for (const [a, p] of one) { const t = s === capU + 1 ? capU + 1 : Math.min(s + a, capU + 1); next[t] += q * p; }
  }
  dist = next;
}
const over = dist[capU + 1];
const entries = []; let tail = over;
for (let s = capU; s >= 0; s--) { tail += dist[s]; if (dist[s] > MIN_P) entries.push([s * UNIT, +tail.toPrecision(6)]); }
entries.reverse();
const out = { version: 1, generatedBy: 'sim/luck_table.mjs', basis: `1枚×${n}回。prizes.json の本数どおりの確率`, cap: CAP, overCap: +over.toPrecision(6), entries };
fs.writeFileSync(new URL('../src/data/luck_table.json', import.meta.url), JSON.stringify(out).replace(/\],\[/g, '],\n[') + '\n');
const sum = dist.reduce((a, b) => a + b, 0);
console.log('entries', entries.length, 'overCap', over, 'total prob', sum);
const find = (pct) => entries.find((e) => e[1] <= pct / 100);
for (const p of [0.1, 1, 5, 10, 25, 50, 75, 90, 99]) console.log('上位' + p + '%以内になる最小の合計', find(p));
