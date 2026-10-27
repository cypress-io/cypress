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
    // Specs may use sync fs and the other APIs restricted in shipped code
    files: ['test/**'],
    rules: {
      'no-restricted-properties': 'off',
      'no-restricted-syntax': 'off',
    },
  },
  {
    // no-floating-promises needs type information, so the shipped source gets a project service
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
  {
    // babel-plugin-tester compares these inputs and outputs byte for byte, so autofix must not reformat them
    ignores: ['test/__fixtures__/**/*', 'test/__babel_fixtures__/**/*'],
  },
]
