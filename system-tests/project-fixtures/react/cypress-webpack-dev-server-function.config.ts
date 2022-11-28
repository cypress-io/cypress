import { defineConfig } from 'cypress'
import defaultConfig from './cypress-webpack.config'
import { devServer as cypressWebpackDevServer } from '@cypress/webpack-dev-server'

export default defineConfig({
  ...defaultConfig,
  component: {
    devServer: (devServerOptions) => cypressWebpackDevServer({
      ...devServerOptions,
      framework: 'react',
    }),
    supportFile: false
  }
})