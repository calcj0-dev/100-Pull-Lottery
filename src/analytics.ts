// 計測（技術設計 7章）。ページの表示は Vercel Analytics、イベントは GA4。
// 失敗しても例外を出さない（広告ブロックなどで読み込めなくても遊べるように）。
// 送らないもの：個人を特定できる情報、金額そのもの（当たりの合計など）。押すたびのイベントも送らない

import { inject } from '@vercel/analytics';
import { getLocale } from './i18n';

export type LuckBucket = '<1' | '1-10' | '10-50' | '50-90' | '90+';
export type PressedBucket = '1-9' | '10-49' | '50-99';
export type ModeId = 'hundred';

export type AnalyticsEvent =
  | { name: 'start'; props: { from: 'title' | 'retry' } }
  | { name: 'finish'; props: { title: string; best: string; luck: LuckBucket } }
  | { name: 'quit'; props: { pressed: PressedBucket } }
  | { name: 'jackpot'; props: Record<string, never> }
  | { name: 'share_click'; props: { method: 'x_intent' | 'web_share' | 'save_image'; title: string } }
  | { name: 'main_app_click'; props: { target: 'tameru' | 'tva' | 'follow' } }
  | { name: 'retry'; props: Record<string, never> }
  | { name: 'basis_open'; props: { from: 'title' | 'result' } };

type Gtag = (...args: unknown[]) => void;
type GtagWindow = { dataLayer?: unknown[]; gtag?: Gtag };

/** GA4 の測定ID（環境変数 VITE_GA_ID）。空なら GA4 は読み込まない */
export function gaId(): string {
  return ((import.meta.env.VITE_GA_ID as string | undefined) ?? '').trim();
}

/** 起動時に1回呼ぶ */
export function initAnalytics(): void {
  try {
    // Vercel Analytics（ページの表示）。公開版だけ
    if (import.meta.env.PROD) inject({ mode: 'production', framework: 'vanilla' });
  } catch {
    // 読み込めなくても遊べる
  }
  const id = gaId();
  if (!id) return;
  try {
    const w = window as unknown as GtagWindow;
    w.dataLayer = w.dataLayer ?? [];
    w.gtag = function gtag() {
      // gtag.js は arguments をそのまま受け取る決まり
      w.dataLayer!.push(arguments);
    };
    w.gtag('js', new Date());
    w.gtag('config', id);
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.append(s);
  } catch {
    // 読み込めなくても遊べる
  }
}

let mode: ModeId = 'hundred';

/** 今のモード（全イベントに付ける。今は常に hundred。技術設計 9章） */
export function setMode(next: ModeId): void {
  mode = next;
}

/** イベントを送る。全イベントに lang・mode を付ける */
export function track<N extends AnalyticsEvent['name']>(name: N, props: Extract<AnalyticsEvent, { name: N }>['props']): void {
  try {
    const gtag = (window as unknown as GtagWindow).gtag;
    if (typeof gtag !== 'function') return;
    gtag('event', name, { ...props, lang: getLocale(), mode });
  } catch {
    // 計測の失敗で遊びを止めない
  }
}

/** 運の良さ（その合計以上の人の割合。0〜1）の区分 */
export function luckBucket(upper: number): LuckBucket {
  const pct = upper * 100;
  if (pct < 1) return '<1';
  if (pct < 10) return '1-10';
  if (pct < 50) return '10-50';
  if (pct < 90) return '50-90';
  return '90+';
}

/** 途中でやめたときの押した回数の区分。0回なら区分なし（null） */
export function pressedBucket(n: number): PressedBucket | null {
  if (n <= 0) return null;
  if (n <= 9) return '1-9';
  if (n <= 49) return '10-49';
  return '50-99';
}
