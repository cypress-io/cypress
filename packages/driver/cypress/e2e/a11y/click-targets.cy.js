// const { $ } = Cypress

describe('a11y - click targets', () => {
  beforeEach(() => {
    cy.visit('/fixtures/a11y/a11y-click-targets.html')
  })

  context('button', () => {
    it('receives native click event', () => {
      cy.get('#test-a11y-semantic-button').click()
      cy.findByTestId('test-a11y-click-result').should('have.text', 'You are 2 commits ahead')
    })

    it('receives native click event', () => {
      cy.get('#test-a11y-div-button').click()
      cy.findByTestId('test-a11y-click-result').should('have.text', 'You are 2 commits ahead')
    })

    it('receives native click event', () => {
      cy.get('#test-a11y-role-button').click()
      cy.findByTestId('test-a11y-click-result').should('have.text', 'You are 2 commits ahead')

      cy.get('#test-a11y-role-button').type('{enter}')
      cy.findByTestId('test-a11y-click-result').should('have.text', 'You are 2 commits ahead')

      cy.get('#test-a11y-role-button').type(' ')
      cy.findByTestId('test-a11y-click-result').should('have.text', 'You are 2 commits ahead')
    })
  })

  context('link', () => {
    it('receives native click event', () => {
      cy.get('#test-a11y-semantic-link').click()
      cy.findByTestId('test-a11y-click-result').should('have.text', 'You are 2 commits ahead')
    })

    it('receives native click event', () => {
      cy.get('#test-a11y-div-link').click()
      cy.findByTestId('test-a11y-click-result').should('have.text', 'You are 2 commits ahead')
    })

    it('receives native click event', () => {
      cy.get('#test-a11y-role-link').click()
      cy.findByTestId('test-a11y-click-result').should('have.text', 'You are 2 commits ahead')

      cy.get('#test-a11y-role-link').type('{enter}')
      cy.findByTestId('test-a11y-click-result').should('have.text', 'You are 2 commits ahead')

      cy.get('#test-a11y-role-link').type(' ')
      cy.findByTestId('test-a11y-click-result').should('have.text', 'You are 2 commits ahead')
    })
  })
})
