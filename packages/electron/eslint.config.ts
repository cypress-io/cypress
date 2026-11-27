import { baseConfig, cliOverrides, jsonConfig, nodeConfig, regexpConfig, vitestConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
  ...regexpConfig,
  ...jsonConfig,
  ...nodeConfig,
  ...vitestConfig,
  ...cliOverrides,
  {
  },
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
]
