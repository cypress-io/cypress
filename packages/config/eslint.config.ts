import { baseConfig } from '@packages/eslint-config'

export default [
  {
    ignores: [
      '**/cjs',
      '**/cjs/**',
      '**/esm',
      '**/esm/**',
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
      'test/__fixtures__/**',
      'test/__babel_fixtures__/**',
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
