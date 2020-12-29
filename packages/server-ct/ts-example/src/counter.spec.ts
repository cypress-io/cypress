/// <reference types="cypress" />

import $ from 'cash-dom'
import counter from './counter'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      incrementAndCheck: typeof incrementAndCheck
    }
  }
}

const incrementAndCheck = (value: number) => {
  return cy.get('button')
  .click()
  .get('#counter')
  .should('contain', value)
}

Cypress.Commands.add('incrementAndCheck', incrementAndCheck)

function mount () {
  $('body').html('')
  const $counter = counter('counter-root', $(`<div id="counter-root"/>`))

  $('body').append($counter)

  return cy.get('#counter')
}

Cypress.Commands.add('mount', mount)

describe('Counter', () => {
  it('increments', () => {
    mount()
    .get('#counter-root')
    .should('contain', 0) // default value
    .incrementAndCheck(1)
    .incrementAndCheck(2)
    .incrementAndCheck(3)
    .incrementAndCheck(4)
  })
})
