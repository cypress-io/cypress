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
  noFloatingPromisesConfig(['src/**/*.ts']),
  {
    // build output of tsconfig.browser.json
    ignores: ['browser/**/*'],
  },
]
