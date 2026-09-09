import { baseConfig } from '@packages/eslint-config'
import globals from 'globals'

export default [
  {
    ignores: [
      'app-dist/**',
      'lib-dist/**',
      '**/*.d.ts',
      '**/*.d.ts/**',
      '**/package-lock.json',
      '**/package-lock.json/**',
      '**/tsconfig.json',
      '**/tsconfig.json/**',
      'test/helpers/background.js',
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
    files: ['test/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
]
