import { getResourceKey } from '@/src/utils/accessLevel_utils';

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
