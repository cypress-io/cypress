import { baseConfig } from '@packages/eslint-config'
import globals from 'globals'

export default [
  ...baseConfig,
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
    // vitest hoists `vi.mock` above the file's imports, so there is never a reason to
    // push the module under test below a mock factory. Keep the imports in one block.
    files: ['test/unit/**/*.spec.ts'],
    rules: {
      'import-x/first': 'error',
    },
  },
  {
    ignores: ['test/support/fixtures/server/**/*', 'lib/validations/**/*'],
  },
]
