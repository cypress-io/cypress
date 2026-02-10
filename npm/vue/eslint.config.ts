import { baseConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
  {
    files: ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx', '**/*.vue'],
    rules: {
      'no-console': 'off',
      'mocha/no-global-tests': 'off',
      'vue/multi-word-component-names': 'off',
    },
  },
]
