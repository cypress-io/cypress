describe('test wrapper', () => {
  it('test 1', () => {
    cy.log('testBody 1')
  })

  describe('nested suite 1', () => {
    beforeEach(() => {
      cy.log('beforeEachHook 1')
    })

    // Intentional .only for testing
    // eslint-disable-next-line mocha/no-exclusive-tests
    it.only('test 2', () => {
      cy.log('testBody 2')
    })
  })

  describe('nested suite 2', () => {
    beforeEach(() => {
      cy.log('beforeEachHook 2')
    })

    it('test 3', () => {
      cy.log('testBody 3')
    })
  })

  describe('nested suite 3', () => {
    // Intentional .only for testing
    // eslint-disable-next-line mocha/no-exclusive-tests
    it.only('test 4', () => {
      cy.log('testBody 4')
    })
  })
})
