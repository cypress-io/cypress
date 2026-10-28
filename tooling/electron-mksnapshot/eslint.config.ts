import { baseConfig, jsonConfig } from '@packages/eslint-config'
import globals from 'globals'

export default [
  ...baseConfig,
  ...jsonConfig,
  {
    ignores: [
      // a snapshot script the specs expect mksnapshot to reject
      'test/fixtures/**',
      // the downloaded mksnapshot binary and its support files
      'bin/**',
    ],
  },
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.node,
      },
    },
  },
  {
    // Build-time tooling that never ships in the app, so sync fs is fine here
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
]
