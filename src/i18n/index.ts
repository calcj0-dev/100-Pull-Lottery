// 文言の取り出し（技術設計 14章）。言語は起動時に1回だけ決める。公開時は常に ja

import { messagesByLocale } from '../data';
import type { Locale, MessageKey, Messages } from './types';

let locale: Locale = 'ja';
let messages: Messages = messagesByLocale.ja;

export function setLocale(next: Locale): void {
  locale = next;
  messages = messagesByLocale[next];
  if (typeof document !== 'undefined') document.documentElement.lang = next;
}

export function getLocale(): Locale {
  return locale;
}

export type Vars = Record<string, string | number>;

/** {name} の形の差し込みを置き換える。値がない差し込みはそのまま残す */
export function format(template: string, vars: Vars = {}): string {
  return template.replace(/\{(\w+)\}/g, (all, name: string) => (name in vars ? String(vars[name]) : all));
}

/** 点でつないだキーで文言を引く。見つからなければキーそのものを返す */
export function lookup(m: unknown, key: string): string | undefined {
  let cur: unknown = m;
  for (const part of key.split('.')) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === 'string' ? cur : undefined;
}

export function t(key: MessageKey, vars?: Vars): string {
  return format(lookup(messages, key) ?? key, vars);
}

/** 等級名・称号など、ID で引く文言（ID はデータの JSON から来るので型では決められない） */
export function tId(group: 'prizes' | 'titles', id: string): string {
  return lookup(messages, `${group}.${id}`) ?? id;
}
