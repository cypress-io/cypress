import { baseConfig } from '@packages/eslint-config'

export default [
  { ignores: ['**/dist', '**/*.d.ts', '**/package-lock.json', '**/tsconfig.json', '**/cypress/fixtures'] },
  ...baseConfig,
  {
    files: ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx'],
    rules: {
      'no-console': 'off',
      'mocha/no-global-tests': 'off',
      'react/prop-types': 'off',
      'react/display-name': 'off',
    },
    languageOptions: {
      parserOptions: {
        allowDefaultProject: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['cypress/**/*.js', 'cypress/**/*.ts', 'cypress/**/*.jsx', 'cypress/**/*.tsx'],
    languageOptions: {
      globals: {
        Cypress: 'readonly',
        cy: 'readonly',
        expect: 'readonly',
      },
    },
  },
]
