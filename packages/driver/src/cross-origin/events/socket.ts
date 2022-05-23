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

  webSocket.on('cross:origin:delaying:html', (request) => {
    // Until we do nested cy.origin, we just need to know what the request was for error messaging.
    cy.isAnticipatingCrossOriginResponseFor(request)
  })

  Cypress.on('backend:request', onBackendRequest)
  Cypress.on('automation:request', onAutomationRequest)
}
