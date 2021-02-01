describe('top level suite', () => {
  describe('inner suite with describe', () => {
    it('test with it', () => {
      cy.get('.btn').click()
    })

    specify('test with specify', () => {
      cy.get('.btn').click()
    })

    // eslint-disable-next-line mocha/no-exclusive-tests, no-only-tests/no-only-tests
    it.only('test with it.only', () => {
      cy.get('.btn').click()
    })
  })

  context('inner suite with context', () => {

  })

  // eslint-disable-next-line mocha/no-exclusive-tests, no-only-tests/no-only-tests
  describe.only('inner suite with describe.only', () => {

  })
})
