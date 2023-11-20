import { defineConfig } from 'cypress'
import defaultConfig from './cypress-vite.config'
import * as http from 'http'

export default defineConfig({
  ...defaultConfig,
  component: {
    ...defaultConfig.component as Cypress.Config['component'],
    devServer: {
      framework: 'react',
      bundler: 'vite',
      viteConfig: {
        server: {
          port: 3000,
        },
      },
    },
    async setupNodeEvents () {
      await new Promise<void>((res) => http.createServer().listen(3000, '127.0.0.1', res))
    },
  },
})
