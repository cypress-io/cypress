import { CloudRunStatus, DebugPageFragmentDoc } from '../generated/graphql-test'
import DebugPageHeader from './DebugPageHeader.vue'
import { defaultMessages } from '@cy/i18n'

const defaults = [
  { attr: 'debug-header-branch', text: 'Branch Name: feature/DESIGN-183' },
  { attr: 'debug-header-commitHash', text: 'Commit Hash: b5e6fde' },
  { attr: 'debug-header-author', text: 'Commit Author: cypressDTest' },
  { attr: 'debug-header-createdAt', text: 'Run Total Duration: 01:00 (an hour ago) ' },
]

describe('<DebugPageHeader />', {
  viewportWidth: 1032,
},
() => {
  it('renders with passed in gql props', () => {
    cy.mountFragment(DebugPageFragmentDoc, {
      onResult (result) {
        if (result) {
          result.status = 'FAILED'
          if (result.commitInfo) {
            result.commitInfo.summary = 'Adding a hover state to the button component'
            result.commitInfo.branch = 'feature/DESIGN-183'
            result.commitInfo.authorName = 'cypressDTest'
            result.commitInfo.sha = 'b5e6fde'
          }
        }
      },
      render: (gqlVal) => {
        return (
          <DebugPageHeader gql={gqlVal} commitsAhead={2}/>
        )
      },
    })

    cy.findByTestId('debug-header').children().should('have.length', 2)
    cy.findByTestId('debug-test-summary').should('have.text', 'Adding a hover state to the button component')

    cy.findByTestId('debug-commitsAhead').should('have.text', 'You are 2 commits ahead')

    cy.findByTestId('debug-results').should('be.visible')

    cy.findByTestId('debug-runNumber-FAILED')
    .should('have.text', '#432')
    .children().should('have.length', 2)

    cy.findByTestId('debug-flaky-badge')
    .should('not.exist')

    defaults.forEach((obj) => {
      cy.findByTestId(obj.attr)
      .should('have.text', obj.text)
      .children().should('have.length', 2)
    })
  })

  it('displays a flaky badge', () => {
    const flakyCount = 4

    cy.mountFragment(DebugPageFragmentDoc, {
      onResult: (result) => {
        if (result) {
          result.totalFlakyTests = flakyCount
        }
      },
      render: (gqlVal) => {
        return (
          <DebugPageHeader gql={gqlVal} commitsAhead={0}/>
        )
      },
    })

    cy.findByTestId('debug-flaky-badge')
    .contains(defaultMessages.specPage.flaky.badgeLabel)

    cy.findByTestId('total-flaky-tests')
    .contains(flakyCount)
  })

  it('displays each run status', () => {
    const statuses: CloudRunStatus[] = ['PASSED', 'FAILED', 'CANCELLED', 'RUNNING', 'ERRORED']

    statuses.forEach((status) => {
      cy.mountFragment(DebugPageFragmentDoc, {
        onResult: (result) => {
          if (result) {
            result.status = status
          }
        },
        render: (gqlVal) => {
          return (
            <DebugPageHeader gql={gqlVal} commitsAhead={0}/>
          )
        },
      })

      cy.findByTestId(`debug-runNumber-${status}`).should('be.visible')
      cy.percySnapshot()
    })
  })

  it('renders singular commit message', () => {
    cy.mountFragment(DebugPageFragmentDoc, {
      render: (gqlVal) => {
        return (
          <DebugPageHeader gql={gqlVal} commitsAhead={1}/>
        )
      },
    })

    cy.findByTestId('debug-commitsAhead')
    .should('have.text', 'You are 1 commit ahead')
  })

  it('renders no commit message', () => {
    cy.mountFragment(DebugPageFragmentDoc, {
      render: (gqlVal) => {
        return (
          <DebugPageHeader gql={gqlVal} commitsAhead={0}/>
        )
      },
    })

    cy.findByTestId('debug-commitsAhead').should('not.exist')
  })
})
