describe('outer suite', () => {
  // NOTE: intentionally skipped for testing
  it.skip('test 1', () => {
    cy.log('testBody 1')
  })

  describe('inner suite', () => {
    before(() => {
      cy.log('beforeHook 1')
    })

    it('test 2', () => {
      cy.log('testBody 2')
    })
  })
})
