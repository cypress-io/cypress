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

webSocket.on('cross:domain:delaying:html', (request) => {
  // Until we do nested switch to domain, we just need to know what the request was for error messaging.
  cy.isAnticipatingCrossOriginRequestFor(request.href)
})

export const handleSocketEvents = (Cypress) => {
  Cypress.on('backend:request', onBackendRequest)
  Cypress.on('automation:request', onAutomationRequest)
}
