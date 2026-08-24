import { baseConfig, frontendOverrides } from '@packages/eslint-config'
import vueParser from 'vue-eslint-parser'

export default [
  {
    ignores: [
      '**/dist',
      '**/dist-*',
      '**/*.d.ts',
      '**/package-lock.json',
      '**/tsconfig.json',
      '**/cypress/fixtures',
      'src/store/mobx-runner-store.ts',
    ],
  },
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: { tsconfigRootDir: __dirname },
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
  ...frontendOverrides,
]
