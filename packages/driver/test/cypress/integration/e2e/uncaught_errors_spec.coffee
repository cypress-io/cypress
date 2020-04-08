_ = Cypress._

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
      try
        expect(err.name).to.eq("Uncaught ReferenceError")
        expect(err.message).to.include("foo is not defined")
        expect(err.message).to.include("This error originated from your application code, not from Cypress.")
        expect(err.message).to.not.include("https://on.cypress.io/uncaught-exception-from-application")
        expect(err.docsUrl).to.eq("https://on.cypress.io/uncaught-exception-from-application")
        expect(runnable is r).to.be.true
        return false
      catch err2
        return true

    cy.visit("/fixtures/visit_error.html")

  it "can turn off uncaught exception handling via Cypress", ->
    r = cy.state("runnable")

    Cypress.once "uncaught:exception", (err, runnable) ->
      expect(err.message).to.include("foo is not defined")
      expect(runnable is r).to.be.true

      return false

    cy.visit("/fixtures/visit_error.html")

  it "logs click error once", (done) ->
    uncaught = false

    cy.on "uncaught:exception", ->
      uncaught = true

      return true

    cy.on "fail", (err) =>
      lastLog = @lastLog

      expect(@logs.length).to.eq(4)
      expect(uncaught).to.be.true
      expect(err.message).to.include("uncaught click error")
      expect(lastLog.get("name")).to.eq("click")
      expect(lastLog.get("error")).to.eq(err)

      done()

    cy
      .visit("/fixtures/jquery.html")
      .window().then (win) ->
        win.$("button:first").on "click", ->
          throw new Error("uncaught click error")
      .get("button:first").click()

  it "logs error on page load when new page has uncaught exception", (done) ->
    uncaught = false

    cy.on "uncaught:exception", ->
      uncaught = true

      return true

    cy.on "fail", (err) =>
      click = _.find @logs, (log) ->
        log.get("name") is "click"

      ## visit, window, contains, click, page loading, new url
      expect(@logs.length).to.eq(6)
      expect(uncaught).to.be.true
      expect(err.message).to.include("foo is not defined")
      expect(click.get("name")).to.eq("click")
      expect(click.get("error")).to.eq(err)

      done()

    cy
      .visit("/fixtures/jquery.html")
      .window().then (win) ->
        win.$("<a href='/fixtures/visit_error.html'>visit</a>")
        .appendTo(win.document.body)

      .contains("visit").click()

  ## https://github.com/cypress-io/cypress/issues/987
  it 'global onerror', (done) ->
    cy.once 'uncaught:exception', (err) ->
      expect(err.stack).contain('foo is not defined')
      expect(err.stack).contain('one')
      expect(err.stack).contain('two')
      expect(err.stack).contain('three')
      done()

    cy.visit('/fixtures/global-error.html')
