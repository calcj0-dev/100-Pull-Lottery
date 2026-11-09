// T-14 払い戻しの割合（100万回・シード固定）。時間がかかるので、ふだんは飛ばす。
// 公開前に1回：SLOW=1 npx vitest run tests/payout.test.ts
import { describe, expect, it } from 'vitest';
import { config, prizeData, titleData } from '../src/data';
import { isFinished, newGame, press } from '../src/core/hundred';
import { mulberry32 } from '../src/core/rng';
import { titleOf } from '../src/core/title';

const N = 1_000_000;
const n = config.modes.hundred.presses * config.modes.hundred.ticketsPerPress;

/** 厳密な称号の割合（計算と検証 3.2。sim/validate.mjs と同じ求め方） */
function exactTitles(): Record<string, number> {
  const byAmt = [...prizeData.prizes].sort((a, b) => b.amount - a.amount);
  const best: Record<string, number> = {};
  let higher = 0;
  for (const pr of byAmt) {
    const p = pr.perUnit / prizeData.unitTickets;
    best[pr.id] = Math.pow(1 - higher, n) - Math.pow(1 - higher - p, n);
    higher += p;
  }
  const none = Math.pow(1 - higher, n);
  return Object.fromEntries(
    titleData.titles.map((t) => [t.id, t.prizes.length ? t.prizes.reduce((s, id) => s + best[id]!, 0) : none]),
  );
}

describe.skipIf(!process.env.SLOW)('T-14 払い戻しの割合', () => {
  it('100万回の払い戻しが 49〜51%、称号の割合が厳密な計算と±0.3ポイント以内', () => {
    const rng = mulberry32(40040);
    const cfg = config.modes.hundred;
    const counts: Record<string, number> = {};
    let won = 0;
    for (let i = 0; i < N; i++) {
      const g = newGame();
      while (!isFinished(g, cfg)) press(g, rng, prizeData, cfg);
      won += g.won;
      const t = titleOf(g.best, titleData);
      counts[t] = (counts[t] ?? 0) + 1;
    }
    const payout = won / (N * n * prizeData.price);
    expect(payout).toBeGreaterThanOrEqual(0.49);
    expect(payout).toBeLessThanOrEqual(0.51);
    const exact = exactTitles();
    for (const t of titleData.titles) {
      expect(Math.abs((counts[t.id] ?? 0) / N - exact[t.id]!) * 100, t.id).toBeLessThanOrEqual(0.3);
    }
  }, 600_000);
});
