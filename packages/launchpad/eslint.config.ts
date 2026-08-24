import { baseConfig, frontendOverrides } from '@packages/eslint-config'
import vueParser from 'vue-eslint-parser'

export default [
  {
    ignores: [
      '**/dist',
      '**/dist-*',
      '**/*.d.ts',
      '**/*.gen.ts',
      '**/package-lock.json',
      '**/tsconfig.json',
      '**/cypress/fixtures',
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
