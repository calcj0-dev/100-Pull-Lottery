// 2等の称号の条件案を比べる
import { play, mulberry32 } from './lottery.mjs';
const rng = mulberry32(7); const N = 200000;
let any = 0, plusAtP2 = 0, early = 0, two = 0;
for (let i = 0; i < N; i++) {
  const r = play(rng);
  const k = r.counts.p2;
  if (k > 0) any++;
  if (k >= 2) two++;
  if (k > 0) {
    // 最初の2等が出た位置：n−1 枚の中に k 本が一様に散らばる → 最小値
    let m = Infinity; for (let j = 0; j < k; j++) m = Math.min(m, 1 + Math.floor(rng() * (r.n - 1)));
    // その時点の差し引き（2等の1億円＋それまでのほかの当たりの期待値で近似：1枚あたり約115円）
    const netAt = 1e8 + m * 115 - m * 300;
    if (netAt >= 0) plusAtP2++;
    if (m / r.n <= 0.1) early++;
  }
}
const pc = (x) => (100 * x / N).toFixed(1) + '%';
console.log({ '2等が1本以上（今の条件）': pc(any), '2等の時点でやめていればプラスだった': pc(plusAtP2), '2等が1等よりずっと前（買った枚数の最初の1割）': pc(early), '2等が2本以上': pc(two) });
