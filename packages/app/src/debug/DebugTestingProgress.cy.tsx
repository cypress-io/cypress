import { DebugTestingProgress_SpecsDocument } from '../generated/graphql'
import DebugTestingProgress from './DebugTestingProgress.vue'

describe('<DebugTestingProgress />', () => {
  it('renders as expected', () => {
    cy.mount(() => (
      <div class="p-4">
        <DebugTestingProgress runNumber={123}/>
      </div>
    ))

    const createEvent = (completed: number, total: number) => {
      return {
        relevantRunSpecChange: {
          currentProject: {
            id: '',
            relevantRunSpecs: {
              current: {
                completedSpecs: completed,
                totalSpecs: total,
                scheduledToCompleteAt: null,
              },
            },
          },
        },
      }
    }

    cy.stubSubscriptionEvent(DebugTestingProgress_SpecsDocument, () => {
      return createEvent(3, 5)
    })

    cy.contains('3 of 5').should('be.visible')

    cy.stubSubscriptionEvent(DebugTestingProgress_SpecsDocument, () => {
      return createEvent(5, 5)
    })

    cy.contains('5 of 5').should('be.visible')

    cy.percySnapshot()
  })

  it('renders scheduled to complete countdown', () => {
    const now = new Date()

    cy.clock(now)

    cy.mount(() => (
      <div class="p-4">
        <DebugTestingProgress runNumber={123}/>
      </div>
    ))

    const createEvent = (completed: number, total: number, scheduledToCompleteAt: string | null) => {
      return {
        relevantRunSpecChange: {
          currentProject: {
            id: '',
            relevantRunSpecs: {
              current: {
                completedSpecs: completed,
                totalSpecs: total,
                scheduledToCompleteAt,
              },
            },
          },
        },
      }
    }

    cy.stubSubscriptionEvent(DebugTestingProgress_SpecsDocument, () => {
      const fiveSecondsFromNow = new Date(now.getTime() + 5000).toISOString()

      return createEvent(5, 5, fiveSecondsFromNow)
    })

    cy.contains('5 of 5').should('be.visible')

    cy.tick(1000)

    cy.contains('Scheduled to complete in 4s').should('be.visible')

    cy.percySnapshot()

    cy.tick(5000)

    cy.contains('Scheduled to complete soon').should('be.visible')

    cy.percySnapshot()

    //should revert to previous message if scheduledToCompleteAt is nulled out
    cy.stubSubscriptionEvent(DebugTestingProgress_SpecsDocument, () => {
      return createEvent(5, 10, null)
    })

    cy.contains('Testing in progress...').should('be.visible')
    cy.contains('5 of 10').should('be.visible')
  })
})
