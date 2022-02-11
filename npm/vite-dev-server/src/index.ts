import { debug as debugFn } from 'debug'
import { createServer, InlineConfig } from 'vite'
import { resolveServerConfig, StartDevServerOptions } from './resolveServerConfig'
const debug = debugFn('cypress:vite-dev-server:vite')

export { StartDevServerOptions }

export async function startDevServer (startDevServerArgs: StartDevServerOptions): Promise<Cypress.ResolvedDevServerConfig> {
  if (!startDevServerArgs.viteConfig) {
    debug('User did not pass in any Vite dev server configuration')
    startDevServerArgs.viteConfig = {}
  }

  debug('starting vite dev server')
  const resolvedConfig = await resolveServerConfig(startDevServerArgs)
  const port = resolvedConfig.server!.port!

  const viteDevServer = await createServer(resolvedConfig)

  await viteDevServer.listen()

  debug('Component testing vite server started on port', port)

  return { port, close: viteDevServer.close }
}

export type CypressViteDevServerConfig = Omit<InlineConfig, 'base' | 'root'>

export function devServer (cypressDevServerConfig: Cypress.DevServerConfig, devServerConfig?: CypressViteDevServerConfig) {
  return startDevServer({ options: cypressDevServerConfig, viteConfig: devServerConfig })
}
