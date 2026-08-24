import { baseConfig, frontendOverrides } from '@packages/eslint-config'
import globals from 'globals'
import vueParser from 'vue-eslint-parser'

export default [
  {
    ignores: [
      '**/dist',
      '**/*.d.ts',
      '**/package-lock.json',
      '**/tsconfig.json',
      '**/cypress/fixtures',
      '**/generated',
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
  {
    files: ['script/**/*.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
]
