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
  #studioCompileRerunPending = false

  constructor (config: Record<string, any>) {
    super(config)

    // should we use this option at all for component testing 😕?
    devServer.emitter.on('dev-server:specs:unchanged', () => {
      this.toRunner('dev-server:specs:unchanged')
    })

    devServer.emitter.on('dev-server:jit-recompile:queued', (data) => {
      this.toRunner('dev-server:jit-recompile:queued', data)
    })

    // Always forward compile success so JIT spec updates can wait for webpack
    // even when watchForFileChanges is disabled.
    devServer.emitter.on('dev-server:compile:success', ({ specFile, jitRecompile, jitRecompileGeneration }) => {
      const studioCompileRerun = this.#studioCompileRerunPending && !jitRecompile

      if (studioCompileRerun) {
        this.#studioCompileRerunPending = false
      }

      this.toRunner('dev-server:compile:success', { specFile, jitRecompile, jitRecompileGeneration, studioCompileRerun })
    })
  }

  onBeforeSave (config) {
    // even if the user has turned off file watching
    // we want to force a reload on save
    if (!config.watchForFileChanges) {
      this.#studioCompileRerunPending = true
    }
  }

  onAfterSave (config, error) {
    // even if the user has turned off file watching
    // we want to force a reload on save
    if (error && !config.watchForFileChanges) {
      this.#studioCompileRerunPending = false
    }
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
