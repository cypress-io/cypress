import { baseConfig, chaiFriendlyConfig, jsonConfig, mochaConfig, nodeConfig, regexpConfig, vitestConfig } from '@packages/eslint-config'
import globals from 'globals'

export default [
  ...baseConfig,
  ...regexpConfig,
  ...jsonConfig,
  ...nodeConfig,
  chaiFriendlyConfig(['unit/**']),
  // `*.spec.*` runs on Vitest (`vitest.config.ts`); the rest of `unit/` runs on mocha
  ...vitestConfig.map((block) => ({ ...block, files: ['unit/**/*.spec.*'] })),
  ...mochaConfig.map((block) => ({ ...block, files: ['unit/**'], ignores: [...(block.ignores ?? []), 'unit/**/*.spec.*'] })),
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
