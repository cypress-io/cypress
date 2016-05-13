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

  it "adds 4 methods", ->
    _.each ["cypressErr", "throwErr", "commandErr", "fail"], (name) =>
      expect(@cy[name]).to.be.a("function")

  context "#throwErr", ->
    beforeEach ->
      $Cypress.ErrorMessages.__test_errors = {
        simple: "This is a simple error message"
        with_args: "The has args like '{{foo}}' and {{bar}}"
        with_multi_args: "This has args like '{{foo}}' and {{bar}}, and '{{foo}}' is used twice"
      }

    describe "when error message path does not exist", ->

      it "has an err.name of InternalError", ->
        try
          @cy.throwErr("not.there")
        catch e
          expect(e.name).to.eq "InternalError"

      it "has the right message", ->
        try
          @cy.throwErr("not.there")
        catch e
          expect(e.message).to.include "Error message path 'not.there' does not exist"

    describe "when error message path exists", ->

      it "has an err.name of CypressError", ->
        try
          @cy.throwErr("__test_errors.simple")
        catch e
          expect(e.name).to.eq "CypressError"

      it "has the right message", ->
        try
          @cy.throwErr("__test_errors.simple")
        catch e
          expect(e.message).to.include "This is a simple error message"

    describe "when args are provided for the error", ->

      it "uses them in the error message", ->
        try
          @cy.throwErr("__test_errors.with_args", {
            args: { foo: "foo", bar: ["bar", "qux"]  }
          })
        catch e
          expect(e.message).to.include "The has args like 'foo' and bar,qux"

    describe "when args are provided for the error and some are used multiple times in message", ->

      it "uses them in the error message", ->
        try
          @cy.throwErr("__test_errors.with_multi_args", {
            args: { foo: "foo", bar: ["bar", "qux"]  }
          })
        catch e
          expect(e.message).to.include "This has args like 'foo' and bar,qux, and 'foo' is used twice"

    describe "when onFail is provided as a function", ->

      it "attaches the function to the error", ->
        onFail = ->
        try
          @cy.throwErr("window.iframe_undefined", { onFail })
        catch e
          expect(e.onFail).to.equal onFail

    describe "when onFail is provided as a command", ->

      it "attaches the handler to the error", ->
        command = { error: @sandbox.spy() }
        try
          @cy.throwErr("window.iframe_undefined", { onFail: command })
        catch e
          e.onFail("the error")
          expect(command.error).to.be.calledWith("the error")

  context "#throwUnexpectedErr", ->

    it "throws the error as sent", ->
      try
        @cy.throwUnexpectedErr("Something unexpected")
      catch e
        expect(e.message).to.include "Something unexpected"
        expect(e.name).to.eq "CypressError"

  context "#endedEarlyErr", ->
    beforeEach ->
      @commands = @cy.commands
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
