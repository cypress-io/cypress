import io, { ManagerOptions, SocketOptions } from 'socket.io-client'
import { cypressParser } from '../utils'
import { CDPBrowserSocket } from './cdp-browser'
import type { SocketShape } from './cdp-browser'

declare global {
  interface Window {
    cypressSockets: {[key: string]: CDPBrowserSocket}
  }
}

// Whether this browser communicates over the automation channel (a window
// binding bridged by CDP in Chromium or Playwright in WebKit) instead of HTTP.
let usesAutomationSocket = false

const getAutomationSocket = (fullNamespace: string): SocketShape => {
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

export function client (uri: string, opts?: Partial<ManagerOptions & SocketOptions>): SocketShape {
  if (usesAutomationSocket) {
    return getAutomationSocket(`${opts?.path}${uri}`)
  }

  return io(uri, { parser: cypressParser, ...opts })
}

export function createWebsocket ({ path, browserFamily }: { path: string, browserFamily: string}): SocketShape {
  if (browserFamily === 'chromium' || browserFamily === 'webkit') {
    usesAutomationSocket = true

    return getAutomationSocket(`${path}/default`)
  }

  return io({
    path,
    transports: ['websocket'],
    parser: cypressParser,
  })
}
