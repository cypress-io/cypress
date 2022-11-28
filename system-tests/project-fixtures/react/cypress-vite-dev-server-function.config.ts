import { defineConfig } from 'cypress'
import defaultConfig from './cypress-vite.config'
import {devServer as cypressViteDevServer} from '@cypress/vite-dev-server'

export default defineConfig({
  ...defaultConfig,
  component: {
    devServer: (devServerOptions) => cypressViteDevServer({
      ...devServerOptions,
      framework: 'react'
    })
  }
})
