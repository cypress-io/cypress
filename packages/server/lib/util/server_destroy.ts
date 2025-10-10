import Bluebird from 'bluebird'
import type http from 'http'
import { allowDestroy as allowDestroyNetwork } from '@packages/network'

export interface DestroyableHttpServer extends http.Server {
  /** asynchronously destroys the http server, waiting
   * for all open socket connections to first close
   */
  destroyAsync (): Bluebird<void>
}

export const allowDestroy = (server) => {
  allowDestroyNetwork(server)

  server.destroyAsync = () => {
    return Bluebird.promisify(server.destroy)()
    .catch(() => {}) // dont catch any errors
  }

  return server
}
