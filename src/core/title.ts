// 称号（ゲーム仕様 5章・技術設計 5.2）：一番大きい当たりの等級で、titles.json を上から評価
import type { TitleData } from '../data';
import type { PrizeId } from './draw';

export function titleOf(best: PrizeId | null, titles: TitleData): string {
  for (const t of titles.titles) {
    if (t.prizes.length === 0 && best === null) return t.id;
    if (best !== null && t.prizes.includes(best)) return t.id;
  }
  throw new Error(`no title for ${best}`);
}

/** 結果画面の音の種類（big／mid／small／lose） */
export function titleSound(titleId: string, titles: TitleData): string {
  const t = titles.titles.find((x) => x.id === titleId);
  if (!t) throw new Error(`unknown title: ${titleId}`);
  return t.sound;
}
