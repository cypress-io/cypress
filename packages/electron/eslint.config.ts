import { baseConfig, cliOverrides, jsonConfig, nodeConfig, vitestConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
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
