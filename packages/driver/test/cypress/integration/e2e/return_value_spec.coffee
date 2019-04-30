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

  it "throws when returning a non promise and invoking cy commands", (done) ->
    cy.on "fail", (err) ->
      expect(err.message).to.include("> foo")
      expect(err.message).to.include("Cypress detected that you invoked one or more cy commands but returned a different value.")

      done()

    cy.wrap(null)

    return "foo"

  it "stringifies function bodies", (done) ->
    cy.on "fail", (err) ->
      expect(err.message).to.include("> function () {")
      expect(err.message).to.include("return \"foo\";")
      expect(err.message).to.include("Cypress detected that you invoked one or more cy commands but returned a different value.")

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
      expect(err.message).to.include("> cy.foo()")
      expect(err.message).to.include("> bar")
      expect(err.message).to.include("Cypress detected that you invoked one or more cy commands in a custom command but returned a different value.")

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
      expect(err.message).to.include("> cy.foo()")
      expect(err.message).to.include("> function () {")
      expect(err.message).to.include("return \"bar\";")
      expect(err.message).to.include("Cypress detected that you invoked one or more cy commands in a custom command but returned a different value.")

      done()

    Cypress.Commands.add "foo", ->
      cy.wrap(null)

      return ->
        return "bar"

    cy.foo()
