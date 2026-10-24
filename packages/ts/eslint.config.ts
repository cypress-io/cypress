import { baseConfig, jsonConfig } from '@packages/eslint-config'
import globals from 'globals'

export default [
  ...baseConfig,
  ...jsonConfig,
  {
    files: ['**/*.spec.ts', '**/*.ts'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
  // The ts-node register hooks are plain CommonJS loaded by Node
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
]
