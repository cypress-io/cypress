// The second spec of a multi-spec run, deliberately pointed at an origin the first spec
// never touches.
//
// Chromium reads `--host-resolver-rules` once, at launch, and a later spec reuses that
// browser instead of relaunching it. A bridge rebound per spec therefore hands this spec a
// rule pointing at a port that has already been closed. A second origin is what makes that
// visible: reusing the first spec's origin can succeed on a connection the browser already
// holds open, which hides the stale rule.
const origin = Cypress.expose('MTLS_ORIGIN_2')

describe('clientCertificates on a second spec', () => {
  it('presents the certificate for a browser-issued script subresource', () => {
    cy.visit(`${origin}/`)
    cy.get('[data-cy=script]').should('have.text', 'cypress-client')
  })

  it('presents the certificate for a browser-issued fetch', () => {
    cy.visit(`${origin}/`)
    cy.get('[data-cy=fetch]').should('have.text', 'cypress-client')
  })
})
