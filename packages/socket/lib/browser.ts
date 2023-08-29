import io, { ManagerOptions, SocketOptions } from 'socket.io-client'
import { CDPBrowserSocket } from './cdp-browser'
import type { SocketShape } from './types'

export type { Socket } from 'socket.io-client'

const sockets: {[key: string]: CDPBrowserSocket} = {}
let chromium = false

export function client (uri: string, opts?: Partial<ManagerOptions & SocketOptions>): SocketShape {
  if (chromium) {
    const fullNamespace = `${opts?.path}${uri}`

    if (!sockets[fullNamespace]) {
      sockets[fullNamespace] = new CDPBrowserSocket(fullNamespace)
    }

    return sockets[fullNamespace]
  }

  return io(uri, opts)
}

export function createWebsocket ({ path, browserFamily }: { path: string, browserFamily: string}): SocketShape {
  if (browserFamily === 'chromium') {
    chromium = true

    const fullNamespace = `${path}/default`

    if (!sockets[fullNamespace]) {
      sockets[fullNamespace] = new CDPBrowserSocket(fullNamespace)
    }

    return sockets[fullNamespace]
  }

  return io({
    path,
    // TODO(webkit): the websocket socket.io transport is busted in WebKit, need polling
    // https://github.com/cypress-io/cypress/issues/23807
    transports: browserFamily === 'webkit' ? ['polling'] : ['websocket'],
  })
}
