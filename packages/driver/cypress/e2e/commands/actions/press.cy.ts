describe('__placeholder__/commands/actions/press', () => {
  it('dispatches the tab keypress to the AUT', () => {
    cy.visit('/fixtures/input_events.html')

    cy.get('#focus').focus().then(async () => {
      try {
        await Cypress.automation('key:press', { key: 'Tab' })
      } catch (e) {
        if (e.message && (e.message as string).includes('key:press')) {
          cy.log(e.message)

          return
        }

        throw e
      }

      cy.get('#keyup').should('have.value', 'Tab')

      cy.get('#keydown').should('have.value', 'Tab')
    })
  })
})
