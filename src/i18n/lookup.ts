// 点でつないだキー（"play.buy"）で入れ子の文言を引く。見つからなければ undefined
export function lookup(m: unknown, key: string): string | undefined {
  let cur: unknown = m;
  for (const part of key.split('.')) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === 'string' ? cur : undefined;
}
