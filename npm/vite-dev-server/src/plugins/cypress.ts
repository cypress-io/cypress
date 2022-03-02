import { ViteDevServer } from 'vite'
import { CypressViteDevServer } from './server'

export const Cypress = (options) => {
  return {
    name: 'cypress:main',
    enforce: 'pre',
    configureServer (viteServer: ViteDevServer) {
      return () => {
        const cyServer = new CypressViteDevServer(viteServer, options.specs)

        viteServer.middlewares.use('/', cyServer.handleAllRoutes)

        viteServer.middlewares.use('/', cyServer.handle404)
      }
    },
  }
}
