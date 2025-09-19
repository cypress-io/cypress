import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      'test/project/index.spec.ts',
      'test/project/utils.spec.ts',
      'test/index.spec.ts',
      'test/utils.spec.ts',
      'test/ast-utils/addPluginId.spec.ts',
      'test/ast-utils/addToCypressConfigPlugin-e2e.spec.ts',
      'test/ast-utils/addToCypressConfigPlugin.spec.ts',
      'test/ast-utils/addToCypressConfig.spec.ts',
    ],
    globals: true,
    environment: 'node',
  },
})
