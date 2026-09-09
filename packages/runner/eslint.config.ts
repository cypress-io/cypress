import { baseConfig } from '@packages/eslint-config'

export default [
  {
    ignores: [
      'dist',
      'dist/**',
      '**/*.d.ts',
      '**/package-lock.json',
      '**/tsconfig.json',
      'injection/dist',
      'injection/dist/**',
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
    // this package still renders with React 16
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    settings: {
      react: {
        version: '16.12',
      },
    },
  },
  {
    files: ['injection/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        window: true,
        parent: true,
      },
    },
  },
]
