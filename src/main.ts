// 起動

import './style.css';
import { initAnalytics } from './analytics';
import { unlockAudio } from './audio';
import { setLocale } from './i18n';
import { createApp } from './ui/app';
import { modals } from './ui/modals';
import { playScreen } from './ui/screens/play';
import { resultScreen } from './ui/screens/result';
import { titleScreen } from './ui/screens/title';

setLocale('ja');
initAnalytics();
// iOS では利用者が触ったときに音を鳴らせるようにする（技術設計 11章）
document.addEventListener('pointerdown', unlockAudio, { capture: true });
document.addEventListener('keydown', unlockAudio, { capture: true });

const root = document.querySelector<HTMLElement>('#app');
if (root) {
  const app = createApp(root, { title: titleScreen, play: playScreen, result: resultScreen }, modals);
  app.go('title');
}
