import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { t } from '../src/i18n';
import { APP_VERSION } from '../src/version';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8')) as { version: string };

describe('バージョン（技術設計 13.1）', () => {
  it('package.json の version が埋め込まれる', () => {
    expect(APP_VERSION).toBe(pkg.version);
  });

  it('セマンティック バージョニングの形', () => {
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('画面には先頭に v を付けて出す', () => {
    expect(t('app.version', { version: '0.1.0' })).toBe('v0.1.0');
  });
});
