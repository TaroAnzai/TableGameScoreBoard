const expoConfig = require('eslint-config-expo/flat');
const simpleImportSort = require('eslint-plugin-simple-import-sort');

module.exports = [
  ...expoConfig,

  {
    ignores: ['node_modules/**', '.expo/**', 'dist/**', 'build/**', 'android/**', 'ios/**'],
  },

  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
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
      'simple-import-sort/imports': 'warn',
      'simple-import-sort/exports': 'warn',
    },
  },
];
