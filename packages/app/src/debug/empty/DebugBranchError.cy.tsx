import DebugBranchError from './DebugBranchError.vue'
import { defaultMessages } from '@cy/i18n'

describe('<DebugBranchError />', () => {
  it('can mount', () => {
    cy.mount(<DebugBranchError />)
    cy.get('[data-cy=debug-empty-title]').should('contain.text', defaultMessages.debugPage.emptyStates.noRunsFoundForBranch)
    cy.get('[data-cy=debug-empty-description]').should('contain.text', defaultMessages.debugPage.emptyStates.noRunsForBranchMessage)
    cy.contains(defaultMessages.links.learnMoreButton).should('have.attr', 'href', 'https://on.cypress.io/git-info?utm_source=Binary%3A+Launchpad&utm_medium=Debug+Tab&utm_campaign=Learn+More')
  })
})
