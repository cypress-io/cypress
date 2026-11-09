import { baseConfig, jsonConfig, nodeConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
  ...jsonConfig,
  ...nodeConfig,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    // rollup build output
    ignores: ['index.js', 'index.mjs'],
  },
]
