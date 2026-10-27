import { baseConfig, jsonConfig } from '@packages/eslint-config'
import globals from 'globals'

export default [
  ...baseConfig,
  ...jsonConfig,
  {
    ignores: [
      // deliberately invalid input for the compile-error e2e run and the unit tests
      'cypress/tests/e2e/compile-error.js',
      'test/fixtures/**',
      'test/_test-output/**',
    ],
  },
  {
    files: ['**/*.js', '**/*.ts'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.node,
      },
    },
  },
]
