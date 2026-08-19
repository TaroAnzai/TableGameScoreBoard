import { parseUtcString, toLocalDate } from '@/src/utils/date_utils';

describe('parseUtcString', () => {
  it('ISO 8601形式のUTC文字列をDateに変換する', () => {
    const result = parseUtcString('2025-10-31T02:00:00Z');

    expect(result).toEqual(new Date('2025-10-31T02:00:00Z'));
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
