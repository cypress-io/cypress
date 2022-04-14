import { defineConfig } from 'cypress'

export default defineConfig({
  component: {
    devServer: {
      framework: 'nuxt',
      bundler: 'webpack',
      // Necessary due to cypress/vue resolving from cypress/node_modules rather than the project root
      webpackConfig: {
        resolve: {
          alias: {
            'vue': require.resolve('vue'),
          }
        }
      }
    },
  },
})
