describe "uncaught errors", ->
  beforeEach ->
    @logs = []

    cy.on "log:added", (attrs, log) =>
      @lastLog = log
      @logs.push(log)

    return null

  it "logs visit failure once", (done) ->
    r = cy.state("runnable")

    cy.on "fail", (err) =>
      lastLog = @lastLog

      expect(@logs.length).to.eq(1)

      ## this runnable should not have a timer
      expect(r.timer).not.to.be.ok

      done()

      ## and still not have a timer
      expect(r.timer).not.to.be.ok

    ## when this beforeEach hook fails
    ## it will skip invoking the test
    ## but run the other suite
    cy.visit("/fixtures/visit_error.html")

  it "can turn off uncaught exception handling via cy", ->
    r = cy.state("runnable")

    cy.on "uncaught:exception", (err, runnable) ->
      expect(err.message).to.include("foo is not defined")
      expect(runnable is r).to.be.true

      return false

    cy.visit("/fixtures/visit_error.html")

  it "can turn off uncaught exception handling via Cypress", ->
    r = cy.state("runnable")

    Cypress.once "uncaught:exception", (err, runnable) ->
      expect(err.message).to.include("foo is not defined")
      expect(runnable is r).to.be.true

      return false

    cy.visit("/fixtures/visit_error.html")
