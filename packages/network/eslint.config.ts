import { baseConfig } from '@packages/eslint-config'

export default [
  {
    ignores: [
      'cjs/',
      'cjs/**',
      'esm/',
      'esm/**',
      '**/*.d.ts',
      '**/*.d.ts/**',
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
