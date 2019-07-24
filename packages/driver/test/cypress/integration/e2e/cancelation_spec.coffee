Promise = Cypress.Promise

previousTestWasCanceled = false
calledAfterDoneEarly = false

describe "canceling command queues", ->
  it "Cypress.stop()", (done) ->
    cy.stub(Cypress.runner, "stop")

    calledAfterStop = false

    cy.once "stop", ->
      expect(cy.state("promise").isCancelled()).to.be.true

      Promise
      .delay(50)
      .then ->
        expect(calledAfterStop).to.be.false
        done()

    cy.wrap(null).then ->
      Cypress.stop()

      null
    .then ->
      ## should not be called
      calledAfterStop = true

  it "done early", (done) ->
    cy.once "command:start", (cmd) ->
      cancel = cy.state("promise").cancel
      cy.state("promise").cancel = ->
        previousTestWasCanceled = true
        cancel.apply(@, arguments)

      done()

    cy.wrap(null).then ->
      calledAfterDoneEarly = true

  it "verifies the previous test worked", ->
    expect(previousTestWasCanceled).to.be.true
    expect(calledAfterDoneEarly).to.be.false

  it "command failure", (done) ->
    ## make sure there are no unhandled rejections
    Promise.onPossiblyUnhandledRejection(done)

    calledAfterFailure = false

    cy.on "fail", ->
      Promise
      .delay(50)
      .then ->
        expect(cy.isStopped()).to.be.true ## make sure we ran our cleanup routine
        expect(calledAfterFailure).to.be.false
        done()

    cy.wrap(null).then ->
      throw new Error("foo")
    .then ->
      calledAfterFailure = true
