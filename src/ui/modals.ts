// 重ね表示（画面設計 7章）。M1 結果画像、M2 計算の前提、M3 プライバシー

import { gaId, track } from '../analytics';
import { resultShareText } from '../share/postText';
import { resultImage } from '../share/resultImage';
import { canShareImage, isTouch, saveImage, shareWithImage, toDataUrl } from '../share/share';
import { formatOdds, formatYen } from '../core/format';
import { config, messagesByLocale, prizeData } from '../data';
import { getLocale, t, tId } from '../i18n';
import type { App, ModalFactory, ModalName } from './app';
import { button, externalLink, h } from './dom';

const fmt = () => messagesByLocale[getLocale()].format;

function frame(app: App, heading: string, body: (Node | null)[]): HTMLElement {
  return h('div', { className: 'modal-body' }, [
    h('h2', { className: 'modal-heading', text: heading }),
    ...body,
    h('div', { className: 'modal-actions' }, [button(t('common.close'), () => app.closeModal(), 'btn')]),
  ]);
}

/** M2 計算の前提：注記、等級の表（prizes.json から作る）、運の良さの説明、出典 */
const basis: ModalFactory = (app) => {
  const rows = prizeData.prizes.map((p) => {
    const o = formatOdds(prizeData.unitTickets, p.perUnit, fmt());
    return h('tr', {}, [
      h('th', { text: tId('prizes', p.id), attrs: { scope: 'row' } }),
      h('td', { text: formatYen(p.amount, fmt()) }),
      h('td', { text: p.perUnit.toLocaleString(getLocale()) }),
      h('td', { text: t(o.approx ? 'basis.chanceApprox' : 'basis.chance', { n: o.n }) }),
    ]);
  });
  return frame(app, t('basis.heading'), [
    h('p', { text: t('basis.note') }),
    h('p', { text: t('basis.unit') }),
    h('div', { className: 'table-wrap' }, [
      h('table', { className: 'basis-table' }, [
        h('thead', {}, [
          h('tr', {}, [
            h('th', { text: t('basis.colPrize'), attrs: { scope: 'col' } }),
            h('th', { text: t('basis.colAmount'), attrs: { scope: 'col' } }),
            h('th', { text: t('basis.colPerUnit'), attrs: { scope: 'col' } }),
            h('th', { text: t('basis.colChance'), attrs: { scope: 'col' } }),
          ]),
        ]),
        h('tbody', {}, rows),
      ]),
    ]),
    h('p', { text: t('basis.luck') }),
    h('p', { className: 'source', text: t('basis.source') }),
  ]);
};

/** M3 プライバシーについて（技術設計 7.3。文言は U4：公開前にオーナー確認）。GA4 を使わないときは Vercel Analytics だけの説明 */
const privacy: ModalFactory = (app) => {
  const p = (text: string) => h('p', { text });
  const link = (text: string, href: string) => h('p', {}, [externalLink(text, href)]);
  const body = gaId()
    ? [
        p(t('privacy.p1')),
        p(t('privacy.p2')),
        p(t('privacy.p3')),
        p(t('privacy.p4')),
        p(t('privacy.p5')),
        p(t('privacy.p6')),
        link(t('privacy.googlePolicy'), config.links.googlePrivacy),
        link(t('privacy.optout'), config.links.gaOptout),
        link(t('privacy.vercelPolicy'), config.links.vercelPrivacy),
      ]
    : [
        p(t('privacy.basic.p1')),
        p(t('privacy.basic.p2')),
        p(t('privacy.basic.p3')),
        p(t('privacy.p4')),
        p(t('privacy.p5')),
        link(t('privacy.vercelPolicy'), config.links.vercelPrivacy),
      ];
  return frame(app, t('privacy.heading'), body);
};

/** M1 結果画像のプレビュー：画像を幅いっぱいに。「画像を付けてシェア」（使える端末だけ）「画像を保存」「閉じる」 */
const image: ModalFactory = (app) => {
  const r = app.lastResult;
  const img = h('img', { className: 'image-preview', attrs: { alt: t('image.alt'), width: '1200', height: '630' } });
  let blob: Blob | null = null;
  const titleId = r?.titleId ?? '';
  const shareBtn = button(
    t('result.shareImage'),
    () => {
      if (!blob || !r) return;
      track('share_click', { method: 'web_share', title: titleId });
      void shareWithImage(resultShareText(r), blob);
    },
    'btn btn-primary',
  );
  const saveBtn = button(
    t('result.saveImage'),
    () => {
      if (!blob) return;
      track('share_click', { method: 'save_image', title: titleId });
      void saveImage(blob);
    },
    'btn',
  );
  shareBtn.hidden = true;
  saveBtn.disabled = true;
  if (r) {
    void resultImage(r).then(async (b) => {
      blob = b;
      if (!b) return;
      shareBtn.hidden = !(isTouch() && canShareImage(b));
      saveBtn.disabled = false;
      img.src = await toDataUrl(b);
    });
  }
  return h('div', { className: 'modal-body modal-image' }, [
    img,
    h('p', { className: 'note', text: t('image.longPress') }),
    h('div', { className: 'modal-actions stack' }, [shareBtn, saveBtn, button(t('common.close'), () => app.closeModal(), 'btn btn-plain')]),
  ]);
};

export const modals: Record<ModalName, ModalFactory> = { basis, privacy, image };
