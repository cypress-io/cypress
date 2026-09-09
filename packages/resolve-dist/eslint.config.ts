import { baseConfig } from '@packages/eslint-config'

export default [
  {
    ignores: [
      '**/tsconfig.json',
      '**/tsconfig.json/**',
      '**/tsconfig.base.json',
      '**/tsconfig.base.json/**',
      '**/tsconfig.esm.json',
      '**/tsconfig.esm.json/**',
      '**/tsconfig.cjs.json',
      '**/tsconfig.cjs.json/**',
      'cjs/index.js',
      'cjs/index.js/**',
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
