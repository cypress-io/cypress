import { EventEmitter } from 'events'
import { debug as debugFn } from 'debug'
import { start as createDevServer } from './startServer'
import { Server } from 'http'
import { RollupOptions } from 'rollup'
const debug = debugFn('cypress:rollup-dev-server:rollup')

interface Options {
  specs: Cypress.Cypress['spec'][] // Why isn't this working? It works for webpack-dev-server
  config: Record<string, string>
  devServerEvents: EventEmitter
  [key: string]: unknown
}

export interface StartDevServer {
  /* this is the Cypress options object */
  options: Options
  rollupConfig?: RollupOptions | string
}

export interface ResolvedDevServerConfig {
  port: number
  server: Server
}

export async function startDevServer (startDevServerArgs: StartDevServer): Promise<ResolvedDevServerConfig> {
  const { server, port } = await createDevServer(startDevServerArgs)

  return new Promise(async (resolve) => {
    server.listen(port, 'localhost', () => {
      resolve({ port, server })
    })
  })
}
