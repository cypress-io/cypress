import baseConfig from '../../packages/eslint-config'

export default [
  ...baseConfig,
  {
    files: ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx'],
    rules: {
      'no-console': 'off',
      'no-restricted-syntax': 'off',
      'mocha/no-global-tests': 'off',
    },
    languageOptions: {
      parserOptions: {
        allowDefaultProject: true,
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
    files: ['src/**/*.js', 'src/**/*.ts', 'expects/**/*.js', 'expects/**/*.ts'],
    languageOptions: {
      globals: {
        process: 'readonly',
      },
    },
  },
]
