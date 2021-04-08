import { debug as debugFn } from 'debug'
import { Server } from 'http'
import { start as createDevServer, StartDevServer } from './startServer'
const debug = debugFn('cypress:vite-dev-server:vite')

export { StartDevServer }

export interface ResolvedDevServerConfig {
  port: number
  server: Server
}

export async function startDevServer (startDevServerArgs: StartDevServer): Promise<ResolvedDevServerConfig> {
  const viteDevServer = await createDevServer(startDevServerArgs)

  const app = await viteDevServer.listen()
  const port = app.config.server.port

  debug('Component testing vite server started on port', port)

  return { port, server: app.httpServer }
}
