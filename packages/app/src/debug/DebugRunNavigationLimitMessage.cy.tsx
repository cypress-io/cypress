import DebugRunNavigationLimitMessage from './DebugRunNavigationLimitMessage.vue'

describe('DebugRunNavigationLimitMessage', () => {
  it('renders link if cloudProjectUrl is passed', () => {
    cy.mount(<DebugRunNavigationLimitMessage cloudProjectUrl="https://cloud.cypress.io/projects/ypt4pf/" />)

    cy.findByRole('link', { name: 'Go to Cypress Cloud to see all runs' }).should('be.visible').should('have.attr', 'href', 'https://cloud.cypress.io/projects/ypt4pf/?utm_medium=Debug+Tab&utm_campaign=Run+Navigation+Limit&utm_source=Binary%3A+Launchpad')
  })

  it('does not render link if cloudProjectUrl is falsy', () => {
    cy.mount(<DebugRunNavigationLimitMessage cloudProjectUrl="" />)

    cy.findByRole('link', { name: 'Go to Cypress Cloud to see all runs' }).should('not.exist')
  })
})
