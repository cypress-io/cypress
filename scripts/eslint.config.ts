import { baseConfig, chaiFriendlyConfig, jsonConfig, mochaConfig, nodeConfig } from '@packages/eslint-config'
import globals from 'globals'

export default [
  ...baseConfig,
  ...jsonConfig,
  ...nodeConfig,
  chaiFriendlyConfig(['unit/**']),
  // The root `test-scripts` script runs these on mocha
  ...mochaConfig.map((block) => ({ ...block, files: ['unit/**'] })),
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
      globals: globals.node,
    },
    rules: {
      // build, release and CI scripts report progress straight to the terminal
      'no-console': 'off',
    },
  },
]
