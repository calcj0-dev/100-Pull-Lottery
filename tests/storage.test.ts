import { afterEach, describe, expect, it, vi } from 'vitest';
import { load, save } from '../src/storage';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('端末への保存（技術設計 10章）', () => {
  it('保存できない環境（localStorage がない）では初期値で動く', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(load('sound', 'on')).toBe('on');
    expect(() => save('sound', 'off')).not.toThrow();
  });

  it('localStorage が例外を出しても止まらない', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
    });
    expect(load('sound', 'on')).toBe('on');
    expect(() => save('sound', 'off')).not.toThrow();
  });

  it('保存した値を読み出せる（キーは baka040.sound）', () => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
    });
    save('sound', 'off');
    expect(store.get('baka040.sound')).toBe('off');
    expect(load('sound', 'on')).toBe('off');
  });
});
