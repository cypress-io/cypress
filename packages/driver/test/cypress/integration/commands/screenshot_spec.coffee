_ = Cypress._
Promise = Cypress.Promise

describe "src/cy/commands/screenshot", ->
  beforeEach ->
    cy.stub(Cypress, "automation").callThrough()

  context "runnable:after:run:async", ->
    it "is noop when not isTextTerminal", ->
      Cypress.config("isTextTerminal", false)

      cy.spy(Cypress, "action").log(false)

      test = {
        err: new Error
      }

      runnable = cy.state("runnable")

      Cypress.action("runner:runnable:after:run:async", test, runnable)
      .then ->
        expect(Cypress.action).not.to.be.calledWith("cy:test:set:state")
        expect(Cypress.automation).not.to.be.called

    it "is noop when no test.err", ->
      Cypress.config("isInteractive", false)

      cy.spy(Cypress, "action").log(false)

      test = {}

      runnable = cy.state("runnable")

      Cypress.action("runner:runnable:after:run:async", test, runnable)
      .then ->
        expect(Cypress.action).not.to.be.calledWith("cy:test:set:state")
        expect(Cypress.automation).not.to.be.called

    it "is noop when screenshotOnHeadlessFailure is false", ->
      Cypress.config("isInteractive", false)
      Cypress.config("screenshotOnHeadlessFailure", false)

      cy.spy(Cypress, "action").log(false)

      test = {
        err: new Error
      }

      runnable = cy.state("runnable")

      Cypress.action("runner:runnable:after:run:async", test, runnable)
      .then ->
        expect(Cypress.action).not.to.be.calledWith("cy:test:set:state")
        expect(Cypress.automation).not.to.be.called

    it "sets test state and takes screenshot when not isInteractive", ->
      Cypress.config("isInteractive", false)

      Cypress.automation.withArgs("take:screenshot").resolves({})

      cy.stub(Cypress, "action").log(false)
      .callThrough()
      .withArgs("cy:test:set:state")
      .yieldsAsync()

      test = {
        err: new Error
      }

      runnable = cy.state("runnable")

      Cypress.action("runner:runnable:after:run:async", test, runnable)
      .then ->
        ## this should mutate this property
        expect(test.isOpen).to.be.true

        expect(Cypress.action).to.be.calledWith("cy:test:set:state", test)
        expect(Cypress.automation).to.be.calledWith("take:screenshot", {
          name: undefined
          testId: runnable.id
          titles: [
            "src/cy/commands/screenshot",
            "runnable:after:run:async",
            runnable.title
          ]
        })

  context "runnable:after:run:async hooks", ->
    beforeEach ->
      Cypress.config("isInteractive", false)

      Cypress.automation.withArgs("take:screenshot").resolves({})

      cy.stub(Cypress, "action").log(false)
      .callThrough()
      .withArgs("cy:test:set:state")
      .yieldsAsync()

      test = {
        err: new Error
      }

      runnable = cy.state("runnable")

      Cypress.action("runner:runnable:after:run:async", test, runnable)
      .then ->
        ## this should mutate this property
        expect(test.isOpen).to.be.true

        expect(Cypress.action).to.be.calledWith("cy:test:set:state", test)
        expect(Cypress.automation).to.be.calledWith("take:screenshot", {
          name: undefined
          testId: runnable.id
          titles: [
            "src/cy/commands/screenshot",
            "runnable:after:run:async hooks",
            "takes screenshot of hook title with test",
            '"before each" hook'
          ]
        })

    it "takes screenshot of hook title with test", ->

  context "#screenshot", ->
    it "nulls out current subject", ->
      Cypress.automation.withArgs("take:screenshot").resolves({path: "foo/bar.png", size: "100 kB"})

      cy.screenshot().should("be.null")

    it "sets name to undefined when not passed name", ->
      runnable = cy.state("runnable")
      runnable.title = "foo bar"

      Cypress.automation.withArgs("take:screenshot").resolves({path: "foo/bar.png", size: "100 kB"})

      cy.screenshot().then ->
        expect(Cypress.automation).to.be.calledWith("take:screenshot", {
          name: undefined
          testId: runnable.id
          titles: [
            "src/cy/commands/screenshot",
            "#screenshot",
            "foo bar"
          ]
        })

    it "can pass name", ->
      runnable = cy.state("runnable")
      runnable.title = "foo bar"

      Cypress.automation.withArgs("take:screenshot").resolves({path: "foo/bar.png", size: "100 kB"})

      cy.screenshot("my/file").then ->
        expect(Cypress.automation).to.be.calledWith("take:screenshot", {
          name: "my/file"
          testId: runnable.id
          titles: [
            "src/cy/commands/screenshot",
            "#screenshot",
            "foo bar"
          ]
        })

    it "opens and closes the test", ->
      runnable = cy.state("runnable")

      Cypress.automation.withArgs("take:screenshot").resolves({})

      testSetState = cy.spy(Cypress, "action").log(false).withArgs("cy:test:set:state")

      cy
      .screenshot("foo")
      .then ->
        expect(testSetState.firstCall).to.be.calledWith("cy:test:set:state", {
          id: runnable.id
          isOpen: true
        })

        expect(testSetState.secondCall).to.be.calledWith("cy:test:set:state", {
          id: runnable.id
          isOpen: false
        })

    describe "timeout", ->
      beforeEach ->
        Cypress.automation.withArgs("take:screenshot").resolves({path: "foo/bar.png", size: "100 kB"})

      it "sets timeout to Cypress.config(responseTimeout)", ->
        Cypress.config("responseTimeout", 2500)

        timeout = cy.spy(Promise.prototype, "timeout")

        cy.screenshot().then ->
          expect(timeout).to.be.calledWith(2500)

      it "can override timeout", ->
        timeout = cy.spy(Promise.prototype, "timeout")

        cy.screenshot({timeout: 1000}).then ->
          expect(timeout).to.be.calledWith(1000)

      it "can override timeout and pass name", ->
        timeout = cy.spy(Promise.prototype, "timeout")

        cy.screenshot("foo", {timeout: 1000}).then ->
          expect(timeout).to.be.calledWith(1000)

      it "clears the current timeout and restores after success", ->
        cy.timeout(100)

        cy.spy(cy, "clearTimeout")

        cy.screenshot().then ->
          expect(cy.clearTimeout).to.be.calledWith("take:screenshot")

          ## restores the timeout afterwards
          expect(cy.timeout()).to.eq(100)

    describe "errors", ->
      beforeEach ->
        Cypress.config("defaultCommandTimeout", 50)

        @logs = []

        cy.on "log:added", (attrs, log) =>
          if attrs.name is "screenshot"
            @lastLog = log
            @logs.push(log)

        return null

      it "logs once on error", (done) ->
        error = new Error("some error")
        error.name = "foo"
        error.stack = "stack"

        Cypress.automation.withArgs("take:screenshot").rejects(error)

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error").message).to.eq error.message
          expect(lastLog.get("error").name).to.eq error.name
          expect(lastLog.get("error").stack).to.eq error.stack
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy.screenshot()

      it "throws after timing out", (done) ->
        Cypress.automation.withArgs("take:screenshot").resolves(Promise.delay(1000))

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          expect(lastLog.get("state")).to.eq("failed")
          expect(lastLog.get("name")).to.eq("screenshot")
          expect(lastLog.get("message")).to.eq("foo")
          expect(err.message).to.eq("cy.screenshot() timed out waiting '50ms' to complete.")
          done()

        cy.screenshot("foo", {timeout: 50})

    describe ".log", ->
      beforeEach ->
        Cypress.automation.withArgs("take:screenshot").resolves({path: "foo/bar.png", size: "100 kB"})

        cy.on "log:added", (attrs, log) =>
          if attrs.name is "screenshot"
            @lastLog = log

        return null

      it "can turn off logging", ->
        cy.screenshot("bar", {log: false}).then ->
          expect(@lastLog).to.be.undefined

      it "ends immediately", ->
        cy.screenshot().then ->
          lastLog = @lastLog

          expect(lastLog.get("ended")).to.be.true
          expect(lastLog.get("state")).to.eq("passed")

      it "snapshots immediately", ->
        cy.screenshot().then ->
          lastLog = @lastLog

          expect(lastLog.get("snapshots").length).to.eq(1)
          expect(lastLog.get("snapshots")[0]).to.be.an("object")

      it "#consoleProps", ->
        cy.screenshot().then ->
          c = @lastLog.invoke("consoleProps")
          expect(c["Saved"]).to.deep.eq "foo/bar.png"
          expect(c["Size"]).to.eq "100 kB"
