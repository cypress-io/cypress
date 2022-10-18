import { createWebsocket } from '@packages/socket/lib/browser'

export const handleSocketEvents = (Cypress) => {
  const webSocket = createWebsocket({ path: Cypress.config('socketIoRoute'), browserFamily: Cypress.config('browser').family })

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
