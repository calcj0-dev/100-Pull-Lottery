// 100回モードの状態（技術設計 4.1）。sim/lottery.mjs の newGame・press と同じ結果になる（T-01）
import type { GameConfig, PrizeData } from '../data';
import { amountOf, drawTicket, type PrizeId } from './draw';
import type { Rng } from './rng';

export type HundredConfig = GameConfig['modes']['hundred'];

export type Game = {
  /** 押した回数（0〜presses） */
  pressed: number;
  /** 使ったお金 */
  spent: number;
  /** 当たりの合計 */
  won: number;
  /** 等級ごとの本数（当たった等級だけ） */
  counts: Partial<Record<PrizeId, number>>;
  /** 一番大きい当たり */
  best: PrizeId | null;
  /** 直前に押した回の結果（ticketsPerPress 枚） */
  last: (PrizeId | null)[];
};

export function newGame(): Game {
  return { pressed: 0, spent: 0, won: 0, counts: {}, best: null, last: [] };
}

/** 「買う」を1回押す。ticketsPerPress 枚を抽選して状態を書き換え、その回の結果を返す。presses を超えて押したら例外 */
export function press(game: Game, rng: Rng, data: PrizeData, cfg: HundredConfig): (PrizeId | null)[] {
  if (isFinished(game, cfg)) throw new Error('already finished');
  const results: (PrizeId | null)[] = [];
  for (let i = 0; i < cfg.ticketsPerPress; i++) {
    const id = drawTicket(rng, data);
    game.spent += data.price;
    if (id) {
      const amount = amountOf(id, data);
      game.won += amount;
      game.counts[id] = (game.counts[id] ?? 0) + 1;
      if (!game.best || amount > amountOf(game.best, data)) game.best = id;
    }
    results.push(id);
  }
  game.pressed++;
  game.last = results;
  return results;
}

export function isFinished(game: Game, cfg: HundredConfig): boolean {
  return game.pressed >= cfg.presses;
}

/** 差し引き（画面では毎回計算する） */
export function net(game: Pick<Game, 'won' | 'spent'>): number {
  return game.won - game.spent;
}
