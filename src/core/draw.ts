// 1枚の抽選（ゲーム仕様 3章・技術設計 5.1）。sim/lottery.mjs の drawTicket と同じ
import type { PrizeData } from '../data';
import type { Rng } from './rng';

export type PrizeId = string;

/** 0〜(unitTickets−1) の整数を1つ引き、prizes の並び順に本数を積み上げた区間で等級を決める。どれにも入らなければ null（ハズレ） */
export function drawTicket(rng: Rng, data: PrizeData): PrizeId | null {
  const r = Math.floor(rng() * data.unitTickets);
  let acc = 0;
  for (const pr of data.prizes) {
    acc += pr.perUnit;
    if (r < acc) return pr.id;
  }
  return null;
}

/** 等級の当せん金 */
export function amountOf(id: PrizeId, data: PrizeData): number {
  const pr = data.prizes.find((p) => p.id === id);
  if (!pr) throw new Error(`unknown prize: ${id}`);
  return pr.amount;
}
