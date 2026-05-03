import io, { ManagerOptions, SocketOptions } from 'socket.io-client'
import { cypressParser } from '../utils'
import { CDPBrowserSocket } from './cdp-browser'
import type { SocketShape } from './cdp-browser'

declare global {
  interface Window {
    cypressSockets: {[key: string]: CDPBrowserSocket}
  }
}

let chromium = false

export function client (uri: string, opts?: Partial<ManagerOptions & SocketOptions>): SocketShape {
  if (chromium) {
    const fullNamespace = `${opts?.path}${uri}`

    // When running in Chromium and with a baseUrl set to something that includes basic auth: (e.g. http://user:pass@localhost:1234), the assets
    // will load twice. Thus, we need to add the cypress sockets to the window object rather than just relying on a local variable.
    window.cypressSockets ||= {}
    if (!window.cypressSockets[fullNamespace]) {
      window.cypressSockets[fullNamespace] = new CDPBrowserSocket(fullNamespace)
    }

    // Connect the socket regardless of whether or not we have newly created it
    window.cypressSockets[fullNamespace].connect()

    return window.cypressSockets[fullNamespace] as unknown as SocketShape
  }

  return io(uri, { parser: cypressParser, ...opts })
}

export function createWebsocket ({ path, browserFamily }: { path: string, browserFamily: string}): SocketShape {
  if (browserFamily === 'chromium') {
    chromium = true

    const fullNamespace = `${path}/default`

    // When running in Chromium and with a baseUrl set to something that includes basic auth: (e.g. http://user:pass@localhost:1234), the assets
    // will load twice. Thus, we need to add the cypress sockets to the window object rather than just relying on a local variable.
    window.cypressSockets ||= {}
    if (!window.cypressSockets[fullNamespace]) {
      window.cypressSockets[fullNamespace] = new CDPBrowserSocket(fullNamespace)
    }

    // Connect the socket regardless of whether or not we have newly created it
    window.cypressSockets[fullNamespace].connect()

    return window.cypressSockets[fullNamespace] as unknown as SocketShape
  }

  return io({
    path,
    // TODO(webkit): the websocket socket.io transport is busted in WebKit, need polling
    // https://github.com/cypress-io/cypress/issues/23807
    transports: browserFamily === 'webkit' ? ['polling'] : ['websocket'],
    parser: cypressParser,
  })
}
