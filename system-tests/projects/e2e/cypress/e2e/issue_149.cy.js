/* eslint-disable mocha/no-global-tests, no-undef */
it('fails', () => {
  cy.then(() => {
    throw new Error('this should fail here')
  })
})

it('executes more commands', () => {
  cy.wrap({ foo: 'bar' }).its('foo').should('eq', 'bar')
  cy.writeFile('foo.js', 'bar')
})
