import { EventEmitter } from 'events'
import { debug as debugFn } from 'debug'
import { AddressInfo } from 'net'
import { Server } from 'http'
import { start as createDevServer } from './startServer'
const debug = debugFn('cypress:webpack-dev-server:webpack')

export interface DevServerOptions {
  specs: Cypress.Cypress['spec'][]
  config: {
    supportFile: string
    projectRoot: string
    webpackDevServerPublicPathRoute: string
  }
  devServerEvents: EventEmitter
}

export interface StartDevServer {
  /* this is the Cypress options object */
  options: DevServerOptions
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
