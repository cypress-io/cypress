import DebugBranchError from './DebugBranchError.vue'
import { defaultMessages } from '@cy/i18n'

describe('<DebugBranchError />', () => {
  it('can mount', () => {
    cy.mount(<DebugBranchError />)
    cy.get('[data-cy=debug-empty-title]').should('contain.text', defaultMessages.debugPage.emptyStates.noRunsFoundForBranch)
    cy.get('[data-cy=debug-empty-description]').should('contain.text', defaultMessages.debugPage.emptyStates.noRunsForBranchMessage)
    // This will fail locally as the utm_source will be Binary%3A+Lauanchpad in `open` mode
    cy.contains(defaultMessages.links.learnMoreButton).should('have.attr', 'href', 'https://on.cypress.io/git-info?utm_source=Binary%3A+App&utm_medium=Debug+Tab&utm_campaign=No+Runs+Found')
  })
})
