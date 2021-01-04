describe('src/dom/jquery', () => {
  context('.isJquery', () => {
    it('does not get confused when window contains jquery function', () => {
      window.jquery = () => {}

      expect(Cypress.dom.isJquery(window)).to.be.false
    })

    it('is true for actual jquery instances', () => {
      expect(Cypress.dom.isJquery(Cypress.$(':first'))).to.be.true
    })

    // https://github.com/cypress-io/cypress/issues/14278
    it('does not return undefined', () => {
      cy.visit('fixtures/dom.html')

      cy.get('#dom').then(($el) => {
        expect(Cypress.dom.isJquery($el[0])).to.eql(false)
        // @ts-ignore
        expect(Cypress.dom.isJquery()).to.eql(false)
      })
    })
  })
})
