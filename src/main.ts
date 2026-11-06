// 起動（#1：土台だけ。画面は #4 で作る）

import './style.css';
import { initAnalytics } from './analytics';
import { unlockAudio } from './audio';
import { setLocale, t } from './i18n';
import { h } from './ui/dom';
import { disclaimer, soundButton, versionLabel } from './ui/parts';

setLocale('ja');
initAnalytics();
// iOS では利用者が触ったときに音を鳴らせるようにする（技術設計 11章）
document.addEventListener('pointerdown', unlockAudio, { capture: true });
document.addEventListener('keydown', unlockAudio, { capture: true });

const root = document.querySelector<HTMLElement>('#app');
if (root) {
  const sound = soundButton();
  root.replaceChildren(
    h('section', { className: 'screen screen-title' }, [
      h('div', { className: 'top-bar' }, [versionLabel(), sound.el]),
      h('h1', { className: 'title', text: t('app.name') }),
      h('p', { className: 'lead', text: t('app.tagline') }),
      disclaimer(),
    ]),
  );
}
