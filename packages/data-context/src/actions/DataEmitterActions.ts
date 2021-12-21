import type { DataContext } from '../DataContext'

export class DataEmitterActions {
  constructor (private ctx: DataContext) {}

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
}
