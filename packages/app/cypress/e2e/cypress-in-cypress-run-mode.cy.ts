describe('Cypress In Cypress - run mode', { viewportWidth: 1200 }, () => {
  beforeEach(() => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.findBrowsers()
    cy.openProject('cypress-in-cypress')
    cy.startAppServer()
    cy.visitApp()
  })

  it('test e2e', () => {
    // this simulates run mode enough for this test
    cy.window().then((win) => {
      win.__CYPRESS_MODE__ = 'run'
      cy.findAllByTestId('navbar-wrapper').then(($el) => {
        $el.remove()
      })
    })

    cy.contains('dom-content.spec').click()
    cy.location().should((location) => {
      expect(location.hash).to.contain('dom-content.spec')
    })

    cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')
    cy.findByTestId('aut-url').should('be.visible')
    cy.findByTestId('playground-activator').should('not.exist')

    // confirm expected content is rendered
    cy.contains('1000x660').should('be.visible')
    cy.contains('84%').should('be.visible')
    cy.contains('Chrome 1').should('be.visible')
    cy.contains('http://localhost:4455/cypress/e2e/dom-content.html').should('be.visible')

    cy.percySnapshot()

    // confirm no interactions are implemented
    cy.findByTestId('viewport').click()
    cy.contains('The viewport determines').should('not.exist')
    cy.contains('Chrome 1').click()
    cy.contains('Firefox').should('not.exist')
  })
})
