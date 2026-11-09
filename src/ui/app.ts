// 画面の切り替えと重ね表示（画面設計 2章・技術設計 4章）。ページの読み込みは起こさない。
// ブラウザの「戻る」：画面ごとに history を1つ積み、戻ったら S2・S3 → S1。重ね表示が開いていれば閉じる

import type { Mode, ModeResult } from '../modes/types';

export type ScreenName = 'title' | 'play' | 'result';
export type ModalName = 'basis' | 'privacy' | 'image';

/** 画面に渡す値。play は始め方、result はその回の結果 */
export type ScreenParams = {
  title: undefined;
  play: { from: 'title' | 'retry' };
  result: { result: ModeResult };
};

export type App = {
  go<S extends ScreenName>(screen: S, params?: ScreenParams[S]): void;
  openModal(modal: ModalName): void;
  closeModal(): void;
  readonly screen: ScreenName;
  /** 今のゲーム（S2 で作り、S3 で結果を見る） */
  game: Mode | null;
};

export type ScreenView = {
  el: HTMLElement;
  unmount?: () => void;
  /** ブラウザの「戻る」で離れるとき（S2 の途中でやめた計測など） */
  onBack?: () => void;
};
export type ScreenFactory<S extends ScreenName = ScreenName> = (app: App, params: ScreenParams[S]) => ScreenView;
export type ModalFactory = (app: App) => HTMLElement;

export function createApp(
  root: HTMLElement,
  screens: { [S in ScreenName]: ScreenFactory<S> },
  modals: Record<ModalName, ModalFactory>,
): App {
  const main = document.createElement('div');
  main.className = 'screen-host';
  const dialog = document.createElement('dialog');
  dialog.className = 'modal';
  root.replaceChildren(main, dialog);

  let current: ScreenView | null = null;
  let screenName: ScreenName = 'title';

  const show = <S extends ScreenName>(next: S, params: ScreenParams[S]) => {
    closeDialog();
    current?.unmount?.();
    screenName = next;
    current = (screens[next] as ScreenFactory<S>)(app, params);
    main.replaceChildren(current.el);
    main.dataset.screen = next;
    window.scrollTo(0, 0);
  };

  const closeDialog = () => {
    if (dialog.open) dialog.close();
  };

  const app: App = {
    game: null,
    get screen() {
      return screenName;
    },
    go(next, params) {
      // タイトルは履歴の一番下。それ以外の画面は1つ積む（S2 → S3 は置き換え。S3 で戻ると S1）
      if (next === 'title') {
        if (history.state?.screen && history.state.screen !== 'title') history.replaceState({ screen: 'title' }, '');
      } else if (screenName === 'title') history.pushState({ screen: next }, '');
      else history.replaceState({ screen: next }, '');
      show(next, params as ScreenParams[typeof next]);
    },
    openModal(name) {
      dialog.replaceChildren(modals[name](app));
      dialog.dataset.modal = name;
      if (!dialog.open) {
        dialog.showModal();
        history.pushState({ screen: screenName, modal: name }, '');
      }
    },
    closeModal() {
      // 重ね表示は履歴を1つ積んでいるので、戻って閉じる
      if (dialog.open) history.back();
    },
  };

  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    app.closeModal();
  });
  // 重ね表示の外側（背景）を押したら閉じる
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) app.closeModal();
  });

  window.addEventListener('popstate', () => {
    if (dialog.open) {
      closeDialog();
      return;
    }
    if (screenName !== 'title') {
      current?.onBack?.();
      show('title', undefined);
    }
  });

  history.replaceState({ screen: 'title' }, '');
  return app;
}
