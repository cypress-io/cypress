import { baseConfig, chaiFriendlyConfig, jsonConfig, nodeConfig, reactConfig, regexpConfig, vitestConfig } from '@packages/eslint-config'
import globals from 'globals'

export default [
  ...baseConfig,
  ...regexpConfig,
  ...jsonConfig,
  ...nodeConfig,
  // the shared test globs leave out .mjs
  chaiFriendlyConfig(['test/**/*.{mjs,mts}']),
  ...vitestConfig,
  // fixtures that check the preprocessor compiles React JSX
  reactConfig(['test/fixtures/**/*.{jsx,tsx}']),
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
      'import-x/default': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
    },
  },
]
