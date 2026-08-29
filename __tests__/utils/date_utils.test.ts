import {
  formatLocalDateTime,
  parseUtcString,
  toLocalDate,
  toUtcString,
} from '@/src/utils/date_utils';

describe('parseUtcString', () => {
  it('ISO 8601形式のUTC文字列をDateに変換する', () => {
    const result = parseUtcString('2025-10-31T02:00:00Z');

    expect(result).toEqual(new Date('2025-10-31T02:00:00Z'));
  });

  it.each([null, undefined, ''])('値がない場合はnullを返す (%p)', (value) => {
    expect(parseUtcString(value)).toBeNull();
  });

  it('不正な日時文字列はnullを返す', () => {
    expect(parseUtcString('not-a-date')).toBeNull();
  });
});

describe('日時の保存・表示', () => {
  it('DateをISO 8601形式のUTC文字列へ変換する', () => {
    expect(toUtcString(new Date('2026-08-29T01:02:03.000Z'))).toBe(
      '2026-08-29T01:02:03.000Z',
    );
  });

  it.each([null, undefined])('Dateがない場合は保存値も表示も空にする (%p)', (value) => {
    expect(toUtcString(value)).toBeNull();
    expect(formatLocalDateTime(value)).toBe('');
  });

  it('日本語ロケールの年月日時分として表示する', () => {
    const date = new Date(2026, 7, 29, 10, 5);

    expect(formatLocalDateTime(date)).toMatch(/2026\/08\/29 10:05/);
  });
});

describe('toLocalDate', () => {
  it('UTC文字列にタイムゾーンオフセットを二重に加算しない', () => {
    const result = toLocalDate('2026-08-16T19:41:00Z');

    expect(result).toEqual(new Date('2026-08-16T19:41:00Z'));
  });

  it('タイムゾーンなしの文字列をローカル時刻として保持する', () => {
    const result = toLocalDate('2026-08-17T04:41:00');

    expect(result).toEqual(new Date('2026-08-17T04:41:00'));
  });
});
