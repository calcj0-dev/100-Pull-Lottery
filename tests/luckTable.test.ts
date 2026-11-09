// T-04 運の良さの表（計算と検証 4章）。表の引き方（upperOf）のテストは core と一緒に #3 で足す
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TABLE_PATH, buildFromFiles, serialize } from '../scripts/luck-table.mjs';

describe('T-04 運の良さの表', () => {
  it('scripts/luck-table.mjs で作り直した表が luck_table.json と同じ', () => {
    expect(serialize(buildFromFiles())).toBe(readFileSync(TABLE_PATH, 'utf-8'));
  }, 60_000);
});
