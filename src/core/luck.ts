// 運の良さ（ゲーム仕様 6章・技術設計 5.2）
import type { GameConfig, LuckTable } from '../data';

/** 当たりの合計 total 以上になる人の割合（0〜1）。表の中で total 以下で一番大きい合計の値。cap を超えたら overCap */
export function upperOf(total: number, table: LuckTable): number {
  if (total > table.cap) return table.overCap;
  const e = table.entries;
  let lo = 0;
  let hi = e.length - 1;
  let ans = 0;
  while (lo <= hi) {
    const m = (lo + hi) >> 1;
    if (e[m]![0]! <= total) {
      ans = m;
      lo = m + 1;
    } else hi = m - 1;
  }
  return e[ans]![1]!;
}

export type LuckLabel = { key: 'pct' | 'under'; value: string };

/** 表示用の「上位〇%」の数字。1%以上は整数に切り上げ、minPct 以上は小数1けたに切り上げ、それ未満は「minPct%未満」 */
export function luckLabel(upper: number, rule: GameConfig['luckDisplay']): LuckLabel {
  const pct = upper * 100;
  // 浮動小数の誤差で 52.0000001 が 53 にならないよう、切り上げの前に小さな値を引く
  if (pct >= 1) return { key: 'pct', value: String(Math.min(100, Math.ceil(pct - 1e-9))) };
  if (pct >= rule.minPct) return { key: 'pct', value: (Math.ceil(pct * 10 - 1e-9) / 10).toFixed(1) };
  return { key: 'under', value: String(rule.minPct) };
}
