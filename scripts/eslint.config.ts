import { baseConfig, chaiFriendlyConfig, jsonConfig, mochaConfig, nodeConfig, regexpConfig, vitestConfig } from '@packages/eslint-config'
import globals from 'globals'

export default [
  ...baseConfig,
  ...regexpConfig,
  ...jsonConfig,
  ...nodeConfig,
  chaiFriendlyConfig(['unit/**']),
  // The root `test-scripts` script runs the `-spec` files on mocha; `.spec.ts` files run on vitest
  ...mochaConfig.map((block) => ({ ...block, files: ['unit/**'], ignores: [...(block.ignores ?? []), 'unit/**/*.spec.ts'] })),
  ...vitestConfig,
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
