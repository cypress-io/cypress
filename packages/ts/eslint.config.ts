import { baseConfig } from '@packages/eslint-config'

export default [
  {
    ignores: [
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
