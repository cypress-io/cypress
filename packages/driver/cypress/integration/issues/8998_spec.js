it('t', () => {
  cy.visit('fixtures/issue-8998.html')
  cy.get('.option').then((el) => {
    const x = Cypress.dom.isVisible(el[8])

    expect(x).to.be.false
  })
})
