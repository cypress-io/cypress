it('fails because the "task" event is not registered in setupNodeEvents method', () => {
  cy.task('some:task')
})
