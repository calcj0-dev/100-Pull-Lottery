// S2 購入中（画面設計 4章）。押した瞬間に結果・残りの回数・金額を書き換え、演出の終わりを待たない（技術設計 11章）

import { luckBucket, pressedBucket, track } from '../../analytics';
import { playSound } from '../../audio';
import { formatYen } from '../../core/format';
import { net } from '../../core/hundred';
import type { PrizeId } from '../../core/draw';
import { config, messagesByLocale, prizeData, type SoundName } from '../../data';
import { getLocale, t, tId } from '../../i18n';
import { createHundred } from '../../modes/hundred';
import type { Mode } from '../../modes/types';
import type { ScreenFactory } from '../app';
import { h } from '../dom';
import { soundButton } from '../parts';
import { TICKET_ART } from '../ticket';

const BACK_ICON =
  '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const yen = (v: number) => formatYen(v, messagesByLocale[getLocale()].format);
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 当せん金の大きい順の等級 ID */
const BY_AMOUNT = [...prizeData.prizes].sort((a, b) => b.amount - a.amount);
const amountOf = (id: PrizeId) => prizeData.prizes.find((p) => p.id === id)!.amount;

export const playScreen: ScreenFactory<'play'> = (app, params) => {
  const mode: Mode = createHundred();
  app.game = mode;
  track('start', { from: params?.from ?? 'title' });

  const sound = soundButton();
  const back = h('button', {
    className: 'icon-btn',
    attrs: { type: 'button', 'aria-label': t('play.back') },
    on: { click: () => history.back() },
  });
  back.innerHTML = BACK_ICON;

  const remaining = h('p', { className: 'remaining' });
  const bar = h('div', { className: 'progress-bar' });
  const progressText = h('span', { className: 'progress-text' });
  const progress = h('div', { className: 'progress', attrs: { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(mode.presses) } }, [
    h('div', { className: 'progress-track' }, [bar]),
    progressText,
  ]);

  const resultText = h('p', { className: 'ticket-result', attrs: { 'aria-live': 'polite' } });
  const ticket = h('div', { className: 'ticket' }, [
    h('p', { className: 'ticket-name', text: t('lotteryName') }),
    resultText,
  ]);
  ticket.insertAdjacentHTML('afterbegin', TICKET_ART);

  const spentEl = h('dd');
  const wonEl = h('dd');
  const netEl = h('dd');
  const money = h('dl', { className: 'money' }, [
    h('div', {}, [h('dt', { text: t('play.spent') }), spentEl]),
    h('div', {}, [h('dt', { text: t('play.won') }), wonEl]),
    h('div', {}, [h('dt', { text: t('play.net') }), netEl]),
  ]);
  const hits = h('p', { className: 'hits' });

  const buy = h('button', { className: 'btn btn-primary btn-buy', attrs: { type: 'button' }, text: t('play.buy') });

  const paint = (last: (PrizeId | null)[] | null) => {
    const left = mode.presses - mode.pressed;
    remaining.textContent = t('play.remaining', { n: left });
    bar.style.width = `${(mode.pressed / mode.presses) * 100}%`;
    progressText.textContent = t('play.progress', { n: mode.pressed, total: mode.presses });
    progress.setAttribute('aria-valuenow', String(mode.pressed));
    spentEl.textContent = yen(mode.spent);
    wonEl.textContent = yen(mode.won);
    netEl.textContent = yen(net(mode));
    netEl.classList.toggle('minus', net(mode) < 0);

    const parts = BY_AMOUNT.filter((p) => mode.counts[p.id]).map((p) =>
      t('play.hitsItem', { prize: tId('prizes', p.id), count: mode.counts[p.id]! }),
    );
    hits.textContent = parts.length ? t('play.hitsLabel') + parts.join(' ') : '';

    if (last) {
      // ticketsPerPress が1枚より多くなっても、一番大きい当たりを見せる
      const best = last.filter((x): x is PrizeId => x !== null).sort((a, b) => amountOf(b) - amountOf(a))[0] ?? null;
      resultText.textContent = best ? t('play.hit', { prize: tId('prizes', best), amount: yen(amountOf(best)) }) : t('play.miss');
      resultText.classList.toggle('miss', !best);
      resultText.dataset.prize = best ?? '';
    } else {
      resultText.textContent = '';
    }

    if (mode.finished) {
      buy.textContent = t('play.toResult');
      buy.classList.add('to-result');
    }
  };

  const shake = () => {
    if (reduceMotion() || typeof ticket.animate !== 'function') return;
    ticket.getAnimations().forEach((a) => a.cancel());
    ticket.animate(
      [{ transform: 'rotate(0) scale(1)' }, { transform: 'rotate(-1.5deg) scale(.97)' }, { transform: 'rotate(1deg) scale(1.01)' }, { transform: 'rotate(0) scale(1)' }],
      { duration: 140, easing: 'ease-out' },
    );
  };

  // 連打の勢いで「結果を見る」を押してしまわないよう、100回目のあと少しのあいだは受け付けない【案】
  const RESULT_LOCK_MS = 600;
  let finishedAt = 0;

  const doPress = () => {
    if (mode.finished) {
      if (performance.now() - finishedAt < RESULT_LOCK_MS) return;
      app.go('result', { result: mode.result() });
      return;
    }
    const last = mode.press();
    paint(last);
    shake();
    playSound(config.sounds.press as SoundName);
    const prize = last.find((x) => x !== null) ?? null;
    const s = prize ? config.sounds.byPrize[prize as keyof typeof config.sounds.byPrize] : config.sounds.miss;
    if (s) playSound(s as SoundName);

    if (mode.finished) {
      finishedAt = performance.now();
      const r = mode.result();
      track('finish', { title: r.titleId, best: r.best ?? 'none', luck: luckBucket(r.upper) });
    }
  };

  // 連打に備え pointerdown で反応させる（click の遅れをなくす）。キーボードの決定は click で受ける
  let fromPointer = false;
  buy.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    fromPointer = true;
    doPress();
  });
  buy.addEventListener('click', () => {
    if (fromPointer) {
      fromPointer = false;
      return;
    }
    doPress();
  });

  paint(null);

  const el = h('section', { className: 'screen screen-play' }, [
    h('div', { className: 'top-bar play-bar' }, [back, remaining, sound.el]),
    progress,
    ticket,
    money,
    hits,
    h('div', { className: 'buy-area' }, [buy]),
  ]);

  return {
    el,
    unmount: sound.dispose,
    onBack: () => {
      if (!mode.finished) {
        const b = pressedBucket(mode.pressed);
        if (b) track('quit', { pressed: b });
      }
      app.game = null;
    },
  };
};
