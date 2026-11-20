import { baseConfig, jsonConfig, mochaConfig, nodeConfig, undeclaredWorkspaceImports } from '@packages/eslint-config'
import globals from 'globals'

export default [
  ...baseConfig,
  ...jsonConfig,
  ...nodeConfig,
  ...mochaConfig.map((block) => ({ ...block, files: ['test/**'] })),
  undeclaredWorkspaceImports(['test/**'], ['@tooling/system-tests']),
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
