import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    env: {
      // disables SSL certificate verification for testing purposes
      // This is needed to allow self-signed certificates
      // which are needed for the agent.spec.ts tests
      NODE_TLS_REJECT_UNAUTHORIZED: '0',
    },
    include: ['test/**/*.spec.ts'],
    globals: true,
    environment: 'node',
  },
})
