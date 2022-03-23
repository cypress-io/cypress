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
   * Emitted when we have modified part of the backend and want to show
   * a notification to possibly restart the app
   */
  devChange () {
    this._emit('devChange')
  }

  /**
   * Emitted when we have a notification from the cloud to refresh the data
   */
  cloudViewerChange () {
    this._emit('cloudViewerChange')
  }

  browserStatusChange () {
    this._emit('browserStatusChange')
  }

  /**
   * Emitted when the specs for the current project have changed. This can
   * be due to files being added or removed or due to a change in
   * the spec pattern in the config
   */
  specsChange () {
    this._emit('specsChange')
  }

  private _emit <Evt extends keyof DataEmitterEvents> (evt: Evt, ...args: Parameters<DataEmitterEvents[Evt]>) {
    this.pub.emit(evt, ...args)
  }
}
export class DataEmitterActions extends DataEmitterEvents {
  constructor (private ctx: DataContext) {
    super()
  }

  /**
   * Broadcasts a signal to the "app" via Socket.io, typically used to trigger
   * a re-query of data on the frontend
   */
  toApp (...args: any[]) {
    this.ctx.coreData.servers.appSocketServer?.emit('data-context-push', ...args)
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
  subscribeTo (evt: keyof DataEmitterEvents, sendInitial = true): AsyncGenerator<any> {
    let hasSentInitial = false
    let dfd: pDefer.DeferredPromise<any> | undefined
    let pending: any[] = []
    let done = false

    function subscribed (value: any) {
      // We can get events here before next() is called setting up the deferred promise
      // If that happens, we will queue them up to be handled once next eventually is called
      if (dfd) {
        dfd.resolve({ done: false, value })
        dfd = undefined
      } else {
        pending.push({ done: false, value })
      }
    }
    this.pub.on(evt, subscribed)

    const iterator = {
      async next () {
        if (done) {
          return { done: true, value: undefined }
        }

        if (!hasSentInitial && sendInitial) {
          hasSentInitial = true

          return { done: false, value: {} }
        }

        if (pending.length === 0) {
          dfd = pDefer()

          return await dfd.promise
        }

        return pending.shift()
      },
      throw: async (error: Error) => {
        throw error
      },
      return: async () => {
        this.pub.off(evt, subscribed)
        // If we are currently waiting on a deferred promise, we need to resolve it and signify we're done to ensure that the async loop terminates
        if (dfd) {
          dfd.resolve({ done: true, value: undefined })
        }

        done = true

        dfd = undefined

        return { done: true, value: undefined }
      },
      [Symbol.asyncIterator] () {
        return iterator
      },
    }

    return iterator
  }
}
