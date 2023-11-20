/* eslint-disable no-undef */
const httpUrl = Cypress.env('httpUrl')
const httpsUrl = Cypress.env('httpsUrl')

describe('cookies', () => {
  it('sends cookies to url', () => {
    cy.visit(`${httpUrl}/`)
    cy.clearCookies()
    cy.setCookie('asdf', 'jkl')
    cy.request(`${httpUrl}/requestCookies`)
    .its('body').should('deep.eq', { asdf: 'jkl' })
  })

  it('handles expired cookies secure', () => {
    cy.visit(`${httpUrl}/set`)
    cy.getCookie('shouldExpire').should('exist')
    cy.visit(`${httpUrl}/expirationMaxAge`)
    cy.getCookie('shouldExpire').should('not.exist')
    cy.visit(`${httpUrl}/set`)
    cy.getCookie('shouldExpire').should('exist')
    cy.visit(`${httpUrl}/expirationExpires`)
    cy.getCookie('shouldExpire').should('not.exist')
  })

  it('issue: #224 sets expired cookies between redirects', () => {
    cy.visit(`${httpUrl}/set`)
    cy.getCookie('shouldExpire').should('exist')
    cy.visit(`${httpUrl}/expirationRedirect`)
    cy.url().should('include', '/logout')
    cy.getCookie('shouldExpire').should('not.exist')

    cy.visit(`${httpUrl}/set`)
    cy.getCookie('shouldExpire').should('exist')
    cy.request(`${httpUrl}/expirationRedirect`)
    cy.getCookie('shouldExpire').should('not.exist')
  })

  it('issue: #1321 failing to set or parse cookie', () => {
    // this is happening because the original cookie was set
    // with a secure flag, and then expired without the secure
    // flag.
    cy.visit(`${httpsUrl}/setOneHourFromNowAndSecure`)
    cy.getCookies().should('have.length', 1)

    // secure cookies should have been attached
    cy.request(`${httpsUrl}/requestCookies`)
    .its('body').should('deep.eq', { shouldExpire: 'oneHour' })

    const hostName = new Cypress.Location(httpUrl).getHostName()

    // TODO(origin): remove 'if' check once https://github.com/cypress-io/cypress/issues/24332 is resolved
    if (!['localhost', '127.0.0.1'].includes(hostName)) {
      // secure cookies should not have been attached
      cy.request(`${httpUrl}/requestCookies`)
      .its('body').should('deep.eq', {})
    }

    cy.visit(`${httpsUrl}/expirationMaxAge`)
    cy.getCookies().should('be.empty')
  })

  it('issue: #2724 does not fail on invalid cookies', () => {
    cy.visit(`${httpsUrl}/`)
    cy.request(`${httpsUrl}/invalidCookies`)
  })
})
