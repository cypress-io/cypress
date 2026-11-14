import { baseConfig, jsonConfig, nodeConfig, noFloatingPromisesConfig, undeclaredWorkspaceImports, vitestConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
  ...jsonConfig,
  ...nodeConfig,
  undeclaredWorkspaceImports(['test/**'], ['@tooling/system-tests']),
  ...vitestConfig,
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
  noFloatingPromisesConfig(['src/**/*.ts', 'test/**/*.ts']),
  {
    // babel-plugin-tester compares these inputs and outputs byte for byte, so autofix must not reformat them
    ignores: ['test/__fixtures__/**/*', 'test/__babel_fixtures__/**/*'],
  },
]
