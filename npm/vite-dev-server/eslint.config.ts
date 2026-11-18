import { baseConfig, jsonConfig, nodeConfig, undeclaredWorkspaceImports, vitestConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
  ...jsonConfig,
  // Browser code, which has no Node globals and a browser floor
  ...nodeConfig.map((config) => ({ ...config, ignores: [...(config.ignores ?? []), 'client/**'] })),
  undeclaredWorkspaceImports(['test/**', 'cypress/**'], ['@tooling/system-tests']),
  ...vitestConfig,
  {
    files: ['**/*.js', '**/*.ts'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    // This script runs in the AUT, and passes a bundler-defined `process`
    // through to node test plugins when one exists
    files: ['client/**/*.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
      },
    },
  },
]
