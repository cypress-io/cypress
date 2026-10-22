import { baseConfig, jsonConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
  ...jsonConfig,
  {
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    // The client logs to the browser console when debugging is on and warns when
    // a module can't be proxied, and the specs log what they import.
    rules: {
      'no-console': 'off',
    },
  },
]
