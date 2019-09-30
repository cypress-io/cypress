Cypress.Commands.add('failAssertion', () => {
  expect(true).to.be.false
})

Cypress.Commands.add('failException', () => {
  ({}).bar()
})

Cypress.Commands.add('failCommand', () => {
  cy.get('h1', { timeout: 1 })
})

Cypress.Commands.add('failChainedCommand', () => {
  cy.get('div').find('h1', { timeout: 1 })
})

Cypress.Commands.add('failThenAssertion', () => {
  cy.wrap({}).then(() => {
    expect(true).to.be.false
  })
})

Cypress.Commands.add('failShouldCallbackAssertion', () => {
  cy.wrap({}).should(() => {
    expect(true).to.be.false
  })
})

Cypress.Commands.add('failThenException', () => {
  cy.wrap({}).then(() => {
    ({}).bar()
  })
})

Cypress.Commands.add('failShouldCallbackException', () => {
  cy.wrap({}).should(() => {
    ({}).bar()
  })
})

Cypress.Commands.add('failShouldAssertion', () => {
  cy.wrap({})
  .should('have.property', 'foo')
})

Cypress.Commands.add('failAfterMultipleShoulds', () => {
  cy.wrap({ foo: 'foo' }).should('have.property', 'foo')
  .should('have.property', 'bar')
})

Cypress.Commands.add('failAfterMultipleShouldCallbacksException', () => {
  cy.wrap({})
  .should(() => {
    expect(true).to.be.true
  })
  .should(() => {
    ({}).bar()
  })
})

Cypress.Commands.add('failAfterMultipleShouldCallbacksAssertion', () => {
  cy.wrap({})
  .should(() => {
    expect(true).to.be.true
  })
  .should(() => {
    expect(true).to.be.false
  })
})

Cypress.Commands.add('failCommandAfterShouldSuccess', () => {
  cy.wrap({ foo: 'foo' }).should('have.property', 'foo')
  cy.get('h1', { timeout: 1 })
})
