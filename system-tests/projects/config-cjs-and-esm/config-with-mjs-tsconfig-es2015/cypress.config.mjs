import { defineConfig } from 'cypress'

// import.meta.resolve must be present within an ESM context
import.meta.resolve

export default defineConfig({
  e2e: {
    supportFile: false,
  },
})
