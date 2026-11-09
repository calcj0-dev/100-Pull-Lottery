// scripts/luck-table.mjs の型（テストから使うため）
import type { LuckTable } from '../src/data';
export const TABLE_PATH: URL;
export function buildLuckTable(prizes: unknown, hundred: { presses: number; ticketsPerPress: number }): LuckTable;
export function serialize(table: LuckTable): string;
export function buildFromFiles(): LuckTable;
