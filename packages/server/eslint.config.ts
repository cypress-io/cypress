import { baseConfig, jsonConfig, nodeConfig, noFloatingPromisesConfig, undeclaredWorkspaceImports, userNodeConfig, vitestConfig } from '@packages/eslint-config'
import globals from 'globals'

export default [
  ...baseConfig,
  ...jsonConfig,
  ...nodeConfig,
  undeclaredWorkspaceImports(['hook-require.js'], ['@packages/v8-snapshot-require']),
  {
    // The config child process runs on the user's Node
    ...userNodeConfig,
    files: ['lib/plugins/child/**'],
  },
  // Only the unit specs run on Vitest; integration and performance specs run on mocha
  ...vitestConfig.map((block) => ({ ...block, files: ['test/unit/**'] })),
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.node,
        globalThis: 'readonly',
        window: 'readonly',
      },
    },
  },
  noFloatingPromisesConfig(['lib/**/*.ts']),
  {
    files: ['test/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        // Test-specific globals
        mockery: 'readonly',
        proxyquire: 'readonly',
        supertest: 'readonly',
        sinon: 'readonly',
        nock: 'readonly',
      },
    },
  },
  {
    ignores: [
      'test/support/fixtures/server/**/*',
      'lib/validations/**/*',
      // The memory profiler writes here, relative to the cwd, when specs run from this package
      'cypress/logs/**/*',
    ],
  },
]
