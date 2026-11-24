/* eslint-disable mocha/no-top-level-tests, no-undef */
it('fails', () => {
  cy.then(() => {
    throw new Error('this should fail here')
  })
})

it('executes more commands', () => {
  cy.wrap({ foo: 'bar' }).its('foo').should('eq', 'bar')
  cy.writeFile('foo.js', 'bar')
})
