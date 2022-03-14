describe('Cypress In Cypress - run mode', { viewportWidth: 1200 }, () => {
  it('e2e run mode spec runner header is correct', () => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.findBrowsers()
    cy.openProject('cypress-in-cypress')
    cy.startAppServer()
    cy.visitApp()

    simulateRunModeInUI()

    cy.contains('dom-content.spec').click()
    cy.location().should((location) => {
      expect(location.hash).to.contain('dom-content.spec')
    })

    cy.findByTestId('aut-url').should('be.visible')
    cy.findByTestId('playground-activator').should('not.exist')

    // confirm expected content is rendered
    cy.contains('1000x660').should('be.visible')
    cy.contains('71%').should('be.visible')
    cy.contains('Chrome 1').should('be.visible')
    cy.contains('http://localhost:4455/cypress/e2e/dom-content.html').should('be.visible')

    cy.percySnapshot({
      elementOverrides: {
        '.runnable-header .duration': ($el) => {
          $el.text('XX:XX')
        },
      },
    })

    // confirm no interactions are implemented
    cy.findByTestId('viewport').click()
    cy.contains('The viewport determines').should('not.exist')
    cy.contains('Chrome 1').click()
    cy.contains('Firefox').should('not.exist')
  })

  it('component testing run mode spec runner header is correct', () => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.findBrowsers()
    cy.openProject('cypress-in-cypress')
    cy.startAppServer('component')
    cy.visitApp()
    simulateRunModeInUI()
    cy.contains('TestComponent.spec').click()
    cy.location().should((location) => {
      expect(location.hash).to.contain('TestComponent.spec')
    })

    cy.findByTestId('aut-url').should('not.exist')
    cy.findByTestId('playground-activator').should('not.exist')

    // confirm expected content is rendered
    cy.contains('500x500').should('be.visible')
    cy.contains('Chrome 1').should('be.visible')

    cy.percySnapshot({
      elementOverrides: {
        '.runnable-header .duration': ($el) => {
          $el.text('XX:XX')
        },
      },
    })

    // confirm no interactions are implemented
    cy.findByTestId('viewport').click()
    cy.contains('The viewport determines').should('not.exist')
    cy.contains('Chrome 1').click()
    cy.contains('Firefox').should('not.exist')
  })
})

function simulateRunModeInUI () {
  // this simulates run mode enough for this test
  cy.window().then((win) => {
    win.__CYPRESS_MODE__ = 'run'
    cy.get('body').then(($el) => {
      $el.find('[data-cy="sidebar"]')?.remove()
    })
  })
}
