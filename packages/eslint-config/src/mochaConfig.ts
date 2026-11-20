// Pulls the eslint-plugin-mocha declaration into every program that includes this file
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./eslint-plugin-mocha.d.ts" />
import type { Linter } from 'eslint'
import mocha from 'eslint-plugin-mocha'

const recommended = mocha.configs.recommended

const files = ['**/*.cy.{js,jsx,ts,tsx,mjs,cjs}', '**/cypress/**/*.{js,jsx,ts,tsx,mjs,cjs}']

/**
 * eslint-plugin-mocha's rules, for files whose tests run on mocha. `baseConfig`
 * applies them to Cypress specs and support files. A workspace with Node-side
 * mocha suites spreads it again after `baseConfig`, narrowing `files` to them:
 * `...mochaConfig.map((block) => ({ ...block, files: ['test/**'] }))`.
 */
export const mochaConfig: Linter.Config[] = [
  {
    ...recommended,
    files,
    rules: {
      ...recommended.rules,
      'mocha/no-exclusive-tests': 'error',
      // rules that are gold standard, but have many violations. The ones set to
      // `off` here should be re-enabled once their violations are fixed; that
      // work is tracked in https://github.com/cypress-io/cypress/issues/35250
      'mocha/no-mocha-arrows': 'off',
      'mocha/no-setup-in-suite': 'off',
      'mocha/max-top-level-suites': 'off',
      'mocha/no-root-hooks': 'off',
      'mocha/no-top-level-tests': 'off',
      'mocha/no-pending-tests': 'off',
      // no-async-in-sync-tests reads Cypress command chains as unawaited
      // promises. The others report real bugs, so each is re-enabled once its
      // own violations are fixed.
      'mocha/no-async-in-sync-tests': 'off',
      'mocha/handle-done-callback': 'off',
      'mocha/no-conditional-tests': 'off',
      'mocha/no-code-after-done': 'off',
      'mocha/consistent-structure': 'off',
    },
  },
  // eslint-plugin-mocha treats any file with a Mocha call, hooks included, as a
  // test file, which takes in support files, test generators and plugin source
  // whose exports are their purpose. The rule is there because importing a spec
  // registers its tests in the importer, so only spec files are held to it.
  {
    files,
    ignores: ['**/*.cy.*', '**/*.spec.*', '**/*_spec.*', '**/*-spec.*', '**/*.test.*'],
    rules: {
      'mocha/no-exports': 'off',
    },
  },
]
