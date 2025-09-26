import { defineConfig } from 'cypress'

export default defineConfig({
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
    },
  },
  e2e: {
    baseUrl: 'http://localhost:5000',
  },
})
