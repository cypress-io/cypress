import util from 'util'

import type { AddressInfo } from 'net'
import type { Server } from 'http'
import type { SocketIONamespace, SocketIOServer } from '@packages/socket'
import type { DataContext } from '..'
import type { CDPSocketServer } from '@packages/socket/lib/cdp-socket'

export class ServersActions {
  constructor (private ctx: DataContext) {}

  setAppServerPort (port: number | undefined) {
    this.ctx.update((d) => {
      d.servers.appServerPort = port ?? null
    })
  }

  setAppSocketServer ({ socketIo, cdpIo }: { socketIo?: SocketIOServer, cdpIo?: CDPSocketServer } = { socketIo: undefined, cdpIo: undefined }) {
    this.ctx.update((d) => {
      d.servers.appSocketServer?.disconnectSockets(true)
      d.servers.appSocketNamespace?.disconnectSockets(true)
      d.servers.cdpSocketServer?.disconnectSockets(true)
      d.servers.cdpSocketNamespace?.disconnectSockets(true)
      d.servers.appSocketServer = socketIo
      d.servers.appSocketNamespace = socketIo?.of('/data-context')
      d.servers.cdpSocketServer = cdpIo
      d.servers.cdpSocketNamespace = cdpIo?.of('/data-context')
    })
  }

  setGqlServer (srv: Server) {
    this.ctx.update((d) => {
      d.servers.gqlServer = srv
      d.servers.gqlServerPort = (srv.address() as AddressInfo).port
    })
  }

  setGqlSocketServer (socketServer: SocketIONamespace | undefined) {
    this.ctx.update((d) => {
      d.servers.gqlSocketServer?.disconnectSockets(true)
      d.servers.gqlSocketServer = socketServer
    })
  }

  async destroyGqlServer () {
    const destroy = this.ctx.coreData.servers.gqlServer?.destroy

    if (!destroy) {
      return
    }

    return util.promisify(destroy)()
  }
}
