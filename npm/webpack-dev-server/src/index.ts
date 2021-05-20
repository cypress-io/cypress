import { debug as debugFn } from 'debug'
import { AddressInfo } from 'net'
import { Server } from 'http'
import { start as createDevServer, StartDevServer } from './startServer'

const debug = debugFn('cypress:webpack-dev-server:webpack')

type DoneCallback = () => unknown

export interface ResolvedDevServerConfig {
  port: number
  close: (done?: DoneCallback) => void
}

export { StartDevServer }

export async function startDevServer(startDevServerArgs: StartDevServer, exitProcess = process.exit) {
  const webpackDevServer = await createDevServer(startDevServerArgs, exitProcess)

  return new Promise<ResolvedDevServerConfig>((resolve) => {
    const httpSvr = webpackDevServer.listen(0, '127.0.0.1', () => {
      // webpack-dev-server v3 returns `http.Server`.
      // v4 returns a Promise that resolves `http.Server`.
      // use Promise.resolve to make sure we get the `http.Server`,
      // regardless of webpack-dev-server version.
      Promise.resolve(httpSvr).then((server: Server) => {
        // FIXME: handle address returning a string
        const port = (server.address() as AddressInfo).port

        debug('Component testing webpack server started on port', port)

        return resolve({
          port,
          close: (done?: DoneCallback) => {
            httpSvr.close()
            done?.()
          },
        })
      })
    })
  })
}
