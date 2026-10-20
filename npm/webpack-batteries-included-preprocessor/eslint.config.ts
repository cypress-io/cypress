import { baseConfig } from '@packages/eslint-config'
import globals from 'globals'

export default [
  ...baseConfig,
  {
    ignores: ['test/_test-output/**'],
  },
  {
    files: ['**/*.js', '**/*.ts'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['test/fixtures/**/*.{js,jsx,mjs,mts,ts,tsx}'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.node,
        expect: 'readonly',
      },
    },
    rules: {
      'no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'import-x/default': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
    },
  },
]
