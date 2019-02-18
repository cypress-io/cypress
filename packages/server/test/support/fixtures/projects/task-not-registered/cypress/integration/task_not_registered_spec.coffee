it "fails because the 'task' event is not registered in background file", ->
  cy.task("some:task")
