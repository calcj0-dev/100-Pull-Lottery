// O1 1等の演出（画面設計 5章）：画面いっぱいに「1等」「7億円」、紙吹雪とファンファーレ。
// 連打で見逃さないよう、表示から LOCK_MS は閉じられない。閉じるまで「買う」は押せない

import { t } from '../../i18n';
import { h } from '../dom';
import { confetti } from '../effects';

/** 表示から閉じられるようになるまで（ミリ秒）【案】 */
export const LOCK_MS = 1000;

export function showJackpot(prize: string, amount: string, onClose: () => void): void {
  const [line1, line2] = t('play.bigHit', { prize, amount }).split('\n');
  const hint = h('p', { className: 'jackpot-hint', text: t('play.tapToContinue') });
  const el = h(
    'div',
    {
      className: 'jackpot',
      attrs: { role: 'alertdialog', 'aria-modal': 'true', 'aria-label': `${line1 ?? ''} ${line2 ?? ''}`, tabindex: '-1' },
    },
    [
      h('div', { className: 'jackpot-text' }, [
        h('p', { className: 'jackpot-prize', text: line1 ?? '' }),
        h('p', { className: 'jackpot-amount', text: line2 ?? '' }),
      ]),
      hint,
    ],
  );
  const stopConfetti = confetti(el, 120);
  document.body.append(el);
  el.focus();

  const openedAt = performance.now();
  const tryClose = (e: Event) => {
    e.preventDefault();
    if (performance.now() - openedAt < LOCK_MS) return;
    stopConfetti();
    el.remove();
    window.removeEventListener('popstate', onPop);
    onClose();
  };
  // 閉じられるようになったら「タップで続ける」を出す
  window.setTimeout(() => hint.classList.add('ready'), LOCK_MS);
  // pointerdown で閉じると、続く click が下の「買う」に届くことがあるため click で閉じる
  el.addEventListener('click', tryClose);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') tryClose(e);
  });

  // ブラウザの「戻る」でタイトルへ戻るときは、演出も消す
  const onPop = () => {
    stopConfetti();
    el.remove();
    window.removeEventListener('popstate', onPop);
  };
  window.addEventListener('popstate', onPop);
}
