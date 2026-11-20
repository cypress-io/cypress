import { baseConfig, jsonConfig, nodeConfig, noFloatingPromisesConfig, noMisusedPromisesConfig, vitestConfig } from '@packages/eslint-config'

const typeAwareFiles = ['index.ts', 'lib/**/*.ts']

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
  // `build-prod` compiles in place, next to the sources
  {
    ignores: ['index.js', 'lib/**/*.js'],
  },
]
