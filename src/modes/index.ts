// 遊べるモードの一覧（技術設計 9章）。config.json の modes で enabled のものだけ。
// 2つ以上のときだけ、タイトル画面にモードの選択を出す（今は 100回モードだけなので出さない。受け入れ T-13）
import type { GameConfig } from '../data';

export type ModeId = keyof GameConfig['modes'];

export function availableModes(cfg: Pick<GameConfig, 'modes'>): ModeId[] {
  return (Object.keys(cfg.modes) as ModeId[]).filter((id) => cfg.modes[id].enabled);
}

export function showModeSelect(cfg: Pick<GameConfig, 'modes'>): boolean {
  return availableModes(cfg).length > 1;
}
