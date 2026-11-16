import { baseConfig, jsonConfig, nodeConfig, noFloatingPromisesConfig, regexpConfig, undeclaredWorkspaceImports, vitestConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
  ...regexpConfig,
  ...jsonConfig,
  ...nodeConfig,
  undeclaredWorkspaceImports(['test/**'], ['@tooling/v8-snapshot']),
  ...vitestConfig,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
  noFloatingPromisesConfig(['src/**/*.ts']),
]
