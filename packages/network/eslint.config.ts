import { baseConfig, jsonConfig, nodeConfig, noFloatingPromisesConfig, noMisusedPromisesConfig, undeclaredWorkspaceImports, vitestConfig } from '@packages/eslint-config'

const typeAwareFiles = ['lib/*.ts']

export default [
  ...baseConfig,
  ...jsonConfig,
  ...nodeConfig,
  undeclaredWorkspaceImports(['test/**'], ['@packages/https-proxy']),
  ...vitestConfig,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
  noFloatingPromisesConfig(typeAwareFiles),
  noMisusedPromisesConfig(typeAwareFiles),
  {
    // Specs may use sync fs and the other APIs restricted in shipped code
    files: ['test/**'],
    rules: {
      'no-restricted-properties': 'off',
      'no-restricted-syntax': 'off',
    },
  },
]
