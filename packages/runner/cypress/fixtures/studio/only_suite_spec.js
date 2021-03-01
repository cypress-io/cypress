describe('suite', () => {
  describe('nested suite 1', () => {
    it('test 1', () => {
      cy.visit('the://url')
    })

    it('test 2', () => {
      cy.visit('the://url')
    })
  })

  describe.only('nested suite 2', () => {
    it('test 3', () => {
      cy.visit('the://url')
    })

    it('test 4', () => {
      cy.visit('the://url')
    })
  })
})
