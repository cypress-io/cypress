{ $, _ } = window.testUtils

describe "$Cypress.Cy Errors Extensions", ->
  before ->
    @iframe = $("<iframe />").appendTo $("body")

  beforeEach ->
    @Cypress = $Cypress.create({loadModules: true})
    @cy      = $Cypress.Cy.create(@Cypress, @iframe)

    ## make sure not to accidentally return
    ## cy else mocha will queue up a .then()
    null

  after ->
    @iframe.remove()

  it "adds 2 methods", ->
    _.each ["commandErr", "fail"], (name) =>
      expect(@cy[name]).to.be.a("function")

  context "#endedEarlyErr", ->
    beforeEach ->
      @commands = @cy.queue
      @commands.splice(0, 1, {name: "get", args: ["form:first"]})
      @commands.splice(1, 2, {name: "find", args: ["button"]})
      @commands.splice(2, 3, {name: "click", args: [{multiple: true}]})
      @commands.splice(3, 4, {name: "then", args: [->]})
      @commands.splice(4, 5, {name: "get", args: ["body", {timeout: 1000}]})
      @commands.splice(5, 6, {name: "should", args: ["have.prop", "class", "active"]})

    it "displays commands which have not yet run", (done) ->
      @cy.on "fail", (err) ->
        expect(err.message).to.include("The test has finished but Cypress still has commands in its queue.")
        expect(err.message).to.include("https://on.cypress.io/command-queue-ended-early")
        done()

      @cy.endedEarlyErr(1)

  context "#fail", ->
    it "triggers fail with err and runnable", ->
      trigger = @sandbox.spy @Cypress, "trigger"

      err = new Error
      err.onFail = ->
      @cy.state("runnable", {})
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
    #     cy.timeout(100)

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
