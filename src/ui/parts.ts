// 画面に共通の部品（前作 parts.ts を流用）

import { t } from '../i18n';
import { onSettingsChange, settings } from '../settings';
import { APP_VERSION } from '../version';
import { h } from './dom';

const SPEAKER_ON =
  '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
const SPEAKER_OFF =
  '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 9.5l5 5m0-5l-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

/** 右上の音のボタン。設定が変わると見た目も変わる。戻り値の dispose で購読を解除 */
export function soundButton(): { el: HTMLButtonElement; dispose: () => void } {
  const el = h('button', { className: 'icon-btn', attrs: { type: 'button' } });
  const paint = () => {
    el.innerHTML = settings.sound ? SPEAKER_ON : SPEAKER_OFF;
    el.setAttribute('aria-label', t(settings.sound ? 'common.soundOn' : 'common.soundOff'));
    el.setAttribute('aria-pressed', settings.sound ? 'true' : 'false');
  };
  el.addEventListener('click', () => {
    settings.sound = !settings.sound;
  });
  paint();
  return { el, dispose: onSettingsChange(paint) };
}

/** 右上のバージョン（押せない。12px・薄い文字色） */
export function versionLabel(): HTMLElement {
  return h('span', { className: 'version', text: t('app.version', { version: APP_VERSION }) });
}

/** 画面の下の免責 */
export function disclaimer(): HTMLElement {
  return h('p', { className: 'disclaimer', text: t('common.disclaimer') });
}
