import { baseConfig } from '@packages/eslint-config'

export default [
  {
    ignores: [
      // fixture with intentionally invalid syntax
      'cypress/tests/e2e/compile-error.js',
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
      '**/test/fixtures',
      '**/test/fixtures/**',
      '**/_test-output',
      '**/_test-output/**',
      'cypress/tests/e2e/compile-error.js',
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
]
