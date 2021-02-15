describe('suite', () => {
  beforeEach(() => {
    cy.visit('the://url')
  })

  it('test', () => {
    cy.get('body').then(() => {
      throw new Error('Failing Test')
    })
  })
})
