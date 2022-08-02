describe('Cypress In Cypress - run mode', { viewportWidth: 1200 }, () => {
  it('e2e run mode spec runner header is correct', () => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.findBrowsers()
    cy.openProject('cypress-in-cypress')
    cy.startAppServer()
    cy.visitApp()

    simulateRunModeInUI()

    cy.contains('dom-content.spec').click()
    cy.waitForSpecToFinish()

    cy.findByTestId('aut-url').should('be.visible')
    cy.findByTestId('playground-activator').should('not.exist')

    cy.findByLabelText('Stats').within(() => {
      cy.get('.passed .num', { timeout: 10000 }).should('have.text', '1')
    })

    // confirm expected content is rendered
    cy.contains('1000x660').should('be.visible')
    cy.contains('71%').should('be.visible')
    cy.contains('Chrome 1').should('be.visible')
    cy.contains('http://localhost:4455/cypress/e2e/dom-content.html').should('be.visible')

    // confirm no interactions are implemented
    cy.findByTestId('viewport').click()
    cy.contains('The viewport determines').should('not.exist')
    cy.contains('Chrome 1').click()
    cy.contains('Firefox').should('not.exist')

    cy.percySnapshot()
  })

  it('component testing run mode spec runner header is correct', () => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.findBrowsers()
    cy.openProject('cypress-in-cypress')
    cy.startAppServer('component')
    cy.visitApp()
    simulateRunModeInUI()
    cy.contains('TestComponent.spec').click()
    cy.waitForSpecToFinish()

    cy.findByTestId('aut-url').should('not.exist')
    cy.findByTestId('playground-activator').should('not.exist')

    cy.findByLabelText('Stats').within(() => {
      cy.get('.passed .num', { timeout: 10000 }).should('have.text', '1')
    })

    // confirm expected content is rendered
    cy.contains('500x500').should('be.visible')
    cy.contains('Chrome 1').should('be.visible')

    // confirm no interactions are implemented
    cy.findByTestId('viewport').click()
    cy.contains('The viewport determines').should('not.exist')
    cy.contains('Chrome 1').click()
    cy.contains('Firefox').should('not.exist')

    cy.percySnapshot()
  })

  it('hides reporter when NO_COMMAND_LOG is set in run mode', () => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.findBrowsers()
    cy.openProject('cypress-in-cypress')
    cy.startAppServer()
    cy.withCtx(async (ctx, o) => {
      const config = await ctx.project.getConfig()

      o.sinon.stub(ctx.project, 'getConfig').resolves({
        ...config,
        env: {
          ...config.env,
          NO_COMMAND_LOG: 1,
        },
      })
    })

    cy.visitApp()
    simulateRunModeInUI()
    cy.contains('dom-content.spec').click()

    cy.contains('http://localhost:4455/cypress/e2e/dom-content.html').should('be.visible')
    cy.findByLabelText('Stats').should('not.exist')
    cy.findByTestId('specs-list-panel').should('not.be.visible')
    cy.findByTestId('reporter-panel').should('not.be.visible')
    cy.findByTestId('sidebar').should('not.exist')
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
