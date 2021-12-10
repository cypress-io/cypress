// import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'
// import type { Interception } from '@packages/net-stubbing/lib/external-types'
// import type { FoundSpec } from '@packages/types/src'

describe('App Top Nav Workflows', () => {
  beforeEach(() => {
    cy.setupE2E('launchpad')
    cy.initializeApp()
    cy.visitApp()
  })

  context('Page Name', () => {
    it('should show the current page name in the top nav', () => {
      cy.get('[data-cy=app-header-bar]').should('be.visible').and('contain', 'Specs-Index')
    })
  })

  context('Browser List', () => {
    it('should show the current browser in the top nav browser list button', () => {
      // TODO initialize with test browsers/set current browser
      cy.get('[data-cy=topnav-browser-list]').should('be.visible').and('contain', 'Chrome')
    })

    // TODO dropdown tests
  })

  context('Cypress Version', () => {
    it('should render link to external docs if version is current', () => {
      // TODO initialize with latest version
      cy.get('[data-cy=top-nav-cypress-version-current-link]').should('have.attr', 'href', `https://github.com/cypress-io/cypress/releases/tag/v${'9.1.1'}`)
    })
  })

  context('Docs', () => {
    it('should render dropdown with documentation links', () => {

    })
  })
})
