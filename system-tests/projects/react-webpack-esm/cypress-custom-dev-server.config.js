import { defineConfig } from 'cypress'
import { devServer as cypressWebpackDevServer } from '@cypress/webpack-dev-server'

export default defineConfig({
  component: {
    devServer: (devServerOptions) => {
      return cypressWebpackDevServer({
        ...devServerOptions,
        framework: 'react',
        bundler: 'webpack',
      })
    },
  },
})
