import './setup'

describe('cy.within', { defaultCommandTimeout: 0 }, () => {
  it('assertion failure', () => {
    cy.get('body').within(() => {
      expect('actual').to.equal('expected')
    })
  })

  it('exception', () => {
    cy.get('body').within(() => {
      ({}).bar()
    })
  })

  it('command failure', () => {
    cy.get('body').within(() => {
      cy.get('#does-not-exist')
    })
  })
})
