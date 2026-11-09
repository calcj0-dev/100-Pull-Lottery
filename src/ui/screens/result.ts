// S3 結果（画面設計 6章）

import { track } from '../../analytics';
import { playSound } from '../../audio';
import { formatYen } from '../../core/format';
import { net } from '../../core/hundred';
import { luckLabel } from '../../core/luck';
import { config, messagesByLocale, prizeData, titleData, type ResultSound, type SoundName } from '../../data';
import { titleSound } from '../../core/title';
import { getLocale, t, tId } from '../../i18n';
import { resultShareText } from '../../share/postText';
import { resultImage } from '../../share/resultImage';
import { canShareImage, isTouch, openXIntent, shareWithImage, toDataUrl } from '../../share/share';
import type { ScreenFactory } from '../app';
import { button, externalLink, h, linkButton } from '../dom';
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

  /** 外部リンク（新しいタブ）。押したら main_app_click */
  const appLink = (text: string, href: string, target: 'tameru' | 'tva' | 'follow', className: string) => {
    const a = externalLink(text, href);
    a.className = className;
    a.addEventListener('click', () => track('main_app_click', { target }));
    return a;
  };

  app.lastResult = r;

  // 結果画像は画面を開いたときに作り始める（シェアのときにすぐ使えるように）
  let imageBlob: Blob | null = null;
  const thumbImg = h('img', { className: 'thumb-img', attrs: { alt: t('image.alt'), width: '1200', height: '630' } });
  void resultImage(r).then(async (b) => {
    imageBlob = b;
    if (b) thumbImg.src = await toDataUrl(b);
  });
  const thumb = h('button', { className: 'thumb', attrs: { type: 'button', 'aria-label': t('image.alt') }, on: { click: () => app.openModal('image') } }, [thumbImg]);

  /** 「Xでシェア」：画像を付けて共有できるスマホは Web Share、それ以外は X の投稿画面（技術設計 6章） */
  const onShare = () => {
    const text = resultShareText(r);
    if (isTouch() && imageBlob && canShareImage(imageBlob)) {
      track('share_click', { method: 'web_share', title: r.titleId });
      void shareWithImage(text, imageBlob);
    } else {
      track('share_click', { method: 'x_intent', title: r.titleId });
      openXIntent(text);
    }
  };

  // 結果の音（称号ごとの big／mid／small／lose。ゲーム仕様 5章）
  playSound(config.sounds.result[titleSound(r.titleId, titleData) as ResultSound] as SoundName);

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
    thumb,
    h('div', { className: 'result-actions' }, [
      button(t('result.share'), onShare, 'btn btn-share'),
      button(
        t('result.retry'),
        () => {
          track('retry', {});
          app.go('play', { from: 'retry' });
        },
        'btn btn-primary',
      ),
    ]),
    h('section', { className: 'apps' }, [
      h('h2', { className: 'apps-heading', text: t('links.heading') }),
      h('div', { className: 'app-card' }, [
        h('p', { text: t('links.tameru') }),
        appLink(t('links.tameruButton'), config.links.tameru, 'tameru', 'btn btn-app'),
      ]),
      h('div', { className: 'app-card' }, [
        h('p', { text: t('links.tva') }),
        appLink(t('links.tvaButton'), config.links.tva, 'tva', 'btn btn-app'),
      ]),
      appLink(t('links.follow'), config.links.follow, 'follow', 'link follow-link'),
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
