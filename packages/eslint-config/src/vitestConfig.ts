import type { Linter } from 'eslint'
import vitest from '@vitest/eslint-plugin'

/**
 * Opt-in linting of Vitest specs, for workspaces whose unit tests run on
 * Vitest. Spread it after `baseConfig`:
 * `export default [...baseConfig, ...vitestConfig]`.
 *
 * Builds on the plugin's recommended rules. `vitest/unbound-method`, its one
 * rule that needs type information, is left out.
 */
export const vitestConfig: Linter.Config[] = [
  {
    ...vitest.configs.recommended,
    files: ['**/*.{test,spec}.{ts,tsx,js}', 'test/**'],
    // Fixtures are inputs that specs bundle or load, not specs themselves
    ignores: ['**/fixtures/**', '**/__fixtures__/**'],
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/no-focused-tests': 'error',
      'vitest/no-disabled-tests': 'error',
      // `vi.mock` and `vi.hoisted` are hoisted above the imports whatever their
      // position, so a call written lower down reads as if it ran later
      'vitest/hoisted-apis-on-top': 'error',
      // Vitest's `expect` takes a failure message as its second argument
      'vitest/valid-expect': ['error', { maxArgs: 2 }],
      // An assertion in a hook fails the tests it sets up, so it is not standalone
      'vitest/no-standalone-expect': ['error', {
        additionalTestBlockFunctions: ['beforeAll', 'beforeEach', 'afterEach', 'afterAll'],
      }],
      // Many specs assert through sinon or chai helpers, or pass by not
      // throwing, which this rule doesn't recognize as assertions
      'vitest/expect-expect': 'off',
      // Specs assert on a caught error in a `catch` block, or branch on the
      // platform or a parametrized case; rewriting those is a style change
      'vitest/no-conditional-expect': 'off',
      // Style: `toHaveBeenCalledOnce()` plus `toHaveBeenCalledWith()` asserts
      // the same thing
      'vitest/prefer-called-exactly-once-with': 'off',
      // `baseConfig` already enforces this through `mocha/no-identical-title`
      'vitest/no-identical-title': 'off',
      // Without type information the rule rejects every title passed as a
      // variable, as table-driven specs do; the rest of its hits are wording
      'vitest/valid-title': 'off',
    },
  },
]
