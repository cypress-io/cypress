import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.spec.ts'],
    globals: true,
    environment: 'node',
    poolOptions: {
      forks: {
        // node.ts requires its own modules on demand, and vitest hands modules Node's own
        // require, which only resolves an extensionless .ts path with tsx registered
        execArgv: ['--import', 'tsx'],
      },
    },
  },
})
