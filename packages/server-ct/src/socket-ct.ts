import * as socketIo from '@packages/socket'
import devServer from '@packages/server/lib/plugins/dev-server'
import { SocketBase } from '@packages/server/lib/socket-base'
import { DestroyableHttpServer } from '@packages/server/lib/util/server_destroy'

export class SocketCt extends SocketBase {
  constructor (config: Record<string, any>) {
    super(config)

    devServer.emitter.on('dev-server:compile:error', (error) => {
      this.toRunner('dev-server:hmr:error', error === null ? null : { error })
    })

    // should we use this option at all for component testing 😕?
    if (config.watchForFileChanges) {
      devServer.emitter.on('dev-server:compile:success', () => {
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
