import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

// バージョンは package.json の1か所で持ち、ビルド時に埋め込む（技術設計 13.1）
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as { version: string };

export default defineConfig({
  // どこに置いても動くよう相対パスにする（技術設計 3章）
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
