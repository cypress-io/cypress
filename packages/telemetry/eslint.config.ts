import { baseConfig, jsonConfig, nodeConfig, regexpConfig, vitestConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
  ...regexpConfig,
  ...jsonConfig,
  ...nodeConfig,
  ...vitestConfig,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    // build output of rollup.config.mjs
    ignores: ['browser/**/*'],
  },
]
