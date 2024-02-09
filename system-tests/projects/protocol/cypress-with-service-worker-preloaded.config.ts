import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: 'pid123',
  e2e: {
    supportFile: 'cypress/support/e2e-preload-service-worker.ts',
    setupNodeEvents: (on, config) => {},
  },
})
