import type { FoundBrowser } from '@packages/types/src'

describe('App Top Nav Workflows', () => {
  const setupMockBrowsers = function () {
    cy.withCtx(async (ctx, o) => {
      const mockBrowsers = [{
        channel: 'stable',
        displayName: 'Chrome',
        family: 'chromium',
        name: 'chrome',
        version: '1.2.333.445',
        path: '/test/chrome/path',
        majorVersion: '1',
      }, {
        channel: 'stable',
        displayName: 'Firefox',
        family: 'firefox',
        name: 'firefox',
        path: '/test/firefox/path',
        version: '2.3.444',
        majorVersion: '2',
      }, {
        channel: 'stable',
        displayName: 'Electron',
        family: 'chromium',
        name: 'electron',
        path: '/test/electron/path',
        version: '3.4.555.66',
        majorVersion: '3',
      }, {
        channel: 'stable',
        displayName: 'Edge',
        family: 'chromium',
        name: 'edge',
        path: '/test/edge/path',
        version: '4.5.666.77',
        majorVersion: '4',
      }] as FoundBrowser[]

      sinon.stub(ctx._apis.appApi, 'getBrowsers').resolves(mockBrowsers)
    })
  }

  beforeEach(() => {
    cy.scaffoldProject('launchpad')
  })

  context('Page Name', () => {
    it('shows the current page name in the top nav', () => {
      setupMockBrowsers()
      cy.openProject('launchpad')
      cy.startAppServer()
      cy.visitApp()

      cy.get('[data-cy=app-header-bar]').should('be.visible').and('contain', 'Specs-Index')
    })
  })

  context('Browser List', () => {
    it('shows the current browser in the top nav browser list button', () => {
      setupMockBrowsers()
      cy.openProject('launchpad')
      cy.startAppServer()
      cy.visitApp()

      cy.get('[data-cy=top-nav-active-browser-icon]')
      .should('have.attr', 'src')
      .and('contain', 'chrome')

      cy.get('[data-cy=top-nav-active-browser]')
      .should('contain', 'Chrome v1')
    })

    it('shows current browser when launched with browser option', () => {
      setupMockBrowsers()
      cy.openProject('launchpad', ['--browser', 'firefox'])
      cy.startAppServer()
      cy.visitApp()

      cy.get('[data-cy=top-nav-active-browser-icon]')
      .should('have.attr', 'src')
      .and('contain', 'firefox')

      cy.get('[data-cy=top-nav-active-browser]')
      .should('contain', 'Firefox v2')
    })

    it('shows list of browser options in dropdown when selected', () => {
      setupMockBrowsers()
      cy.openProject('launchpad')
      cy.startAppServer()
      cy.visitApp()

      cy.get('[data-cy=top-nav-active-browser]').click()

      cy.get('[data-cy=top-nav-browser-list-item]').as('browserItems').should('have.length', 4)

      cy.get('@browserItems').eq(0)
      .should('contain', 'Chrome')
      .and('contain', 'Version 1.2.333.445')
      .find('[data-cy="top-nav-browser-list-selected-item"]')
      .should('exist')

      cy.get('@browserItems').eq(1)
      .should('contain', 'Firefox')
      .and('contain', 'Version 2.3.444')
      .find('[data-cy="top-nav-browser-list-selected-item"]')
      .should('not.exist')

      cy.get('@browserItems').eq(2)
      .should('contain', 'Electron')
      .and('contain', 'Version 3.4.555.66')
      .find('[data-cy="top-nav-browser-list-selected-item"]')
      .should('not.exist')

      cy.get('@browserItems').eq(3)
      .should('contain', 'Edge')
      .and('contain', 'Version 4.5.666.77')
      .find('[data-cy="top-nav-browser-list-selected-item"]')
      .should('not.exist')
    })

    it('performs mutations to update and relaunch browser', () => {
      setupMockBrowsers()
      cy.openProject('launchpad')
      cy.startAppServer()
      cy.visitApp()

      cy.get('[data-cy=top-nav-active-browser]').click()

      cy.intercept('mutation-TopNav_SetBrowser').as('setBrowser')
      cy.intercept('mutation-TopNav_LaunchOpenProject').as('launchOpenProject')

      cy.get('[data-cy=top-nav-browser-list-item]').eq(1).click().then(($element) => {
        cy.wait('@setBrowser').then(({ request }) => {
          expect(request.body.variables.id).to.eq($element.attr('data-browser-id'))
        })

        cy.wait('@launchOpenProject')
      })
    })
  })

  // context('Cypress Version', () => {
  //   it('should render link to external docs if version is current', () => {
  //     // TODO initialize with latest version
  //     cy.get('[data-cy=top-nav-cypress-version-current-link]').should('have.attr', 'href', `https://github.com/cypress-io/cypress/releases/tag/v${'9.1.1'}`)
  //   })
  // })

  // context('Docs', () => {
  //   it('should render dropdown with documentation links', () => {

  //   })
  // })
})
