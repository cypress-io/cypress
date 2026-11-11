import { baseConfig, jsonConfig, nodeConfig, undeclaredWorkspaceImports } from '@packages/eslint-config'
import globals from 'globals'

export default [
  ...baseConfig,
  ...jsonConfig,
  ...nodeConfig,
  undeclaredWorkspaceImports(['src/setup/v8-snapshot-entry*.ts'], ['@packages/server']),
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
    // Build-time tooling that never ships in the app, so sync fs is fine here
    rules: {
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
  {
    // ESLint lints each file alone, so it reads the bindings set-globals.js
    // reassigns as globals; globals-strict.js replaces real globals with
    // proxies to catch unsafe use during snapshot creation
    files: ['src/blueprint/set-globals.js', 'src/blueprint/globals-strict.js'],
    rules: {
      'no-global-assign': 'off',
    },
  },
]
