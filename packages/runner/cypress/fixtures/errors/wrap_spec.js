import './setup'

describe('cy.wrap', { defaultCommandTimeout: 0 }, () => {
  it('assertion failure', () => {
    cy.wrap(() => {
      expect('actual').to.equal('expected')
    }).then((fn) => fn())
  })

  it('exception', () => {
    cy.wrap(() => {
      ({}).bar()
    }).then((fn) => fn())
  })

  it('command failure', () => {
    cy.wrap(() => {
      cy.get('#does-not-exist')
    }).then((fn) => fn())
  })
})
