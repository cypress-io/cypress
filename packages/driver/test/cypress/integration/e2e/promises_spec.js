describe "promises", ->
  beforeEach ->
    @warn = cy.spy(Cypress.Promise.prototype, "_warn")

  afterEach ->
    expect(@warn).not.to.be.calledOnce

  it "warns when returning a promise and calling cypress commands", ->
    cy.spy(top.console, "warn")

    title = cy.state("runnable").fullTitle()

    Cypress.Promise.delay(10)
    .then ->
      cy.wrap({})
      cy.wrap([])
      cy.wrap("lol")
      .then ->
        msg = top.console.warn.firstCall.args[0]

        expect(msg).to.include("Cypress detected that you returned a promise in a test, but also invoked one or more cy commands inside of that promise.")
        expect(msg).to.include(title)
        expect(msg).to.include("https://on.cypress.io/returning-promise-and-commands-in-test")

        expect(top.console.warn).to.be.calledOnce

  it "warns when instantiating a promise and calling cypress commands", ->
    cy.spy(top.console, "warn")

    title = cy.state("runnable").fullTitle()

    new Cypress.Promise (resolve) ->
      cy.wrap({})
      cy.wrap([])
      cy.wrap("lol")
      .then(resolve)
    .then ->
      msg = top.console.warn.firstCall.args[0]

      expect(msg).to.include("Cypress detected that you returned a promise in a test, but also invoked one or more cy commands inside of that promise.")
      expect(msg).to.include(title)
      expect(msg).to.include("https://on.cypress.io/returning-promise-and-commands-in-test")

      expect(top.console.warn).to.be.calledOnce

  it "throws when returning a promise from a custom command", (done) ->
    logs = []

    cy.on "log:added", (attrs, log) =>
      @lastLog = log

      logs.push(log)

    cy.on "fail", (err) =>
      lastLog = @lastLog

      expect(logs.length).to.eq(1)
      expect(lastLog.get("name")).to.eq("foo")
      expect(lastLog.get("error")).to.eq(err)

      expect(err.message).to.include("Cypress detected that you returned a promise from a command while also invoking one or more cy commands in that promise.")
      expect(err.message).to.include("> `cy.foo()`")
      expect(err.message).to.include("> `cy.wrap()`")
      expect(err.docsUrl).to.eq("https://on.cypress.io/returning-promise-and-commands-in-another-command")

      done()

    Cypress.Commands.add "foo", ->
      Cypress.Promise
      .delay(10)
      .then ->
        cy.wrap({})

    cy.foo()

  it "throws when instantiating a promise from a custom command", (done) ->
    logs = []

    cy.on "log:added", (attrs, log) =>
      @lastLog = log

      logs.push(log)

    cy.on "fail", (err) =>
      lastLog = @lastLog

      expect(logs.length).to.eq(1)
      expect(lastLog.get("name")).to.eq("foo")
      expect(lastLog.get("error")).to.eq(err)

      expect(err.message).to.include("Cypress detected that you returned a promise from a command while also invoking one or more cy commands in that promise.")
      expect(err.message).to.include("> `cy.foo()`")
      expect(err.message).to.include("> `cy.wrap()`")

      done()

    Cypress.Commands.add "foo", ->
      new Cypress.Promise (resolve) ->
        cy.wrap({}).then(resolve)

    cy.foo()

  it "is okay to return promises from custom commands with no cy commands", ->
    Cypress.Commands.add "foo", ->
      Cypress.Promise
      .delay(10)

    cy.foo()

  it "can return a promise that throws on its own without warning", ->
    Cypress.Promise
    .delay(10)
    .then ->
      cy.wrap({}).should("deep.eq", {})
    .then (obj) ->
      expect(obj).to.deep.eq({})

      throw new Error("foo")
    .catch ->

  it "can still fail cypress commands", (done) ->
    cy.on "fail", (err) ->
      expect(err.message).to.eq("foo")
      done()

    Cypress.Promise
    .delay(10)
    .then ->
      cy.wrap({}).then ->
        throw new Error("foo")
    return
