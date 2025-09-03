import { baseConfig, cliOverrides } from '@packages/eslint-config'

export default [
  ...baseConfig,
  ...cliOverrides,
  {
    ignores: [
      '**/dist',
      '**/*.d.ts',
      '**/package-lock.json',
      '**/tsconfig.json',
      '**/cypress/fixtures',
    ],
  },
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
]
