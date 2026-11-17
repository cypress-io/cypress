import { baseConfig, compatConfig, jsonConfig, noFloatingPromisesConfig, vitestConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
  ...jsonConfig,
  // Shipped entry points outside the shared src/** glob
  ...compatConfig.map((block) => ({ ...block, files: [...(block.files ?? []), 'index.ts'] })),
  ...vitestConfig,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
  noFloatingPromisesConfig(['index.ts', 'src/**/*.ts']),
  {
    // Specs may use sync fs and the other APIs restricted in shipped code
    files: ['cypress/**', 'test/**'],
    rules: {
      'no-restricted-properties': 'off',
      'no-restricted-syntax': 'off',
    },
  },
  {
    // The driver implements the commands: its specs assert on what they return, and
    // its internals under src/cypress call `cy` methods like `cy.config` that the
    // rule mistakes for commands
    rules: {
      'cypress/no-assigning-return-values': 'off',
    },
  },
  {
    // The vitest suites under test/unit/cypress match the shared `**/cypress/**`
    // spec glob, but run in Node with no command queue, so async tests are correct
    files: ['test/**'],
    rules: {
      'cypress/no-async-tests': 'off',
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
