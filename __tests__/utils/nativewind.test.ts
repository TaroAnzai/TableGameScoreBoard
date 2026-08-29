const mockVars = jest.fn((variables: Record<string, string>) => variables);

jest.mock('nativewind', () => ({
  vars: (variables: Record<string, string>) => mockVars(variables),
}));

import {
  createNativeWindTheme,
  semanticColorVariables,
} from '@/src/lib/theme/nativewind';
import { lightTheme } from '@/src/lib/theme/themes';

describe('createNativeWindTheme', () => {
  it('すべてのセマンティックカラーを対応する CSS 変数へ変換する', () => {
    const expectedVariables = Object.fromEntries(
      Object.entries(semanticColorVariables).map(([role, variable]) => [
        variable,
        lightTheme[role as keyof typeof lightTheme],
      ]),
    );

    const result = createNativeWindTheme(lightTheme);

    expect(mockVars).toHaveBeenCalledTimes(1);
    expect(mockVars).toHaveBeenCalledWith(expectedVariables);
    expect(result).toEqual(expectedVariables);
    expect(Object.keys(expectedVariables)).toHaveLength(
      Object.keys(lightTheme).length,
    );
  });
});
