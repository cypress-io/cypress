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
    // The browser client logs when debugging is on and warns when a module can't
    // be proxied, and the component tests log from specs and fixtures. The Node
    // plugin in src/ logs through `debug`, so the rule stays on there.
    files: ['client/**/*.js', 'cypress/**/*.{ts,tsx}'],
    rules: {
      'no-console': 'off',
    },
  },
]
