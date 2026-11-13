/// <reference types="cypress" />

// https://github.com/cypress-io/cypress/issues/34964
// https://github.com/cypress-io/cypress/issues/35025
//
// Base64 makes the Fetch.fulfillRequest message for this body about 113 MiB,
// over Chrome's 100 MiB limit for a single DevTools websocket frame.
const LARGE_LENGTH = 85 * 1024 * 1024

// Pseudo-random rather than one repeated character, so a fragment that is
// dropped, repeated, or reassembled out of order changes what the page receives.
// Built as bytes, since an array of 85M one-character strings takes several
// times the memory of the string it joins into.
const largePayload = () => {
  const alphabet = new TextEncoder().encode('abcdefghijklmnopqrstuvwxyz0123456789')
  const bytes = new Uint8Array(LARGE_LENGTH)
  let seed = 1

  for (let i = 0; i < LARGE_LENGTH; i++) {
    seed = (seed * 1103515245 + 12345) >>> 0
    bytes[i] = alphabet[seed % alphabet.length]
  }

  return new TextDecoder().decode(bytes)
}

const largeScript = (payload: string) => `window.largeScript = "${payload}"`

// Asserts on `===` rather than `.to.eq(sent)`, which would print both 85 MB
// strings in the command log and any failure message.
const expectPageReceived = (sent: string) => {
  cy.window().then((win) => {
    const received: unknown = Reflect.get(win, 'largeScript')

    expect(typeof received === 'string' ? received.length : received, 'received length').to.eq(sent.length)
    expect(received === sent, 'received payload equals the sent one').to.be.true
  })
}

// Registering another route goes through the driver's socket, which shares the
// browser's DevTools connection, so it only resolves while that is still open.
const interceptAndFetchAnotherRoute = () => {
  cy.intercept('/intercept_large_body/after', { body: 'stubbed' }).as('after')

  cy.window().then((win) => win.fetch('/intercept_large_body/after').then((res) => res.text())).should('eq', 'stubbed')
  cy.wait('@after')
}

describe('cy.intercept with a response body over the CDP message limit', () => {
  it('fulfills a static response', () => {
    const payload = largePayload()

    cy.intercept('/intercept_large_body/large.js', {
      headers: { 'content-type': 'application/javascript' },
      body: largeScript(payload),
    }).as('large')

    cy.visit('/intercept_large_body/page')
    cy.wait('@large')
    expectPageReceived(payload)

    interceptAndFetchAnotherRoute()
  })

  it('fulfills a body replaced in a response handler', () => {
    const payload = largePayload()

    cy.intercept('/intercept_large_body/large.js', (req) => {
      req.continue((res) => {
        res.body = largeScript(payload)
      })
    }).as('large')

    cy.visit('/intercept_large_body/page')
    cy.wait('@large')
    expectPageReceived(payload)

    interceptAndFetchAnotherRoute()
  })
})
