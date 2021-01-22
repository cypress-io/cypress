describe('suite', () => {
  describe('nested suite 1', () => {
    it('test 1', () => {
      cy.visit('the://url')
    })

    it.only('test 2', () => {
      cy.visit('the://url')
    })

    it('test 3', () => {
      cy.visit('the://url')
    })
  })

  describe('nested suite 2', () => {
    it('test 4', () => {
      cy.visit('the://url')
    })
  })
})
