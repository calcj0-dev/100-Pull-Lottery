// 投稿文が X の上限（280）に収まるかを、全称号×最も長くなる金額で確かめる
import { formatYen, fill, xLength, ja } from './format.mjs';
const longest = [30000, 700012300, 1050003000, 6900, 0];
let worst = 0, sample;
for (const t of Object.values(ja.titles)) for (const w of longest) for (const key of ['textPct', 'textUnder']) {
  const text = fill(ja.share[key], { spent: formatYen(30000), won: formatYen(w), pct: key === 'textPct' ? '100' : '0.1', title: t, hashtag: '宝くじ100連ガチャ' });
  const len = xLength(text, 'https://example.vercel.app/'); if (len > worst) { worst = len; sample = text; }
}
console.log('最長', worst, '/ 280\n', sample);
for (const v of [300, 3000, 6900, 10000, 12700, 30000, 100000, 105000, 1000000, 150000000, 700000000, 700012300, -23100]) console.log(v, formatYen(v));
