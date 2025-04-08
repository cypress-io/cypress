describe('a11y - inputs', () => {
  beforeEach(() => {
    cy.visit('/fixtures/a11y/inputs.html')
  })

  context('checkbox - handles activation', () => {
    it('semantic', () => {
      cy.get('#test-a11y-semantic-checkbox').click().should('have.value', 'on')
    })

    it('styled div', () => {
      cy.get('#test-a11y-styled-checkbox').click().should('have.class', 'checked')
    })

    it('role', () => {
      cy.get('#test-a11y-role-checkbox').click().should('have.attr', 'aria-checked').and('equal', 'true')

      cy.get('#test-a11y-role-checkbox').type(' ').should('have.attr', 'aria-checked').and('equal', 'false')
    })
  })

  context('text - handles text entry', () => {
    it('semantic', () => {
      cy.get('#test-a11y-semantic-text').type('test value').should('have.value', 'test value')
    })

    it('styled div', () => {
      cy.get('#test-a11y-styled-text').type('test value').should('have.text', 'test value')
    })

    it('role', () => {
      cy.get('#test-a11y-role-text').type('test value').should('have.text', 'test value')
    })
  })
})
