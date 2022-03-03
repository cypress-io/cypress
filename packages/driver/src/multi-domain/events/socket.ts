import { client } from '@packages/socket'

const webSocket = client({
  path: '/__socket.io',
  transports: ['websocket'],
}).connect()

const onBackendRequest = (...args) => {
  webSocket.emit('backend:request', ...args)
}

const onAutomationRequest = (...args) => {
  webSocket.emit('automation:request', ...args)
}

export const handleSocketEvents = (Cypress) => {
  Cypress.on('backend:request', onBackendRequest)
  Cypress.on('automation:request', onAutomationRequest)
}
