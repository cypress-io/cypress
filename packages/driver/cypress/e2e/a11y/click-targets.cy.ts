describe('a11y - click targets', () => {
  beforeEach(() => {
    cy.visit('/fixtures/a11y/click-targets.html')
  })

  context('button - handles click behavior', () => {
    it('semantic', () => {
      cy.get('#test-a11y-semantic-button').click()
      cy.get('#test-a11y-click-result').should('have.text', 'Click - SEMANTIC Button')
    })

    it('styled div', () => {
      cy.get('#test-a11y-styled-button').click()
      cy.get('#test-a11y-click-result').should('have.text', 'Click - STYLED Button')
    })

    it('role', () => {
      cy.get('#test-a11y-role-button').click()
      cy.get('#test-a11y-click-result').should('have.text', 'Click - ROLE Button')

      cy.get('#test-a11y-role-button').type('{enter}')
      cy.get('#test-a11y-click-result').should('have.text', 'Keydown - Enter - ROLE Button')

      cy.get('#test-a11y-role-button').type(' ')
      cy.get('#test-a11y-click-result').should('have.text', 'Keydown - Space - ROLE Button')
    })
  })

  context('link', () => {
    it('semantic', () => {
      cy.get('#test-a11y-semantic-link').click()
      cy.get('#test-a11y-click-result').should('have.text', 'Click - SEMANTIC Link')
    })

    it('styled div', () => {
      cy.get('#test-a11y-styled-link').click()
      cy.get('#test-a11y-click-result').should('have.text', 'Click - STYLED Link')
    })

    it('role', () => {
      cy.get('#test-a11y-role-link').click()
      cy.get('#test-a11y-click-result').should('have.text', 'Click - ROLE Link')

      cy.get('#test-a11y-role-link').type('{enter}')
      cy.get('#test-a11y-click-result').should('have.text', 'Keydown - Enter - ROLE Link')
    })
  })
})
