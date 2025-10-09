import { baseConfig, cliOverrides } from '@packages/eslint-config'

export default [
  ...baseConfig,
  ...cliOverrides,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    rules: {
      '@stylistic/comma-dangle': 'warn',
      '@stylistic/comma-spacing': 'warn',
      '@stylistic/type-generic-spacing': 'warn',
      '@stylistic/quotes': 'warn',
      '@stylistic/arrow-parens': 'warn',
      '@stylistic/no-multi-spaces': 'warn',
      'padding-line-between-statements': 'warn',
      '@stylistic/space-unary-ops': 'warn',
      '@stylistic/member-delimiter-style': 'warn',
      '@stylistic/object-curly-spacing': 'warn',
      '@stylistic/semi': 'warn',
      '@stylistic/space-in-parens': 'warn',
      '@stylistic/space-infix-ops': 'warn',
      '@stylistic/template-tag-spacing': 'warn',
      'no-var': 'warn',
      '@stylistic/space-before-function-paren': ['warn', 'always'],
    },
  },
  {
    ignores: [
      '**/__snapshots__',
      '**/build/**/*',
      'package.json',
      '**/angular/**/*',
      '**/react/**/*',
      '**/vue/**/*',
      '**/svelte/**/*',
      '**/mount-utils/**/*',
      '**/types/{bluebird,chai,chai-jquery,jquery,lodash,minimatch,mocha,sinon,sinon-chai}/**/*',
      '.mocharc.js',
      '**/*.js',
    ],
  },
]
