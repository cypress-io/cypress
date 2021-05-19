describe('suite', () => {
  beforeEach(() => {
    cy.visit('the://url')

    cy.get('body').then(() => {
      throw new Error('Failing Test')
    })
  })

  it('test', () => {
    cy.get('body')
  })
})
