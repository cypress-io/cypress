import { defineConfig } from 'cypress'

export default defineConfig({
  component: {
    devServer: {
      bundler: 'vite',
      framework: 'vue'
    },
    indexHtmlFile: 'cypress/support/custom-component-index.html'
  },
})
