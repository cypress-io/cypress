import { baseConfig } from '@packages/eslint-config'
import globals from 'globals'

export default [
  {
    ignores: [
      '**/dist',
      '**/dist/**',
      '**/*.d.ts',
      '**/*.d.ts/**',
      '**/package-lock.json',
      '**/package-lock.json/**',
      '**/tsconfig.json',
      '**/tsconfig.json/**',
      '**/cypress/fixtures',
      '**/cypress/fixtures/**',
      '**/_test-output',
      '**/_test-output/**',
    ],
  },
  ...baseConfig,
  {
    files: ['**/*.{ts,js,jsx,tsx,vue}'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    // Cypress plugin/server files are Node, the specs reach for Buffer
    files: ['cypress/plugins/**/*.js', 'cypress/e2e/**/*.{js,ts}', 'cypress/support/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
]
