describe('stop execution', () => {
  it('test stops while running', () => {
    cy.timeout(200)
    cy.get('.not-exist')
    setTimeout(() => {
      cy.$$('button.stop', parent.document).click()
    }, 100)
  })

  afterEach(function () {
    this.currentTest.err = new Error('ran afterEach even though specs were stopped')
  })
})
