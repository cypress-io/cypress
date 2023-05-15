import DebugBranchError from './DebugBranchError.vue'

describe('<DebugBranchError />', () => {
  it('can mount', () => {
    cy.mount(<DebugBranchError />)
    cy.contains('No runs found for your branch')
    cy.contains('Cypress uses Git to show runs for your branch. Ensure that version control is properly configured and that you are sending Git information to Cypress Cloud.')
    cy.contains('Learn more').should('have.attr', 'href', 'https://on.cypress.io/git-info?utm_source=Binary%3A+Launchpad&utm_medium=Debug+Tab&utm_campaign=Learn+More')
  })
})
