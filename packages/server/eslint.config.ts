import { baseConfig } from '@packages/eslint-config'
import globals from 'globals'

export default [
  ...baseConfig,
  {
    languageOptions: {
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
    ignores: ['test/support/fixtures/server/**/*'],
  },
]
