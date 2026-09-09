import { baseConfig } from '@packages/eslint-config'
import globals from 'globals'

export default [
  {
    ignores: [
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
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
]
