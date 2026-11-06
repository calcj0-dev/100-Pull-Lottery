// JSON のデータを読み込み、型を付けて渡す窓口（技術設計 2.1）。
// satisfies により、項目の不足・型の違いはビルド時にエラーになる。
// 中身の検査（ID の重複・表の順番など）は #2 で足す

import type { Locale, Messages } from './i18n/types';
import configJson from './data/config.json';
import jaJson from './data/i18n/ja.json';
import luckTableJson from './data/luck_table.json';
import prizesJson from './data/prizes.json';
import titlesJson from './data/titles.json';

export type SoundName = 'pon' | 'chari' | 'chari2' | 'fanfare' | 'fanfareLong' | 'sad';
export type ResultSound = 'big' | 'mid' | 'small' | 'lose';

export type PrizeData = {
  version: number;
  source: { basis: string; checkedAt: string; ref: string; officialChecked: boolean };
  price: number;
  unitTickets: number;
  prizes: { id: string; amount: number; perUnit: number }[];
};

export type TitleData = {
  version: number;
  rule: string;
  titles: { id: string; prizes: string[]; sound: string }[];
};

export type GameConfig = {
  version: number;
  modes: {
    hundred: { enabled: boolean; presses: number; ticketsPerPress: number };
    infinite: { enabled: boolean; ticketsPerYear: number | null; note: string };
  };
  luckDisplay: { minPct: number };
  fullScreenPrizes: string[];
  sounds: {
    press: string;
    miss: string | null;
    byPrize: Record<string, string>;
    result: Record<ResultSound, string>;
  };
  hashtag: string;
  links: { tameru: string; tva: string; follow: string; xIntent: string };
};

export type LuckTable = {
  version: number;
  generatedBy: string;
  basis: string;
  cap: number;
  overCap: number;
  entries: number[][];
};

export const config = configJson satisfies GameConfig;
export const prizeData = prizesJson satisfies PrizeData;
export const titleData = titlesJson satisfies TitleData;
export const luckTable = luckTableJson satisfies LuckTable;

/** 言語ごとの文言。言語を足すときは JSON を作ってここに1行足す */
export const messagesByLocale = { ja: jaJson } satisfies Record<Locale, Messages>;

/** 作品のURL（環境変数 VITE_SITE_URL。技術設計 3章）。未設定なら今のページのURL */
export function siteUrl(): string {
  const v = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim();
  if (v) return v;
  return typeof location === 'undefined' ? '' : location.origin + location.pathname;
}

/** シェアするURL。作品のURLだけ（結果は入れない。技術設計 6章） */
export function shareUrl(): string {
  return siteUrl();
}
