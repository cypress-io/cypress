import { baseConfig, jsonConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
  ...jsonConfig,
  {
    files: ['**/*.spec.ts', '**/*.ts'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
]
