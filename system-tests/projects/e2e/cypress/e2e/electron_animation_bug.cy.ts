describe('bug', () => {
  it('loads in less than .3 seconds', { defaultCommandTimeout: 300 }, () => {
    cy.visit('/electron_animation_bug.html')

    for (let i = 0; i < 50; i++) {
      cy.get('#app').should('exist')
      cy.get('#remove').click()
      cy.get('#app').should('not.exist')
      cy.get('#add').click()
    }
  })
})
