import DebugBranchError from './DebugBranchError.vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'

describe('<DebugBranchError />', () => {
  it('can mount', () => {
    cy.mount(<DebugBranchError />)
    cy.get('[data-cy=debug-empty-title]').should('contain.text', defaultMessages.debugPage.emptyStates.noRunsFoundForBranch)
    cy.get('[data-cy=debug-empty-description]').should('contain.text', defaultMessages.debugPage.emptyStates.noRunsForBranchMessage)
    // The utm_source will be Binary%3A+App in production`open` mode but we assert using Binary%3A+Launchpad as this is the value in CI
    cy.contains(defaultMessages.links.learnMoreButton).should('have.attr', 'href', 'https://on.cypress.io/git-info?utm_source=Binary%3A+Launchpad&utm_medium=Debug+Tab&utm_campaign=No+Runs+Found')
  })
})
