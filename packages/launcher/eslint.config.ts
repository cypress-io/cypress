import { baseConfig, jsonConfig, nodeConfig, vitestConfig } from '@packages/eslint-config'

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
  // `build-prod` compiles in place, next to the sources
  {
    ignores: ['index.js', 'lib/**/*.js'],
  },
]
