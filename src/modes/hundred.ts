// 100回モード（技術設計 4.1・9章）

import { isFinished, newGame, press } from '../core/hundred';
import { upperOf } from '../core/luck';
import type { Rng } from '../core/rng';
import { titleOf } from '../core/title';
import { config, luckTable, prizeData, titleData } from '../data';
import type { Mode } from './types';

export function createHundred(rng: Rng = Math.random): Mode {
  const cfg = config.modes.hundred;
  const game = newGame();
  return {
    id: 'hundred',
    press: () => press(game, rng, prizeData, cfg),
    get pressed() {
      return game.pressed;
    },
    presses: cfg.presses,
    get spent() {
      return game.spent;
    },
    get won() {
      return game.won;
    },
    get counts() {
      return game.counts;
    },
    get finished() {
      return isFinished(game, cfg);
    },
    result() {
      return {
        spent: game.spent,
        won: game.won,
        counts: { ...game.counts },
        best: game.best,
        upper: upperOf(game.won, luckTable),
        titleId: titleOf(game.best, titleData),
      };
    },
  };
}
