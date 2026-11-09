// 乱数の型。本番は Math.random、テストは再現できる mulberry32（ゲーム仕様 3章）
export type Rng = () => number;

/** sim/lottery.mjs の mulberry32 と同じ */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
