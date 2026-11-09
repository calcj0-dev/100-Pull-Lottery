// シェア（ゲーム仕様 8章・受け入れ 2.4）：投稿文と結果画像の文言
import { describe, expect, it } from 'vitest';
import { config, luckTable, messagesByLocale } from '../src/data';
import { upperOf } from '../src/core/luck';
import { titleOf } from '../src/core/title';
import { titleData } from '../src/data';
import type { ModeResult } from '../src/modes/types';
import { resultShareText, X_MAX, xLength } from '../src/share/postText';
import { imageLines } from '../src/share/resultImage';
import { xIntentUrl } from '../src/share/share';

const ja = messagesByLocale.ja;

function result(won: number, best: string | null): ModeResult {
  return { spent: 30000, won, counts: best ? { [best]: 1 } : {}, best, upper: upperOf(won, luckTable), titleId: titleOf(best, titleData) };
}

describe('投稿文', () => {
  it('ゲーム仕様 8.1 の例のとおり（上位52%・6等の称号）', () => {
    expect(resultShareText(result(6900, 'p6'))).toBe(
      ja.share.textPct
        .replace('{spent}', '3万円')
        .replace('{won}', '6,900円')
        .replace('{pct}', '52')
        .replace('{title}', ja.titles.t_p6)
        .replace('{hashtag}', config.hashtag),
    );
  });

  it('0.1%未満なら textUnder（1等）', () => {
    const text = resultShareText(result(700_002_400, 'p1'));
    expect(text).toBe(
      ja.share.textUnder
        .replace('{spent}', '3万円')
        .replace('{won}', `7${ja.format.oku}2,400円`)
        .replace('{pct}', '0.1')
        .replace('{title}', ja.titles.t_p1)
        .replace('{hashtag}', config.hashtag),
    );
    expect(xLength(text, 'https://100-pull-lottery.vercel.app/')).toBeLessThanOrEqual(X_MAX);
  });

  it('X の投稿画面のURL：投稿文とURLを別々に渡し、空白は %20', () => {
    const u = new URL(xIntentUrl('a b #宝くじ100連ガチャ'));
    expect(u.origin + u.pathname).toBe(config.links.xIntent);
    expect(u.searchParams.get('text')).toBe('a b #宝くじ100連ガチャ');
    expect(u.searchParams.get('url')).toMatch(/^https?:\/\//);
    expect(xIntentUrl('a b')).toContain('text=a%20b');
  });
});

describe('結果画像の文言（受け入れ 2.4）', () => {
  it('作品名・使ったお金と当たりの合計・運の良さ・称号・作品URL・免責', () => {
    const l = imageLines(result(6900, 'p6'));
    expect(l.heading).toBe(ja.image.heading);
    expect(l.line1).toBe(ja.image.line1.replace('{spent}', '3万円').replace('{won}', '6,900円'));
    expect(l.luck).toBe(ja.image.luckPct.replace('{pct}', '52'));
    expect(l.title).toBe(ja.titles.t_p6);
    expect(l.url).not.toMatch(/^https?:/);
    expect(l.url.length).toBeGreaterThan(0);
    expect(l.footer).toBe(ja.image.footer);
  });

  it('0.1%未満は luckUnder', () => {
    expect(imageLines(result(700_000_000, 'p1')).luck).toBe(ja.image.luckUnder.replace('{pct}', '0.1'));
  });
});
