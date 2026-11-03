import { baseConfig, jsonConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
  ...jsonConfig,
  {
    files: ['**/*.js', '**/*.ts'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    // This script runs in the AUT, and passes a bundler-defined `process`
    // through to node test plugins when one exists
    files: ['client/**/*.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
      },
    },
  },
]
