import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'
import { snapshotAUTPanel } from './support/snapshot-aut-panel'

describe('Cypress In Cypress', { viewportWidth: 1500 }, () => {
  beforeEach(() => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.findBrowsers()
    cy.openProject('cypress-in-cypress')
    cy.startAppServer('component')
    cy.__incorrectlyVisitAppWithIntercept()
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

    snapshotAUTPanel('browsers open')
    cy.contains('Firefox').should('be.hidden')
    cy.contains('The viewport determines the width and height of your application. By default the viewport will be 500px by 500px for Component Testing unless specified by a cy.viewport command.')
    .should('be.visible')

    snapshotAUTPanel('viewport info open')

    cy.get('body').click()

    cy.findByTestId('playground-activator').click()
    cy.findByTestId('playground-selector').clear().type('#__cy_root')

    snapshotAUTPanel('cy.get selector')

    cy.findByTestId('playground-num-elements').contains('1 Match')

    cy.window().then((win) => cy.spy(win.console, 'log'))
    cy.findByTestId('playground-print').click().window().then((win) => {
      expect(win.console.log).to.have.been.calledWith('%cCommand:  ', 'font-weight: bold', 'cy.get(\'#__cy_root\')')
    })

    cy.findByLabelText('Selector Methods').click()
    cy.findByRole('menuitem', { name: 'cy.contains' }).click()

    cy.findByTestId('playground-selector').clear().type('Component Test')

    snapshotAUTPanel('cy.contains selector')

    cy.findByTestId('playground-num-elements').contains('1 Match')
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
