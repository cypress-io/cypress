import { client } from '@packages/socket'

//@ts-ignore
const ws = client.connect({
  path: '/__socket.io',
  transports: ['websocket'],
})

ws.on('cross:domain:delaying:html', (request) => {
  // Until we do nested switch to domain, we just need to know what the request was for error messaging.
  cy.isAnticipatingMultiDomainFor(request.href)
})
