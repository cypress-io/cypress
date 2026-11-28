import { baseConfig, jsonConfig, nodeConfig, noFloatingPromisesConfig, regexpConfig, vitestConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
  ...regexpConfig,
  ...jsonConfig,
  ...nodeConfig,
  ...vitestConfig,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
  noFloatingPromisesConfig(['lib/**/*.ts']),
  {
    // esm/ is loaded by Node's own ESM loader, which won't guess a missing extension
    files: ['lib/**/*.ts'],
    rules: {
      'n/file-extension-in-import': ['error', 'always'],
    },
  },
]
