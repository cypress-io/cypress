import { defineConfig } from 'cypress'

export default defineConfig({
  // Matches the port the storefront dev server listens on
  e2e: {
    baseUrl: 'http://localhost:3000',
  },
})
