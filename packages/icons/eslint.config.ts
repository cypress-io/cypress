import { baseConfig } from '@packages/eslint-config'

export default [
  {
    ignores: [
      '**/dist',
      '**/dist/**',
      'index.js',
      'index.js/**',
      'index.mjs',
      'index.mjs/**',
      '**/*.d.ts',
      '**/*.d.ts/**',
      '**/*.d.mts',
      '**/*.d.mts/**',
      '**/package-lock.json',
      '**/package-lock.json/**',
      '**/tsconfig.json',
      '**/tsconfig.json/**',
      '**/cypress/fixtures',
      '**/cypress/fixtures/**',
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
