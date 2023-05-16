import DebugBranchError from './DebugBranchError.vue'
import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'

describe('<DebugBranchError />', () => {
  it('can mount', () => {
    cy.mount(<DebugBranchError />)
    cy.contains(defaultMessages.debugPage.emptyStates.noRunsFoundForBranch)
    cy.contains(defaultMessages.debugPage.emptyStates.noRunsForBranchMessage)
    cy.contains('Learn more').should('have.attr', 'href', 'https://on.cypress.io/git-info?utm_source=Binary%3A+Launchpad&utm_medium=Debug+Tab&utm_campaign=Learn+More')
  })
})
