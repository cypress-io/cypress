import { defineConfig } from 'cypress'
import { findUp } from 'find-up'

// Need to log this to avoid the compiler removing
// the unused import.
console.log('Illegal ESM only import', findUp)

export default defineConfig({
  e2e: {
    supportFile: false,
    setupNodeEvents: async (_, config) => {
      return config
    },
  },
})
