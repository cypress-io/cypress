import './setup'

describe('cy.each', { defaultCommandTimeout: 0 }, () => {
  it('assertion failure', () => {
    cy.wrap([1]).each(() => {
      expect('actual').to.equal('expected')
    })
  })

  it('exception', () => {
    cy.wrap([1]).each(() => {
      ({}).bar()
    })
  })

  it('command failure', () => {
    cy.wrap([1]).each(() => {
      cy.get('#does-not-exist')
    })
  })
})
