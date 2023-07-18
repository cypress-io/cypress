describe('results spec 1', () => {
  beforeEach(() => {
    cy.log('beforeEach hook')
  })

  afterEach(() => {
    cy.log('afterEach hook')
  })

  it('test 1', () => {
    cy.log('test 1')
    cy.screenshot('test 1 screenshot')
  })

  it('test 2', () => {
    cy.log('test 2')
  })

  it('test 3 (fails)', { retries: 1, defaultCommandTimeout: 10 }, () => {
    cy.log('test 3')
    cy.screenshot('test 3 screenshot')
    cy.wrap(true).should('be.false')
  })
})
