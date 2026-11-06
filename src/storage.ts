// 端末への保存（技術設計 10章）。保存するのは音の設定だけ。
// 保存できない環境（プライベートブラウズなど）では初期値で動く

const PREFIX = 'baka040.';

export type StorageKey = 'sound';

export function load(key: StorageKey, fallback: string): string {
  try {
    return globalThis.localStorage?.getItem(PREFIX + key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function save(key: StorageKey, value: string): void {
  try {
    globalThis.localStorage?.setItem(PREFIX + key, value);
  } catch {
    // 保存できなくても遊べるようにする
  }
}
