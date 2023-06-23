import ipc from 'node-ipc'
import debugLib from 'debug'

const debug = debugLib('cypress:Server:extensionIpc')

ipc.config.id = 'cypress'
ipc.config.retry = 1500
ipc.config.sync = true
ipc.config.logger = debugLib

export const REQUESTS = {
  graphql: 'graphql:endpoint',
} as const

export function startExtensionIpc (endpoint: string) {
  ipc.serveNet(() => {
    ipc.server.on(REQUESTS.graphql, function (data, socket) {
      ipc.server.emit(socket, REQUESTS.graphql, endpoint)
    })

    ipc.server.on('socket.disconnected', function (data, socket) {
      debug
    })
  })

  ipc.server.start()

  return ipc
}
