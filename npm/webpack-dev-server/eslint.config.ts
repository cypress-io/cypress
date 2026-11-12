import { baseConfig, jsonConfig, nodeConfig, undeclaredWorkspaceImports, vitestConfig } from '@packages/eslint-config'

export default [
  // test/fixtures are webpack inputs, including one that deliberately fails to compile
  { ignores: ['test/fixtures/**'] },
  ...baseConfig,
  ...jsonConfig,
  // Browser code, which has no Node globals and a browser floor
  ...nodeConfig.map((config) => ({ ...config, ignores: [...(config.ignores ?? []), 'src/browser.ts', 'src/aut-runner.ts'] })),
  undeclaredWorkspaceImports(['test/**', 'cypress/**'], ['@tooling/system-tests']),
  ...vitestConfig,
]
