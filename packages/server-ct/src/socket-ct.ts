import * as socketIo from '@packages/socket'
import Debug from 'debug'
import devServer from '@packages/server/lib/plugins/dev-server'
import { SocketBase } from '@packages/server/lib/socket-base'
import { DestroyableHttpServer } from '@packages/server/lib/util/server_destroy'

const debug = Debug('cypress:server-ct:socket')

export class SocketCt extends SocketBase {
  constructor (config: Record<string, any>) {
    super(config)

    devServer.emitter.on('dev-server:compile:error', (error) => {
      this.toRunner('dev-server:hmr:error', error === null ? null : { error })
    })

    // should we use this option at all for component testing 😕?
    if (config.watchForFileChanges) {
      devServer.emitter.on('dev-server:compile:success', () => {
        debug('Recieved event from dev server, dev-server:compile:success restarting runner')
        this.toRunner('runner:restart')
      })
    }
  }

  startListening (server: DestroyableHttpServer, automation, config, options) {
    const { componentFolder } = config

    this.testsDir = componentFolder

    return super.startListening(server, automation, config, options, {
      onSocketConnection (socket: socketIo.SocketIOServer) {

      },
    })
  }

  sendSpecList (specs) {
    this.toRunner('component:specs:changed', specs)
  }
}
