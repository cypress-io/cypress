import pDefer from 'p-defer'
import { EventEmitter } from 'stream'

import type { DataContext } from '../DataContext'

abstract class DataEmitterEvents {
  protected pub = new EventEmitter()

  /**
   * Emitted when we have logged in / logged out of the application
   */
  authChange () {
    this._emit('authChange')
  }

  /**
   * Emitted when we have added / removed specs from the spec list
   */
  specsChanged () {
    this._emit('specsChanged')
  }

  /**
   * Emitted when we have modified part of the backend and want to show
   * a notification to possibly restart the app
   */
  devChange () {
    this._emit('devChange')
  }

  /**
   * Emitted when we have added/removed an item from the list of Global Projects
   */
  globalUpdate () {
    this._emit('globalUpdate')
  }

  /**
   * Emitted when we have changed the current project config
   */
  projectUpdate () {
    this._emit('projectUpdate')
  }

  private _emit (evt: keyof DataEmitterEvents) {
    this.pub.emit(evt)
  }
}

export class DataEmitterActions extends DataEmitterEvents {
  constructor (private ctx: DataContext) {
    super()
  }

  /**
   * Broadcasts a signal to the "launchpad" (Electron GUI) via Socket.io,
   * typically used to trigger a re-query of data on the frontend
   */
  toLaunchpad (...args: any[]) {
    this.ctx.coreData.servers.gqlSocketServer?.emit('data-context-push', ...args)
  }

  /**
   * GraphQL Subscriptions use the AsyncIterator protocol for notifying
   * of updates which trigger re-execution on the client.
   * However the native syntax for async iteration: async function* () {...}
   * currently has no means for cancelling the iterator (as far as I've read):
   *   https://github.com/tc39/proposal-async-iteration/issues/126
   *
   * The graphql-ws library does properly handle the iteration, however it
   * requires that we use the raw protocol, which we have below. We assume that
   * when subscribing, we want to execute the operation to get the up-to-date initial
   * value, and then we keep a deferred object, resolved when the given emitter is fired
   */
  subscribeTo (evt: keyof DataEmitterEvents, sendInitial = true): AsyncIterator<any> {
    let hasSentInitial = false
    let dfd: pDefer.DeferredPromise<any> | undefined

    function subscribed (val: any) {
      dfd?.resolve(val)
    }
    this.pub.on(evt, subscribed)

    const iterator = {
      async next () {
        if (!hasSentInitial && sendInitial) {
          hasSentInitial = true

          return { done: false, value: {} }
        }

        dfd = pDefer()

        return { done: false, value: await dfd.promise }
      },
      return: async () => {
        this.pub.off(evt, subscribed)
        dfd = undefined

        return { done: true, value: undefined }
      },

      [Symbol.asyncIterator] () {
        return iterator
      },
    }

    return iterator
  }p
}
