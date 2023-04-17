import DebugRunNavigationLimitMessage from './DebugRunNavigationLimitMessage.vue'

describe('DebugRunNavigationLimitMessage', () => {
  it('renders link if runUrl is passed', () => {
    cy.mount(<DebugRunNavigationLimitMessage runUrl="https://cloud.cypress.io/projects/ypt4pf/runs/45575" />)

    cy.findByRole('link', { name: 'Go to Cypress Cloud to see all runs' }).should('be.visible').should('have.attr', 'href', 'https://cloud.cypress.io/projects/ypt4pf')

    cy.percySnapshot()
  })

  it('does not render link if runUrl is falsy', () => {
    cy.mount(<DebugRunNavigationLimitMessage runUrl="" />)

    cy.findByRole('link', { name: 'Go to Cypress Cloud to see all runs' }).should('not.exist')
  })
})
