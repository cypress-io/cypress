import { client } from '@packages/socket'

export const handleSocketEvents = (Cypress) => {
  const webSocket = client({
    path: Cypress.config('socketIoRoute'),
    transports: ['websocket'],
  }).connect()

  const onBackendRequest = (...args) => {
    webSocket.emit('backend:request', ...args)
  }

  const onAutomationRequest = (...args) => {
    webSocket.emit('automation:request', ...args)
  }

  Cypress.on('backend:request', onBackendRequest)
  Cypress.on('automation:request', onAutomationRequest)
}
