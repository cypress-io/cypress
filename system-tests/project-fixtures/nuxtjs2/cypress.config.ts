import { defineConfig } from 'cypress'

export default defineConfig({
  component: {
    devServer: {
      framework: 'nuxt',
      bundler: 'webpack'
    }
  },
})