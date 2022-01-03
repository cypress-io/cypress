import pDefer from 'p-defer'
import { EventEmitter } from 'stream'

import type { DataContext } from '../DataContext'

abstract class DataEmitterEvents {
  protected ee = new EventEmitter()

  /**
   * Emitted when we have added/removed an item from the list of Global Projects
   */
  globalUpdate () {
    this.ee.emit('globalUpdate')
  }

  /**
   * Emitted when we have changed the current project, or we have
   */
  projectUpdate () {
    this.ee.emit('projectUpdate')
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

  subscribeTo (evt: keyof DataEmitterEvents, sendInitial = true): AsyncIterator<any> {
    let hasSentInitial = false
    let dfd: pDefer.DeferredPromise<any> | undefined

    function subscribed (val: any) {
      dfd?.resolve(val)
    }
    this.ee.on(evt, subscribed)

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
        this.ee.off(evt, subscribed)
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
