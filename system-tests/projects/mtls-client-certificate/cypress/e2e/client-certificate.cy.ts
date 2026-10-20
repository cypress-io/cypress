// Regression coverage for https://github.com/cypress-io/cypress/issues/34807.
//
// The origin requires a client certificate. `cy.request` and the visited document both
// pass even while the bug is live, because Node makes those requests and presents the
// certificate. Only a request the *browser* issues exercises the broken path, so the
// subresource assertions below are the ones that matter.
const origin = Cypress.expose('MTLS_ORIGIN')

describe('clientCertificates', () => {
  it('presents the certificate for cy.request', () => {
    cy.request(`${origin}/peer`).its('body.peerCN').should('eq', 'cypress-client')
  })

  it('presents the certificate for the visited document', () => {
    cy.visit(`${origin}/`)
    cy.get('[data-cy=doc]').should('have.text', 'mTLS document')
  })

  it('presents the certificate for a browser-issued script subresource', () => {
    cy.visit(`${origin}/`)
    cy.get('[data-cy=script]').should('have.text', 'cypress-client')
  })

  it('presents the certificate for a browser-issued fetch', () => {
    cy.visit(`${origin}/`)
    cy.get('[data-cy=fetch]').should('have.text', 'cypress-client')
  })
})
