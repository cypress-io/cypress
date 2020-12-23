import { debug as debugFn } from 'debug'
import { AddressInfo } from 'net'
import { start as createDevServer } from './startServer'
const debug = debugFn('cypress:webpack-dev-server:webpack')

export async function startDevServer (config, webpackConfig) {
  let webpackDevServer
  try {
    webpackDevServer = await createDevServer(webpackConfig, config)
  } catch (err) {
    console.log(err)
    debugger;
  }

  return new Promise((resolve) => {
    const httpSvr = webpackDevServer.listen(0, '127.0.0.1', () => {
      // FIXME: handle address returning a string
      const port = (httpSvr.address() as AddressInfo).port

      debug('Component testing webpack server started on port', port)
      resolve(port)
    })
  })
}
