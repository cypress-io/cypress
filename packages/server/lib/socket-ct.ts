import Debug from 'debug'
import devServer from './plugins/dev-server'
import { SocketBase } from './socket-base'
import dfd from 'p-defer'
import type { Socket } from '@packages/socket'
import type { DestroyableHttpServer } from './util/server_destroy'
import assert from 'assert'
import type { Automation } from './automation'
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

  onBeforeSave (config) {
    // even if the user has turned off file watching
    // we want to force a reload on save
    if (!config.watchForFileChanges) {
      devServer.emitter.on('dev-server:compile:success', this.onCloudTestFileChange)
    }
  }

  onAfterSave (config, error) {
    // even if the user has turned off file watching
    // we want to force a reload on save
    if (error && !config.watchForFileChanges) {
      devServer.emitter.off('dev-server:compile:success', this.onCloudTestFileChange)
    }
  }

  onCloudTestFileChange = ({ specFile }) => {
    this.toRunner('dev-server:compile:success', { specFile })
    devServer.emitter.off('dev-server:compile:success', this.onCloudTestFileChange)
  }

  startListening (server: DestroyableHttpServer, automation: Automation, config, options) {
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
