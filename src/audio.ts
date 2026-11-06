// 効果音（ゲーム仕様 7章）。素材ファイルは使わず Web Audio で合成する（前作 audio.ts を流用）。
// 連打に備え、音は「押した音」と「結果の音」の2つの系統に分け、同じ系統で新しい音が鳴ったら前の音を止める。
// iOS は利用者が触ったときに AudioContext を作り直す・再開する必要がある

import type { SoundName } from './data';
import { settings } from './settings';

let ctx: AudioContext | null = null;

/** 最初のタッチ・クリックで呼ぶ。以後は鳴らせるようになる */
export function unlockAudio(): void {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
}

type Tone = {
  freq: number;
  /** 終わりの周波数（音の高さを動かすとき） */
  to?: number;
  type?: OscillatorType;
  /** 開始までの遅れ（秒） */
  at?: number;
  dur: number;
  gain?: number;
};

export type Channel = 'press' | 'result';

const playing: Record<Channel, OscillatorNode[]> = { press: [], result: [] };

function stopChannel(channel: Channel): void {
  for (const osc of playing[channel]) {
    try {
      osc.stop();
    } catch {
      // すでに止まっている
    }
  }
  playing[channel] = [];
}

function play(channel: Channel, tones: Tone[]): void {
  if (!settings.sound || !ctx || ctx.state !== 'running') return;
  stopChannel(channel);
  const now = ctx.currentTime;
  for (const tone of tones) {
    const t0 = now + (tone.at ?? 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = tone.type ?? 'sine';
    osc.frequency.setValueAtTime(tone.freq, t0);
    if (tone.to) osc.frequency.exponentialRampToValueAtTime(tone.to, t0 + tone.dur);
    const peak = tone.gain ?? 0.15;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + tone.dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + tone.dur + 0.02);
    playing[channel].push(osc);
  }
}

const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const C6 = 1046.5;
const G4 = 392;

/** 音の中身。名前は config.json の sounds で使うもの */
export const SOUNDS: Record<SoundName, Tone[]> = {
  /** 「買う」を押した：短く軽いポン */
  pon: [{ freq: 880, to: 620, dur: 0.07, gain: 0.12 }],
  /** 7等・6等：高い音の短いチャリン */
  chari: [
    { freq: 2093, type: 'triangle', dur: 0.08, gain: 0.08 },
    { freq: 2637, type: 'triangle', dur: 0.18, at: 0.05, gain: 0.08 },
  ],
  /** 5等：チャリンを2回、少し大きく */
  chari2: [
    { freq: 2093, type: 'triangle', dur: 0.08, gain: 0.11 },
    { freq: 2637, type: 'triangle', dur: 0.16, at: 0.05, gain: 0.11 },
    { freq: 2093, type: 'triangle', dur: 0.08, at: 0.16, gain: 0.11 },
    { freq: 3136, type: 'triangle', dur: 0.24, at: 0.21, gain: 0.11 },
  ],
  /** 組違い賞以上：短いファンファーレ（1秒以内） */
  fanfare: [
    { freq: C5, type: 'square', dur: 0.1, gain: 0.06 },
    { freq: E5, type: 'square', dur: 0.1, at: 0.1, gain: 0.06 },
    { freq: G5, type: 'square', dur: 0.1, at: 0.2, gain: 0.06 },
    { freq: C6, type: 'square', dur: 0.5, at: 0.3, gain: 0.07 },
    { freq: G5, type: 'triangle', dur: 0.5, at: 0.3, gain: 0.08 },
  ],
  /** 結果（big）：長めのファンファーレ */
  fanfareLong: [
    { freq: G4, type: 'square', dur: 0.14, gain: 0.06 },
    { freq: C5, type: 'square', dur: 0.14, at: 0.15, gain: 0.06 },
    { freq: E5, type: 'square', dur: 0.14, at: 0.3, gain: 0.06 },
    { freq: G5, type: 'square', dur: 0.3, at: 0.45, gain: 0.06 },
    { freq: E5, type: 'square', dur: 0.14, at: 0.78, gain: 0.06 },
    { freq: C6, type: 'square', dur: 1.0, at: 0.95, gain: 0.07 },
    { freq: G5, type: 'triangle', dur: 1.0, at: 0.95, gain: 0.08 },
    { freq: E5, type: 'triangle', dur: 1.0, at: 0.95, gain: 0.08 },
  ],
  /** 結果（lose）：下がる2音 */
  sad: [
    { freq: 392, to: 330, type: 'triangle', dur: 0.25, gain: 0.12 },
    { freq: 330, to: 262, type: 'triangle', dur: 0.45, at: 0.22, gain: 0.12 },
  ],
};

/** 名前で鳴らす。押した音は 'press'、それ以外は 'result' の系統 */
export function playSound(name: SoundName, channel: Channel = name === 'pon' ? 'press' : 'result'): void {
  play(channel, SOUNDS[name]);
}

/** 結果の系統の音を止める（画面を離れたときなど） */
export function stopSounds(): void {
  stopChannel('press');
  stopChannel('result');
}
