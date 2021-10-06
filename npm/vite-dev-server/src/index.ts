import { debug as debugFn } from 'debug'
import { InlineConfig } from 'vite'
import { start as createDevServer, StartDevServerOptions } from './startServer'
const debug = debugFn('cypress:vite-dev-server:vite')

export { StartDevServerOptions }

export async function startDevServer (startDevServerArgs: StartDevServerOptions): Promise<Cypress.ResolvedDevServerConfig> {
  const viteDevServer = await createDevServer(startDevServerArgs)

  const app = await viteDevServer.listen()
  const port = app.config.server.port!

  debug('Component testing vite server started on port', port)

  return { port, close: app.httpServer!.close }
}

export function devServer (cypressDevServerConfig: Cypress.DevServerConfig, devServerConfig?: Omit<InlineConfig, 'base' | 'root'>) {
  return startDevServer({ options: cypressDevServerConfig, viteConfig: devServerConfig })
}

export function defineDevServerConfig (devServerConfig: Omit<InlineConfig, 'base' | 'root'>) {
  return devServerConfig
}
