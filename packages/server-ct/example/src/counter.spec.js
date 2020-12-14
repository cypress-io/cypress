import $ from 'cash-dom'
import counter from './counter'

const incrementAndCheck = (value) => {
  return cy.get('button')
  .click()
  .get('#counter')
  .should('contain', value)
}

function mount () {
  $('body').html('')
  const $counter = counter($(`<div id="counter-root"/>`))

  $('body').append($counter)

  return cy.get('#counter')
}

Cypress.Commands.add('incrementAndCheck', incrementAndCheck)
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
