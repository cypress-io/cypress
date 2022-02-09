import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'

describe('Cypress In Cypress', { viewportWidth: 1200 }, () => {
  beforeEach(() => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.findBrowsers()
    cy.openProject('cypress-in-cypress')
    cy.startAppServer('component')
    cy.visitApp()
  })

  it('test component', () => {
    cy.contains('TestComponent.spec').click()
    cy.location().should((location) => {
      expect(location.hash).to.contain('TestComponent.spec')
    })

    cy.get('[data-model-state="passed"]').should('contain', 'renders the test component')

    cy.findByTestId('aut-url').should('not.exist')
    cy.findByTestId('select-browser').click()

    cy.contains('Firefox').should('be.visible')
    cy.findByTestId('viewport').click()

    cy.percySnapshot('browsers open')
    cy.contains('Firefox').should('be.hidden')
    cy.contains('The viewport determines the width and height of your application. By default the viewport will be 500px by 500px for Component Testing unless specified by a cy.viewport command.')
    .should('be.visible')

    cy.percySnapshot('viewport info open')
  })

  it('navigation between specs and other parts of the app works', () => {
    cy.contains('TestComponent.spec').click()
    cy.get('[data-model-state="passed"]').should('contain', 'renders the test component')

    // go to Settings page and back to spec runner
    cy.contains('a', 'Settings').click()
    cy.contains(defaultMessages.settingsPage.device.title).should('be.visible')
    cy.contains('a', 'Specs').click()
    cy.contains('TestComponent.spec').click()
    cy.get('[data-model-state="passed"]').should('contain', 'renders the test component')

    // go to Runs page and back to spec runner
    cy.contains('a', 'Runs').click()
    cy.contains(defaultMessages.runs.connect.title).should('be.visible')
    cy.contains('a', 'Specs').click()
    cy.contains('TestComponent.spec').click()
    cy.get('[data-model-state="passed"]').should('contain', 'renders the test component')
  })

  it('browser picker in runner calls mutation with current spec path', () => {
    cy.__incorrectlyVisitAppWithIntercept()
    cy.contains('TestComponent.spec').click()
    cy.get('[data-model-state="passed"]').should('contain', 'renders the test component')

    cy.intercept('mutation-VerticalBrowserListItems_SetBrowser').as('setBrowser')

    cy.get('[data-cy="select-browser"]')
    .click()

    cy.contains('Firefox')
    .click()

    cy.wait('@setBrowser').then(({ request }) => {
      expect(request.body.variables.specPath).to.contain('/cypress-in-cypress/src/TestComponent.spec.jsx')
    })
  })
})
