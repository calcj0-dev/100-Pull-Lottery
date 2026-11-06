// 宝くじ100連ガチャ：計算の参照実装（実装の core/ はこれと同じ結果にする）
// データはすべて ../src/data/*.json から読む（数字をコードに書かない）
import fs from 'node:fs';
const load = (p) => JSON.parse(fs.readFileSync(new URL(p, import.meta.url), 'utf8'));
export const PRIZES = load('../src/data/prizes.json');
export const TITLES = load('../src/data/titles.json');
export const CONFIG = load('../src/data/config.json');

// 再現できる乱数（テスト・検証用）。本番は Math.random でよい
export function mulberry32(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---- 100回モード：1枚ずつ抽選（押した瞬間に結果） ----
// 0〜(unitTickets−1) の整数を1つ引き、本数を上から積み上げた区間で等級を決める（ユニット内の本数どおりの確率になる）
export function drawTicket(rng, data = PRIZES) {
  const r = Math.floor(rng() * data.unitTickets);
  let acc = 0;
  for (const pr of data.prizes) { acc += pr.perUnit; if (r < acc) return pr.id; }
  return null; // ハズレ
}

export function newGame() { return { pressed: 0, spent: 0, won: 0, counts: {}, best: null, log: [] }; }

// 「買う」を1回押す。ticketsPerPress 枚を抽選して状態を更新し、その回の結果を返す
export function press(state, rng, data = PRIZES, cfg = CONFIG.modes.hundred) {
  if (state.pressed >= cfg.presses) throw new Error('already finished');
  const results = [];
  for (let i = 0; i < cfg.ticketsPerPress; i++) {
    const id = drawTicket(rng, data);
    state.spent += data.price;
    if (id) {
      const pr = data.prizes.find((p) => p.id === id);
      state.won += pr.amount;
      state.counts[id] = (state.counts[id] || 0) + 1;
      if (!state.best || pr.amount > amountOf(state.best, data)) state.best = id;
    }
    results.push(id);
  }
  state.pressed++;
  state.log.push(results);
  return results;
}
const amountOf = (id, data) => data.prizes.find((p) => p.id === id).amount;

export function playHundred(rng, data = PRIZES, cfg = CONFIG.modes.hundred) {
  const s = newGame();
  while (s.pressed < cfg.presses) press(s, rng, data, cfg);
  return s;
}

// 称号：一番大きい当たりの等級で、titles.json を上から評価
export function titleOf(best, titles = TITLES) {
  for (const t of titles.titles) {
    if (t.prizes.length === 0 && best === null) return t.id;
    if (best !== null && t.prizes.includes(best)) return t.id;
  }
  throw new Error('no title for ' + best);
}

// 運の良さ：当たりの合計 total 以上になる人の割合（0〜1）。luck_table.json の対応表を引く
export function upperOf(total, table) {
  if (total > table.cap) return table.overCap; // 上限を超えたら「上限以上の人の割合」（これより小さい）
  // entries は [合計, その合計以上の割合] を合計の小さい順。total 以下で一番大きい合計の値を使う
  const e = table.entries; let lo = 0, hi = e.length - 1, ans = 0;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (e[m][0] <= total) { ans = m; lo = m + 1; } else hi = m - 1; }
  return e[ans][1];
}

// 表示用：「上位〇%」の数字（文字列）。決まりは config.json の luckDisplay
export function luckLabel(upper, rule = CONFIG.luckDisplay) {
  const pct = upper * 100;
  if (pct >= 1) return { key: 'pct', value: String(Math.min(100, Math.ceil(pct - 1e-9))) };
  if (pct >= rule.minPct) return { key: 'pct', value: (Math.ceil(pct * 10 - 1e-9) / 10).toFixed(1) };
  return { key: 'under', value: String(rule.minPct) };
}

// ---- 無限モード（後で追加。今は使わない）：1等までの枚数を幾何分布で一度に引く ----
export function geometric(rng, p) { let u; do { u = rng(); } while (u === 0); return Math.ceil(Math.log(u) / Math.log1p(-p)); }
function poisson(rng, lam) { const L = Math.exp(-lam); let k = 0, q = 1; do { k++; q *= rng(); } while (q > L); return k - 1; }
function normal(rng) { let u = 0; while (u === 0) u = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng()); }
export function binomial(rng, n, p) {
  const mean = n * p; if (n <= 0) return 0;
  if (mean < 30) return Math.min(n, poisson(rng, mean));
  const x = Math.round(mean + Math.sqrt(mean * (1 - p)) * normal(rng));
  return Math.max(0, Math.min(n, x));
}
export function playInfinite(rng, data = PRIZES) {
  const p1 = data.prizes.find((p) => p.id === 'p1').perUnit / data.unitTickets;
  const n = geometric(rng, p1); const counts = { p1: 1 };
  for (const pr of data.prizes) if (pr.id !== 'p1') counts[pr.id] = binomial(rng, n - 1, pr.perUnit / data.unitTickets);
  const spent = n * data.price; const won = data.prizes.reduce((s, pr) => s + pr.amount * (counts[pr.id] || 0), 0);
  return { n, spent, won, net: won - spent, upper: 1 - Math.pow(1 - p1, n), counts };
}
