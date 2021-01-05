import { SocketBase } from '@packages/server/lib/socket-base'
import { DestroyableHttpServer } from '@packages/server/lib/util/server_destroy'

export class SocketCt extends SocketBase {
  startListening (server: DestroyableHttpServer, automation, config, options) {
    const { componentFolder } = config

    this.testsDir = componentFolder

    return super.startListening(server, automation, config, options, {
      onSocketConnection (_socket) { },
    })
  }

  sendSpecList (specs) {
    this.toRunner('component:specs:changed', specs)
  }
}
