import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'

describe('Cypress In Cypress', { viewportWidth: 1200 }, () => {
  beforeEach(() => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.findBrowsers()
    cy.openProject('cypress-in-cypress')
    cy.startAppServer()
    cy.visitApp()
  })

  it('test e2e', () => {
    cy.contains('dom-content.spec').click()
    cy.location().should((location) => {
      expect(location.hash).to.contain('dom-content.spec')
    })

    cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')
    cy.findByTestId('aut-url').should('be.visible')
    cy.findByTestId('playground-activator').should('be.visible')
    cy.findByTestId('select-browser').click()

    cy.contains('Firefox').should('be.visible')
    cy.findByTestId('viewport').click()

    cy.percySnapshot('browsers open')
    cy.contains('Firefox').should('be.hidden')
    cy.contains('The viewport determines the width and height of your application. By default the viewport will be 1000px by 660px for End-to-end Testing unless specified by a cy.viewport command.')
    .should('be.visible')

    cy.percySnapshot('viewport info open')
  })

  it('navigation between specs and other parts of the app works', () => {
    cy.contains('dom-content.spec').click()
    cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')

    // go to Settings page and back to spec runner
    cy.contains('a', 'Settings').click()
    cy.contains(defaultMessages.settingsPage.device.title).should('be.visible')
    cy.contains('a', 'Specs').click()
    cy.contains('dom-content.spec').click()
    cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')

    // go to Runs page and back to spec runner
    cy.contains('a', 'Runs').click()
    cy.contains(defaultMessages.runs.connect.title).should('be.visible')
    cy.contains('a', 'Specs').click()
    cy.contains('dom-content.spec').click()
    cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')
  })
})
