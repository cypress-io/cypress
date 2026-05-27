// Reproduces https://github.com/cypress-io/cypress/issues/33926
//
// Suspected regression: PR #33446 (15.12.0) — whenStable queue waits for all
// stability waiters instead of overwriting a single callback. On WebKit 15.15+,
// cy.session() restore plus multiple cy.intercept() routes in beforeEach with
// testIsolation: false can deadlock while subresources stay in-flight.

const dashboardPath = () => {
  return Cypress.browser.family === 'webkit' ? '/dashboard-stress' : '/dashboard'
}

describe('issue 33926', { testIsolation: false }, () => {
  beforeEach(() => {
    cy.session('user-session', () => {
      cy.visit('/login')
      cy.get('[data-cy="login-button"]').click()
      cy.url().should('include', '/dashboard')
    })

    cy.intercept('GET', '/bundles/libraries-css*').as('librariesCss')
    cy.intercept('GET', '/bundles/main/content/main-css*').as('mainCss')
    cy.intercept('GET', '/bundles/acresi-vue-library*').as('vueLibrary')
    cy.intercept('GET', '/bundles/common/content/common-css*').as('commonCss')
    cy.intercept('GET', '/acresi-vue-library/dist/assets/third-party-css*').as('thirdPartyCss')
    cy.intercept('GET', '/bundles/css-layer-order*').as('cssLayerOrder')
    cy.intercept('GET', '/bundles/main.js*').as('mainJs')
    cy.intercept('GET', '/api/**').as('api')
  })

  it('loads dashboard with subresources', () => {
    cy.visit(dashboardPath())

    if (Cypress.browser.family === 'webkit') {
      cy.wait(['@librariesCss', '@mainCss', '@mainJs', '@vueLibrary'], { timeout: 5000 })
    }

    cy.get('[data-cy="nav-care-network"]').should('be.visible')
    cy.window().its('__appMounted').should('eq', true)
  })

  it('restores session and loads dashboard on second test', () => {
    cy.reload()
    cy.visit(dashboardPath())

    if (Cypress.browser.family === 'webkit') {
      cy.wait(['@librariesCss', '@mainCss', '@mainJs', '@vueLibrary'], { timeout: 5000 })
    }

    cy.get('[data-cy="nav-care-network"]').should('be.visible')
    cy.window().its('__appMounted').should('eq', true)
  })
})
