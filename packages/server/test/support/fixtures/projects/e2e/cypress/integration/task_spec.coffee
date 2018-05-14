it "throws when task returns undefined", ->
  cy.task("returns:undefined")

it "includes stack trace in error", ->
  cy.task("errors", "Error thrown in task handler")
