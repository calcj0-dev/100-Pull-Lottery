// S3 結果（画面設計 6章）。#4 では金額・運の良さ・称号・内訳・もう一回まで。シェア・導線・音は #6・#7 で足す

import { track } from '../../analytics';
import { formatYen } from '../../core/format';
import { net } from '../../core/hundred';
import { luckLabel } from '../../core/luck';
import { config, messagesByLocale, prizeData } from '../../data';
import { getLocale, t, tId } from '../../i18n';
import type { ScreenFactory } from '../app';
import { button, h, linkButton } from '../dom';
import { disclaimer, soundButton } from '../parts';

const yen = (v: number) => formatYen(v, messagesByLocale[getLocale()].format);

export const resultScreen: ScreenFactory<'result'> = (app, params) => {
  const r = params.result;
  const sound = soundButton();
  const luck = luckLabel(r.upper, config.luckDisplay);

  const rows = [...prizeData.prizes]
    .sort((a, b) => b.amount - a.amount)
    .filter((p) => r.counts[p.id])
    .map((p) => h('li', { text: t('result.breakdownRow', { prize: tId('prizes', p.id), amount: yen(p.amount), count: r.counts[p.id]! }) }));

  const el = h('section', { className: 'screen screen-result' }, [
    h('div', { className: 'top-bar result-bar' }, [h('h1', { className: 'result-heading', text: t('result.heading') }), sound.el]),
    h('dl', { className: 'money money-result' }, [
      h('div', {}, [h('dt', { text: t('result.spent') }), h('dd', { text: yen(r.spent) })]),
      h('div', { className: 'won' }, [h('dt', { text: t('result.won') }), h('dd', { text: yen(r.won) })]),
      h('div', {}, [h('dt', { text: t('result.net') }), h('dd', { text: yen(net(r)) })]),
    ]),
    h('p', { className: 'luck', text: t(luck.key === 'pct' ? 'result.luckPct' : 'result.luckUnder', { pct: luck.value }) }),
    h('div', { className: 'honor' }, [
      h('p', { className: 'honor-label', text: t('result.titleLabel') }),
      h('p', { className: 'honor-name', text: tId('titles', r.titleId) }),
    ]),
    h('section', { className: 'breakdown' }, [
      h('h2', { text: t('result.breakdown') }),
      rows.length ? h('ul', {}, rows) : h('p', { text: t('result.breakdownNone') }),
    ]),
    h('div', { className: 'result-actions' }, [
      button(
        t('result.retry'),
        () => {
          track('retry', {});
          app.go('play', { from: 'retry' });
        },
        'btn btn-primary',
      ),
    ]),
    h('nav', { className: 'link-row' }, [
      linkButton(t('common.basisLink'), () => {
        track('basis_open', { from: 'result' });
        app.openModal('basis');
      }),
      linkButton(t('common.privacyLink'), () => app.openModal('privacy')),
    ]),
    disclaimer(),
  ]);
  return { el, unmount: sound.dispose, onBack: () => (app.game = null) };
};
