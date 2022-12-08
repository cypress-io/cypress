import { DebugPageFragmentDoc, DebugResultsFragmentDoc } from '../generated/graphql-test'
import DebugPageHeader from './DebugPageHeader.vue'

describe('<DebugPageHeader />', {
  viewportWidth: 1032,
},
() => {
  const defaults = [
    { attr: 'debug-header-branch', text: 'Branch Name: feature/DESIGN-183' },
    { attr: 'debug-header-commitHash', text: 'Commit Hash: b5e6fde' },
    { attr: 'debug-header-author', text: 'Commit Author: cypressDTest' },
    { attr: 'debug-header-createdAt', text: 'Run Total Duration: 60000 (an hour ago) ' },
    { attr: 'debug-flaky-badge', text: '6 Flaky ' },
  ]

  const mountingFragment = (flakyTest: number, status: string, commitsAhead: string, hash: string) => {
    return (
      cy.mountFragment(DebugPageFragmentDoc, {
        onResult (result) {
          if (result) {
            if (result.commitInfo) {
              result.commitInfo.summary = 'Adding a hover state to the button component'
              result.commitInfo.branch = 'feature/DESIGN-183'
              result.commitInfo.authorName = 'cypressDTest'
              result.totalFlakyTests = flakyTest
            }
          }
        },
        render: (gqlVal) => {
          return (
            <DebugPageHeader gql={gqlVal} runNumber={468} commitsAhead={commitsAhead} commitHash={hash} status={status}/>
          )
        },
      })
    )
  }

  it('renders with passed in gql props', () => {
    const flakyTests = 6
    const status = 'FAILED'
    const commitsAhead = 'You are 2 commits ahead'
    const hash = 'b5e6fde'

    mountingFragment(flakyTests, status, commitsAhead, hash)

    cy.findByTestId('debug-header').children().should('have.length', 2)
    cy.findByTestId('debug-test-summary').should('have.text', 'Adding a hover state to the button component')

    cy.findByTestId('debug-commitsAhead').should('have.text', 'You are 2 commits ahead')

    cy.findByTestId('debug-results').should('be.visible')

    cy.findByTestId('debug-runNumber-FAILED')
    .should('have.text', '#468')
    .children().should('have.length', 2)

    defaults.forEach((obj) => {
      if (obj.attr === 'debug-flaky-badge') {
        cy.findByTestId(obj.attr)
        .should('have.text', obj.text)
        .children().should('have.length', 3)
      } else {
        cy.findByTestId(obj.attr)
        .should('have.text', obj.text)
        .children().should('have.length', 2)
      }
    })
  })

  it('does not show flaky component when flakyTests are < 1', () => {
    mountingFragment(0, 'FAILED', '', '')
    cy.contains('Flaky').should('not.exist')
  })

  it('checks if all run status are accounted for', () => {
    const statuses = ['PASSED', 'FAILED', 'CANCELLED', 'RUNNING', 'ERRORED']

    statuses.forEach((status) => {
      mountingFragment(6, status, '', '')
      cy.findByTestId(`debug-runNumber-${status}`).should('be.visible')
    })
  })
})

// to complete in order to test the debugResults properly
describe('<DebugResults />', () => {
  it('shows the failed icon and the number of passed, skipped, pending, failed tests passed through gql props', () => {
    cy.mountFragment(DebugResultsFragmentDoc, {
      onResult (result) {
        if (result) {
          result.totalPassed = 1
          result.totalFailed = 7
          result.totalSkipped = 2
          result.totalPending = 3
        }
      },
      render: (gqlVal) => {
        return (
          <DebugPageHeader gql={gqlVal} runNumber={468} commitsAhead='You are 2 commits ahead' commitHash='b5e6fde' status='FAILED'/>
        )
      },
    })

    const debugResultsChildren = cy.findByTestId('debug-results').children()

    debugResultsChildren.should('have.length', 4)
    debugResultsChildren.then((status) => {
      status[0].innerText === 'passed1'
      status[1].innerText === 'failed7'
      status[2].innerText === 'skipped2'
      status[3].innerText === 'pending3'
    })
  })
})
