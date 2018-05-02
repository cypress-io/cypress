$ = require("jquery")

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
      fullPage: false
      blackout: [".foo"]
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

    it "sends before:screenshot event", ->
      Cypress.config("isInteractive", false)
      @screenshotConfig.scaleAppCaptures = false
      cy.stub(Screenshot, "getConfig").returns(@screenshotConfig)

      Cypress.automation.withArgs("take:screenshot").resolves({})

      cy.stub(Cypress, "action").log(false)
      .callThrough()
      .withArgs("cy:before:screenshot")
      .yieldsAsync()

      test = { id: "123", err: new Error() }
      runnable = cy.state("runnable")

      Cypress.action("runner:runnable:after:run:async", test, runnable)
      .then ->
        expect(Cypress.action).to.be.calledWith("cy:before:screenshot", {
          id: runnable.id
          isOpen: true
          appOnly: false
          scale: true
          waitForCommandSynchronization: true
          disableTimersAndAnimations: true
          blackout: []
        })

    it "sends after:screenshot event", ->
      Cypress.config("isInteractive", false)
      @screenshotConfig.scaleAppCaptures = false
      cy.stub(Screenshot, "getConfig").returns(@screenshotConfig)

      Cypress.automation.withArgs("take:screenshot").resolves({})

      cy.stub(Cypress, "action").log(false)
      .callThrough()
      .withArgs("cy:after:screenshot")
      .yieldsAsync()

      test = { id: "123", err: new Error() }
      runnable = cy.state("runnable")

      Cypress.action("runner:runnable:after:run:async", test, runnable)
      .then ->
        expect(Cypress.action).to.be.calledWith("cy:after:screenshot", {
          id: runnable.id
          isOpen: false
          appOnly: false
          scale: true
          waitForCommandSynchronization: true
          disableTimersAndAnimations: true
          blackout: []
        })

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
        expect(Cypress.automation).to.be.calledWith("take:screenshot")
        args = Cypress.automation.withArgs("take:screenshot").args[0][1]
        expect(_.omit(args, "clip")).to.eql({
          testId: runnable.id
          titles: [
            "src/cy/commands/screenshot",
            "runnable:after:run:async",
            runnable.title
          ]
          capture: "runner"
        })
        expect(args.clip.x).to.equal(0)
        expect(args.clip.y).to.equal(0)
        expect(args.clip.width).to.be.gt(0)
        expect(args.clip.height).to.be.gt(0)

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
        expect(Cypress.automation).to.be.calledWith("take:screenshot")
        args = Cypress.automation.withArgs("take:screenshot").args[0][1]
        expect(_.omit(args, "clip")).to.eql({
          testId: runnable.id
          titles: [
            "src/cy/commands/screenshot",
            "runnable:after:run:async hooks",
            "takes screenshot of hook title with test",
            '"before each" hook'
          ]
          capture: "runner"
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
        expect(Cypress.automation.withArgs("take:screenshot").args[0][1].name).to.be.undefined

    it "can pass name", ->
      runnable = cy.state("runnable")
      runnable.title = "foo bar"

      Cypress.automation.withArgs("take:screenshot").resolves({path: "foo/bar.png", size: "100 kB"})

      cy.screenshot("my/file").then ->
        expect(Cypress.automation.withArgs("take:screenshot").args[0][1].name).to.equal("my/file")

    it "calls beforeScreenshot callback with document", ->
      Cypress.automation.withArgs("take:screenshot").resolves({})
      cy.stub(Screenshot, "callBeforeScreenshot")
      cy.spy(Cypress, "action").log(false)

      cy
      .screenshot("foo")
      .then ->
        expect(Screenshot.callBeforeScreenshot).to.be.calledWith(cy.state("document"))

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

    describe "before/after events", ->
      beforeEach ->
        Cypress.automation.withArgs("take:screenshot").resolves({})
        cy.spy(Cypress, "action").log(false)

      it "sends before:screenshot", ->
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
            blackout: [".foo"]
          })

      it "sends after:screenshot", ->
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
            waitForCommandSynchronization: false
            disableTimersAndAnimations: true
            blackout: [".foo"]
          })

      it "always sends scale: true and blackout: [] for non-app captures", ->
        runnable = cy.state("runnable")
        @screenshotConfig.capture = "runner"
        @screenshotConfig.scaleAppCaptures = false

        cy
        .screenshot("foo")
        .then ->
          expect(Cypress.action.withArgs("cy:before:screenshot").args[0][1]).to.eql({
            id: runnable.id
            isOpen: true
            appOnly: false
            scale: true
            waitForCommandSynchronization: true
            disableTimersAndAnimations: true
            blackout: []
          })

      it "always sends waitForCommandSynchronization: false for app captures", ->
        runnable = cy.state("runnable")
        @screenshotConfig.waitForAnimations = true

        cy
        .screenshot("foo")
        .then ->
          expect(Cypress.action.withArgs("cy:before:screenshot").args[0][1]).to.eql({
            id: runnable.id
            isOpen: true
            appOnly: true
            scale: true
            waitForCommandSynchronization: false
            disableTimersAndAnimations: true
            blackout: [".foo"]
          })

    describe "capture: fullpage", ->
      beforeEach ->
        Cypress.automation.withArgs("take:screenshot").resolves({})
        cy.spy(Cypress, "action").log(false)
        cy.viewport(600, 200)
        cy.visit("/fixtures/screenshots.html")

      it "takes a screenshot for each time it needs to scroll", ->
        cy.screenshot({ capture: "fullpage" })
        .then ->
          expect(Cypress.automation.withArgs("take:screenshot")).to.be.calledThrice

      it "sends capture: fullpage", ->
        cy.screenshot({ capture: "fullpage" })
        .then ->
          take = Cypress.automation.withArgs("take:screenshot")
          expect(take.args[0][1].capture).to.equal("fullpage")
          expect(take.args[1][1].capture).to.equal("fullpage")
          expect(take.args[2][1].capture).to.equal("fullpage")

      it "sends number of current screenshot for each time it needs to scroll", ->
        cy.screenshot({ capture: "fullpage" })
        .then ->
          take = Cypress.automation.withArgs("take:screenshot")
          expect(take.args[0][1].current).to.equal(1)
          expect(take.args[1][1].current).to.equal(2)
          expect(take.args[2][1].current).to.equal(3)

      it "sends total number of screenshots for each time it needs to scroll", ->
        cy.screenshot({ capture: "fullpage" })
        .then ->
          take = Cypress.automation.withArgs("take:screenshot")
          expect(take.args[0][1].total).to.equal(3)
          expect(take.args[1][1].total).to.equal(3)
          expect(take.args[2][1].total).to.equal(3)

      it "scrolls the window to the right place for each screenshot", ->
        win = cy.state("window")
        win.scrollTo(0, 100)
        scrollTo = cy.spy(win, "scrollTo")
        cy.screenshot({ capture: "fullpage" })
        .then ->
          expect(scrollTo.getCall(0).args.join(",")).to.equal("0,0")
          expect(scrollTo.getCall(1).args.join(",")).to.equal("0,200")
          expect(scrollTo.getCall(2).args.join(",")).to.equal("0,400")

      it "scrolls the window back to the original place", ->
        win = cy.state("window")
        win.scrollTo(0, 100)
        scrollTo = cy.spy(win, "scrollTo")
        cy.screenshot({ capture: "fullpage" })
        .then ->
          expect(scrollTo.getCall(3).args.join(",")).to.equal("0,100")

      it "sends the right clip values", ->
        cy.screenshot({ capture: "fullpage" })
        .then ->
          take = Cypress.automation.withArgs("take:screenshot")
          expect(take.args[0][1].clip).to.eql({ x: 0, y: 0, width: 600, height: 200 })
          expect(take.args[1][1].clip).to.eql({ x: 0, y: 0, width: 600, height: 200 })
          expect(take.args[2][1].clip).to.eql({ x: 0, y: 120, width: 600, height: 80 })

    describe "element capture", ->
      beforeEach ->
        Cypress.automation.withArgs("take:screenshot").resolves({})
        cy.spy(Cypress, "action").log(false)
        cy.viewport(600, 200)
        cy.visit("/fixtures/screenshots.html")

      it "takes a screenshot for each time it needs to scroll", ->
        cy.get(".tall-element").screenshot()
        .then ->
          expect(Cypress.automation.withArgs("take:screenshot")).to.be.calledTwice

      it "sends number of current screenshot for each time it needs to scroll", ->
        cy.get(".tall-element").screenshot()
        .then ->
          take = Cypress.automation.withArgs("take:screenshot")
          expect(take.args[0][1].current).to.equal(1)
          expect(take.args[1][1].current).to.equal(2)

      it "sends total number of screenshots for each time it needs to scroll", ->
        cy.get(".tall-element").screenshot()
        .then ->
          take = Cypress.automation.withArgs("take:screenshot")
          expect(take.args[0][1].total).to.equal(2)
          expect(take.args[1][1].total).to.equal(2)

      it "scrolls the window to the right place for each screenshot", ->
        win = cy.state("window")
        win.scrollTo(0, 100)
        scrollTo = cy.spy(win, "scrollTo")
        cy.get(".tall-element").screenshot()
        .then ->
          expect(scrollTo.getCall(0).args.join(",")).to.equal("0,140")
          expect(scrollTo.getCall(1).args.join(",")).to.equal("0,340")

      it "scrolls the window back to the original place", ->
        win = cy.state("window")
        win.scrollTo(0, 100)
        scrollTo = cy.spy(win, "scrollTo")
        cy.get(".tall-element").screenshot()
        .then ->
          expect(scrollTo.getCall(2).args.join(",")).to.equal("0,100")

      it "sends the right clip values for elements that need scrolling", ->
        cy.get(".tall-element").screenshot()
        .then ->
          take = Cypress.automation.withArgs("take:screenshot")
          expect(take.args[0][1].clip).to.eql({ x: 20, y: 0, width: 560, height: 200 })
          expect(take.args[1][1].clip).to.eql({ x: 20, y: 60, width: 560, height: 120 })

      it "sends the right clip values for elements that don't need scrolling", ->
        cy.get(".short-element").screenshot()
        .then ->
          take = Cypress.automation.withArgs("take:screenshot")
          expect(take.args[0][1].clip).to.eql({ x: 40, y: 0, width: 200, height: 100 })

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
        @assertErrorMessage("cy.screenshot() 'capture' option must be one of the following: 'app', 'runner', or 'fullpage'. You passed: true", done)
        cy.screenshot({ capture: true })

      it "throws if capture is not a valid option", (done) ->
        @assertErrorMessage("cy.screenshot() 'capture' option must be one of the following: 'app', 'runner', or 'fullpage'. You passed: foo", done)
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
