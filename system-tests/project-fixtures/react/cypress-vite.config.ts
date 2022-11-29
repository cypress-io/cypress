import { defineConfig } from 'cypress'

export default defineConfig({
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
  // These tests should run quickly / fail quickly,
  // since we intentionally causing error states for testing
  defaultCommandTimeout: 1000,
})
