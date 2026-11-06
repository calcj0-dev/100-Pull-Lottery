import { play, mulberry32, DATA } from './lottery.mjs';
const N = Number(process.argv[2] || 200000), PER_YEAR = Number(process.argv[3] || 30);
const rng = mulberry32(20261106);
const rs = Array.from({ length: N }, () => play(rng)).sort((a, b) => a.n - b.n);
const q = (x) => rs[Math.min(N - 1, Math.floor(x * N))];
const oku = (y) => (y / 1e8).toFixed(1) + '億円';
console.log(`# 試算（${N.toLocaleString()}回、毎年${PER_YEAR}枚）\n\n| 運の良さ | 1等までの枚数 | 使ったお金 | 当たりの合計 | 差し引き | 毎年${PER_YEAR}枚なら |\n| --- | --- | --- | --- | --- | --- |`);
for (const [l, x] of [['上位1%', .01], ['上位10%', .1], ['ふつう（真ん中）', .5], ['下位10%', .9], ['下位1%', .99]]) {
  const r = q(x); console.log(`| ${l} | ${(r.n / 1e4).toFixed(0)}万枚 | ${oku(r.spent)} | ${oku(r.won)} | ${oku(r.net)} | ${Math.round(r.n / PER_YEAR).toLocaleString()}年 |`);
}
const pay = rs.reduce((s, r) => s + r.won, 0) / rs.reduce((s, r) => s + r.spent, 0);
const plus = rs.filter((r) => r.net >= 0).length / N;
const p2 = rs.filter((r) => r.counts.p2 > 0).length / N;
const t = { chosen: 0, lucky: 0, normal: 0, unloved: 0, donor: 0 };
for (const r of rs) { if (r.luck <= .01) t.chosen++; else if (r.luck <= .1) t.lucky++; else if (r.luck <= .5) t.normal++; else if (r.luck <= .9) t.unloved++; else t.donor++; }
console.log(`\n- 払い戻しの割合（全回の当たり÷使ったお金）：${(pay * 100).toFixed(1)}%（理論値 ${(100 * DATA.prizes.reduce((s, p) => s + p.amount * p.perUnit, 0) / (DATA.unitTickets * DATA.price)).toFixed(1)}%）`);
console.log(`- 差し引きがプラスになった割合：${(plus * 100).toFixed(1)}%`);
console.log(`- 1等より先に2等（1億円）が出た割合：${(p2 * 100).toFixed(1)}%`);
console.log(`- 称号（運の良さだけで分けた場合）：上位1%以内 ${(100 * t.chosen / N).toFixed(1)}%、上位1〜10% ${(100 * t.lucky / N).toFixed(1)}%、上位10〜50% ${(100 * t.normal / N).toFixed(1)}%、下位50〜90% ${(100 * t.unloved / N).toFixed(1)}%、下位10%以下 ${(100 * t.donor / N).toFixed(1)}%`);
