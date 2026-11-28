import { baseConfig, jsonConfig, mochaConfig, nodeConfig, noFloatingPromisesConfig, regexpConfig, userNodeConfig, vitestConfig } from '@packages/eslint-config'
import globals from 'globals'

export default [
  ...baseConfig,
  ...regexpConfig,
  ...jsonConfig,
  ...nodeConfig,
  {
    // The config child process runs on the user's Node
    ...userNodeConfig,
    files: ['lib/plugins/child/**'],
  },
  // Unit and integration specs run on Vitest; performance specs run on mocha
  ...vitestConfig.map((block) => ({ ...block, files: ['test/unit/**', 'test/integration/**'] })),
  ...mochaConfig.map((block) => ({ ...block, files: ['test/**'], ignores: [...(block.ignores ?? []), 'test/unit/**', 'test/integration/**'] })),
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
