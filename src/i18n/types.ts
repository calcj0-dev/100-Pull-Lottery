// 文言の型（技術設計 14章）。日本語の JSON（src/data/i18n/ja.json）の形を正とし、
// ほかの言語の JSON も同じ形を持つ。キーは "play.buy" のように点でつないで指す

import type jaJson from '../data/i18n/ja.json';

export type Locale = 'ja';

/** ja.json と同じ形で、値がすべて文字列のもの */
type DeepStrings<T> = { [K in keyof T]: T[K] extends string ? string : DeepStrings<T[K]> };
export type Messages = DeepStrings<typeof jaJson>;

/** 入れ子のキーを "a.b" の形に並べたもの */
type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

export type MessageKey = Leaves<Messages>;
