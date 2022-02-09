describe('src/cy/commands/group', () => {
  it('groups', () => {
    cy.visit('/fixtures/jquery.html')
    cy.log(Cypress.Commands._commands)
    cy.group('hello', () => {
      cy.log('in')
    })
    cy.log('here')
    cy.endGroup('hello')
    cy.log('after')
  })
})
