import io from 'socket.io-client'

export type { Socket } from 'socket.io-client'

export {
  io as client,
}

export function createWebsocket ({ path, browserFamily }: { path: string, browserFamily: string}) {
  return io({
    path,
    // TODO(webkit): the websocket socket.io transport is busted in WebKit, need polling
    // https://github.com/cypress-io/cypress/issues/23807
    transports: browserFamily === 'webkit' ? ['polling'] : ['websocket'],
  })
}
