import { defineConfig } from 'cypress'
import defaultConfig from './cypress-webpack.config'
import { devServer as cypressWebpackDevServer } from '@cypress/webpack-dev-server'

export default defineConfig({
  ...defaultConfig,
  component: {
    devServer: (devServerOptions) => {
      return cypressWebpackDevServer({
        ...devServerOptions,
        framework: 'react',
      })
    },
    supportFile: false,
  },
})
