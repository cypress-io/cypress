import { baseConfig, jsonConfig, nodeConfig, regexpConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
  ...regexpConfig,
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
