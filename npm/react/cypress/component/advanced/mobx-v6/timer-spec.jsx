import React from 'react'
import { mount } from 'cypress-react-unit-test'
import { Timer } from './Timer'
import { TimerView } from './timer-view'

describe('MobX v6', { viewportWidth: 200, viewportHeight: 100 }, () => {
  context('TimerView', () => {
    it('increments every second', () => {
      const myTimer = new Timer()
      mount(<TimerView timer={myTimer} />)
      cy.contains('Seconds passed: 0').then(() => {
        // we can increment the timer from outside
        myTimer.increaseTimer()
      })
      cy.contains('Seconds passed: 1')

      // by wrapping the timer and giving it an alias
      cy.wrap(myTimer).as('timer')
      // we can "insert" it into the command chain
      // using cy.get() and then invoke methods
      // as if every command was inside .then(() => {...}) callback
      cy.get('@timer').invoke('increaseTimer')
      cy.contains('Seconds passed: 2')

      cy.get('@timer').invoke('increaseTimer')
      cy.contains('Seconds passed: 3')
      cy.get('@timer').invoke('increaseTimer')
      cy.contains('Seconds passed: 4')

      // we can also ask the timer for the current value
      cy.get('@timer').invoke('increaseTimer')
      cy.get('@timer')
        .its('secondsPassed')
        .should('equal', 5)
    })
  })
})
