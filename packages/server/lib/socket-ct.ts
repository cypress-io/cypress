import Debug from 'debug'
import devServer from '@packages/server/lib/plugins/dev-server'
import { SocketBase } from '@packages/server/lib/socket-base'
import dfd from 'p-defer'
import type { Socket } from '@packages/socket'
import type { DestroyableHttpServer } from '@packages/server/lib/util/server_destroy'
import assert from 'assert'

const debug = Debug('cypress:server:socket-ct')

export class SocketCt extends SocketBase {
  #destroyAutPromise?: dfd.DeferredPromise<void>

  constructor (config: Record<string, any>) {
    super(config)

    // should we use this option at all for component testing 😕?
    if (config.watchForFileChanges) {
      devServer.emitter.on('dev-server:compile:success', ({ specFile }) => {
        this.toRunner('dev-server:compile:success', { specFile })
      })
    }
  }

  startListening (server: DestroyableHttpServer, automation, config, options) {
    return super.startListening(server, automation, config, options, {
      onSocketConnection: (socket: Socket) => {
        debug('do onSocketConnection')

        socket.on('aut:destroy:complete', () => {
          assert(this.#destroyAutPromise)
          this.#destroyAutPromise.resolve()
        })
      },
    })
  }

  destroyAut () {
    this.#destroyAutPromise = dfd()

    this.toRunner('aut:destroy:init')

    return this.#destroyAutPromise.promise
  }
}
