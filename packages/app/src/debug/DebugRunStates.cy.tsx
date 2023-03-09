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

      cy.percySnapshot()
    })
  })

  context('errored', () => {
    it('renders for single spec', () => {
      cy.mount(<DebugErrored errors={[mockError]} totalSkippedSpecs={1} totalSpecs={1} />)

      cy.contains('1 of 1 spec skipped').should('be.visible')

      cy.percySnapshot()
    })

    it('renders for plural specs', () => {
      cy.mount(<DebugErrored errors={[mockError]} totalSkippedSpecs={4} totalSpecs={50} />)

      cy.contains('4 of 50 specs skipped').should('be.visible')

      cy.percySnapshot()
    })
  })

  context('no tests', () => {
    it('renders', () => {
      cy.mount(<DebugNoTests />)

      cy.percySnapshot()
    })
  })

  context('timed out', () => {
    it('renders without CI information', () => {
      cy.mount(<DebugTimedout totalSkippedSpecs={4} totalSpecs={50} />)

      cy.percySnapshot()
    })

    it('renders with CI information', () => {
      cy.mount(<DebugTimedout
        ci={{ id: '123', url: 'https://circleci.com/', formattedProvider: 'CircleCI', ciBuildNumberFormatted: '12345' }} totalSkippedSpecs={4} totalSpecs={50} />)

      cy.percySnapshot()
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

        cy.percySnapshot()
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

        cy.percySnapshot()
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

        cy.percySnapshot()
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

        cy.percySnapshot()
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

        cy.percySnapshot()
      })
    })
  })

  context('cancelled', () => {
    it('renders', () => {
      cy.mount(<DebugCancelledAlert totalSpecs={5} totalSkippedSpecs={2} cancellation={{ cancelledAt: '2019-01-25T02:00:00.000Z', cancelledBy: { email: 'adams@cypress.io', fullName: 'Test Tester' } }} />)

      cy.percySnapshot()
    })
  })
})
