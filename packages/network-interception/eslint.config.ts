import { baseConfig } from '@packages/eslint-config'

export default [
  {
    ignores: [
      '**/dist',
      '**/dist/**',
      'cjs/',
      'cjs/**',
      'esm/',
      'esm/**',
      '**/*.d.ts',
      '**/*.d.ts/**',
      '**/package-lock.json',
      '**/package-lock.json/**',
      '**/tsconfig.json',
      '**/tsconfig.json/**',
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
