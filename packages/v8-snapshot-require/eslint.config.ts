import { baseConfig, jsonConfig, nodeConfig, undeclaredWorkspaceImports } from '@packages/eslint-config'

export default [
  ...baseConfig,
  ...jsonConfig,
  ...nodeConfig,
  undeclaredWorkspaceImports(['test/**'], ['@tooling/v8-snapshot']),
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
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
]
