import { debug as debugFn } from 'debug'
import { AddressInfo } from 'net'
import { Server } from 'http'
import { start as createDevServer, StartDevServer, WebpackConfigurationWithDevServer } from './startServer'
import { webpackDevServerFacts } from './webpackDevServerFacts'

const debug = debugFn('cypress:webpack-dev-server:webpack')

type DoneCallback = () => unknown

export interface ResolvedDevServerConfig {
  port: number
  close: (done?: DoneCallback) => void
}

export { StartDevServer }

export async function startDevServer (startDevServerArgs: StartDevServer, exitProcess = process.exit) {
  const webpackDevServer = await createDevServer(startDevServerArgs, exitProcess)

  return new Promise<ResolvedDevServerConfig>(async (resolve, reject) => {
    if (webpackDevServerFacts.isV3()) {
      // @ts-ignore
      const server: Server = webpackDevServer.listen(0, '127.0.0.1', () => {
        // FIXME: handle address returning a string
        const port = (server.address() as AddressInfo).port

        debug('Component testing webpack server started on port', port)

        resolve({
          port,
          close: (done?: DoneCallback) => {
            server.close()
            done?.()
          },
        })
      })

      return
    }

    if (webpackDevServerFacts.isV4()) {
      await webpackDevServer.start()

      resolve({
        // @ts-expect-error @types do not yet support v4
        port: webpackDevServer.options.port,
        close: (done?: DoneCallback) => {
          webpackDevServer.stop()
          done?.()
        },
      })

      return
    }

    reject(webpackDevServerFacts.unsupported())
  })
}

export interface CypressWebpackDevServerConfig{
  /* support passing a path to the user's webpack config */
  webpackConfig?: WebpackConfigurationWithDevServer
}

export function devServer (cypressDevServerConfig: Cypress.DevServerConfig, devServerConfig?: CypressWebpackDevServerConfig) {
  return startDevServer({
    options: cypressDevServerConfig,
    webpackConfig: devServerConfig?.webpackConfig,
  })
}
