import { baseConfig, jsonConfig, nodeConfig, noFloatingPromisesConfig, vitestConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
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
  noFloatingPromisesConfig(['lib/**/*.ts']),
]
