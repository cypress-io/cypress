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

        expect(top.console.warn).to.be.calledOnce

  it "can return a promise that throws on its own without warning", (done) ->
    Cypress.Promise
    .delay(10)
    .then ->
      cy.wrap({}).should("deep.eq", {})
    .then (obj) ->
      expect(obj).to.deep.eq({})

      throw new Error("foo")
    .catch ->
      done()

  it "can still fail cypress commands", (done) ->
    cy.on "fail", (err) ->
      expect(err.message).to.eq("foo")
      done()

    Cypress.Promise
    .delay(10)
    .then ->
      cy.wrap({}).then ->
        throw new Error("foo")

