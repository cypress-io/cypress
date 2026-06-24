import { defineConfig } from 'cypress'

const beforeSpecRecord: Record<string, boolean> = {}

export default defineConfig({
  allowCypressEnv: false,
  e2e: {
    experimentalRunAllSpecs: true,
    experimentalInteractiveRunEvents: true,
    supportFile: false,
    specPattern: '**/*.cy.ts',
    setupNodeEvents (on) {
      on('before:spec', (spec) => {
        beforeSpecRecord[spec.absolute] = true
      })

      on('task', {
        getBeforeSpecRecord () {
          return beforeSpecRecord
        },
      })
    },
  },
})
