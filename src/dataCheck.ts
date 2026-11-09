// データの検査（技術設計 2.1・受け入れ T-08）。読み込み時に呼び、問題があれば一覧を返す。
// 型は satisfies で確かめるので、ここでは中身のつじつま（重複・漏れ・順番）を見る

import type { GameConfig, LuckTable, PrizeData, TitleData } from './data';
import { lookup } from './i18n/lookup';

export const SOUND_NAMES = ['pon', 'chari', 'chari2', 'fanfare', 'fanfareLong', 'sad'] as const;
export const RESULT_SOUNDS = ['big', 'mid', 'small', 'lose'] as const;

export type AllData = {
  prizes: PrizeData;
  titles: TitleData;
  config: GameConfig;
  luckTable: LuckTable;
  messages: Record<string, unknown>;
};

const isPosInt = (v: unknown): boolean => Number.isInteger(v) && (v as number) > 0;

export function checkData(d: AllData): string[] {
  const errors: string[] = [];
  const err = (msg: string) => errors.push(msg);
  const { prizes, titles, config, luckTable, messages } = d;

  // くじの数字
  if (!isPosInt(prizes.price)) err('prizes.price must be a positive integer');
  if (!isPosInt(prizes.unitTickets)) err('prizes.unitTickets must be a positive integer');
  if (prizes.prizes.length === 0) err('prizes.prizes is empty');
  const ids = prizes.prizes.map((p) => p.id);
  const known = new Set(ids);
  for (const id of known) if (ids.filter((x) => x === id).length > 1) err(`duplicate prize id: ${id}`);
  for (const p of prizes.prizes) {
    if (!isPosInt(p.amount)) err(`prize ${p.id}: amount must be a positive integer`);
    if (!isPosInt(p.perUnit)) err(`prize ${p.id}: perUnit must be a positive integer`);
  }
  const totalPerUnit = prizes.prizes.reduce((s, p) => s + p.perUnit, 0);
  if (!(totalPerUnit < prizes.unitTickets)) err('sum of perUnit must be less than unitTickets');
  const amounts = prizes.prizes.map((p) => p.amount);
  if (new Set(amounts).size !== amounts.length) {
    // 金額が同じ等級があると「一番大きい当たり」が並び順に左右される
    err('prize amounts must be distinct');
  }

  // 称号：全等級がちょうど1回ずつ。prizes が空の称号がちょうど1つ
  const titleIds = titles.titles.map((t) => t.id);
  for (const id of new Set(titleIds)) if (titleIds.filter((x) => x === id).length > 1) err(`duplicate title id: ${id}`);
  const inTitles = titles.titles.flatMap((t) => t.prizes);
  for (const id of ids) {
    const n = inTitles.filter((x) => x === id).length;
    if (n !== 1) err(`prize ${id} must appear in titles exactly once (found ${n})`);
  }
  for (const id of inTitles) if (!known.has(id)) err(`unknown prize in titles: ${id}`);
  const empty = titles.titles.filter((t) => t.prizes.length === 0).length;
  if (empty !== 1) err(`exactly one title must have no prizes (found ${empty})`);
  for (const t of titles.titles) {
    if (!(RESULT_SOUNDS as readonly string[]).includes(t.sound)) err(`title ${t.id}: unknown sound ${t.sound}`);
  }

  // 文言：全等級名・全称号・くじの名前
  for (const id of ids) if (!lookup(messages, `prizes.${id}`)) err(`missing message: prizes.${id}`);
  for (const id of titleIds) if (!lookup(messages, `titles.${id}`)) err(`missing message: titles.${id}`);

  // 設定：音
  const isSound = (s: unknown) => (SOUND_NAMES as readonly unknown[]).includes(s);
  if (!isSound(config.sounds.press)) err(`unknown sound: sounds.press = ${config.sounds.press}`);
  if (config.sounds.miss !== null && !isSound(config.sounds.miss)) err(`unknown sound: sounds.miss = ${config.sounds.miss}`);
  for (const id of ids) {
    if (!(id in config.sounds.byPrize)) err(`sounds.byPrize is missing ${id}`);
  }
  for (const [id, s] of Object.entries(config.sounds.byPrize)) {
    if (!known.has(id)) err(`unknown prize in sounds.byPrize: ${id}`);
    if (!isSound(s)) err(`unknown sound: sounds.byPrize.${id} = ${s}`);
  }
  for (const r of RESULT_SOUNDS) if (!isSound(config.sounds.result[r])) err(`unknown sound: sounds.result.${r}`);

  // 設定：1等の演出・回数
  for (const id of config.fullScreenPrizes) if (!known.has(id)) err(`unknown prize in fullScreenPrizes: ${id}`);
  const h = config.modes.hundred;
  if (!isPosInt(h.presses) || !isPosInt(h.ticketsPerPress)) err('modes.hundred.presses and ticketsPerPress must be positive integers');
  if (!(h.presses * h.ticketsPerPress * prizes.price > 0)) err('modes.hundred: presses × ticketsPerPress × price must be positive');
  if (!(config.luckDisplay.minPct > 0 && config.luckDisplay.minPct < 1)) err('luckDisplay.minPct must be between 0 and 1');

  // 運の良さの表：合計は小さい順、割合は増えない順
  const e = luckTable.entries;
  if (e.length === 0) err('luck_table.entries is empty');
  else {
    if (e[0]?.[0] !== 0 || e[0]?.[1] !== 1) err('luck_table must start with [0, 1]');
    for (let i = 0; i < e.length; i++) {
      const row = e[i]!;
      if (row.length !== 2 || !Number.isFinite(row[0]) || !Number.isFinite(row[1])) {
        err(`luck_table.entries[${i}] must be [total, upper]`);
        continue;
      }
      if (row[1]! < 0 || row[1]! > 1) err(`luck_table.entries[${i}]: upper out of range`);
      if (i > 0) {
        const prev = e[i - 1]!;
        if (!(row[0]! > prev[0]!)) err(`luck_table.entries[${i}]: totals must be increasing`);
        if (row[1]! > prev[1]!) err(`luck_table.entries[${i}]: upper must not increase`);
      }
    }
    const last = e[e.length - 1]!;
    if (last[0]! > luckTable.cap) err('luck_table: entries must not exceed cap');
    if (!(luckTable.overCap >= 0 && luckTable.overCap <= last[1]!)) err('luck_table.overCap must be between 0 and the last upper');
  }
  return errors;
}

/** 問題があれば例外にする（起動時に1回） */
export function assertData(d: AllData): void {
  const errors = checkData(d);
  if (errors.length) throw new Error(`invalid data:\n- ${errors.join('\n- ')}`);
}
