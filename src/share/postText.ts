// 投稿文（ゲーム仕様 8.1）と X の文字数（受け入れ T-07）
import { format, type Vars } from '../i18n';

export type ShareVars = { spent: string; won: string; pct: string; title: string; hashtag: string };

/** 投稿文。運の良さが minPct 以上なら textPct、未満なら textUnder（テンプレートは ja.json の share） */
export function shareText(templates: { textPct: string; textUnder: string }, under: boolean, vars: ShareVars): string {
  return format(under ? templates.textUnder : templates.textPct, vars as unknown as Vars);
}

/** 1と数える文字（twitter-text の重みの決まり。それ以外は2） */
const LIGHT = /[\u0000-ჿ -‍‐-‟′-‷]/u;

/** X の文字数：全角などは2、半角英数記号は1。URL は 23 で数え、前に空白1つ */
export function xLength(text: string, url?: string): number {
  let n = 0;
  for (const ch of text) n += LIGHT.test(ch) ? 1 : 2;
  return n + (url ? 1 + 23 : 0);
}

export const X_MAX = 280;
