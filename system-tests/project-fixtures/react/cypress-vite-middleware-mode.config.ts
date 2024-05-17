import { defineConfig } from 'cypress'
import defaultConfig from './cypress-vite.config'
import * as http from 'http'
import { devServer as cypressViteDevServer } from '@cypress/vite-dev-server'
import { promisify } from 'util'

const viteConfig = require('./vite.config.js')

export default defineConfig({
  ...defaultConfig,
  component: {
    ...defaultConfig.component as Cypress.Config['component'],
    async devServer (devServerConfig) {
      const { server, close } = await cypressViteDevServer({
        ...devServerConfig,
        framework: 'react',
        viteConfig: {
          ...viteConfig,
          server: { middlewareMode: true },
        },
      })

      console.log('>>>>>>>> Closing original server')

      close && await promisify(close)()

      console.log('>>>>>>>> Original server closed')

      const httpServer = http.createServer(server.middlewares)

      console.log('>>>>>>>> Start lisatening.....')

      await new Promise<void>((resolve) => {
        return httpServer.listen(9000, resolve)
      })

      console.log('>>>>>>>> Listening')

      console.log(`Dev server listening on port 9000`)

      return {
        port: 9000,
        close: (callback) => httpServer.close(callback),
      }
    },
    async setupNodeEvents () {
      await new Promise<void>((res) => http.createServer().listen(3000, '127.0.0.1', res))
    },
  },
})
