// 運の良さの対応表（src/data/luck_table.json）を厳密に計算する（sim/luck_table.mjs を移したもの。技術設計 2.1）
// 1枚ずつの等級の確率から、100枚の当たりの合計の分布を畳み込みで求め、
// 「その合計以上になる人の割合」を合計ごとに出す。乱数を使わないので、何度作っても同じ表になる
//
// 使い方：prizes.json を直したら `node scripts/luck-table.mjs`（計算と検証 2章）
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const UNIT = 100; // 当せん金はすべて100円の倍数
const CAP = 300000; // これを超える合計は「上限以上」にまとめる（上位0.1%より十分小さい）
const MIN_P = 1e-12; // これより起きにくい合計は表に入れない（引くときは1つ下の合計の値を使う）

const DATA = new URL('../src/data/', import.meta.url);
export const TABLE_PATH = new URL('luck_table.json', DATA);

/** 表を作る。prizes は prizes.json、hundred は config.json の modes.hundred */
export function buildLuckTable(prizes, hundred) {
  const capU = CAP / UNIT;
  const n = hundred.presses * hundred.ticketsPerPress;
  const one = new Map();
  let pHit = 0;
  for (const pr of prizes.prizes) {
    if (pr.amount % UNIT !== 0) throw new Error(`amount must be a multiple of ${UNIT}: ${pr.id}`);
    const p = pr.perUnit / prizes.unitTickets;
    pHit += p;
    one.set(pr.amount / UNIT, (one.get(pr.amount / UNIT) || 0) + p);
  }
  one.set(0, 1 - pHit);
  let dist = new Float64Array(capU + 2);
  dist[0] = 1; // 最後の要素＝上限超え
  for (let k = 0; k < n; k++) {
    const next = new Float64Array(capU + 2);
    for (let s = 0; s <= capU + 1; s++) {
      const q = dist[s];
      if (q === 0) continue;
      for (const [a, p] of one) {
        const t = s === capU + 1 ? capU + 1 : Math.min(s + a, capU + 1);
        next[t] += q * p;
      }
    }
    dist = next;
  }
  const over = dist[capU + 1];
  const entries = [];
  let tail = over;
  for (let s = capU; s >= 0; s--) {
    tail += dist[s];
    if (dist[s] > MIN_P) entries.push([s * UNIT, +tail.toPrecision(6)]);
  }
  entries.reverse();
  return {
    version: 1,
    generatedBy: 'sim/luck_table.mjs',
    basis: `1枚×${n}回。prizes.json の本数どおりの確率`,
    cap: CAP,
    overCap: +over.toPrecision(6),
    entries,
  };
}

/** ファイルに書くときの形（1行に1組。sim/luck_table.mjs と同じ） */
export function serialize(table) {
  return JSON.stringify(table).replace(/\],\[/g, '],\n[') + '\n';
}

export function buildFromFiles() {
  const read = (name) => JSON.parse(fs.readFileSync(new URL(name, DATA), 'utf8'));
  return buildLuckTable(read('prizes.json'), read('config.json').modes.hundred);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) {
  const table = buildFromFiles();
  fs.writeFileSync(TABLE_PATH, serialize(table));
  console.log('entries', table.entries.length, 'overCap', table.overCap, '->', fileURLToPath(TABLE_PATH));
}
