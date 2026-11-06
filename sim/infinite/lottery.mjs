// 1等が出るまで：参照実装
// 1等までの枚数 n を幾何分布で一度に引き、ほかの等級は「1等の券を除く n−1 枚」に対して二項分布で引く
import fs from 'node:fs';
export const DATA = JSON.parse(fs.readFileSync(new URL('./prizes.json', import.meta.url), 'utf8'));

export function mulberry32(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// 初めて当たるまでの回数（1以上）。逆関数法
export function geometric(rng, p) { let u; do { u = rng(); } while (u === 0); return Math.ceil(Math.log(u) / Math.log1p(-p)); }

function poisson(rng, lam) { // 小さい平均はクヌース法
  const L = Math.exp(-lam); let k = 0, q = 1; do { k++; q *= rng(); } while (q > L); return k - 1;
}
function normal(rng) { let u = 0; while (u === 0) u = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng()); }
// 二項分布 Bin(n, p)。p が小さく n が大きい（宝くじ）ので、平均が小さければポアソン、大きければ正規で近似し、0〜n に収める
export function binomial(rng, n, p) {
  const mean = n * p;
  if (n <= 0) return 0;
  if (mean < 30) return Math.min(n, poisson(rng, mean));
  const x = Math.round(mean + Math.sqrt(mean * (1 - p)) * normal(rng));
  return Math.max(0, Math.min(n, x));
}

export function play(rng, data = DATA) {
  const p1 = data.prizes[0].perUnit / data.unitTickets;
  const n = geometric(rng, p1);
  const counts = { p1: 1 };
  for (const pr of data.prizes.slice(1)) counts[pr.id] = binomial(rng, n - 1, pr.perUnit / data.unitTickets);
  const spent = n * data.price;
  const won = data.prizes.reduce((s, pr) => s + pr.amount * counts[pr.id], 0);
  const luck = 1 - Math.pow(1 - p1, n); // 上位〇%（0〜1）
  return { n, spent, won, net: won - spent, luck, counts };
}
