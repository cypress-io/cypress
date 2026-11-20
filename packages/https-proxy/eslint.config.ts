import { baseConfig, jsonConfig, nodeConfig, noFloatingPromisesConfig, noMisusedPromisesConfig, vitestConfig } from '@packages/eslint-config'

const typeAwareFiles = ['lib/**/*.ts']

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
  noFloatingPromisesConfig(typeAwareFiles),
  noMisusedPromisesConfig(typeAwareFiles),
]
