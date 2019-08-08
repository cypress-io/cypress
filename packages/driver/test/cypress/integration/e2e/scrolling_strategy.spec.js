describe('scrolling strategy', () => {
  beforeEach(() => {
    cy.visit('/fixtures/dom.html')
  })

  it('works', () => {
    cy.get('input:last')
    .scrollIntoView()

    // .scrollIntoView()
    cy.get('input:first')
    .click()

  })

})
