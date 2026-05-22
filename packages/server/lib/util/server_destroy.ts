import type http from 'http'
import { promisify } from 'util'
import { allowDestroy as allowDestroyNetwork } from '@packages/network'

export interface DestroyableHttpServer extends http.Server {
  /** asynchronously destroys the http server, waiting
   * for all open socket connections to first close
   */
  destroyAsync (): Promise<void>
}

export const allowDestroy = (server) => {
  allowDestroyNetwork(server)

  server.destroyAsync = () => {
    return promisify(server.destroy)()
    .catch(() => {}) // dont catch any errors
  }

  return server
}
