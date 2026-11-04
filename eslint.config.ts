import { baseConfig, jsonConfig } from '@packages/eslint-config'
import globals from 'globals'

export default [
  {
    // Lint only files at the repo root. Every workspace lints itself, and
    // lint-staged routes a workspace's files to its own config.
    ignores: ['*/'],
  },
  ...baseConfig,
  ...jsonConfig,
  {
    // Root scripts and tool configs all run in Node
    files: ['*.{js,ts}'],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
]
