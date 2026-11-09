// 金額の書き方（受け入れ T-06）・投稿文の長さ（T-07）・確率の書き方（画面設計 M2）
import { describe, expect, it } from 'vitest';
import * as simFormat from '../sim/format.mjs';
import { config, messagesByLocale, prizeData } from '../src/data';
import { formatOdds, formatYen } from '../src/core/format';
import { shareText, X_MAX, xLength } from '../src/share/postText';

const ja = messagesByLocale.ja;
const yen = (v: number) => formatYen(v, ja.format);
const MINUS = '−';

describe('T-06 金額の書き方', () => {
  it('技術設計 5.3 の例のとおり', () => {
    const cases: [number, string][] = [
      [300, '300'],
      [6900, '6,900'],
      [30000, `3${ja.format.man}`],
      [100000, `10${ja.format.man}`],
      [105000, '105,000'],
      [150_000_000, `1${ja.format.oku}5,000${ja.format.man}`],
      [700_000_000, `7${ja.format.oku}`],
      [700_012_300, `7${ja.format.oku}1${ja.format.man}2,300`],
      [0, '0'],
    ];
    for (const [v, n] of cases) expect(yen(v), String(v)).toBe(ja.format.yen.replace('{n}', n));
    expect(yen(-23100)).toBe(MINUS + ja.format.yen.replace('{n}', '23,100'));
  });

  it('参照実装と同じ', () => {
    for (const v of [0, 300, 3000, 10000, 12700, 1_000_000, 1_050_003_000, 100_000_000, -30000, 123_456_789, 700_012_300]) {
      expect(yen(v)).toBe(simFormat.formatYen(v));
    }
  });
});

describe('T-07 投稿文の長さ', () => {
  it('全称号×長い金額×2種類の文で、X の上限 280 に収まる', () => {
    const url = 'https://100-pull-lottery.vercel.app/';
    let worst = 0;
    for (const title of Object.values(ja.titles)) {
      for (const w of [0, 6900, 30000, 700_012_300, 1_050_003_000]) {
        for (const under of [false, true]) {
          const text = shareText(ja.share, under, {
            spent: yen(30000),
            won: yen(w),
            pct: under ? '0.1' : '100',
            title,
            hashtag: config.hashtag,
          });
          const len = xLength(text, url);
          expect(len).toBeLessThanOrEqual(X_MAX);
          expect(len).toBe(simFormat.xLength(text, url));
          worst = Math.max(worst, len);
        }
      }
    }
    // 計算と検証 5章の最長
    expect(worst).toBe(179);
  });

  it('投稿文にハッシュタグ・称号・金額が入る（ゲーム仕様 8.1）', () => {
    const text = shareText(ja.share, false, { spent: yen(30000), won: yen(6900), pct: '52', title: ja.titles.t_p6, hashtag: config.hashtag });
    expect(text).toBe(simFormat.fill(ja.share.textPct, { spent: yen(30000), won: yen(6900), pct: '52', title: ja.titles.t_p6, hashtag: config.hashtag }));
    expect(text.endsWith(`#${config.hashtag}`)).toBe(true);
    expect(text).toContain(ja.titles.t_p6);
  });
});

describe('確率の書き方（画面設計 M2）', () => {
  it('1万以上は万の単位、1万未満は整数に四捨五入。割り切れなければ approx', () => {
    const m = ja.format.man;
    const odds = Object.fromEntries(prizeData.prizes.map((p) => [p.id, formatOdds(prizeData.unitTickets, p.perUnit, ja.format)]));
    expect(odds).toEqual({
      p1: { n: `2,000${m}`, approx: false },
      p1adj: { n: `1,000${m}`, approx: false },
      p2: { n: `2,000${m}`, approx: false },
      p3: { n: `1,000${m}`, approx: false },
      p4: { n: `33${m}`, approx: true },
      p1kumi: { n: `10${m}`, approx: true },
      p5: { n: '333', approx: true },
      p6: { n: '100', approx: false },
      p7: { n: '10', approx: false },
    });
  });
});
