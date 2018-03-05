it "fails because task:requested is not registered in plugins file", ->
  cy.task("some:task")
