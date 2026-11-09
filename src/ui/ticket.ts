// くじ券の絵（画面設計 3章・4章【案】）。絵に文字は入れない（くじの名前は文言として重ねる。技術設計 14章）。
// 実在の宝くじ券のデザインに似せない：角を丸めた紙に、金の枠と星を並べただけの架空の券

export const TICKET_ART =
  '<svg class="ticket-art" viewBox="0 0 320 160" aria-hidden="true" focusable="false">' +
  '<defs><pattern id="tk-dots" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="1.4" fill="rgba(255,255,255,.18)"/></pattern></defs>' +
  '<rect x="2" y="2" width="316" height="156" rx="14" fill="var(--red)"/>' +
  '<rect x="2" y="2" width="316" height="156" rx="14" fill="url(#tk-dots)"/>' +
  '<rect x="14" y="14" width="292" height="132" rx="8" fill="none" stroke="var(--gold-light)" stroke-width="3"/>' +
  '<rect x="22" y="22" width="276" height="116" rx="5" fill="none" stroke="var(--gold-light)" stroke-width="1" stroke-dasharray="4 4"/>' +
  '<g fill="var(--gold-light)">' +
  '<path d="M44 46l3.5 7 7.7 1.1-5.6 5.4 1.3 7.7L44 63.6l-6.9 3.6 1.3-7.7-5.6-5.4 7.7-1.1z"/>' +
  '<path d="M276 46l3.5 7 7.7 1.1-5.6 5.4 1.3 7.7-6.9-3.6-6.9 3.6 1.3-7.7-5.6-5.4 7.7-1.1z"/>' +
  '<path d="M44 96l3.5 7 7.7 1.1-5.6 5.4 1.3 7.7-6.9-3.6-6.9 3.6 1.3-7.7-5.6-5.4 7.7-1.1z"/>' +
  '<path d="M276 96l3.5 7 7.7 1.1-5.6 5.4 1.3 7.7-6.9-3.6-6.9 3.6 1.3-7.7-5.6-5.4 7.7-1.1z"/>' +
  '</g>' +
  '<circle cx="2" cy="80" r="9" fill="var(--bg)"/><circle cx="318" cy="80" r="9" fill="var(--bg)"/>' +
  '</svg>';
