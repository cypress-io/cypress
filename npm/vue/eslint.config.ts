import { baseConfig } from '@packages/eslint-config'
import vueParser from 'vue-eslint-parser'

export default [
  { ignores: ['**/dist', '**/*.d.ts', '**/package-lock.json', '**/tsconfig.json', '**/cypress/fixtures'] },
  ...baseConfig,
  {
    files: ['**/*.{js,ts,jsx,tsx,vue}'],
    languageOptions: {
      parserOptions: { tsconfigRootDir: __dirname },
      globals: {
        defineProps: 'readonly',
        defineEmits: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'mocha/no-global-tests': 'off',
      'vue/no-required-prop-with-default': 'off',
    },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: '@typescript-eslint/parser',
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    files: ['cypress/**/*.{js,ts,jsx,tsx,vue}'],
    languageOptions: {
      globals: { Cypress: 'readonly', cy: 'readonly', expect: 'readonly' },
    },
  },
  {
    files: ['vite.config.ts'],
    rules: {
      'import-x/namespace': 'off',
      'import-x/default': 'off',
    },
  },
]
