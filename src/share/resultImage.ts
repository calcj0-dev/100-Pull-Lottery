// 結果画像 1200×630（技術設計 8章・画面設計 M1【案】）。画面に出さない Canvas に描いて PNG にする（前作の作りを流用）
// 中身：作品名、「{使ったお金}使って、当たりは{当たりの合計}」、上位〇%の運、称号（一番大きく）、作品のURL、免責1行

import { formatYen } from '../core/format';
import { luckLabel } from '../core/luck';
import { config, messagesByLocale, siteUrl } from '../data';
import { getLocale, t, tId } from '../i18n';
import type { ModeResult } from '../modes/types';
import { TICKET_ART } from '../ui/ticket';

const W = 1200;
const H = 630;
const PAD = 64;
const FONT = 'system-ui, "Hiragino Sans", "Noto Sans JP", sans-serif';
const COLORS = {
  bg: '#fffdf8',
  text: '#22201c',
  sub: '#6b665d',
  red: '#c8322f',
  redDark: '#9f2421',
  gold: '#c08a1e',
  goldLight: '#f3d27a',
  line: '#e6e0d4',
};

/** 幅に収まるよう、文字を小さくする（最小 min px）。決まった大きさを返す */
function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, size: number, weight: number, min = 18): number {
  let s = size;
  for (; s > min; s -= 2) {
    ctx.font = `${weight} ${s}px ${FONT}`;
    if (ctx.measureText(text).width <= maxWidth) break;
  }
  ctx.font = `${weight} ${s}px ${FONT}`;
  return s;
}

/** くじ券の絵（CSS の色の変数を実際の色に置き換えて画像にする） */
function ticketImage(): Promise<HTMLImageElement | null> {
  const svg = TICKET_ART.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
    .replace(/var\(--red\)/g, COLORS.red)
    .replace(/var\(--gold-light\)/g, COLORS.goldLight)
    .replace(/var\(--bg\)/g, COLORS.bg);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

/** 画像に入れる文言（テストで確かめられるよう、描く処理と分ける） */
export function imageLines(r: ModeResult) {
  const fmt = messagesByLocale[getLocale()].format;
  const luck = luckLabel(r.upper, config.luckDisplay);
  return {
    heading: t('image.heading'),
    line1: t('image.line1', { spent: formatYen(r.spent, fmt), won: formatYen(r.won, fmt) }),
    luck: t(luck.key === 'pct' ? 'image.luckPct' : 'image.luckUnder', { pct: luck.value }),
    title: tId('titles', r.titleId),
    url: siteUrl().replace(/^https?:\/\//, '').replace(/\/$/, ''),
    footer: t('image.footer'),
  };
}

export async function renderResultImage(r: ModeResult): Promise<Blob | null> {
  try {
    await document.fonts?.ready;
  } catch {
    // フォントの読み込みを待てなくても描く
  }
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const L = imageLines(r);
  const maxW = W - PAD * 2;

  // 地：紙の白に、上下の赤い帯
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = COLORS.red;
  ctx.fillRect(0, 0, W, 14);
  ctx.fillRect(0, H - 14, W, 14);

  // 右上：くじ券の絵（傾ける）
  const ticket = await ticketImage();
  if (ticket) {
    ctx.save();
    ctx.translate(W - PAD - 120, 108);
    ctx.rotate((8 * Math.PI) / 180);
    ctx.drawImage(ticket, -120, -60, 240, 120);
    ctx.restore();
  }

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  // 作品名
  ctx.fillStyle = COLORS.red;
  fitText(ctx, L.heading, maxW - 300, 40, 800);
  ctx.fillText(L.heading, PAD, 92);

  // 3万円使って、当たりは〇円
  ctx.fillStyle = COLORS.text;
  fitText(ctx, L.line1, maxW - 260, 50, 800, 28);
  ctx.fillText(L.line1, PAD, 172);

  // 上位〇%の運
  ctx.fillStyle = COLORS.gold;
  fitText(ctx, L.luck, maxW, 40, 800, 24);
  ctx.fillText(L.luck, PAD, 238);

  // 称号（一番大きく。金の枠の中）
  const boxY = 278;
  const boxH = 190;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(PAD, boxY, maxW, boxH, 24);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  fitText(ctx, L.title, maxW - 80, 80, 900, 40);
  ctx.fillText(L.title, W / 2, boxY + boxH / 2 + 4);

  // 下：作品のURL・免責
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = COLORS.line;
  ctx.fillRect(PAD, 520, maxW, 2);
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.sub;
  fitText(ctx, L.url, maxW / 2 - 16, 26, 600, 16);
  ctx.fillText(L.url, PAD, 572);
  ctx.textAlign = 'right';
  fitText(ctx, L.footer, maxW / 2 - 16, 22, 500, 14);
  ctx.fillText(L.footer, W - PAD, 572);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}

const cache = new WeakMap<ModeResult, Promise<Blob | null>>();

/** 1回の結果につき1回だけ作る（結果画面を開いたときに作り始め、シェアのときにすぐ使えるようにする） */
export function resultImage(r: ModeResult): Promise<Blob | null> {
  let p = cache.get(r);
  if (!p) {
    p = renderResultImage(r).catch(() => null);
    cache.set(r, p);
  }
  return p;
}
