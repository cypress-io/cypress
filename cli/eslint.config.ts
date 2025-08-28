import { baseConfig, cliOverrides, globals } from '@packages/eslint-config'
import expectType from 'eslint-plugin-expect-type/configs/recommended'

const config = [
  ...baseConfig,
  ...cliOverrides,
  expectType,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
        projectService: true,
      },
      globals: {
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        process: 'readonly',
        ...globals.specHelper,
      },
    },
    rules: {
      '@stylistic/comma-dangle': 'warn',
      '@stylistic/comma-spacing': 'warn',
      '@stylistic/type-generic-spacing': 'warn',
      '@stylistic/quotes': 'warn',
      '@stylistic/arrow-parens': 'warn',
      '@stylistic/space-before-function-paren': 'warn',
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
    ],
  },
]

export default config
