import { debug as debugFn } from 'debug'
import { createServer, InlineConfig } from 'vite'
import { default as resolveServerConfig, StartDevServerOptions } from './resolveServerConfig'
const debug = debugFn('cypress:vite-dev-server:vite')

export { StartDevServerOptions }

export async function startDevServer (startDevServerArgs: StartDevServerOptions): Promise<Cypress.ResolvedDevServerConfig> {
  if (!startDevServerArgs.viteConfig) {
    debug('User did not pass in any Vite dev server configuration')
    startDevServerArgs.viteConfig = {}
  }

  debug('starting vite dev server')
  const resolvedConfig = await resolveServerConfig(startDevServerArgs)

  // if (devServerOptions.options.config.isTextTerminal) {
  //   await build(resolvedConfig)

  //   const port = resolvedConfig.server!.port!

  //   const server = await connect()

  //   return { close () {
  //     // server.httpServer.close()
  //   }, port }
  // }

  const viteDevServer = await createServer(resolvedConfig)
  const app = await viteDevServer.listen()
  const port = app.config.server.port!

  debug('Component testing vite server started on port', port)

  return {
    close: viteDevServer.close,
    port,
  }
}

export type CypressViteDevServerConfig = Omit<InlineConfig, 'base' | 'root'>

export function devServer (cypressDevServerConfig: Cypress.DevServerConfig, devServerConfig?: CypressViteDevServerConfig) {
  return startDevServer({ options: cypressDevServerConfig, viteConfig: devServerConfig })
}
