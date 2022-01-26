import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'

describe('Cypress In Cypress', { viewportWidth: 1200 }, () => {
  beforeEach(() => {
    cy.scaffoldProject('cypress-in-cypress')
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
})
