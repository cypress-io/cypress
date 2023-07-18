describe('results spec 1', () => {
  before(() => {
    cy.log('before hook')
  })

  after(() => {
    cy.log('after hook')
  })

  it('test 1 (fails)', { retries: 1, defaultCommandTimeout: 10 }, () => {
    cy.log('test 1')
    cy.wrap(true).should('be.false')
  })

  it('test 2', () => {
    cy.log('test 2')
    cy.screenshot('test 2 screenshot')
  })
})
