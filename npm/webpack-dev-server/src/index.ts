import { EventEmitter } from 'events'
import { debug as debugFn } from 'debug'
import { AddressInfo } from 'net'
import { Server } from 'http'
import { start as createDevServer } from './startServer'
const debug = debugFn('cypress:webpack-dev-server:webpack')

interface Options {
  specs: Cypress.Cypress['spec'][]
  config: Record<string, string>
  devServerEvents: EventEmitter
  [key: string]: unknown
}

export interface StartDevServer {
  /* this is the Cypress options object */
  options: Options
  /* support passing a path to the user's webpack config */
  webpackConfig?: Record<string, any>
}

export interface ResolvedDevServerConfig {
  port: number
  server: Server
}

export async function startDevServer (startDevServerArgs: StartDevServer) {
  const webpackDevServer = await createDevServer(startDevServerArgs)

  return new Promise<ResolvedDevServerConfig>((resolve) => {
    const httpSvr = webpackDevServer.listen(0, '127.0.0.1', () => {
      // FIXME: handle address returning a string
      const port = (httpSvr.address() as AddressInfo).port

      debug('Component testing webpack server started on port', port)
      resolve({ port, server: httpSvr })
    })
  })
}
