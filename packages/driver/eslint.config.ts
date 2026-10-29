import { baseConfig, jsonConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
  ...jsonConfig,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    // Specs may use sync fs and the other APIs restricted in shipped code
    files: ['cypress/**', 'test/**'],
    rules: {
      'no-restricted-properties': 'off',
      'no-restricted-syntax': 'off',
    },
  },
  {
    files: ['cypress/**/*.cy.{js,jsx}'],
    rules: {
      'no-restricted-syntax': ['error', {
        selector: 'Program',
        message: 'Driver specs must be TypeScript (.cy.ts).',
      }],
    },
  },
  {
    // Fixtures are served to the AUT as-is, and _test-output is written by specs at run time
    ignores: ['cypress/fixtures/**', 'cypress/_test-output/**'],
  },
]
