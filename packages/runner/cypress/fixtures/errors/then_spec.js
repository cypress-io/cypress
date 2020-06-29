import './setup'

describe('cy.then', { defaultCommandTimeout: 0 }, () => {
  it('assertion failure', () => {
    cy.wrap({}).then(() => {
      expect('actual').to.equal('expected')
    })
  })

  it('exception', () => {
    cy.wrap({}).then(() => {
      ({}).bar()
    })
  })

  it('command failure', () => {
    cy.wrap({}).then(() => {
      cy.get('#does-not-exist')
    })
  })
})
