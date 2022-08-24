describe('empty spec', () => {
  it('passes', () => {
    cy.session('hello', () => {
      cy.log('here')
    })
  })
})
