import { baseConfig } from '@packages/eslint-config'

export default [
  {
    ignores: [
      'cjs/**',
      'esm/**',
      'dist/**',
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
