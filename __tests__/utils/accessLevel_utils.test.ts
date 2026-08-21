import { getAccessLevelstring, getResourceKey } from '@/src/utils/accessLevel_utils';

describe('getAccessLevelstring', () => {
  it('最も高い有効なアクセスレベルを返す', () => {
    expect(
      getAccessLevelstring([
        { short_key: 'view-key', access_level: 'VIEW' },
        { short_key: 'owner-key', access_level: 'OWNER' },
      ]),
    ).toBe('OWNER');
  });

  it('未知のアクセスレベルはVIEWとして扱う', () => {
    expect(getAccessLevelstring([{ short_key: 'unknown-key', access_level: 'ADMIN' }])).toBe(
      'VIEW',
    );
  });

  it('未知のアクセスレベルより有効なアクセスレベルを優先する', () => {
    expect(
      getAccessLevelstring([
        { short_key: 'unknown-key', access_level: 'ADMIN' },
        { short_key: 'edit-key', access_level: 'EDIT' },
      ]),
    ).toBe('EDIT');
  });
});

describe('getResourceKey', () => {
  it('利用可能なリンクから OWNER、EDIT、VIEW の順でキーを選ぶ', () => {
    expect(
      getResourceKey({
        owner_link: 'owner-key',
        edit_link: 'edit-key',
        view_link: 'view-key',
      }),
    ).toBe('owner-key');
    expect(getResourceKey({ edit_link: 'edit-key', view_link: 'view-key' })).toBe('edit-key');
    expect(getResourceKey({ view_link: 'view-key' })).toBe('view-key');
  });
});
