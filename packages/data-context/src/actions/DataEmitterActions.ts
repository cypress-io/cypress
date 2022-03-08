import type { SpecChangeType } from '@packages/graphql/src/gen/nxs.gen'
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
   * Emitted when we have changed the current project config
   */
  specChange (data: {
    absolute: string
    specChange: SpecChangeType
  }) {
    this._emit('specChange', data)
  }

  /**
   * Emitted when we have added / removed specs from the spec list
   */
  specListChanged () {
    this._emit('specListChanged')
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
  globalProjectListUpdate () {
    this._emit('globalProjectListUpdate')
  }

  /**
   * Emitted when the project is updated (we have changed the current project config, etc.)
   */
  projectUpdate () {
    this._emit('projectUpdate')
  }

  /**
   * Emitted when there is a change to the "baseError" or "warnings"
   * properties on query
   */
  globalAlert () {
    this._emit('globalAlert')
  }

  /**
   * Emitted when there is an update to the browser's status
   */
  changeBrowserStatus () {
    this._emit('changeBrowserStatus')
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
  }
}
