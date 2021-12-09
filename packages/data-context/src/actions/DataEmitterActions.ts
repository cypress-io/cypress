import type { SocketIOServer } from '@packages/socket'
import type { DataContext } from '../DataContext'

export class DataEmitterActions {
  private _launchpadSocketServer: SocketIOServer | undefined
  private _appSocketServer: SocketIOServer | undefined
  constructor (private ctx: DataContext) {}

  setLaunchpadSocketServer (socketServer: SocketIOServer | undefined) {
    this._launchpadSocketServer = socketServer
  }

  setAppSocketServer (socketServer: SocketIOServer | undefined) {
    this._appSocketServer = socketServer
  }

  init () {
    this.ctx.rootBus.on('menu:item:clicked', (logout) => {
    })
  }

  /**
   * Broadcasts a signal to the "app" via Socket.io, typically used to trigger
   * a re-query of data on the frontend
   */
  toApp (...args: any[]) {
    this._appSocketServer?.emit('data-context-push', ...args)
  }

  /**
   * Broadcasts a signal to the "launchpad" (Electron GUI) via Socket.io,
   * typically used to trigger a re-query of data on the frontend
   */
  toLaunchpad (...args: any[]) {
    this._launchpadSocketServer?.emit('data-context-push', ...args)
  }
}
