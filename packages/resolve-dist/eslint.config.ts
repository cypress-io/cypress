import { baseConfig, jsonConfig, nodeConfig, noFloatingPromisesConfig, regexpConfig } from '@packages/eslint-config'

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
  noFloatingPromisesConfig(['lib/**/*.ts']),
]
