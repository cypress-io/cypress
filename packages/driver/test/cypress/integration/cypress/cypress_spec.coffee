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

  context "$", ->
    afterEach ->
      delete Cypress.$.expr[":"].foo

    ## https://github.com/cypress-io/cypress/issues/2830
    it "exposes expr", ->
      expect(Cypress.$).to.have.property("expr")

      Cypress.$.expr[":"].foo = (elem) ->
        Boolean(elem.getAttribute("foo"))

      $foo = $("<div foo='bar'>foo element</div>").appendTo(cy.$$("body"))

      cy.get(":foo").then ($el) ->
        expect($el.get(0)).to.eq($foo.get(0))

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

  context "Log", ->
    it "throws when using Cypress.Log.command()", ->
      fn = ->
        Cypress.Log.command({})

      expect(fn).to.throw(/has been renamed to Cypress.log/)

  context "DeprecatedCommanInterface", ->
    it "throws when using Cypress.add...Command", ->
      fn = ->
        Cypress.addParentCommand()

      expect(fn).to.throw().with.property("message")
        .and.include("Cypress.addParentCommand(...) has been removed and replaced")
      expect(fn).to.throw().with.property("docsUrl")
        .and.eq("https://on.cypress.io/custom-command-interface-changed")
      
      fn = ->
        Cypress.addChildCommand()

      expect(fn).to.throw().with.property("message")
        .and.include("Cypress.addChildCommand(...) has been removed and replaced")
      expect(fn).to.throw().with.property("docsUrl")
        .and.eq("https://on.cypress.io/custom-command-interface-changed")
      
      fn = ->
        Cypress.addDualCommand()

      expect(fn).to.throw().with.property("message")
        .and.include("Cypress.addDualCommand(...) has been removed and replaced")
      expect(fn).to.throw().with.property("docsUrl")
        .and.eq("https://on.cypress.io/custom-command-interface-changed")

  context "PrivateCommandInterface", ->
    it "throws when using addAssertionCommand or addUtilityCommand", ->
      fn = ->
        Cypress.addAssertionCommand()

      expect(fn).to.throw().with.property("message")
        .and.include("You cannot use the undocumented private command interface: `addAssertionCommand`")
      
      fn = ->
        Cypress.addUtilityCommand()

      expect(fn).to.throw().with.property("message")
        .and.include("You cannot use the undocumented private command interface: `addUtilityCommand`")

