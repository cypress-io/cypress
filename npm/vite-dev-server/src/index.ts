import { EventEmitter } from 'events'
import { debug as debugFn } from 'debug'
import { start as createDevServer } from './startServer'
import { UserConfig } from 'vite'
import { Server } from 'http'
const debug = debugFn('cypress:vite-dev-server:vite')

interface Options {
  specs: any[] // Cypress.Cypress['spec'][] // Why isn't this working? It works for webpack-dev-server
  config: Record<string, string>
  devServerEvents: EventEmitter
  [key: string]: unknown
}

export interface StartDevServer {
  /* this is the Cypress options object */
  options: Options
  /* support passing a path to the user's webpack config */
  viteConfig?: UserConfig // TODO: implement taking in the user's vite configuration. Right now we don't
}

export interface ResolvedDevServerConfig {
  port: number
  server: Server
}

export async function startDevServer (startDevServerArgs: StartDevServer): Promise<ResolvedDevServerConfig> {
  const viteDevServer = await createDevServer(startDevServerArgs)

  return new Promise(async (resolve) => {
    const app = await viteDevServer.listen()
    const port = app.config.server.port

    debug('Component testing vite server started on port', port)
    resolve({ port, server: app.httpServer })
  })
}
