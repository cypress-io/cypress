import { debug as debugFn } from 'debug'
import { start as createDevServer, StartDevServerOptions } from './startServer'
const debug = debugFn('cypress:vite-dev-server:vite')

export { StartDevServerOptions }

type DoneCallback = () => unknown

export interface ResolvedDevServerConfig {
  port: number
  close: (done?: DoneCallback) => void
}

export async function startDevServer (startDevServerArgs: StartDevServerOptions): Promise<ResolvedDevServerConfig> {
  const viteDevServer = await createDevServer(startDevServerArgs)

  const app = await viteDevServer.listen()
  const port = app.config.server.port!

  debug('Component testing vite server started on port', port)

  return { port, close: app.httpServer!.close }
}
