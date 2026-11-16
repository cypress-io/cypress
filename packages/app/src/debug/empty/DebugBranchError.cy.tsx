import DebugBranchError from './DebugBranchError.vue'

describe('<DebugBranchError />', () => {
  it('can mount', () => {
    cy.mount(<DebugBranchError />)
    cy.get('[data-cy=debug-empty-title]').should('contain.text', 'No runs found for your branch')
    cy.get('[data-cy=debug-empty-description]').should('contain.text', 'Cypress uses Git to show runs for your branch. Ensure that version control is properly configured and that you are sending Git information to Cypress Cloud.')
    // The utm_source will be Binary%3A+App in production`open` mode but we assert using Binary%3A+Launchpad as this is the value in CI
    cy.contains('Learn more').should('have.attr', 'href', 'https://on.cypress.io/git-info?utm_source=Binary%3A+Launchpad&utm_medium=Debug+Tab&utm_campaign=No+Runs+Found')
  })
})
