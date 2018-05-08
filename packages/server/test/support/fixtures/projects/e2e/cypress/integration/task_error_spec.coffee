it "includes stack trace in error", ->
  cy.task("errors", "Error thrown in task handler")
