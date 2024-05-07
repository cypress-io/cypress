import DebugPassed from './DebugPassed.vue'
import DebugErrored from './DebugErrored.vue'
import DebugNoTests from './DebugNoTests.vue'
import DebugTimedout from './DebugTimedout.vue'
import DebugCancelledAlert from './DebugCancelledAlert.vue'
import DebugOverLimit from './DebugOverLimit.vue'

const mockError = `We detected that the Chromium Renderer process just crashed.

This is the equivalent to seeing the 'sad face' when Chrome dies.

This can happen for a number of different reasons:

- You wrote an endless loop and you must fix your own code
- You are running Docker (there is an easy fix for this: see link below)
- You are running lots of tests on a memory intense application
- You are running in a memory starved VM environment
- There are problems with your GPU / GPU drivers
- There are browser bugs in Chromium

You can learn more including how to fix Docker here:

https://on.cypress.io/renderer-process-crashed`

describe('Debug page states', () => {
  context('passed', () => {
    it('renders', () => {
      cy.mount(<DebugPassed />)

      cy.contains('Well Done!')
      cy.contains('All your tests passed')
    })
  })

  context('errored', () => {
    it('renders for single spec', () => {
      cy.mount(<DebugErrored errors={[mockError]} totalSkippedSpecs={1} totalSpecs={1} />)

      cy.findByTestId('collapsible').should('be.visible')
      cy.get('h2').contains('Incomplete')
      cy.contains(mockError)
      cy.contains('1 of 1 spec skipped').should('be.visible')
    })

    it('renders for plural specs', () => {
      cy.mount(<DebugErrored errors={[mockError]} totalSkippedSpecs={4} totalSpecs={50} />)

      cy.findByTestId('collapsible').should('be.visible')
      cy.get('h2').contains('Incomplete')
      cy.contains(mockError)
      cy.contains('4 of 50 specs skipped').should('be.visible')
    })
  })

  context('no tests', () => {
    it('renders', () => {
      cy.mount(<DebugNoTests />)

      cy.findByTestId('collapsible').should('be.visible')
      cy.get('h2').contains('Incomplete')
      cy.contains('Run has no tests')
    })
  })

  context('timed out', () => {
    it('renders without CI information', () => {
      cy.mount(<DebugTimedout totalSkippedSpecs={4} totalSpecs={50} />)

      cy.findByTestId('collapsible').should('be.visible')
      cy.get('h2').contains('Incomplete')
      cy.contains('The run started but never completed. This can happen when the run is cancelled from CI or when Cypress crashes while running tests. Archive this run to remove it from the runs list and analytics.')
      cy.contains('4 of 50 specs skipped')
    })

    it('renders with CI information', () => {
      cy.mount(<DebugTimedout
        ci={{ id: '123', url: 'https://circleci.com/', formattedProvider: 'CircleCI', ciBuildNumberFormatted: '12345' }} totalSkippedSpecs={4} totalSpecs={50} />)

      cy.findByTestId('collapsible').should('be.visible')
      cy.get('h2').contains('Incomplete')
      cy.contains('The run started but never completed. This can happen when the run is cancelled from CI or when Cypress crashes while running tests. Check your CircleCI #12345 logs for more information. Archive this run to remove it from the runs list and analytics.')
      cy.findByTestId('external').contains('CircleCI #12345').should('have.attr', 'href', 'https://circleci.com/')
      cy.contains('4 of 50 specs skipped')
    })
  })

  context('over limit', () => {
    context('Usage Exceeded', () => {
      it('displays messaging for users', () => {
        cy.mount(
          <DebugOverLimit
            overLimitReasons={[{
              __typename: 'UsageLimitExceeded',
              monthlyTests: 100,
            }]}
            overLimitActionType="CONTACT_ADMIN"
            overLimitActionUrl="#"
            runAgeDays={60}
          />,
        )

        cy.contains('You\'ve reached your monthly test result limit')
        cy.contains('Your Free Cypress Cloud plan includes 100 monthly recorded test results. Contact your Cypress Cloud admin to upgrade your plan and view more test results.')
        cy.findByTestId('external').contains('Contact admin')
      })

      it('displays messaging for plan admins', () => {
        cy.mount(
          <DebugOverLimit
            overLimitReasons={[{
              __typename: 'UsageLimitExceeded',
              monthlyTests: 100,
            }]}
            overLimitActionType="UPGRADE"
            overLimitActionUrl="#"
            runAgeDays={60}
          />,
        )

        cy.contains('You\'ve reached your monthly test result limit')
        cy.contains('Your Free Cypress Cloud plan includes 100 monthly recorded test results. Upgrade your plan now to view more test results.')
        cy.findByTestId('external').contains('Upgrade plan')
      })
    })

    context('Retention Exceeded', () => {
      it('displays messaging for users', () => {
        cy.mount(
          <DebugOverLimit
            overLimitReasons={[{
              __typename: 'DataRetentionLimitExceeded',
              dataRetentionDays: 30,
            }]}
            overLimitActionType="CONTACT_ADMIN"
            overLimitActionUrl="#"
            runAgeDays={60}
          />,
        )

        cy.contains('Beyond data retention')
        cy.contains('Your data retention limit is 30 days and these tests ran 60 days ago. Upgrade your plan to increase your data retention limit.')
        cy.findByTestId('external').contains('Contact admin')
      })

      it('displays messaging for plan admins', () => {
        cy.mount(
          <DebugOverLimit
            overLimitReasons={[{
              __typename: 'DataRetentionLimitExceeded',
              dataRetentionDays: 30,
            }]}
            overLimitActionType="UPGRADE"
            overLimitActionUrl="#"
            runAgeDays={60}
          />,
        )

        cy.contains('Beyond data retention')
        cy.contains('Your data retention limit is 30 days and these tests ran 60 days ago. Upgrade your plan to increase your data retention limit.')
        cy.findByTestId('external').contains('Upgrade plan')
      })
    })

    context('both usage and retention exceeded', () => {
      it('selects usage exceeded and displays appropriate message', () => {
        cy.mount(
          <DebugOverLimit
            overLimitReasons={[{
              __typename: 'DataRetentionLimitExceeded',
              dataRetentionDays: 30,
            }, {
              __typename: 'UsageLimitExceeded',
              monthlyTests: 30,
            }]}
            overLimitActionType="UPGRADE"
            overLimitActionUrl="#"
            runAgeDays={60}
          />,
        )

        cy.contains('You\'ve reached your monthly test result limit')
        cy.contains('Your Free Cypress Cloud plan includes 30 monthly recorded test results. Upgrade your plan now to view more test results.')
        cy.findByTestId('external').contains('Upgrade plan')
      })
    })
  })

  context('cancelled', () => {
    it('renders', () => {
      cy.mount(<DebugCancelledAlert totalSpecs={5} totalSkippedSpecs={2} cancellation={{ cancelledAt: '2019-01-25T02:00:00.000Z', cancelledBy: { email: 'adams@cypress.io', fullName: 'Test Tester' } }} />)
      cy.findByTestId('collapsible').should('be.visible')
      cy.get('h2').contains('Manually cancelled')
      cy.contains('2 of 5 specs skipped')
      cy.findByTestId('cancelled-by-user-avatar').should('have.attr', 'style', 'background-image: url("https://s.gravatar.com/avatar/402f6cafb6c02371c2c23c5215ae3d85?size=48&default=mm");')
      cy.contains('Test Tester')
      cy.contains('Jan 24, 2019 9:00 PM')
    })
  })
})
