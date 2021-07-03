import Wizard from './Wizard.vue'

describe('<Wizard />', () => {
  it('should run the full flow', () => {
    cy.mount(() => <Wizard />)

    cy.get('h1').should('contain', 'Welcome to Cypress')
    cy.contains('Component Testing').click()

    cy.get('h1').should('contain', 'Project Setup')
    cy.contains('Pick a framework').click()
    cy.contains('VueJs').click()
    cy.contains('Pick a bundler').click()
    cy.contains('Vite').click()
    cy.contains('Next').click()

    cy.get('h1').should('contain', 'Install Dev Dependencies')
    cy.contains('@cypress/vue').should('be.visible')
    cy.contains('@cypress/vite-dev-server').should('be.visible')
    cy.contains('Install manually').click()
    cy.contains('installed').click()

    cy.get('h1').should('contain', 'Cypress.config')
  })
})
