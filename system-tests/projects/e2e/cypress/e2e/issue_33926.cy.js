// Reproduces https://github.com/cypress-io/cypress/issues/33926
//
// Suspected regression: PR #33446 (15.12.0) — whenStable queue waits for all
// stability waiters instead of overwriting a single callback. On WebKit 15.15+,
// cy.session() restore plus multiple cy.intercept() routes in beforeEach with
// testIsolation: false can deadlock while subresources stay in-flight.

const appPath = () => {
  return Cypress.browser.family === 'webkit' ? '/app-stress' : '/app'
}

describe('issue 33926', { testIsolation: false }, () => {
  beforeEach(() => {
    cy.session('test-session', () => {
      cy.visit('/login')
      cy.get('#sign-in').click()
      cy.url().should('include', '/app')
    })

    cy.intercept('GET', '/assets/style-a*').as('styleA')
    cy.intercept('GET', '/assets/style-b*').as('styleB')
    cy.intercept('GET', '/assets/vendor*').as('vendor')
    cy.intercept('GET', '/assets/style-c*').as('styleC')
    cy.intercept('GET', '/assets/style-d*').as('styleD')
    cy.intercept('GET', '/assets/layer*').as('layer')
    cy.intercept('GET', '/assets/app*').as('app')
    cy.intercept('GET', '/api/**').as('api')
  })

  it('loads page with subresources', () => {
    cy.visit(appPath())

    cy.get('#app-root').should('be.visible')
    cy.window().its('__mounted').should('eq', true)
  })

  it('restores session on second test', () => {
    cy.reload()
    cy.visit(appPath())

    cy.get('#app-root').should('be.visible')
    cy.window().its('__mounted').should('eq', true)
  })
})
