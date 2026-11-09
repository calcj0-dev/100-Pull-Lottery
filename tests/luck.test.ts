// 運の良さ（受け入れ T-04・T-05。計算と検証 4.3）
import { describe, expect, it } from 'vitest';
import * as sim from '../sim/lottery.mjs';
import { config, luckTable, messagesByLocale } from '../src/data';
import { luckLabel, upperOf } from '../src/core/luck';
import { format } from '../src/i18n';

const img = messagesByLocale.ja.image;

/** 結果画像の文言（「上位52%の運」「上位0.1%未満の運」）で比べる */
const label = (won: number) => {
  const l = luckLabel(upperOf(won, luckTable), config.luckDisplay);
  return format(l.key === 'pct' ? img.luckPct : img.luckUnder, { pct: l.value });
};

describe('T-04 表の引き方', () => {
  it('upperOf(0) が 1、upperOf(6900) が 0.511 前後', () => {
    expect(upperOf(0, luckTable)).toBe(1);
    expect(upperOf(6900, luckTable)).toBeCloseTo(0.511, 3);
  });

  it('表にない合計は「それ以下で一番大きい合計」の値。cap を超えたら overCap', () => {
    expect(upperOf(6950, luckTable)).toBe(upperOf(6900, luckTable));
    expect(upperOf(luckTable.cap + 1, luckTable)).toBe(luckTable.overCap);
    expect(upperOf(700_000_000, luckTable)).toBe(luckTable.overCap);
  });

  it('参照実装と同じ値', () => {
    for (let w = 0; w <= 400_000; w += 100) expect(upperOf(w, luckTable)).toBe(sim.upperOf(w, luckTable));
  });
});

describe('T-05 運の良さの表示', () => {
  it('計算と検証 4.3 の表のとおり', () => {
    const expected: [number, string][] = [
      [0, '100'],
      [300, '100'],
      [3000, '89'],
      [6900, '52'],
      [12700, '26'],
      [29000, '2'],
      [105000, '0.2'],
    ];
    for (const [won, pct] of expected) expect(label(won), String(won)).toBe(format(img.luckPct, { pct }));
    expect(label(700_000_000)).toBe(format(img.luckUnder, { pct: '0.1' }));
  });

  it('境目：ちょうど52%は52、0.1%ちょうどは0.1、それ未満は 0.1%未満', () => {
    expect(luckLabel(0.52, config.luckDisplay)).toEqual({ key: 'pct', value: '52' });
    expect(luckLabel(0.001, config.luckDisplay)).toEqual({ key: 'pct', value: '0.1' });
    expect(luckLabel(0.000999, config.luckDisplay)).toEqual({ key: 'under', value: '0.1' });
  });

  it('参照実装と同じ', () => {
    for (const u of [1, 0.999994, 0.882876, 0.511449, 0.0106, 0.001047, 0.00099, 0.000329946]) {
      expect(luckLabel(u, config.luckDisplay)).toEqual(sim.luckLabel(u));
    }
  });
});
