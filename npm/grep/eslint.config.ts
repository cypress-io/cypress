import { baseConfig, cliOverrides, jsonConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
  ...jsonConfig,
  ...cliOverrides,
  {
    files: ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx'],
    rules: {
      'no-restricted-syntax': 'off',
      'mocha/no-global-tests': 'off',
    },
    languageOptions: {
      parserOptions: {
        allowDefaultProject: true,
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    files: ['cypress/**/*.js', 'cypress/**/*.ts', 'cypress/**/*.jsx', 'cypress/**/*.tsx'],
    languageOptions: {
      globals: {
        Cypress: 'readonly',
        cy: 'readonly',
        window: 'readonly',
      },
    },
  },
  {
    files: ['src/**/*.js', 'src/**/*.ts'],
    languageOptions: {
      globals: {
        process: 'readonly',
      },
    },
  },
]
