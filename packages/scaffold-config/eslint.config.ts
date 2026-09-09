import { baseConfig } from '@packages/eslint-config'

export default [
  {
    ignores: [
      '**/tsconfig.json',
      '**/tsconfig.json/**',
      'cjs/',
      'cjs/**',
      'esm/',
      'esm/**',
      'browser/',
      'browser/**',
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
