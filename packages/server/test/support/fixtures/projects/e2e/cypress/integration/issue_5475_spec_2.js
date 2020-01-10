// https://github.com/cypress-io/cypress/issues/5475
describe('issue #5475', () => {
  it('hangs on next spec after modifying history.pushState', () => {
    cy.screenshot('hangs')

    cy.wrap(null).then(() => {
      throw new Error('foo')
    })
  })
})
