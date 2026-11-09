// S1 タイトル（画面設計 3章）

import { track } from '../../analytics';
import { config } from '../../data';
import { t } from '../../i18n';
import type { ScreenFactory } from '../app';
import { button, externalLink, h, linkButton } from '../dom';
import { disclaimer, soundButton, versionLabel } from '../parts';
import { TICKET_ART } from '../ticket';

export const titleScreen: ScreenFactory<'title'> = (app) => {
  const sound = soundButton();
  const art = h('div', { className: 'title-ticket' });
  art.innerHTML = TICKET_ART;
  const credit = externalLink(t('app.credit'), config.links.follow);
  credit.addEventListener('click', () => track('main_app_click', { target: 'follow' }));

  const el = h('section', { className: 'screen screen-title' }, [
    h('div', { className: 'top-bar' }, [versionLabel(), sound.el]),
    h('h1', { className: 'title', text: t('app.name') }),
    h('p', { className: 'lead', text: t('app.tagline') }),
    art,
    button(t('title.start'), () => app.go('play', { from: 'title' }), 'btn btn-primary btn-start'),
    h('nav', { className: 'link-row' }, [
      linkButton(t('common.basisLink'), () => {
        track('basis_open', { from: 'title' });
        app.openModal('basis');
      }),
      linkButton(t('common.privacyLink'), () => app.openModal('privacy')),
    ]),
    disclaimer(),
    h('p', { className: 'credit' }, [credit]),
  ]);
  return { el, unmount: sound.dispose };
};
