// @vitest-environment happy-dom
// T-10 送るデータ：track() に渡す属性が 技術設計 7.2 の項目だけ。金額そのもの（当たりの合計など）を送っていない。
// 画面を実際に操作して、GA4 に渡るはずの中身をすべて集めて確かめる（今は GA4 を使わないが、足したときに送られる中身）
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/ui/app';
import { modals } from '../src/ui/modals';
import { playScreen } from '../src/ui/screens/play';
import { resultScreen } from '../src/ui/screens/result';
import { titleScreen } from '../src/ui/screens/title';

/** 技術設計 7.2 のイベントと属性（全イベントに lang・mode） */
const ALLOWED: Record<string, Record<string, readonly string[] | null>> = {
  start: { from: ['title', 'retry'] },
  finish: { title: null, best: null, luck: ['<1', '1-10', '10-50', '50-90', '90+'] },
  quit: { pressed: ['1-9', '10-49', '50-99'] },
  jackpot: {},
  share_click: { method: ['x_intent', 'web_share', 'save_image'], title: null },
  main_app_click: { target: ['tameru', 'tva', 'follow'] },
  retry: {},
  basis_open: { from: ['title', 'result'] },
};
const COMMON: Record<string, readonly string[]> = { lang: ['ja'], mode: ['hundred'] };

afterEach(() => {
  vi.restoreAllMocks();
});

function setup() {
  const sent: [string, Record<string, unknown>][] = [];
  (window as unknown as { gtag: unknown }).gtag = (kind: string, name: string, props: Record<string, unknown>) => {
    if (kind === 'event') sent.push([name, props]);
  };
  window.open = () => null;
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  const root = document.createElement('div');
  document.body.replaceChildren(root);
  const app = createApp(root, { title: titleScreen, play: playScreen, result: resultScreen }, modals);
  app.go('title');
  return { root, app, sent };
}

const click = (el: Element | null) => (el as HTMLElement).click();

describe('T-10 送るデータ', () => {
  it('1回通して遊んだときのイベントが、決めた属性と値だけ', async () => {
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    const { root, sent } = setup();

    click(root.querySelector('.link-row button')); // 計算の前提（タイトル）
    click(root.querySelector('.btn-start'));
    const buy = root.querySelector('.btn-buy')!;
    for (let i = 0; i < 100; i++) {
      click(buy);
      // 1等が出たら閉じる
      const jp = document.querySelector('.jackpot');
      if (jp) {
        now += 2000;
        click(jp);
      }
    }
    now += 2000;
    click(buy); // 結果を見る
    const result = root.querySelector('.screen-result')!;
    click(result.querySelector('.btn-share')); // Xでシェア（PC 扱いなので X の投稿画面）
    for (const a of result.querySelectorAll('.apps a')) {
      a.addEventListener('click', (e) => e.preventDefault());
      click(a);
    }
    click(result.querySelector('.link-row button')); // 計算の前提（結果）
    click([...result.querySelectorAll('.result-actions button')].at(-1)!); // もう一回
    click(root.querySelector('.btn-buy'));
    history.back(); // 途中でやめる
    await new Promise((r) => setTimeout(r, 50));

    const names = sent.map(([n]) => n);
    expect(names).toEqual(
      expect.arrayContaining(['basis_open', 'start', 'finish', 'share_click', 'main_app_click', 'retry', 'quit']),
    );

    for (const [name, props] of sent) {
      const allowed = ALLOWED[name];
      expect(allowed, `unknown event ${name}`).toBeDefined();
      for (const [k, v] of Object.entries(props)) {
        const rule = k in COMMON ? COMMON[k]! : allowed![k];
        expect(rule, `${name}.${k} is not allowed`).not.toBeUndefined();
        if (rule) expect(rule, `${name}.${k}=${String(v)}`).toContain(v);
        // 金額や数そのものは送らない（区分の文字列だけ）
        expect(typeof v, `${name}.${k}`).toBe('string');
      }
    }
  });

  it('1回も押さずに戻ったら quit を送らない', async () => {
    const { root, sent } = setup();
    click(root.querySelector('.btn-start'));
    history.back();
    await new Promise((r) => setTimeout(r, 50));
    expect(sent.map(([n]) => n)).toEqual(['start']);
  });
});
