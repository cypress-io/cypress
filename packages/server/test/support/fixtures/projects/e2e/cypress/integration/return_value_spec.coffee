it "errors when invoking commands and return a different value", ->
  cy.wrap(null)

  return [{}, 1, 2, "foo", (->)]

it "errors when invoking commands in custom command and returning differnet value", ->
  Cypress.Commands.add "foo", ->
    cy.wrap(null)

    return "bar"

  cy.foo()
