describe('electron animation bug', () => {
  it('loads in less than .3 seconds', { defaultCommandTimeout: 750 }, () => {
    cy.visit('/electron_animation_bug.html')

    cy.get('#app').should('exist')
    cy.get('#remove').click()
    cy.get('#app').should('not.exist')
  })
})
