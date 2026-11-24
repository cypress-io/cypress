import { baseConfig, jsonConfig, nodeConfig } from '@packages/eslint-config'
import globals from 'globals'

export default [
  ...baseConfig,
  ...jsonConfig,
  ...nodeConfig,
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
]
