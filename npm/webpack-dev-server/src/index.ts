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

function resolveServer (
  httpSvr: Server,
  resolve: (value: ResolvedDevServerConfig | PromiseLike<ResolvedDevServerConfig>) => void,
) {
  const port = (httpSvr.address() as AddressInfo).port

  debug('Component testing webpack server started on port', port)

  return resolve({
    port,
    close: (done?: DoneCallback) => {
      httpSvr.close()
      done?.()
    },
  })
}

export async function startDevServer (startDevServerArgs: StartDevServer, exitProcess = process.exit) {
  const webpackDevServer = await createDevServer(startDevServerArgs, exitProcess)

  return new Promise<ResolvedDevServerConfig>((resolve) => {
    const httpSvr = webpackDevServer.listen(0, '127.0.0.1', () => {
      // FIXME: handle address returning a string

      // webpack-dev-server v4 returns a promise
      if ('then' in httpSvr) {
        // @ts-ignore
        httpSvr.then((server: Server) => {
          return resolveServer(server, resolve)
        })
      } else {
        return resolveServer(httpSvr, resolve)
      }
    })
  })
}
