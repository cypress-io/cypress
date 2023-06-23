import io from 'socket.io-client'
import { CDPBrowserSocket } from './CDP-browser-socket'

export type { Socket } from 'socket.io-client'

const sockets: {[key: string]: CDPBrowserSocket} = {}

// export { io as client }

export function client (namespace: string) {
  if (!sockets[namespace]) {
    sockets[namespace] = new CDPBrowserSocket(namespace)
  }

  return sockets[namespace]
}

export function createWebsocket ({ path, browserFamily }: { path: string, browserFamily: string}) {
  console.log('browser family', browserFamily)
  if (browserFamily === 'chromium') {
    console.log('creating CDPBrowserSocket')

    return new CDPBrowserSocket('default')
  }

  console.log('some how we are here')

  // return io({
  //   path,
  //   // TODO(webkit): the websocket socket.io transport is busted in WebKit, need polling
  //   // https://github.com/cypress-io/cypress/issues/23807
  //   transports: browserFamily === 'webkit' ? ['polling'] : ['websocket'],
  // })
}
