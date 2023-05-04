import { DebugTestingProgress_SpecsDocument } from '../generated/graphql'
import DebugTestingProgress from './DebugTestingProgress.vue'
import { createRelevantRunSpecChangeEvent } from '@packages/graphql/test/stubCloudTypes'

describe('<DebugTestingProgress />', () => {
  it('renders as expected', () => {
    cy.mount(() => (
      <div class="p-4">
        <DebugTestingProgress runId="123"/>
      </div>
    ))

    cy.stubSubscriptionEvent(DebugTestingProgress_SpecsDocument, () => {
      return createRelevantRunSpecChangeEvent(0, 5)
    })

    cy.contains('0 of 5').should('be.visible')

    cy.stubSubscriptionEvent(DebugTestingProgress_SpecsDocument, () => {
      return createRelevantRunSpecChangeEvent(3, 5)
    })

    cy.contains('3 of 5').should('be.visible')

    cy.stubSubscriptionEvent(DebugTestingProgress_SpecsDocument, () => {
      return createRelevantRunSpecChangeEvent(5, 5)
    })

    cy.contains('5 of 5').should('be.visible')

    cy.percySnapshot()
  })

  it('renders scheduled to complete countdown', () => {
    const now = new Date()

    cy.clock(now)

    cy.mount(() => (
      <div class="p-4">
        <DebugTestingProgress runId="123"/>
      </div>
    ))

    cy.stubSubscriptionEvent(DebugTestingProgress_SpecsDocument, () => {
      const fiveSecondsFromNow = new Date(now.getTime() + 1000 * 60 * 5).toISOString()

      return createRelevantRunSpecChangeEvent(5, 5, fiveSecondsFromNow)
    })

    cy.contains('Scheduled to complete in 5m 0s').should('be.visible')

    cy.contains('5 of 5').should('be.visible')

    cy.tick(1000) //tick 1 second

    cy.contains('Scheduled to complete in 4m 59s').should('be.visible')

    cy.percySnapshot()

    cy.tick(1000 * 60 * 4) //tick 4 minutes

    cy.contains('Scheduled to complete in 59s').should('be.visible')

    cy.tick(1000 * 61) //tick 61 seconds

    cy.contains('Scheduled to complete soon').should('be.visible')

    cy.percySnapshot()

    //should revert to previous message if scheduledToCompleteAt is nulled out
    cy.stubSubscriptionEvent(DebugTestingProgress_SpecsDocument, () => {
      return createRelevantRunSpecChangeEvent(5, 10, null)
    })

    cy.contains('Testing in progress...').should('be.visible')
    cy.contains('5 of 10').should('be.visible')
  })
})
