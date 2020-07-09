import './setup'

describe('cy.spread', { defaultCommandTimeout: 0 }, () => {
  it('assertion failure', () => {
    cy.wrap([1, 2, 3]).spread(() => {
      expect('actual').to.equal('expected')
    })
  })

  it('exception', () => {
    cy.wrap([1, 2, 3]).spread(() => {
      ({}).bar()
    })
  })

  it('command failure', () => {
    cy.wrap([1, 2, 3]).spread(() => {
      cy.get('#does-not-exist')
    })
  })
})
