import { baseConfig, jsonConfig } from '@packages/eslint-config'
import globals from 'globals'

export default [
  ...baseConfig,
  ...jsonConfig,
  {
    ignores: [
      // inputs the specs bundle and snapshot, some of them vendored code
      'test/fixtures/**',
      // written by the snapshot build, which would undo any reformatting
      'cache/**',
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
    // Build-time tooling that never ships in the app, so sync fs and the
    // other APIs restricted in shipped code are fine here
    rules: {
      'no-restricted-properties': 'off',
      'no-restricted-syntax': 'off',
    },
  },
  {
    // blueprint.ts concatenates these into one snapshot script, and set-globals.js
    // reassigns top-level bindings that globals.js and custom-require.js declare
    files: ['src/blueprint/**'],
    rules: {
      'prefer-const': 'off',
    },
  },
]
