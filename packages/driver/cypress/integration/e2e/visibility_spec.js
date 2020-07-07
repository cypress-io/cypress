describe('visibility', () => {
  // https://github.com/cypress-io/cypress/issues/631
  describe('with overflow and transform - slider', () => {
    beforeEach(() => {
      cy.visit('/fixtures/issue-631.html')

      // first slide is visible by default, nothing wrong here
      cy.get('[name="test1"]').should('be.visible')
      cy.get('[name="test2"]').should('not.be.visible')
      cy.get('[name="test3"]').should('not.be.visible')
    })

    it('second slide', () => {
      // ask for the second slide to become visible
      cy.get('#button-2').click()

      cy.get('[name="test1"]').should('not.be.visible')
      cy.get('[name="test2"]').should('be.visible')
      cy.get('[name="test3"]').should('not.be.visible')
    })

    it('third slide', () => {
      // ask for the second slide to become visible
      cy.get('#button-3').click()

      cy.get('[name="test1"]').should('not.be.visible')
      cy.get('[name="test2"]').should('not.be.visible')
      cy.get('[name="test3"]').should('be.visible')
    })
  })

  // https://github.com/cypress-io/cypress/issues/7794
  describe('with shadow dom and fixed position ancestor', () => {
    it('does not hang when checking visibility', () => {
      cy.visit('/fixtures/issue-7794.html')
      cy.get('.container-2').should('be.visible')
    })
  })
})
