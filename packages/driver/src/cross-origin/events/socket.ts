import { client } from '@packages/socket/lib/browser'

export const handleSocketEvents = (Cypress) => {
  const webSocket = client({
    path: Cypress.config('socketIoRoute'),
    transports: ['websocket'],
  })

  webSocket.on('connect_error', () => {
    // fall back to polling if websocket fails to connect (webkit)
    // https://github.com/socketio/socket.io/discussions/3998#discussioncomment-972316
    webSocket.io.opts.transports = ['polling', 'websocket']
  })

  webSocket.connect()

  const onBackendRequest = (...args) => {
    webSocket.emit('backend:request', ...args)
  }

  const onAutomationRequest = (...args) => {
    webSocket.emit('automation:request', ...args)
  }

  Cypress.on('backend:request', onBackendRequest)
  Cypress.on('automation:request', onAutomationRequest)
}
