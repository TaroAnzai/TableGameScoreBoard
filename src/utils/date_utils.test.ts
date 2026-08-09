import { parseUtcString } from './date_utils';

describe('parseUtcString', () => {
  it('ISO 8601形式のUTC文字列をDateに変換する', () => {
    const result = parseUtcString('2025-10-31T02:00:00Z');

    expect(result).toEqual(new Date('2025-10-31T02:00:00Z'));
  });
});
