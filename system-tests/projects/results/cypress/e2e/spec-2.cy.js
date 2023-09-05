describe('results spec 1', () => {
  before(() => {
    cy.log('before hook')
  })

  after(() => {
    cy.log('after hook')
  })

  it('test 1 (fails)', { retries: 1, defaultCommandTimeout: 10 }, () => {
    cy.log('test 1')
    cy.screenshot('test 1 screenshot')
    cy.wrap(true).should('be.false')
  })

  it('test 2', () => {
    cy.log('test 2')
    cy.screenshot('test 2 screenshot')
  })

  describe('has skipped tests', { retries: 0 }, () => {
    beforeEach(() => {
      throw new Error('failure in beforeEach')
    })

    it('will be skipped #1', () => {})
    it('will be skipped #2', () => {})
  })
})
