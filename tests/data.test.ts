// T-08 データの検査（技術設計 2.1）
import { describe, expect, it } from 'vitest';
import { config, luckTable, messagesByLocale, prizeData, titleData } from '../src/data';
import { checkData, type AllData } from '../src/dataCheck';

const good = (): AllData =>
  structuredClone({ prizes: prizeData, titles: titleData, config, luckTable, messages: messagesByLocale.ja }) as AllData;

/** 壊したデータで検査が失敗し、その理由に pattern が含まれること */
function expectBroken(mutate: (d: AllData) => void, pattern: RegExp): void {
  const d = good();
  mutate(d);
  const errors = checkData(d);
  expect(errors.length, 'should fail').toBeGreaterThan(0);
  expect(errors.join('\n')).toMatch(pattern);
}

describe('T-08 データの検査', () => {
  it('今のデータは検査に通る', () => {
    expect(checkData(good())).toEqual([]);
  });

  it('等級IDの重複', () => {
    expectBroken((d) => {
      d.prizes.prizes[1]!.id = 'p1';
    }, /duplicate prize id: p1/);
  });

  it('金額・本数が正の整数でない', () => {
    expectBroken((d) => {
      d.prizes.prizes[0]!.amount = -1;
    }, /amount must be a positive integer/);
    expectBroken((d) => {
      d.prizes.prizes[0]!.perUnit = 1.5;
    }, /perUnit must be a positive integer/);
  });

  it('本数の合計が unitTickets 以上', () => {
    expectBroken((d) => {
      d.prizes.unitTickets = 100;
    }, /sum of perUnit/);
  });

  it('称号に出てこない等級・2回出てくる等級・知らない等級', () => {
    expectBroken((d) => {
      d.titles.titles[0]!.prizes = [];
    }, /prize p1 must appear in titles exactly once \(found 0\)/);
    expectBroken((d) => {
      d.titles.titles[1]!.prizes.push('p1');
    }, /prize p1 must appear in titles exactly once \(found 2\)/);
    expectBroken((d) => {
      d.titles.titles[0]!.prizes.push('p99');
    }, /unknown prize in titles: p99/);
  });

  it('何も当たらないときの称号がちょうど1つでない', () => {
    expectBroken((d) => {
      d.titles.titles = d.titles.titles.filter((t) => t.prizes.length > 0);
    }, /exactly one title must have no prizes/);
  });

  it('文言に等級名・称号がない', () => {
    expectBroken((d) => {
      delete (d.messages.prizes as Record<string, string>).p4;
    }, /missing message: prizes\.p4/);
    expectBroken((d) => {
      delete (d.messages.titles as Record<string, string>).t_none;
    }, /missing message: titles\.t_none/);
  });

  it('等級ごとの音がない・知らない音', () => {
    expectBroken((d) => {
      delete d.config.sounds.byPrize.p5;
    }, /sounds\.byPrize is missing p5/);
    expectBroken((d) => {
      d.config.sounds.byPrize.p5 = 'boom';
    }, /unknown sound: sounds\.byPrize\.p5/);
    expectBroken((d) => {
      d.config.sounds.press = 'boom';
    }, /unknown sound: sounds\.press/);
  });

  it('画面いっぱいの演出に知らない等級', () => {
    expectBroken((d) => {
      d.config.fullScreenPrizes = ['p0'];
    }, /unknown prize in fullScreenPrizes: p0/);
  });

  it('運の良さの表の順番の崩れ', () => {
    expectBroken((d) => {
      const e = d.luckTable.entries;
      [e[3], e[4]] = [e[4]!, e[3]!];
    }, /totals must be increasing/);
    expectBroken((d) => {
      d.luckTable.entries[5]![1] = 0.99999;
    }, /upper must not increase/);
  });

  it('押す回数が正でない', () => {
    expectBroken((d) => {
      d.config.modes.hundred.presses = 0;
    }, /modes\.hundred/);
  });
});
