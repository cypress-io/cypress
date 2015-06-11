describe "$Cypress.Cy Errors Extensions", ->
  before ->
    @iframe = $("<iframe />").appendTo $("body")

  beforeEach ->
    @Cypress = $Cypress.create()
    @cy      = $Cypress.Cy.create(@Cypress, @iframe)

    ## make sure not to accidentally return
    ## cy else mocha will queue up a .then()
    null

  after ->
    @iframe.remove()

  it "adds 4 methods", ->
    _.each ["cypressErr", "throwErr", "commandErr", "fail"], (name) =>
      expect(@cy[name]).to.be.a("function")

  context "#throwErr", ->
    it "has an err.name of CypressError", ->
      try
        @cy.throwErr("foo")
      catch e
        expect(e.name).to.eq "CypressError"

  context "#fail", ->
    it "triggers fail with err and runnable", ->
      trigger = @sandbox.spy @Cypress, "trigger"

      err = new Error
      err.onFail = ->
      @cy.private("runnable", {})
      @cy.fail(err)

      expect(trigger).to.be.calledWith "fail", err, {}

    it "calls commandErr when err has no onFail"

    it "calls err.onFail when it exists"

    # it "passes err to runner.uncaught", ->
    #   uncaught = @allowErrors()

    #   err = new Error
    #   @cy.fail(err)
    #   expect(uncaught).to.be.calledWith err

    # it "triggers 'fail' on error", (done) ->
    #   @allowErrors()

    #   @cy.on "command:start", ->
    #     @_timeout(100)

    #   @cy.on "fail", -> done()

    #   @cy.get("foo")

    # context "command error bubbling", ->
    #   beforeEach ->
    #     @uncaught = @allowErrors()

    #   it "does not emit command:end when a command fails", (done) ->
    #     @cy.then ->
    #       trigger = @sandbox.spy @cy, "trigger"

    #       _.defer ->
    #         expect(trigger).not.to.be.calledWith("command:end")
    #         done()
    #       throw new Error("err")

    #   it "emits fail and passes up err", (done) ->
    #     err = null
    #     @cy.then ->
    #       err = new Error("err")
    #       throw err

    #     @cy.on "fail", (e) ->
    #       expect(e).to.eq err
    #       done()

    #   it "passes the full stack trace to mocha", (done) ->
    #     err = null
    #     @cy.then ->
    #       err = new Error("err")
    #       throw err

    #     @cy.on "fail", (e) =>
    #       expect(@uncaught).to.be.calledWith(err)
    #       done()
