describe('a11y - click targets', () => {
  beforeEach(() => {
    cy.visit('/fixtures/a11y/inputs.html')
  })

  context('checkbox - handles activation', () => {
    it('semantic', () => {
      cy.get('#test-a11y-semantic-checkbox').click()
    })

    it('styled div', () => {
      cy.get('#test-a11y-styled-checkbox').click()
    })

    it('role', () => {
      cy.get('#test-a11y-role-checkbox').click()

      cy.get('#test-a11y-role-checkbox').type('{enter}')

      cy.get('#test-a11y-role-checkbox').type(' ')
    })
  })

  context('text - handles text entry', () => {
    it('semantic', () => {
      cy.get('#test-a11y-semantic-text').type('test value')
    })

    it('styled div', () => {
      cy.get('#test-a11y-styled-text').type('test value')
    })

    it('role', () => {
      cy.get('#test-a11y-role-text').type('test value')
    })
  })
})
