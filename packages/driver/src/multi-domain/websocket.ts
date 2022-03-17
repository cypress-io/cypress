import { client } from '@packages/socket'

//@ts-ignore
const ws = client.connect({
  path: '/__socket.io',
  transports: ['websocket'],
})

ws.on('cross:domain:delaying:html', (request) => {
  cy.isAnticipatingMultiDomainFor(request.href)
})
