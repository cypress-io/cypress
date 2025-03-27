import { CloudRunStatus, DebugPageHeaderFragmentDoc } from '../generated/graphql-test'
import DebugPageHeader from './DebugPageHeader.vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'

const defaults = [
  { attr: 'debug-header-branch', text: 'Branch Name: feature/DESIGN-183' },
  { attr: 'debug-header-commitHash', text: 'Commit Hash: b5e6fde' },
  { attr: 'debug-header-author', text: 'Commit Author: cypressDTest' },
  { attr: 'debug-header-createdAt', text: 'Run Total Duration: 01m 00s (an hour ago) ' },
]

describe('<DebugPageHeader />', {
  viewportWidth: 1032,
},
() => {
  it('renders with passed in gql props', () => {
    cy.mountFragment(DebugPageHeaderFragmentDoc, {
      onResult (result) {
        if (result) {
          result.status = 'FAILED'
          if (result.commitInfo) {
            result.commitInfo.summary = 'Adding a hover state to the button component'
            result.commitInfo.branch = 'feature/DESIGN-183'
            result.commitInfo.authorName = 'cypressDTest'
            result.commitInfo.authorEmail = 'adams@cypress.io'
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

    cy.findByTestId('debug-header-dashboard-link').should('be.visible').should('have.attr', 'href', 'http://dummy.cypress.io/runs/1?utm_medium=Debug+Tab&utm_campaign=View+in+Cypress+Cloud&utm_source=Binary%3A+Launchpad')

    cy.findByTestId('debug-commitsAhead').should('have.text', 'You are 2 commits ahead')

    cy.findByTestId('debug-results').should('be.visible')

    cy.findByTestId('runNumber-status-FAILED')
    .should('have.text', '#432')
    .children().should('have.length', 2)

    cy.findByTestId('runResults-flakyBadge')
    .should('not.exist')

    defaults.forEach((obj) => {
      cy.findByTestId(obj.attr)
      .should('have.text', obj.text)
      .children().should('have.length', 2)
    })
  })

  it('displays a flaky badge', () => {
    const flakyCount = 4

    cy.mountFragment(DebugPageHeaderFragmentDoc, {
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

    cy.findByTestId('runResults-flakyBadge')
    .contains(defaultMessages.specPage.flaky.badgeLabel)

    cy.findByTestId('total-flaky-tests')
    .contains(flakyCount)
  })

  it('displays each run status', () => {
    const statuses: CloudRunStatus[] = ['PASSED', 'FAILED', 'CANCELLED', 'RUNNING', 'ERRORED']

    statuses.forEach((status) => {
      cy.mountFragment(DebugPageHeaderFragmentDoc, {
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

      cy.findByTestId(`runNumber-status-${status}`).should('be.visible')
    })
  })

  it('renders singular commit message', () => {
    cy.mountFragment(DebugPageHeaderFragmentDoc, {
      render: (gqlVal) => {
        return (
          <DebugPageHeader gql={gqlVal} commitsAhead={1}/>
        )
      },
    })

    cy.findByTestId('debug-commitsAhead')
    .should('have.text', 'You are 1 commit ahead')
  })

  it('renders long commit message', () => {
    const longText = 'This commit contains many changes which are described at great length in this commit summary, arguably the length is long enough to be considered unwieldy, but nevertheless we should render the text nicely'

    cy.mountFragment(DebugPageHeaderFragmentDoc, {
      render: (gqlVal) => {
        if (!gqlVal.commitInfo?.summary) {
          throw new Error('Missing commit info for test')
        }

        gqlVal.commitInfo.summary = longText

        return (
          <DebugPageHeader gql={gqlVal} commitsAhead={1} class="overflow-auto resize"/>
        )
      },
    })

    cy.contains(longText).should('be.visible')
    cy.percySnapshot()
  })

  it('renders no commit message', () => {
    cy.mountFragment(DebugPageHeaderFragmentDoc, {
      render: (gqlVal) => {
        return (
          <DebugPageHeader gql={gqlVal} commitsAhead={0}/>
        )
      },
    })

    cy.findByTestId('debug-commitsAhead').should('not.exist')
  })

  it('renders duration over 1 hour', () => {
    cy.mountFragment(DebugPageHeaderFragmentDoc, {
      onResult (result) {
        if (result) {
          result.totalDuration = 3602000000
        }
      },
      render: (gqlVal) => {
        return (
          <DebugPageHeader gql={gqlVal} commitsAhead={0}/>
        )
      },
    })

    cy.findByTestId('debug-header-createdAt')
    .should('have.text', 'Run Total Duration: 16h 33m 20s (an hour ago) ')
  })

  it('renders count up duration for running', () => {
    cy.clock()

    cy.mountFragment(DebugPageHeaderFragmentDoc, {
      onResult (result) {
        if (result) {
          result.totalDuration = null
          result.status = 'RUNNING'
          result.createdAt = (new Date()).toISOString()
        }
      },
      render: (gqlVal) => {
        return (
          <DebugPageHeader gql={gqlVal} commitsAhead={0}/>
        )
      },
    })

    cy.findByTestId('debug-header-createdAt')
    .should('have.text', 'Run Total Duration: 00m 00s (a few seconds ago) ')

    cy.tick(5 * 1000) // tick 5s

    cy.findByTestId('debug-header-createdAt')
    .should('have.text', 'Run Total Duration: 00m 05s (a few seconds ago) ')

    cy.tick(60000 + 25 * 1000) // tick 1m 25s

    cy.findByTestId('debug-header-createdAt')
    .should('have.text', 'Run Total Duration: 01m 30s (2 minutes ago) ')

    cy.tick(60000 + 40 * 1000) // tick 1m 40s

    cy.findByTestId('debug-header-createdAt')
    .should('have.text', 'Run Total Duration: 03m 10s (3 minutes ago) ')

    cy.tick(60000 * 60 + 40 * 1000) // tick 1h 40s

    cy.findByTestId('debug-header-createdAt')
    .should('have.text', 'Run Total Duration: 01h 03m 50s (an hour ago) ')
  })
})
