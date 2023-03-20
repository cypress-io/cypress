import type { CloudRunStatus } from '../generated/graphql'
import { useRunDateTimeInterval } from './useRunDateTimeInterval'

describe('useRunDateTimeInterval', () => {
  it('should format dates and times', () => {
    const now = new Date(2023, 3, 14)

    cy.clock(now)

    cy.then(() => {
      const run = {
        status: 'PASSED' as CloudRunStatus,
        totalDuration: 1,
        createdAt: now.toISOString(),
      }

      const { relativeCreatedAt, totalDuration } = useRunDateTimeInterval(run)

      cy.wrap(relativeCreatedAt).as('createdAt')
      cy.wrap(totalDuration).as('totalDuration')
    })

    cy.get('@createdAt').its('value').should('equal', 'a few seconds ago')
    cy.get('@totalDuration').its('value').should('equal', '00m 00s')
  })

  it('should format dates and times for RUNNING run', () => {
    const now = new Date(2023, 3, 14)

    cy.clock(now)

    cy.then(() => {
      const run = {
        status: 'RUNNING' as CloudRunStatus,
        totalDuration: 1,
        createdAt: now.toISOString(),
      }

      const { relativeCreatedAt, totalDuration } = useRunDateTimeInterval(run)

      cy.wrap(relativeCreatedAt).as('createdAt')
      cy.wrap(totalDuration).as('totalDuration')
    })

    cy.get('@createdAt').its('value').should('equal', 'a few seconds ago')
    cy.get('@totalDuration').its('value').should('equal', '00m 00s')

    cy.tick(5 * 1000) // tick 5s

    cy.get('@createdAt').its('value').should('equal', 'a few seconds ago')
    cy.get('@totalDuration').its('value').should('equal', '00m 05s')

    cy.tick(60000 + 25 * 1000) // tick 1m 25s

    cy.get('@createdAt').its('value').should('equal', '2 minutes ago')
    cy.get('@totalDuration').its('value').should('equal', '01m 30s')

    cy.tick(60000 + 40 * 1000) // tick 1m 40s

    cy.get('@createdAt').its('value').should('equal', '3 minutes ago')
    cy.get('@totalDuration').its('value').should('equal', '03m 10s')

    cy.tick(60000 * 60 + 40 * 1000) // tick 1h 40s

    cy.get('@createdAt').its('value').should('equal', 'an hour ago')
    cy.get('@totalDuration').its('value').should('equal', '01h 03m 50s')
  })
})
