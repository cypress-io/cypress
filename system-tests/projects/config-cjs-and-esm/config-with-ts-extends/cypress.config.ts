import { defineConfig } from 'cypress'

// require must be present within a CJS context
require

export default defineConfig({
  e2e: { supportFile: false },
})
