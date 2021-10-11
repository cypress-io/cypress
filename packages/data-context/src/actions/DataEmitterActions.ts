import type { SocketIOServer } from '@packages/socket'
import type { DataContextShell } from '../DataContextShell'

export class DataEmitterActions {
  private _launchpadSocketServer: SocketIOServer | undefined
  private _appSocketServer: SocketIOServer | undefined
  constructor (private ctx: DataContextShell) {}

  setLaunchpadSocketServer (socketServer: SocketIOServer | undefined) {
    this._launchpadSocketServer = socketServer
  }

  setAppSocketServer (socketServer: SocketIOServer | undefined) {
    this._appSocketServer = socketServer
  }

  init () {
    this.ctx._apis.busApi.on('menu:item:clicked', (logout) => {
    })
  }

  toApp (...args: any[]) {
    this._appSocketServer?.emit('data-context-push', ...args)
  }

  toLaunchpad (ev: string, ...args: any[]) {
    this._launchpadSocketServer?.emit('data-context-push', ...args)
  }
}
