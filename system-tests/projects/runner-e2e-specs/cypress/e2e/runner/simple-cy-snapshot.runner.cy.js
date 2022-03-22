describe('cy assertion', {
  numTestsKeptInMemory: 1,
}, () => {
  it('visits fixture', () => {
    cy.visit('cypress/fixtures/example.html')

    cy.get('html').should('exist')
  })

  it('types input', () => {
    cy.get('input').type('test')
  })

  it('clicks button', () => {
    cy.get('button').click()
    cy.get('input').focus().type('foo')
  })
})
