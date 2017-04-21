Cypress.once "test:after:hooks", (test) ->
  new Cypress.Promise (resolve) ->
    Cypress.$.get("/hook").done -> resolve()

Cypress.once "test:after:run", (test) ->
  Cypress.$.get("/run")

describe "uncaught hook error should continue to fire all mocha events", ->
  context "s1", ->
    beforeEach ->
      ## TODO: instead of overriding onerror
      ## we need to make cy.on("fail") behave more
      ## consistently by always slurping up the failures

      ## override the parent's onerror handler
      ## so we don't actually fail this test
      # window.parent.onerror = (err) ->
      #   expect(err).to.eq("Uncaught ReferenceError: foo is not defined")
      #   done()

      ## when this beforeEach hook fails
      ## it will skip invoking the test
      ## but run the other suite
      cy.visit("http://localhost:7878/visit_error.html")

    it "does not run", ->