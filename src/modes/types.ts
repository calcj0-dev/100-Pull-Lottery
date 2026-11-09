// モードの入口（技術設計 9章）。画面はこの型の結果だけを見て表示する。無限モードは後で modes/infinite.ts を足す

import type { PrizeId } from '../core/draw';

export type ModeResult = {
  spent: number;
  won: number;
  counts: Partial<Record<PrizeId, number>>;
  best: PrizeId | null;
  /** 当たりの合計がこれ以上になる人の割合（0〜1） */
  upper: number;
  titleId: string;
};

export interface Mode {
  id: 'hundred';
  /** 「買う」を1回押す。その回の結果（ticketsPerPress 枚） */
  press(): (PrizeId | null)[];
  readonly pressed: number;
  readonly presses: number;
  readonly spent: number;
  readonly won: number;
  readonly counts: Partial<Record<PrizeId, number>>;
  readonly finished: boolean;
  result(): ModeResult;
}
