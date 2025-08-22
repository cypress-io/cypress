import { baseConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
  {
    ignores: ['./index.js', '**/*.d.ts', 'lib/**/*.js', 'angular/**/*', 'react/**/*', 'svelte/**/*', 'vue/**/*', 'mount-utils/**/*'],
  },
  {
    rules: {
      '@stylistic/semi': 'off',
      '@stylistic/comma-dangle': 'off',
      '@stylistic/quotes': 'off',
      '@stylistic/no-undef': 'off',
      'padding-line-between-statements': 'off',
      '@stylistic/arrow-parens': 'off',
    },
  },
]
