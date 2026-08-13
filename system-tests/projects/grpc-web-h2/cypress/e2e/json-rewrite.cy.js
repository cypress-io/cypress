/* eslint-disable no-undef */
// Nothing gRPC about these — ordinary JSON and text POSTs with ordinary UTF-8
// bodies, to separate "binary bodies are mishandled" from "request-body
// rewriting is broken" on the proxy-disabled transport.
//
// Each rewrite uses the form Cypress expects for that content type: an object
// for a JSON body (the driver parses it before the handler and re-stringifies
// after) and a string for a text body.
//
//   node system-tests/projects/grpc-web-h2/server.mjs
//   CYPRESS_INTERNAL_DISABLE_PROXY=1 yarn cypress:run \
//     --project system-tests/projects/grpc-web-h2 --browser chrome \
//     --spec system-tests/projects/grpc-web-h2/cypress/e2e/json-rewrite.cy.js
const post = (fn, arg) => {
  return cy.window().then((win) => {
    return Cypress.Promise.resolve(win[fn](arg))
  })
}

describe('plain request bodies', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.get('#fetch-echo').should('not.have.text', 'pending')
    cy.get('#xhr-echo').should('not.have.text', 'pending')
  })

  it('passes an unmodified JSON body through', () => {
    cy.intercept('POST', '**/api/json').as('json')

    post('jsonPost', { a: 1 }).should('deep.eq', { received: '{"a":1}' })
  })

  it('sends a rewritten JSON body', () => {
    cy.intercept('POST', '**/api/json', (req) => {
      req.body = { a: 2 }
    }).as('json')

    post('jsonPost', { a: 1 }).should('deep.eq', { received: '{"a":2}' })
  })

  it('sends a rewritten text body', () => {
    cy.intercept('POST', '**/api/json', (req) => {
      req.body = 'rewritten'
    }).as('text')

    post('textPost', 'original').should('deep.eq', { received: 'rewritten' })
  })
})
