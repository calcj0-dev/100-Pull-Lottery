// 金額の書き方（技術設計 5.3）。sim/format.mjs と同じ。単位の文字は ja.json の format
// 1万で割り切れる金額は「万・億」（3万円、1億5,000万円）。割り切れない金額は、1億未満ならカンマ区切り（6,900円）、
// 1億以上なら「億・万」＋端数（7億1万2,300円）。マイナスは先頭に「−」

export type YenFormat = { yen: string; man: string; oku: string };

const MINUS = '−';
const comma = (n: number) => n.toLocaleString('ja-JP');

/** 「円」を付けない数の部分 */
export function formatNumberJa(v: number, f: Pick<YenFormat, 'man' | 'oku'>): string {
  const oku = Math.floor(v / 1e8);
  const man = Math.floor((v % 1e8) / 1e4);
  const rest = v % 1e4;
  if (rest === 0 && v >= 1e4) return (oku ? comma(oku) + f.oku : '') + (man ? comma(man) + f.man : '');
  if (v < 1e8) return comma(v);
  return comma(oku) + f.oku + (man ? comma(man) + f.man : '') + (rest ? comma(rest) : '');
}

export function formatYen(v: number, f: YenFormat): string {
  const sign = v < 0 ? MINUS : '';
  return sign + f.yen.replace('{n}', formatNumberJa(Math.abs(v), f));
}

/**
 * 「〇分の1」の〇（画面設計 M2）。割り切れなければ approx。
 * 丸め方：1万以上は万の単位、1万未満は整数に四捨五入（約33万、約10万、約333）
 */
export function formatOdds(unitTickets: number, perUnit: number, f: Pick<YenFormat, 'man' | 'oku'>): { n: string; approx: boolean } {
  const v = unitTickets / perUnit;
  const rounded = v >= 1e4 ? Math.round(v / 1e4) * 1e4 : Math.round(v);
  return { n: formatNumberJa(rounded, f), approx: rounded !== v };
}
