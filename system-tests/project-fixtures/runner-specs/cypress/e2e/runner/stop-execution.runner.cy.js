describe('stop execution', () => {
  it('test stops while running', () => {
    // ensure the timeout is long enough so we can verify the
    // UI changes but not too long so we can verify the error message
    cy.timeout(2000)
    cy.get('.not-exist')
  })

  afterEach(function () {
    this.currentTest.err = new Error('ran afterEach even though specs were stopped')
  })
})
