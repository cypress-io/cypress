it "errors when invoking commands and return a different value", ->
  cy.wrap(null)

  return [{}, 1, 2, "foo", (->)]

it "errors when invoking commands in custom command and returning different value", ->
  Cypress.Commands.add "foo", ->
    cy.wrap(null)

    return "bar"

  cy.foo()

it "errors when not invoking commands, invoking done callback, and returning a promise", (done) ->
  return Promise.resolve(null).then ->
    done()
