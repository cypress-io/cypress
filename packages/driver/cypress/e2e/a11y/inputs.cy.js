// const { $ } = Cypress

describe('a11y - click targets', () => {
  beforeEach(() => {
    cy.visit('/fixtures/a11y/inputs.html')
  })

  context('button - handles click behavior', () => {
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
})
