import { defineConfig } from 'cypress'

export default defineConfig({
  videoCompression: false, // turn off video compression for CI
  component: {
    experimentalSingleTabRunMode: true,
    devServer: {
      bundler: 'vite',
      framework: 'vue',
    },
    indexHtmlFile: 'cypress/support/custom-component-index.html',
  },
})
