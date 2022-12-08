import { CloudRunStatus, DebugPageFragmentDoc } from '../generated/graphql-test'
import DebugPageHeader from './DebugPageHeader.vue'
import { defaultMessages } from '@cy/i18n'

describe('<DebugPageHeader />', {
  viewportWidth: 1032,
},
() => {
  const defaults = [
    { attr: 'debug-header-branch', text: 'Branch Name: feature/DESIGN-183' },
    { attr: 'debug-header-commitHash', text: 'Commit Hash: b5e6fde' },
    { attr: 'debug-header-author', text: 'Commit Author: cypressDTest' },
    { attr: 'debug-header-createdAt', text: 'Run Total Duration: 60000 (an hour ago) ' },
  ]

  const mountingFragment = (flakyTests: number, status: CloudRunStatus) => {
    return (
      cy.mountFragment(DebugPageFragmentDoc, {
        onResult (result) {
          if (result) {
            if (result.commitInfo) {
              result.commitInfo.summary = 'Adding a hover state to the button component'
              result.commitInfo.branch = 'feature/DESIGN-183'
              result.commitInfo.authorName = 'cypressDTest'
              result.totalFlakyTests = flakyTests
              result.totalPassed = 1
              result.totalFailed = 7
              result.totalSkipped = 6
              result.totalPending = 6
              result.status = status
            }
          }
        },
        render: (gqlVal) => {
          return (
            <DebugPageHeader gql={gqlVal} runNumber={468} commitsAhead='You are 2 commits ahead' commitHash='b5e6fde'/>
          )
        },
      })
    )
  }

  it('renders with passed in gql props', () => {
    const flakyTests = 6
    const status = 'FAILED'

    mountingFragment(flakyTests, status)

    cy.findByTestId('debug-header').children().should('have.length', 2)
    cy.findByTestId('debug-test-summary').should('have.text', 'Adding a hover state to the button component')

    cy.findByTestId('debug-commitsAhead').should('have.text', 'You are 2 commits ahead')

    cy.findByTestId('debug-results').should('be.visible')

    cy.findByTestId('debug-runNumber-FAILED')
    .should('have.text', '#468')
    .children().should('have.length', 2)

    cy.findByTestId('debug-flaky-badge')
    .contains(defaultMessages.specPage.flaky.badgeLabel)

    defaults.forEach((obj) => {
      cy.findByTestId(obj.attr)
      .should('have.text', obj.text)
      .children().should('have.length', 2)
    })
  })

  it('checks if all run status are accounted for', () => {
    const statuses: CloudRunStatus[] = ['PASSED', 'FAILED', 'CANCELLED', 'RUNNING', 'ERRORED']

    statuses.forEach((status) => {
      mountingFragment(6, status)
      cy.findByTestId(`debug-runNumber-${status}`).should('be.visible')
    })
  })
})
