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
  {
    // build output of tsconfig.browser.json
    ignores: ['browser/**/*'],
  },
]
