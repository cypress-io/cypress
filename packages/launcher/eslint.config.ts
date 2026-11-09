import { baseConfig, jsonConfig, vitestConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
  ...jsonConfig,
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
