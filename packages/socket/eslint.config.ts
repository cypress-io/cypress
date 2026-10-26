import { baseConfig, jsonConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
  ...jsonConfig,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
  // `build:browser` output, which the shared config's build-output ignores don't cover
  {
    ignores: ['browser/**/*'],
  },
]
