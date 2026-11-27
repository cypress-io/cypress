import { baseConfig, jsonConfig, nodeConfig, noFloatingPromisesConfig, regexpConfig, vitestConfig } from '@packages/eslint-config'

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
  noFloatingPromisesConfig(['index.ts', 'lib/**/*.ts']),
  // `build-prod` compiles in place, next to the sources
  {
    ignores: ['index.js', 'lib/**/*.js'],
  },
]
