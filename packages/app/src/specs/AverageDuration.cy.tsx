import type { AverageDurationFragment } from '../generated/graphql'
import AverageDuration from './AverageDuration.vue'

function emptyAverageDurationFragment (milliseconds?: number): AverageDurationFragment {
  return {
    id: 'id',
    data: {
      id: 'id',
      averageDuration: milliseconds ?? 0,
      retrievedAt: new Date().toISOString(),
      __typename: 'CloudProjectSpec',
    },
    __typename: 'RemoteFetchableCloudProjectSpecResult',
  }
}

describe('<AverageDuration />', () => {
  it('shows no time when 0 is passed', () => {
    const gql = emptyAverageDurationFragment(0)

    cy.mount(() => {
      return (
        <AverageDuration gql={gql}/>
      )
    })

    cy.findByTestId('average-duration').should('not.exist')
  })

  it('shows correct time - small fractions of a second', () => {
    const gql = emptyAverageDurationFragment(33)

    cy.mount(() => {
      return (
        <AverageDuration gql={gql}/>
      )
    })

    cy.findByTestId('average-duration').contains('0:00')
  })

  it('shows correct time - almost a second', () => {
    const gql = emptyAverageDurationFragment(850)

    cy.mount(() => {
      return (
        <AverageDuration gql={gql}/>
      )
    })

    cy.findByTestId('average-duration').contains('0:00')
  })

  it('shows correct time - seconds only', () => {
    const gql = emptyAverageDurationFragment(12 * 1000)

    cy.mount(() => {
      return (
        <AverageDuration gql={gql}/>
      )
    })

    cy.findByTestId('average-duration').contains('0:12')
  })

  it('shows correct time - minutes only', () => {
    // 2:00 = 120 seconds
    const gql = emptyAverageDurationFragment(120 * 1000)

    cy.mount(() => {
      return (
        <AverageDuration gql={gql}/>
      )
    })

    cy.findByTestId('average-duration').contains('2:00')
  })

  it('shows correct time - seconds and minutes', () => {
    // 2:34 = 154 seconds
    const gql = emptyAverageDurationFragment(154 * 1000)

    cy.mount(() => {
      return (
        <AverageDuration gql={gql}/>
      )
    })

    cy.findByTestId('average-duration').contains('2:34')
  })

  it('shows correct time - hours, seconds and minutes', () => {
    // 2:02:34 = 7354 seconds
    const gql = emptyAverageDurationFragment(7354 * 1000)

    cy.mount(() => {
      return (
        <AverageDuration gql={gql}/>
      )
    })

    cy.findByTestId('average-duration').contains('2:02:34')
  })

  it('shows correct time - high number of hours, seconds and minutes', () => {
    // 42:02:34 = 151354 seconds
    const gql = emptyAverageDurationFragment(151354 * 1000)

    cy.mount(() => {
      return (
        <AverageDuration gql={gql}/>
      )
    })

    cy.findByTestId('average-duration').contains('42:02:34')
  })
})
