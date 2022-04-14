import Debug from 'debug'
import type * as socketIo from '@packages/socket'
import devServer from '@packages/server/lib/plugins/dev-server'
import { SocketBase } from '@packages/server/lib/socket-base'
import type { DestroyableHttpServer } from '@packages/server/lib/util/server_destroy'

const debug = Debug('cypress:server:socket-ct')

export class SocketCt extends SocketBase {
  constructor (config: Record<string, any>) {
    super()

    devServer.emitter.on('dev-server:compile:error', (error: string | undefined) => {
      this.toRunner('dev-server:hmr:error', error)
    })

    // should we use this option at all for component testing 😕?
    if (config.watchForFileChanges) {
      devServer.emitter.on('dev-server:compile:success', ({ specFile }) => {
        this.toRunner('dev-server:compile:success', { specFile })
      })
    }
  }

  startListening (server: DestroyableHttpServer, automation, config, options) {
    return super.startListening(server, automation, config, options, {
      onSocketConnection (socket: socketIo.SocketIOServer) {
        debug('do onSocketConnection')
      },
    })
  }
}
