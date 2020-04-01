describe "return values", ->
  beforeEach ->
    @logs = []

    cy.on "log:added", (attrs, log) =>
      @lastLog = log

      @logs.push(log)

    return null

  it "can return undefined and invoke cy commands", (done) ->
    cy.wrap(null).then ->
      expect(@logs.length).to.eq(1)
      done()

    return undefined

  it "can return cy and have done callback", (done) ->
    cy.wrap({}).then ->
      done()

  it "throws when returning a non promise and invoking cy commands", (done) ->
    cy.on "fail", (err) ->
      expect(err.message).to.include("> foo")
      expect(err.message).to.include("Cypress detected that you invoked one or more cy commands but returned a different value.")
      expect(err.docsUrl).to.eq("https://on.cypress.io/returning-value-and-commands-in-test")

      done()

    cy.wrap(null)

    return "foo"

  it "stringifies function bodies", (done) ->
    cy.on "fail", (err) ->
      expect(err.message).to.include("> function")
      expect(err.message).to.include("return \"foo\";")
      expect(err.message).to.include("Cypress detected that you invoked one or more cy commands but returned a different value.")
      expect(err.docsUrl).to.eq("https://on.cypress.io/returning-value-and-commands-in-test")

      done()

    cy.wrap(null)

    return ->
      return "foo"

  it "can return undefined when invoking cy commands in custom command", (done) ->
    Cypress.Commands.add "foo", ->
      cy.wrap(null).then ->
        expect(@logs.length).to.eq(1)
        done()

      return undefined

    cy.foo()

  it "throws when returning a non promise and invoking cy commands from a custom command", (done) ->
    cy.on "fail", (err) =>
      lastLog = @lastLog

      expect(@logs.length).to.eq(1)
      expect(lastLog.get("name")).to.eq("foo")
      expect(lastLog.get("error")).to.eq(err)
      expect(err.message).to.include("> `cy.foo()`")
      expect(err.message).to.include("> bar")
      expect(err.message).to.include("Cypress detected that you invoked one or more cy commands in a custom command but returned a different value.")
      expect(err.docsUrl).to.eq("https://on.cypress.io/returning-value-and-commands-in-custom-command")

      done()

    Cypress.Commands.add "foo", ->
      cy.wrap(null)

      return "bar"

    cy.foo()

  it "stringifies function return values", (done) ->
    cy.on "fail", (err) =>
      lastLog = @lastLog

      expect(@logs.length).to.eq(1)
      expect(lastLog.get("name")).to.eq("foo")
      expect(lastLog.get("error")).to.eq(err)
      expect(err.message).to.include("> `cy.foo()`")
      expect(err.message).to.include("> function() {")
      expect(err.message).to.include("return \"bar\";")
      expect(err.message).to.include("Cypress detected that you invoked one or more cy commands in a custom command but returned a different value.")

      done()

    Cypress.Commands.add "foo", ->
      cy.wrap(null)

      return ->
        return "bar"

    cy.foo()

  describe "without invoking cy", ->
    it "handles returning undefined", ->
      return undefined

    it "handles synchronously invoking and returning done callback", (done) ->
      return done()

    it "handles synchronously invoking done callback and returning undefined", (done) ->
      done()
      return undefined

    it "handles synchronously invoking done callback and returning a value", (done) ->
      done()
      return "foo"

    it "handles asynchronously invoking done callback", (done) ->
      setTimeout ->
        done()
      return "foo"
