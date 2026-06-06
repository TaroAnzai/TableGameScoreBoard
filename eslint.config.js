const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,

  {
    ignores: ['node_modules/**', '.expo/**', 'dist/**', 'build/**', 'android/**', 'ios/**'],
  },

  {
    rules: {
      // 未使用変数
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      // console.log許可
      'no-console': 'off',

      // ==禁止
      eqeqeq: ['error', 'always'],

      // import順序
      'sort-imports': 'off',
      'func-style': ['error', 'expression'],
      'prefer-arrow-callback': 'error',
    },
  },
];
