import type { SocketIOServer } from '@packages/socket'
import type { DataContext } from '../DataContext'

export interface DataEmitterActionsOptions {
  gqlSocketServer: SocketIOServer | undefined
  appSocketServer: SocketIOServer | undefined
}

export class DataEmitterActions {
  constructor (private ctx: DataContext, private opts: DataEmitterActionsOptions) {}

  init () {
    this.ctx.rootBus.on('menu:item:clicked', (logout) => {
    })
  }

  /**
   * Broadcasts a signal to the "app" via Socket.io, typically used to trigger
   * a re-query of data on the frontend
   */
  toApp (...args: any[]) {
    this.opts.appSocketServer?.emit('data-context-push', ...args)
  }

  /**
   * Broadcasts a signal to the "launchpad" (Electron GUI) via Socket.io,
   * typically used to trigger a re-query of data on the frontend
   */
  toLaunchpad (...args: any[]) {
    this.opts.gqlSocketServer?.emit('data-context-push', ...args)
  }
}
