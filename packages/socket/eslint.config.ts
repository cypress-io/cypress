import { baseConfig } from '@packages/eslint-config'

export default [
  {
    ignores: [
      '**/tsconfig.json',
      'cjs/**',
      'esm/**',
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
