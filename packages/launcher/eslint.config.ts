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
  noFloatingPromisesConfig(['index.ts', 'lib/**/*.ts']),
  // `build-prod` compiles in place, next to the sources
  {
    ignores: ['index.js', 'lib/**/*.js'],
  },
]
