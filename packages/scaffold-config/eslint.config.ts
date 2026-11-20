import { baseConfig, jsonConfig, nodeConfig, noFloatingPromisesConfig, noMisusedPromisesConfig, undeclaredWorkspaceImports, vitestConfig } from '@packages/eslint-config'

const typeAwareFiles = ['src/**/*.ts']

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
  noFloatingPromisesConfig(typeAwareFiles),
  noMisusedPromisesConfig(typeAwareFiles),
  {
    // build output of tsconfig.browser.json
    ignores: ['browser/**/*'],
  },
]
