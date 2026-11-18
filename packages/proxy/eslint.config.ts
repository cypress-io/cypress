import { baseConfig, jsonConfig, nodeConfig, noFloatingPromisesConfig, vitestConfig } from '@packages/eslint-config'
import globals from 'globals'

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
  // The CommonJS entry point runs in Node
  {
    files: ['index.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  // `build-prod` compiles in place, next to the sources
  {
    ignores: ['lib/**/*.js'],
  },
]
