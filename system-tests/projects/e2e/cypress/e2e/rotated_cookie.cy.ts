// https://github.com/cypress-io/cypress/issues/34891
// A cookie set in the browser without passing through the proxy must be the cookie
// the server receives on the next AUT frame navigation, rather than the value the
// server-side cookie jar holds from the first visit.
describe('cookies set outside the proxy', () => {
  beforeEach(() => {
    cy.visit('/rotated_cookie')
    cy.get('#sid').should('have.text', 'sid: anon')
  })

  it('sends the cookie cy.request rotated on the next navigation', () => {
    cy.request('POST', '/rotated_cookie/login')
    // asserted first to pin down that the browser holds the rotated value, so a
    // failure below is the server receiving something else
    cy.getCookie('sid').its('value').should('eq', 'auth')

    cy.get('#account').click()
    cy.get('#sid').should('have.text', 'sid: auth')
  })

  it('sends the cookie cy.setCookie overwrote on the next navigation', () => {
    cy.setCookie('sid', 'manual')
    cy.getCookie('sid').its('value').should('eq', 'manual')

    cy.get('#account').click()
    cy.get('#sid').should('have.text', 'sid: manual')
  })
})
