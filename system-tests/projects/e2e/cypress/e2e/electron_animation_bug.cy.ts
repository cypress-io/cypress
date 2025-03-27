describe('bug', () => {
  it('loads in less than .5 seconds', { defaultCommandTimeout: 300 }, () => {
    cy.visit('/electron_animation_bug.html')

    cy.get('#app').should('exist')
    cy.get('#remove').click()
    cy.get('#app').should('not.exist')
  })
})
