import { defineConfig } from 'cypress'

export default defineConfig({
  allowCypressEnv: false,
  expose: {
    CY_EXPOSE_FOO: 'foo',
    CY_EXPOSE_BAR: 'bar',
    CY_EXPOSE_ONE: 1,
  },
  e2e: {
    supportFile: false,
    fixturesFolder: false,
    setupNodeEvents (on, config) {
      // implement node event listeners here
    },
  },
})
