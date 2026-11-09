// 計算（受け入れ T-01〜T-03・T-11・T-12）
import { describe, expect, it } from 'vitest';
import * as sim from '../sim/lottery.mjs';
import { config, prizeData, titleData } from '../src/data';
import { drawTicket } from '../src/core/draw';
import { isFinished, net, newGame, press } from '../src/core/hundred';
import { mulberry32, type Rng } from '../src/core/rng';
import { titleOf } from '../src/core/title';

const cfg = config.modes.hundred;
const U = prizeData.unitTickets;

function play(rng: Rng) {
  const g = newGame();
  while (!isFinished(g, cfg)) press(g, rng, prizeData, cfg);
  return g;
}

/** 決まった値を順に返す偽の乱数（なくなったら最後の値を返し続ける） */
function fixed(values: number[]): Rng {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)]!;
}

/** 等級 ID の区間の最初に当たる乱数の値 */
function valueOf(id: string): number {
  let acc = 0;
  for (const pr of prizeData.prizes) {
    if (pr.id === id) return acc / U;
    acc += pr.perUnit;
  }
  throw new Error(id);
}
const MISS = (U - 1) / U;

describe('T-01 参照実装と一致', () => {
  it('同じシードで10,000回の100回モードを遊び、spent・won・counts・best・称号がすべて一致', () => {
    const a = mulberry32(40040);
    const b = sim.mulberry32(40040);
    for (let i = 0; i < 10_000; i++) {
      const g = play(a);
      const s = sim.playHundred(b);
      expect(g.spent).toBe(s.spent);
      expect(g.won).toBe(s.won);
      expect(g.counts).toEqual(s.counts);
      expect(g.best).toBe(s.best);
      expect(titleOf(g.best, titleData)).toBe(sim.titleOf(s.best));
    }
  });

  it('mulberry32 が参照実装と同じ並びを返す', () => {
    const a = mulberry32(1);
    const b = sim.mulberry32(1);
    for (let i = 0; i < 1000; i++) expect(a()).toBe(b());
  });
});

describe('T-02 抽選の区間', () => {
  it('区間の境目で等級が区間どおり。0 は1等、unitTickets の直前はハズレ', () => {
    expect(drawTicket(() => 0, prizeData)).toBe('p1');
    expect(drawTicket(() => MISS, prizeData)).toBe(null);
    let acc = 0;
    for (const pr of prizeData.prizes) {
      // 区間の最初の値と最後の値
      expect(drawTicket(() => acc / U, prizeData)).toBe(pr.id);
      acc += pr.perUnit;
      expect(drawTicket(() => (acc - 1) / U, prizeData)).toBe(pr.id);
    }
    // すべての区間のすぐあとはハズレ
    expect(drawTicket(() => acc / U, prizeData)).toBe(null);
  });
});

describe('T-03 称号', () => {
  const expected: Record<string, string> = {
    p1: 't_p1',
    p1adj: 't_big',
    p2: 't_big',
    p3: 't_big',
    p4: 't_p4',
    p1kumi: 't_kumi',
    p5: 't_p5',
    p6: 't_p6',
    p7: 't_p7',
  };

  it('全等級とハズレだけの場合で、ゲーム仕様 5章の表どおり', () => {
    for (const [prize, title] of Object.entries(expected)) expect(titleOf(prize, titleData), prize).toBe(title);
    expect(titleOf(null, titleData)).toBe('t_none');
  });

  it('「7等と6等」なら6等の称号、「組違い賞と5等」なら組違い賞の称号（金額で比べる）', () => {
    const g1 = play(fixed([valueOf('p7'), valueOf('p6'), valueOf('p7'), MISS]));
    expect(g1.best).toBe('p6');
    expect(titleOf(g1.best, titleData)).toBe('t_p6');
    const g2 = play(fixed([valueOf('p5'), valueOf('p1kumi'), valueOf('p5'), MISS]));
    expect(g2.best).toBe('p1kumi');
    expect(titleOf(g2.best, titleData)).toBe('t_kumi');
    // 4等（100万円）は組違い賞（10万円）より上
    const g3 = play(fixed([valueOf('p1kumi'), valueOf('p4'), MISS]));
    expect(titleOf(g3.best, titleData)).toBe('t_p4');
  });
});

describe('T-11 100回で終わる', () => {
  it('100回押すと isFinished が真、spent は必ず 30,000。101回目の press は例外', () => {
    const g = newGame();
    const rng = mulberry32(7);
    for (let i = 0; i < 99; i++) press(g, rng, prizeData, cfg);
    expect(isFinished(g, cfg)).toBe(false);
    press(g, rng, prizeData, cfg);
    expect(isFinished(g, cfg)).toBe(true);
    expect(g.pressed).toBe(100);
    expect(g.spent).toBe(30_000);
    expect(net(g)).toBe(g.won - 30_000);
    expect(() => press(g, rng, prizeData, cfg)).toThrow();
    expect(g.pressed).toBe(100);
  });

  it('押すたびに、その回の結果を last に入れる', () => {
    const g = newGame();
    expect(press(g, () => 0, prizeData, cfg)).toEqual(['p1']);
    expect(g.last).toEqual(['p1']);
    press(g, () => MISS, prizeData, cfg);
    expect(g.last).toEqual([null]);
  });
});

describe('T-12 1等でも続く', () => {
  it('1回目で1等が出ても100回まで押せる。称号は t_p1', () => {
    const g = play(fixed([0, MISS]));
    expect(g.pressed).toBe(100);
    expect(g.counts).toEqual({ p1: 1 });
    expect(g.won).toBe(700_000_000);
    expect(titleOf(g.best, titleData)).toBe('t_p1');
  });
});
