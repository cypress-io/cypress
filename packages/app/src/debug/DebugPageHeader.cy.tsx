import { DebugPageFragmentDoc } from '../generated/graphql-test'
import DebugPageHeader from './DebugPageHeader.vue'

const defaults = [
  { attr: 'debug-header-branch', text: 'Branch Name: feature/DESIGN-183' },
  { attr: 'debug-header-commitHash', text: 'Commit Hash: b5e6fde' },
  { attr: 'debug-header-author', text: 'Commit Author: cypressDTest' },
  { attr: 'debug-header-createdAt', text: 'Run Total Duration: 60000 (an hour ago) ' },
]

describe('<DebugPageHeader />', {
  viewportWidth: 1032,
},
() => {
  it('renders with passed in gql props', () => {
    cy.mountFragment(DebugPageFragmentDoc, {
      onResult (result) {
        if (result) {
          if (result.commitInfo) {
            result.commitInfo.summary = 'Adding a hover state to the button component'
            result.commitInfo.branch = 'feature/DESIGN-183'
            result.commitInfo.authorName = 'cypressDTest'
          }
        }
      },
      render: (gqlVal) => {
        return (
          <DebugPageHeader gql={gqlVal} runNumber={468} commitsAhead={'You are 2 commits ahead'} commitHash={'b5e6fde'}/>
        )
      },
    })

    cy.get('[data-cy=debug-header]').children().should('have.length', 2)
    cy.get('[data-cy=debug-test-summary]')
    .should('have.text', 'Adding a hover state to the button component')

    cy.get('[data-cy=debug-runCommit-info]').children().should('have.length', 3)
    cy.get('[data-cy=debug-runNumber]')
    .should('have.text', ' Run #468')
    .should('have.css', 'color', 'rgb(90, 95, 122)')

    cy.get('[data-cy=debug-commitsAhead]')
    .should('have.text', 'You are 2 commits ahead')
    .should('have.css', 'color', 'rgb(189, 88, 0)')

    cy.get('[data-cy=debug-results]').should('be.visible')

    defaults.forEach((obj) => {
      cy.get(`[data-cy=${obj.attr}]`)
      .should('have.text', obj.text)
      .children().should('have.length', 2)
    })
  })
})
