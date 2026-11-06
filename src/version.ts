// 画面に出すバージョン（技術設計 13.1）。値は package.json からビルド時に埋め込まれる
export const APP_VERSION: string = __APP_VERSION__;

export function formatVersion(version: string): string {
  return `v${version}`;
}
