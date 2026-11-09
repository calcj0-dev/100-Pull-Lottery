// 演出（画面設計 4章・5章）：くじ券の上の帯、紙吹雪。動きを減らす設定では動かさない（画面設計 9章）

import { h } from './dom';

export const reduceMotion = (): boolean => {
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

/** 帯を出す時間（ミリ秒）【案】 */
export const BAND_MS = 1000;

/**
 * くじ券の上に帯（「4等 100万円！」）を出す。次に押されたら前の帯は消す。
 * 戻り値で、出ている帯を消せる
 */
export function createBand(host: HTMLElement): { show(text: string): void; hide(): void } {
  const el = h('div', { className: 'band', attrs: { 'aria-hidden': 'true' } });
  host.append(el);
  let timer = 0;
  const hide = () => {
    clearTimeout(timer);
    el.classList.remove('show');
    el.getAnimations?.().forEach((a) => a.cancel());
  };
  return {
    show(text) {
      hide();
      el.textContent = text;
      el.classList.add('show');
      if (!reduceMotion() && typeof el.animate === 'function') {
        el.animate(
          [
            { transform: 'translate(-50%, -50%) rotate(-6deg) scale(1.6)', opacity: 0 },
            { transform: 'translate(-50%, -50%) rotate(-6deg) scale(1)', opacity: 1, offset: 0.15 },
            { transform: 'translate(-50%, -50%) rotate(-6deg) scale(1)', opacity: 1, offset: 0.85 },
            { transform: 'translate(-50%, -50%) rotate(-6deg) scale(1)', opacity: 0 },
          ],
          { duration: BAND_MS, easing: 'ease-out' },
        );
      }
      timer = window.setTimeout(hide, BAND_MS);
    },
    hide,
  };
}

const CONFETTI_COLORS = ['#c8322f', '#f3d27a', '#c08a1e', '#ffffff', '#e86a4a'];

/** 紙吹雪を host の中に降らせる。動きを減らす設定では何もしない。戻り値で止める */
export function confetti(host: HTMLElement, count = 80): () => void {
  if (reduceMotion()) return () => {};
  const layer = h('div', { className: 'confetti', attrs: { 'aria-hidden': 'true' } });
  for (let i = 0; i < count; i++) {
    const p = h('i');
    const size = 6 + Math.random() * 6;
    p.style.left = `${Math.random() * 100}%`;
    p.style.width = `${size}px`;
    p.style.height = `${size * (0.4 + Math.random() * 0.6)}px`;
    p.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length]!;
    p.style.animationDelay = `${Math.random() * 1.2}s`;
    p.style.animationDuration = `${2.2 + Math.random() * 1.8}s`;
    p.style.setProperty('--drift', `${(Math.random() - 0.5) * 120}px`);
    p.style.setProperty('--spin', `${(Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 720)}deg`);
    layer.append(p);
  }
  host.append(layer);
  return () => layer.remove();
}
