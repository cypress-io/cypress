describe('containIgnoreCase command', () => {
  beforeEach(() => {
    cy.visit('about:blank')
    cy.document().then((doc) => {
      doc.body.innerHTML = '<h1>WELCOME</h1>'
    })
  })

  it('should pass when text matches case-insensitively', () => {
    cy.get('h1').containIgnoreCase('welcome')
  })

  it('should fail when text does not match', () => {
    cy.get('h1').then($el => {
      expect(() => {
        cy.wrap($el).containIgnoreCase('wrongText')
      }).to.throw()
    })
  })
})
