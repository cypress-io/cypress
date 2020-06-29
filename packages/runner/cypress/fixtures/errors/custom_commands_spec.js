import './setup'

Cypress.Commands.add('failAssertion', () => {
  expect('actual').to.equal('expected')
})

Cypress.Commands.add('failException', () => {
  ({}).bar()
})

Cypress.Commands.add('failCommand', () => {
  cy.get('#does-not-exist')
})

describe('custom commands', { defaultCommandTimeout: 0 }, () => {
  it('assertion failure', () => {
    cy.failAssertion()
  })

  it('exception', () => {
    cy.failException()
  })

  it('command failure', () => {
    cy.failCommand()
  })
})
