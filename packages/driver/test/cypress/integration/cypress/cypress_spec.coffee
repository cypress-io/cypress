Promise = Cypress.Promise

describe "driver/src/cypress/index", ->
  beforeEach ->
    cy.stub(Promise, "config")

    @Cypress = Cypress.$Cypress.create({})

  context "#backend", ->
    it "sets __stackCleaned__ on errors", (done) ->
      cy.stub(@Cypress, "emit")
      .withArgs("backend:request")
      .yieldsAsync({
        error: {
          name: "Error"
          message: "msg"
          stack: "stack"
        }
      })

      @Cypress.backend("foo")
      .catch (err) ->
        expect(err.backend).to.be.true
        expect(err.stack).not.to.include("From previous event")

        done()
