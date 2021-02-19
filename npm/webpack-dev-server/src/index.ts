import { EventEmitter } from 'events'
import { debug as debugFn } from 'debug'
import { AddressInfo } from 'net'
import { start as createDevServer } from './startServer'
import { UserWebpackDevServerOptions } from './makeWebpackConfig'
const debug = debugFn('cypress:webpack-dev-server:webpack')

export interface DevServerOptions {
  specs: Array<Cypress.Cypress['spec']>
  devServerEvents: EventEmitter
  config: Cypress.ResolvedConfigOptions & Cypress.RuntimeConfigOptions & {
    webpackDevServerPublicPathRoute: string
  }
}

type DoneCallback = () => unknown

export interface ResolvedDevServerConfig {
  port: number
  close: (done?: DoneCallback) => void
}

export interface StartDevServer extends UserWebpackDevServerOptions {
  config: Cypress.RuntimeConfigOptions
  /* this is the Cypress options object */
  options: DevServerOptions
  /* support passing a path to the user's webpack config */
  webpackConfig?: Record<string, any>
}

export async function startDevServer (startDevServerArgs: StartDevServer) {
  const webpackDevServer = await createDevServer(startDevServerArgs)

  return new Promise<ResolvedDevServerConfig>((resolve) => {
    const httpSvr = webpackDevServer.listen(0, '127.0.0.1', () => {
      // FIXME: handle address returning a string
      const port = (httpSvr.address() as AddressInfo).port

      debug('Component testing webpack server started on port', port)
      resolve({
        port,
        close: (done?: DoneCallback) => {
          httpSvr.close()
          done?.()
        },
      })
    })
  })
}
