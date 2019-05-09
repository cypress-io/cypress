$ = Cypress.$
Promise = Cypress.Promise

describe "driver/src/cypress/index", ->
  beforeEach ->
    cy.stub(Promise, "config")

    @Cypress = Cypress.$Cypress.create({})

  context "$Cypress", ->
    it "is attached but not global", ->
      expect(window.$Cypress).to.be.undefined
      expect(window.top.$Cypress).to.be.undefined

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

  context ".isCy", ->
    it "returns true on cy, cy chainable", ->
      expect(Cypress.isCy(cy)).to.be.true
      chainer = cy.wrap().then ->
        expect(Cypress.isCy(chainer)).to.be.true

    it "returns false on non-cy objects", ->
      expect(Cypress.isCy(undefined)).to.be.false
      expect(Cypress.isCy(() => {})).to.be.false

  context ".Log", ->
    it "throws when using Cypress.Log.command()", ->
      fn = ->
        Cypress.Log.command({})

      expect(fn).to.throw(/has been renamed to Cypress.log/)
