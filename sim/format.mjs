// 金額の書き方と投稿文の参照実装
// 決まり：1万で割り切れる金額は「万・億」で書く（3万円、10万円、1億5,000万円、7億円）
//         割り切れない金額は、1億未満ならカンマ区切り（6,900円、12,700円）、1億以上なら「億・万」＋端数（7億1万2,300円）
import fs from 'node:fs';
const ja = JSON.parse(fs.readFileSync(new URL('../src/data/i18n/ja.json', import.meta.url), 'utf8'));
const c = (n) => n.toLocaleString('ja-JP');
export function formatYen(v, f = ja.format) {
  const sign = v < 0 ? '−' : ''; v = Math.abs(v);
  const oku = Math.floor(v / 1e8), man = Math.floor((v % 1e8) / 1e4), rest = v % 1e4;
  let s;
  if (rest === 0 && v >= 1e4) s = (oku ? c(oku) + f.oku : '') + (man ? c(man) + f.man : '');
  else if (v < 1e8) s = c(v);
  else s = c(oku) + f.oku + (man ? c(man) + f.man : '') + (rest ? c(rest) : '');
  return sign + f.yen.replace('{n}', s);
}
export const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
// Xの文字数：全角などは2、半角英数記号は1、URLは23で数える（簡易版。実装は twitter-text と同じ考え方）
export function xLength(text, url) { let n = 0; for (const ch of text) n += /[\u0000-ჿ -‍‐-‟′-‷]/.test(ch) ? 1 : 2; return n + (url ? 1 + 23 : 0); }
export { ja };
