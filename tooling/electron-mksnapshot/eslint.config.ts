import { baseConfig, jsonConfig, mochaConfig, nodeConfig } from '@packages/eslint-config'
import globals from 'globals'

export default [
  ...baseConfig,
  ...jsonConfig,
  ...nodeConfig,
  ...mochaConfig.map((block) => ({ ...block, files: ['test/**'] })),
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
