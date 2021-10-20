it('fails because the "task" event is not registered in plugins file', () => {
  cy.task('some:task')
})
