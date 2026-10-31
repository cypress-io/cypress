import { builtinRules } from 'eslint/use-at-your-own-risk'
import { baseConfig, jsonConfig } from '@packages/eslint-config'
import globals from 'globals'

const fixtureDirs = ['projects/**', 'project-fixtures/**']

const plugins = Object.assign({}, ...baseConfig.map((config) => config.plugins ?? {}))

const isLayoutRule = (ruleId: string) => {
  const slash = ruleId.lastIndexOf('/')
  const rule = slash === -1
    ? builtinRules.get(ruleId)
    : plugins[ruleId.slice(0, slash)]?.rules?.[ruleId.slice(slash + 1)]

  return rule?.meta?.type === 'layout'
}

const layoutRulesOff = Object.fromEntries(
  baseConfig
  .flatMap((config) => Object.keys(config.rules ?? {}))
  .filter(isLayoutRule)
  .map((ruleId) => [ruleId, 'off']),
)

export default [
  ...baseConfig,
  // Fixture package.json files mirror the user projects they stand in for
  ...jsonConfig.map((config) => ({ ...config, ignores: [...(config.ignores ?? []), ...fixtureDirs] })),
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
      'no-restricted-properties': 'off',
      'no-restricted-syntax': 'off',
    },
  },
  {
    files: ['test/**/*.{js,ts}', 'lib/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        expect: 'readonly',
        mockery: 'readonly',
        nock: 'readonly',
        proxyquire: 'readonly',
        root: 'readonly',
        sinon: 'readonly',
        supertest: 'readonly',
      },
    },
  },
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      // node scripts, not mocha specs
      globals: {
        run: 'off',
      },
    },
  },
  {
    // Sample user apps, written the way users write them. System-test snapshots
    // assert on line and column numbers inside them, so a formatting fix or a
    // removed eslint-disable comment can shift a snapshot: only correctness
    // rules apply here, and nothing is autofixed.
    files: fixtureDirs,
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
    rules: {
      ...layoutRulesOff,
      // Angular resolves a constructor parameter's type to a DI token at
      // runtime, so a type-only import erases the token and the app fails to
      // compile (NG2003)
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'prefer-const': 'off',
      'react/no-deprecated': 'off',
      'react/prop-types': 'off',
      'vue/require-default-prop': 'off',
      // import-x cannot parse the `.d.mts` types of @vitejs/plugin-vue
      'import-x/default': 'off',
      'import-x/namespace': 'off',
    },
  },
  {
    files: ['projects/ids/**'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    // Exercise how the snapshot bundler loads modules, unused bindings included
    files: ['projects/v8-snapshot/**'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'no-debugger': 'off',
    },
  },
  {
    ignores: [
      // Cloud generated
      'lib/validations/**',
      // scaffold output that must match what the scaffold tool generates
      'projects/pristine*/expected-cypress-*/**',
      // 3rd party
      'projects/e2e/static/jquery.js',
      // disable `@typescript-eslint/ban-types`, which typescript-eslint has removed
      'projects/vue3-vite-ts-*/src/env.d.ts',
      // invalid on purpose
      'project-fixtures/react/src/AppCompilationError.cy.jsx',
      'projects/config-with-ts-module-error/cypress.config.ts',
      'projects/config-with-ts-syntax-error/cypress.config.ts',
      'projects/e2e/cypress/e2e/stdout_exit_early_failing.cy.js',
      'projects/e2e/cypress/e2e/typescript_syntax_error.cy.ts',
      'projects/e2e/lib/fail.js',
      'projects/e2e/static/fail.js',
      'projects/failures/cypress/e2e/syntax_error.js',
      'projects/no-specs-babel-conflict/src/Invalid.jsx',
      'projects/no-specs/src/Invalid.jsx',
      'projects/plugins-root-syntax-error/cypress.config.js',
      'projects/qwik-app/cypress-ct-bad-missing-value/**',
      'projects/qwik-app/cypress-ct-bad-syntax/**',
      'projects/todos/tests/_fixtures/**/*.js',
    ],
  },
]
