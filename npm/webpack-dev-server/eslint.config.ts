import { baseConfig } from '@packages/eslint-config'

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
      '**/test/fixtures',
      '**/test/fixtures/**',
      '**/__snapshots__',
      '**/__snapshots__/**',
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
