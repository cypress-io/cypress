_ = Cypress._
Promise = Cypress.Promise
Screenshot = Cypress.Screenshot

describe "src/cy/commands/screenshot", ->
  beforeEach ->
    cy.stub(Cypress, "automation").callThrough()

    @screenshotConfig = {
      capture: "app"
      screenshotOnRunFailure: true
      disableTimersAndAnimations: true
      waitForCommandSynchronization: true
      scaleAppCaptures: true
      blackout: []
    }

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

    it "is noop when screenshotOnRunFailure is false", ->
      Cypress.config("isInteractive", false)
      cy.stub(Screenshot, "getConfig").returns({
        screenshotOnRunFailure: false
      })

      cy.spy(Cypress, "action").log(false)

      test = {
        err: new Error
      }

      runnable = cy.state("runnable")

      Cypress.action("runner:runnable:after:run:async", test, runnable)
      .then ->
        expect(Cypress.action).not.to.be.calledWith("cy:test:set:state")
        expect(Cypress.automation).not.to.be.called

    it "takes screenshot when not isInteractive", ->
      Cypress.config("isInteractive", false)
      cy.stub(Screenshot, "getConfig").returns(@screenshotConfig)

      Cypress.automation.withArgs("take:screenshot").resolves({})

      test = {
        id: "123"
        err: new Error
      }

      runnable = cy.state("runnable")

      Cypress.action("runner:runnable:after:run:async", test, runnable)
      .then ->
        expect(Cypress.automation).to.be.calledWith("take:screenshot", {
          name: undefined
          testId: runnable.id
          titles: [
            "src/cy/commands/screenshot",
            "runnable:after:run:async",
            runnable.title
            ]
          appOnly: true
          viewport: {
            width: cy.state("viewportWidth")
            height: cy.state("viewportHeight")
          }
        })

  context "runnable:after:run:async hooks", ->
    beforeEach ->
      Cypress.config("isInteractive", false)
      cy.stub(Screenshot, "getConfig").returns(@screenshotConfig)

      Cypress.automation.withArgs("take:screenshot").resolves({})

      test = {
        id: "123"
        err: new Error
      }
      runnable = cy.state("runnable")

      Cypress.action("runner:runnable:after:run:async", test, runnable)
      .then ->
        expect(Cypress.automation).to.be.calledWith("take:screenshot", {
          name: undefined
          testId: runnable.id
          titles: [
            "src/cy/commands/screenshot",
            "runnable:after:run:async hooks",
            "takes screenshot of hook title with test",
            '"before each" hook'
          ]
          appOnly: true
          viewport: {
            width: cy.state("viewportWidth")
            height: cy.state("viewportHeight")
          }
        })

    it "takes screenshot of hook title with test", ->

  context "#screenshot", ->
    beforeEach ->
      cy.stub(Screenshot, "getConfig").returns(@screenshotConfig)

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
          appOnly: true
          viewport: {
            width: cy.state("viewportWidth")
            height: cy.state("viewportHeight")
          }
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
          appOnly: true
          viewport: {
            width: cy.state("viewportWidth")
            height: cy.state("viewportHeight")
          }
        })

    it "calls beforeScreenshot callback with document", ->
      Cypress.automation.withArgs("take:screenshot").resolves({})
      cy.stub(Screenshot, "callBeforeScreenshot")
      cy.spy(Cypress, "action").log(false)

      cy
      .screenshot("foo")
      .then ->
        expect(Screenshot.callBeforeScreenshot).to.be.calledWith(cy.state("document"))

    it "sends before:screenshot", ->
      Cypress.automation.withArgs("take:screenshot").resolves({})
      cy.spy(Cypress, "action").log(false)
      runnable = cy.state("runnable")

      cy
      .screenshot("foo")
      .then ->
        expect(Cypress.action.withArgs("cy:before:screenshot")).to.be.calledOnce
        expect(Cypress.action.withArgs("cy:before:screenshot").args[0][1]).to.eql({
          id: runnable.id
          isOpen: true
          appOnly: true
          scale: true
          waitForCommandSynchronization: false
          disableTimersAndAnimations: true
          blackout: []
        })

    it "sends after:screenshot", ->
      Cypress.automation.withArgs("take:screenshot").resolves({})
      cy.spy(Cypress, "action").log(false)
      runnable = cy.state("runnable")

      cy
      .screenshot("foo")
      .then ->
        expect(Cypress.action.withArgs("cy:after:screenshot")).to.be.calledOnce
        expect(Cypress.action.withArgs("cy:after:screenshot").args[0][1]).to.eql({
          id: runnable.id
          isOpen: false
          appOnly: true
          scale: true
          disableTimersAndAnimations: true
          blackout: []
        })

    it "calls afterScreenshot callback with document", ->
      Cypress.automation.withArgs("take:screenshot").resolves({})
      cy.stub(Screenshot, "callAfterScreenshot")
      cy.spy(Cypress, "action").log(false)

      cy
      .screenshot("foo")
      .then ->
        expect(Screenshot.callAfterScreenshot).to.be.calledWith(cy.state("document"))

    it "pauses then unpauses timers if disableTimersAndAnimations is true", ->
      Cypress.automation.withArgs("take:screenshot").resolves({})
      cy.spy(Cypress, "action").log(false)
      cy.spy(cy, "pauseTimers")

      cy
      .screenshot("foo")
      .then ->
        expect(cy.pauseTimers).to.be.calledWith(true)
        expect(cy.pauseTimers).to.be.calledWith(false)

    it "does not pause timers if disableTimersAndAnimations is false", ->
      @screenshotConfig.disableTimersAndAnimations = false
      Cypress.automation.withArgs("take:screenshot").resolves({})
      cy.spy(Cypress, "action").log(false)

      cy
      .screenshot("foo")
      .then ->
        expect(Cypress.action.withArgs("cy:pause:timers")).not.to.be.called

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

        @assertErrorMessage = (message, done) =>
          cy.on "fail", (err) =>
            expect(@lastLog.get("error").message).to.eq(message)
            done()

        return null

      it "throws if capture is not a string", (done) ->
        @assertErrorMessage("cy.screenshot() 'capture' option must be one of the following: 'app' or 'runner'. You passed: true", done)
        cy.screenshot({ capture: true })

      it "throws if capture is not a valid option", (done) ->
        @assertErrorMessage("cy.screenshot() 'capture' option must be one of the following: 'app' or 'runner'. You passed: foo", done)
        cy.screenshot({ capture: "foo" })

      it "throws if waitForCommandSynchronization is not a boolean", (done) ->
        @assertErrorMessage("cy.screenshot() 'waitForCommandSynchronization' option must be a boolean. You passed: foo", done)
        cy.screenshot({ waitForCommandSynchronization: "foo" })

      it "throws if scaleAppCaptures is not a boolean", (done) ->
        @assertErrorMessage("cy.screenshot() 'scaleAppCaptures' option must be a boolean. You passed: foo", done)
        cy.screenshot({ scaleAppCaptures: "foo" })

      it "throws if disableTimersAndAnimations is not a boolean", (done) ->
        @assertErrorMessage("cy.screenshot() 'disableTimersAndAnimations' option must be a boolean. You passed: foo", done)
        cy.screenshot({ disableTimersAndAnimations: "foo" })

      it "throws if blackout is not an array", (done) ->
        @assertErrorMessage("cy.screenshot() 'blackout' option must be an array of strings. You passed: foo", done)
        cy.screenshot({ blackout: "foo" })

      it "throws if blackout is not an array of strings", (done) ->
        @assertErrorMessage("cy.screenshot() 'blackout' option must be an array of strings. You passed: true", done)
        cy.screenshot({ blackout: [true] })

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
