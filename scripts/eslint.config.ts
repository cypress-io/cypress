import { baseConfig, jsonConfig } from '@packages/eslint-config'
import globals from 'globals'

export default [
  ...baseConfig,
  ...jsonConfig,
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
