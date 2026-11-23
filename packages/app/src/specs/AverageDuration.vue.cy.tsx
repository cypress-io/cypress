import type { AverageDurationFragment } from '../generated/graphql'
import AverageDuration from './AverageDuration.vue'

describe('<AverageDuration />', () => {
  function mountWithDurationValue (duration: number) {
    const gql: AverageDurationFragment = {
      id: 'id',
      data: {
        __typename: 'CloudProjectSpec',
        id: 'id',
        averageDurationForRunIds: duration,
        retrievedAt: new Date().toISOString(),
      },
    }

    cy.mount(<AverageDuration gql={gql} />)
  }

  context('zero duration', () => {
    beforeEach(() => {
      mountWithDurationValue(0)
    })

    it('renders nothing', () => {
      cy.findByTestId('average-duration').should('not.exist')
    })
  })

  context('duration less than 1 second', () => {
    context('close to zero', () => {
      beforeEach(() => {
        mountWithDurationValue(33)
      })

      it('renders zero duration', () => {
        cy.findByTestId('average-duration').contains('0:00')
      })
    })

    context('near one second', () => {
      beforeEach(() => {
        mountWithDurationValue(850)
      })

      it('shows correct time', () => {
        cy.findByTestId('average-duration').contains('0:00')
      })
    })
  })

  context('duration more than 1 second but less than 1 minute', () => {
    beforeEach(() => {
      mountWithDurationValue(12 * 1000)
    })

    it('shows correct time', () => {
      cy.findByTestId('average-duration').contains('0:12')
    })
  })

  context('duration more than one minute but less than one hour', () => {
    context('even number of minutes', () => {
      beforeEach(() => {
        mountWithDurationValue(120 * 1000)
      })

      it('shows correct time', () => {
        // 2:00 = 120 seconds
        cy.findByTestId('average-duration').contains('2:00')
      })
    })

    context('mix of minutes and seconds', () => {
      beforeEach(() => {
        mountWithDurationValue(154 * 1000)
      })

      it('shows correct time', () => {
        // 2:34 = 154 seconds
        cy.findByTestId('average-duration').contains('2:34')
      })
    })
  })

  context('duration more than one hour', () => {
    context('small number of hours', () => {
      beforeEach(() => {
        mountWithDurationValue(7354 * 1000)
      })

      it('shows correct time', () => {
        // 2:02:34 = 7354 seconds
        cy.findByTestId('average-duration').contains('2:02:34')
      })
    })

    context('large number of hours', () => {
      beforeEach(() => {
        mountWithDurationValue(151354 * 1000)
      })

      it('shows correct time', () => {
        // 42:02:34 = 151354 seconds
        cy.findByTestId('average-duration').contains('42:02:34')
      })
    })
  })
})
