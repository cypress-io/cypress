import io from 'socket.io-client'
import { CDPBrowserSocket } from './cdp-browser'

export type { Socket } from 'socket.io-client'

const sockets: {[key: string]: CDPBrowserSocket} = {}

// TODO: figure out how to replicate this
export function client (namespace: string, opts: any) {
  if (!sockets[namespace]) {
    sockets[namespace] = new CDPBrowserSocket(namespace)
  }

  return sockets[namespace]
}

export function createWebsocket ({ path, browserFamily }: { path: string, browserFamily: string}) {
  if (browserFamily === 'chromium') {
    return new CDPBrowserSocket('default')
  }

  return io({
    path,
    // TODO(webkit): the websocket socket.io transport is busted in WebKit, need polling
    // https://github.com/cypress-io/cypress/issues/23807
    transports: browserFamily === 'webkit' ? ['polling'] : ['websocket'],
  })
}
