// 重ね表示（画面設計 7章）。M2 計算の前提、M3 プライバシー。M1 結果画像は #7 で作る

import { formatOdds, formatYen } from '../core/format';
import { messagesByLocale, prizeData } from '../data';
import { getLocale, t, tId } from '../i18n';
import type { App, ModalFactory, ModalName } from './app';
import { button, h } from './dom';

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

/** M3 プライバシーについて（文言は U4：公開前にオーナー確認） */
const privacy: ModalFactory = (app) => frame(app, t('privacy.heading'), [h('p', { text: t('privacy.body') })]);

/** M1 結果画像のプレビュー（#7 で作る） */
const image: ModalFactory = (app) => frame(app, t('result.shareImage'), []);

export const modals: Record<ModalName, ModalFactory> = { basis, privacy, image };
