import { debug as debugFn } from 'debug'
import { AddressInfo } from 'net'
import { start as createDevServer } from './startServer'
const debug = debugFn('cypress:webpack-dev-server:webpack')

export async function startDevServer (config, webpackConfig) {
  const webpackDevServer = await createDevServer(webpackConfig, config)

  return new Promise((resolve) => {
    const httpSvr = webpackDevServer.listen(9999, '127.0.0.1', () => {
      // FIXME: handle address returning a string
      const port = (httpSvr.address() as AddressInfo).port

      debug('Component testing webpack server started on port', port)
      resolve(port)
    })
  })
}
