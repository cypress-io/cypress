import { baseConfig, jsonConfig, nodeConfig, userNodeConfig } from '@packages/eslint-config'
import globals from 'globals'

export default [
  ...baseConfig,
  ...jsonConfig,
  ...nodeConfig,
  {
    // The config child process runs on the user's Node
    ...userNodeConfig,
    files: ['lib/plugins/child/**'],
  },
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
    ignores: ['test/support/fixtures/server/**/*', 'lib/validations/**/*'],
  },
]
