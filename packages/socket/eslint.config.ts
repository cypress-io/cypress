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
  {
    // Specs may use sync fs and the other APIs restricted in shipped code
    files: ['test/**'],
    rules: {
      'no-restricted-properties': 'off',
      'no-restricted-syntax': 'off',
    },
  },
  // `build:browser` output, which the shared config's build-output ignores don't cover
  {
    ignores: ['browser/**/*'],
  },
]
