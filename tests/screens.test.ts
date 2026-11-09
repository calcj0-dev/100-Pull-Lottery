// @vitest-environment happy-dom
// 画面を組み立てて確かめる（受け入れ T-13 と、画面の文言・導線の確認）
import { describe, expect, it, vi } from 'vitest';
import { config, messagesByLocale } from '../src/data';
import { availableModes, showModeSelect } from '../src/modes';
import { createApp } from '../src/ui/app';
import { modals } from '../src/ui/modals';
import { playScreen } from '../src/ui/screens/play';
import { resultScreen } from '../src/ui/screens/result';
import { titleScreen } from '../src/ui/screens/title';

const ja = messagesByLocale.ja;

function mount() {
  const root = document.createElement('div');
  document.body.replaceChildren(root);
  // happy-dom の dialog.showModal がない場合に備える
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  const app = createApp(root, { title: titleScreen, play: playScreen, result: resultScreen }, modals);
  app.go('title');
  return { root, app };
}

describe('T-13 無限モードが出ない', () => {
  it('modes.infinite.enabled が false のとき、遊べるのは 100回モードだけ', () => {
    expect(config.modes.infinite.enabled).toBe(false);
    expect(availableModes(config)).toEqual(['hundred']);
    expect(showModeSelect(config)).toBe(false);
  });

  it('タイトル画面にモードの選択が出ない', () => {
    const { root } = mount();
    expect(root.querySelector('[data-mode-select]')).toBeNull();
  });

  it('enabled にすると選択を出す判定になる', () => {
    const on = structuredClone(config);
    on.modes.infinite.enabled = true;
    expect(showModeSelect(on)).toBe(true);
  });
});

describe('画面の流れ', () => {
  it('タイトル → 100回押す → 結果を見る → 結果画面。導線に UTM 付きのリンク', () => {
    vi.spyOn(performance, 'now').mockReturnValue(0);
    const { root } = mount();
    expect(root.textContent).toContain(ja.app.name);
    expect(root.textContent).toContain(ja.common.disclaimer);
    (root.querySelector('.btn-start') as HTMLButtonElement).click();
    const buy = root.querySelector('.btn-buy') as HTMLButtonElement;
    for (let i = 0; i < 100; i++) buy.click();
    expect(root.querySelector('.progress-text')!.textContent).toBe('100/100');
    expect(buy.textContent).toBe(ja.play.toResult);
    // 101回目は数えない（0.6 秒たつまでは結果にも進まない）
    buy.click();
    expect(root.querySelector('.screen-play')).not.toBeNull();
    vi.spyOn(performance, 'now').mockReturnValue(10_000);
    buy.click();
    const result = root.querySelector('.screen-result')!;
    expect(result).not.toBeNull();
    expect(result.textContent).toContain(ja.result.heading);
    expect(result.textContent).toContain(ja.common.disclaimer);
    const hrefs = [...result.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toContain(config.links.tameru);
    expect(hrefs).toContain(config.links.tva);
    expect(hrefs).toContain(config.links.follow);
    expect(config.links.tameru).toContain('utm_source=');
    expect(config.links.tva).toContain('utm_source=');
    vi.restoreAllMocks();
  });
});
