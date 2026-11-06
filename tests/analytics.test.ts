// 計測（技術設計 7章）
import { afterEach, describe, expect, it, vi } from 'vitest';
import { gaId, initAnalytics, luckBucket, pressedBucket, track } from '../src/analytics';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('計測', () => {
  it('全イベントに lang・mode を付けて GA4 に送る', () => {
    const gtag = vi.fn();
    vi.stubGlobal('window', { gtag });
    track('finish', { title: 't_p6', best: 'p6', luck: '50-90' });
    expect(gtag).toHaveBeenCalledWith('event', 'finish', { title: 't_p6', best: 'p6', luck: '50-90', lang: 'ja', mode: 'hundred' });
  });

  it('GA4 を読み込めていない・失敗しても例外を出さない', () => {
    vi.stubGlobal('window', {});
    expect(() => track('retry', {})).not.toThrow();
    vi.stubGlobal('window', {
      gtag: () => {
        throw new Error('blocked');
      },
    });
    expect(() => track('main_app_click', { target: 'tameru' })).not.toThrow();
  });

  it('VITE_GA_ID が空なら GA4 は読み込まない', () => {
    expect(gaId()).toBe('');
    const append = vi.fn();
    vi.stubGlobal('window', {});
    vi.stubGlobal('document', { head: { append }, createElement: () => ({}) });
    initAnalytics();
    expect(append).not.toHaveBeenCalled();
  });

  it('運の良さの区分は <1／1-10／10-50／50-90／90+', () => {
    expect([0.0003, 0.0099, 0.01, 0.0999, 0.1, 0.4999, 0.5, 0.8999, 0.9, 1].map(luckBucket)).toEqual([
      '<1', '<1', '1-10', '1-10', '10-50', '10-50', '50-90', '50-90', '90+', '90+',
    ]);
  });

  it('途中でやめたときの押した回数の区分は 1-9／10-49／50-99', () => {
    expect([0, 1, 9, 10, 49, 50, 99].map(pressedBucket)).toEqual([null, '1-9', '1-9', '10-49', '10-49', '50-99', '50-99']);
  });
});
