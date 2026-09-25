describe('a quiet but healthy test', () => {
  it('waits longer than the activity timeout', () => {
    cy.visit('/index.html')

    // cy.wait sends nothing to the server while it waits, so the activity
    // monitor goes silent and probes the renderer, which must answer
    cy.wait(12000)

    cy.get('body').should('exist')
  })
})
