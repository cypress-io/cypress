$ = require("jquery")

_ = Cypress._
Promise = Cypress.Promise
Screenshot = Cypress.Screenshot

getViewportHeight = () ->
  Math.min(cy.state("viewportHeight"), $(cy.state("window")).height())

describe "src/cy/commands/screenshot", ->
  beforeEach ->
    cy.stub(Cypress, "automation").callThrough()

    @serverResult = {
      path: "/path/to/screenshot"
      size: 12
      dimensions: { width: 20, height: 20 }
      multipart: false
      pixelRatio: 1
      takenAt: new Date().toISOString()
      name: "name"
      blackout: [".foo"]
      duration: 100
    }

    @screenshotConfig = {
      capture: "viewport"
      screenshotOnRunFailure: true
      disableTimersAndAnimations: true
      scale: true
      blackout: [".foo"]
    }

  context "runnable:after:run:async", ->
    it "is noop when not isTextTerminal", ->
      ## backup this property so we set it back to whatever
      ## is correct based on what mode we're currently in
      isTextTerminal = Cypress.config("isTextTerminal")

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
      .finally ->
        Cypress.config("isTextTerminal", isTextTerminal)

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

    it "sends before/after events", ->
      Cypress.config("isInteractive", false)
      @screenshotConfig.scale = false
      cy.stub(Screenshot, "getConfig").returns(@screenshotConfig)
      Cypress.automation.withArgs("take:screenshot").resolves(@serverResult)

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

      Cypress.automation.withArgs("take:screenshot").resolves(@serverResult)

      test = {
        id: "123"
        err: new Error
      }

      runnable = cy.state("runnable")

      Cypress.action("runner:runnable:after:run:async", test, runnable)
      .then ->
        expect(Cypress.automation).to.be.calledWith("take:screenshot")
        args = Cypress.automation.withArgs("take:screenshot").args[0][1]
        args = _.omit(args, "padding", "clip", "userClip", "viewport", "takenPaths", "startTime")
        expect(args).to.eql({
          testId: runnable.id
          titles: [
            "src/cy/commands/screenshot",
            "runnable:after:run:async",
            runnable.title
          ]
          capture: "runner"
          simple: true
          testFailure: true
          blackout: []
          scaled: true
        })

    describe "if screenshot has been taken in test", ->
      beforeEach ->
        cy.state("screenshotTaken", true)

      it "sends simple: false", ->
        Cypress.config("isInteractive", false)
        cy.stub(Screenshot, "getConfig").returns(@screenshotConfig)

        Cypress.automation.withArgs("take:screenshot").resolves(@serverResult)

        test = {
          id: "123"
          err: new Error
        }

        runnable = cy.state("runnable")

        Cypress.action("runner:runnable:after:run:async", test, runnable)
        .then ->
          expect(Cypress.automation.withArgs("take:screenshot")).to.be.calledOnce
          args = Cypress.automation.withArgs("take:screenshot").args[0][1]
          args = _.omit(args, "padding", "clip", "userClip", "viewport", "takenPaths", "startTime")
          expect(args).to.eql({
            testId: runnable.id
            titles: [
              "src/cy/commands/screenshot",
              "runnable:after:run:async",
              "if screenshot has been taken in test"
              runnable.title
            ]
            capture: "runner"
            testFailure: true
            simple: false
            scaled: true
            blackout: []
          })

  context "runnable:after:run:async hooks", ->
    beforeEach ->
      Cypress.config("isInteractive", false)
      cy.stub(Screenshot, "getConfig").returns(@screenshotConfig)

      Cypress.automation.withArgs("take:screenshot").resolves(@serverResult)

      test = {
        id: "123"
        err: new Error
      }
      runnable = cy.state("runnable")

      Cypress.action("runner:runnable:after:run:async", test, runnable)
      .then ->
        expect(Cypress.automation).to.be.calledWith("take:screenshot")
        args = Cypress.automation.withArgs("take:screenshot").args[0][1]
        args = _.omit(args, "padding", "clip", "userClip", "viewport", "takenPaths", "startTime")
        expect(args).to.eql({
          testId: runnable.id
          titles: [
            "src/cy/commands/screenshot",
            "runnable:after:run:async hooks",
            "takes screenshot of hook title with test",
            '"before each" hook'
          ]
          capture: "runner"
          simple: true
          testFailure: true
          scaled: true
          blackout: []
        })

    it "takes screenshot of hook title with test", ->

  context "#screenshot", ->
    beforeEach ->
      cy.stub(Screenshot, "getConfig").returns(@screenshotConfig)

    it "sets name to undefined when not passed name", ->
      runnable = cy.state("runnable")
      runnable.title = "foo bar"

      Cypress.automation.withArgs("take:screenshot").resolves(@serverResult)

      cy.screenshot().then ->
        expect(Cypress.automation.withArgs("take:screenshot").args[0][1].name).to.be.undefined

    it "can pass name", ->
      runnable = cy.state("runnable")
      runnable.title = "foo bar"

      Cypress.automation.withArgs("take:screenshot").resolves(@serverResult)

      cy.screenshot("my/file").then ->
        expect(Cypress.automation.withArgs("take:screenshot").args[0][1].name).to.equal("my/file")

    it "calls onBeforeScreenshot callback with documentElement", ->
      Cypress.automation.withArgs("take:screenshot").resolves(@serverResult)
      cy.stub(Screenshot, "onBeforeScreenshot")
      cy.spy(Cypress, "action").log(false)

      cy
      .screenshot("foo")
      .then ->
        expect(Screenshot.onBeforeScreenshot).to.be.calledOnce
        expect(Screenshot.onBeforeScreenshot.firstCall.args[0].get(0)).to.eq(cy.state("document").documentElement)

    it "calls onAfterScreenshot callback with documentElement", ->
      Cypress.automation.withArgs("take:screenshot").resolves(@serverResult)
      cy.stub(Screenshot, "onAfterScreenshot")
      cy.spy(Cypress, "action").log(false)

      cy
      .screenshot("foo")
      .then ->
        expect(Screenshot.onAfterScreenshot).to.be.calledOnce
        expect(Screenshot.onAfterScreenshot.firstCall.args[0].get(0)).to.eq(cy.state("document").documentElement)

    it "pauses then unpauses timers if disableTimersAndAnimations is true", ->
      Cypress.automation.withArgs("take:screenshot").resolves(@serverResult)
      cy.spy(Cypress, "action").log(false)
      cy.spy(cy, "pauseTimers")

      cy
      .screenshot("foo")
      .then ->
        expect(cy.pauseTimers).to.be.calledWith(true)
        expect(cy.pauseTimers).to.be.calledWith(false)

    it "does not pause timers if disableTimersAndAnimations is false", ->
      @screenshotConfig.disableTimersAndAnimations = false
      Cypress.automation.withArgs("take:screenshot").resolves(@serverResult)
      cy.spy(Cypress, "action").log(false)

      cy
      .screenshot("foo")
      .then ->
        expect(Cypress.action.withArgs("cy:pause:timers")).not.to.be.called

    it "sends clip as userClip if specified", ->
      Cypress.automation.withArgs("take:screenshot").resolves(@serverResult)
      cy.spy(Cypress, "action").log(false)
      clip = { width: 100, height: 100, x: 0, y: 0 }

      cy
      .screenshot({ clip })
      .then ->
        expect(Cypress.automation.withArgs("take:screenshot").args[0][1].userClip).to.equal(clip)

    it "sends viewport dimensions of main browser window", ->
      Cypress.automation.withArgs("take:screenshot").resolves(@serverResult)
      cy.spy(Cypress, "action").log(false)

      cy
      .screenshot()
      .then ->
        expect(Cypress.automation.withArgs("take:screenshot").args[0][1].viewport).to.eql({
          width: window.parent.innerWidth
          height: window.parent.innerHeight
        })

    it "can handle window w/length > 1 as a subject", ->
      cy.visit('/fixtures/dom.html')
      cy.window().should('have.length.gt', 1)
      .screenshot()

    describe "before/after events", ->
      beforeEach ->
        Cypress.automation.withArgs("take:screenshot").resolves(@serverResult)
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

      it "always sends scale: true, waitForCommandSynchronization: true, and blackout: [] for non-app captures", ->
        runnable = cy.state("runnable")
        @screenshotConfig.capture = "runner"
        @screenshotConfig.scale = false

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

      it "always sends waitForCommandSynchronization: false for viewport/fullPage captures", ->
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

    describe "capture: fullPage", ->
      beforeEach ->
        Cypress.automation.withArgs("take:screenshot").resolves(@serverResult)
        cy.spy(Cypress, "action").log(false)
        cy.viewport(600, 200)
        cy.visit("/fixtures/screenshots.html")

      it "takes a screenshot for each time it needs to scroll", ->
        cy.screenshot({ capture: "fullPage" })
        .then ->
          expect(Cypress.automation.withArgs("take:screenshot")).to.be.calledThrice

      it "sends capture: fullPage", ->
        cy.screenshot({ capture: "fullPage" })
        .then ->
          take = Cypress.automation.withArgs("take:screenshot")
          expect(take.args[0][1].capture).to.equal("fullPage")
          expect(take.args[1][1].capture).to.equal("fullPage")
          expect(take.args[2][1].capture).to.equal("fullPage")

      it "sends number of current screenshot for each time it needs to scroll", ->
        cy.screenshot({ capture: "fullPage" })
        .then ->
          take = Cypress.automation.withArgs("take:screenshot")
          expect(take.args[0][1].current).to.equal(1)
          expect(take.args[1][1].current).to.equal(2)
          expect(take.args[2][1].current).to.equal(3)

      it "sends total number of screenshots for each time it needs to scroll", ->
        cy.screenshot({ capture: "fullPage" })
        .then ->
          take = Cypress.automation.withArgs("take:screenshot")
          expect(take.args[0][1].total).to.equal(3)
          expect(take.args[1][1].total).to.equal(3)
          expect(take.args[2][1].total).to.equal(3)

      it "scrolls the window to the right place for each screenshot", ->
        win = cy.state("window")
        win.scrollTo(0, 100)
        scrollTo = cy.spy(win, "scrollTo")
        cy.screenshot({ capture: "fullPage" })
        .then ->
          expect(scrollTo.getCall(0).args.join(",")).to.equal("0,0")
          expect(scrollTo.getCall(1).args.join(",")).to.equal("0,200")
          expect(scrollTo.getCall(2).args.join(",")).to.equal("0,400")

      it "scrolls the window back to the original place", ->
        win = cy.state("window")
        win.scrollTo(0, 100)
        scrollTo = cy.spy(win, "scrollTo")
        cy.screenshot({ capture: "fullPage" })
        .then ->
          expect(scrollTo.getCall(3).args.join(",")).to.equal("0,100")

      it "sends the right clip values", ->
        cy.screenshot({ capture: "fullPage" })
        .then ->
          take = Cypress.automation.withArgs("take:screenshot")
          expect(take.args[0][1].clip).to.eql({ x: 0, y: 0, width: 600, height: 200 })
          expect(take.args[1][1].clip).to.eql({ x: 0, y: 0, width: 600, height: 200 })
          expect(take.args[2][1].clip).to.eql({ x: 0, y: 120, width: 600, height: 80 })

    describe "element capture", ->
      beforeEach ->
        Cypress.automation.withArgs("take:screenshot").resolves(@serverResult)
        cy.spy(Cypress, "action").log(false)
        cy.viewport(600, 200)
        cy.visit("/fixtures/screenshots.html")

      it "yields an object with details", ->
        Cypress.automation.withArgs("take:screenshot").resolves(@serverResult)
        cy.stub(Screenshot, "onAfterScreenshot")
        cy.stub(Screenshot, "onBeforeScreenshot")

        cy
        .get(".tall-element")
        .screenshot("name", {
          onBeforeScreenshot: ($el) ->
            expect($el).to.match(".tall-element")

          onAfterScreenshot: ($el, results) ->
            expect($el).to.match(".tall-element")
            expect(results).to.deep.eq(@serverResult)
            expect(results.name).to.eq("name")
            expect(results.blackout).to.eql(@screenshotConfig.blackout)
            expect(results.dimensions).to.eql(@serverResult.dimensions)

            expect(Screenshot.onBeforeScreenshot).to.be.calledOnce
            expect(Screenshot.onBeforeScreenshot.firstCall.args[0]).to.match(".tall-element")

            expect(Screenshot.onAfterScreenshot).not.to.be.called
        })
        .then ->
          expect(Screenshot.onAfterScreenshot).to.be.calledOnce
          expect(Screenshot.onAfterScreenshot.firstCall.args[0]).to.match(".tall-element")

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
        scrollTo = cy.spy(cy.state("window"), "scrollTo")

        cy.get(".tall-element").screenshot()
        .then ->
          expect(scrollTo.getCall(0).args).to.eql([0, 140])

          take = Cypress.automation.withArgs("take:screenshot")
          expect(take.args[0][1].clip).to.eql({ x: 20, y: 0, width: 560, height: 200 })
          expect(take.args[1][1].clip).to.eql({ x: 20, y: 60, width: 560, height: 120 })

      it "sends the right clip values for elements that don't need scrolling", ->
        scrollTo = cy.spy(cy.state("window"), "scrollTo")

        cy.get(".short-element").screenshot()
        .then ->
          # even though we don't need to scroll, the implementation behaviour is to
          # try to scroll until the element is at the top of the viewport.
          expect(scrollTo.getCall(0).args).to.eql([0, 20])

          take = Cypress.automation.withArgs("take:screenshot")
          expect(take.args[0][1].clip).to.eql({ x: 40, y: 0, width: 200, height: 100 })

      it "applies padding to clip values for elements that need scrolling", ->
        padding = 10

        scrollTo = cy.spy(cy.state("window"), "scrollTo")

        cy.get(".tall-element").screenshot({ padding })
        .then ->
          viewportHeight = getViewportHeight()
          expect(scrollTo.getCall(0).args).to.eql([0, 140 - padding])
          expect(scrollTo.getCall(1).args).to.eql([0, 140 + viewportHeight - padding ])

          take = Cypress.automation.withArgs("take:screenshot")

          expect(take.args[0][1].clip).to.eql({
            x: 20 - padding,
            y: 0,
            width: 560 + padding * 2,
            height: viewportHeight
          })
          expect(take.args[1][1].clip).to.eql({
            x: 20 - padding,
            y: 60 - padding,
            width: 560 + padding * 2,
            height: 120 + padding * 2
          })

      it "applies padding to clip values for elements that don't need scrolling", ->
        padding = 10

        scrollTo = cy.spy(cy.state("window"), "scrollTo")

        cy.get(".short-element").screenshot({ padding })
        .then ->
          expect(scrollTo.getCall(0).args).to.eql([0, padding])

          take = Cypress.automation.withArgs("take:screenshot")
          expect(take.args[0][1].clip).to.eql({
            x: 30,
            y: 0,
            width: 220,
            height: 120
          })

      it "works with cy.within()", ->
        cy.get(".short-element").within ->
          cy.screenshot()
        .then ->
          take = Cypress.automation.withArgs("take:screenshot")
          expect(take.args[0][1].clip).to.eql({ x: 40, y: 0, width: 200, height: 100 })

      it "coerces capture option into 'app'", ->
        Cypress.automation.withArgs("take:screenshot").resolves(@serverResult)

        cy.get(".short-element").screenshot({ capture: "runner" })
        .then ->
          expect(Cypress.action.withArgs("cy:before:screenshot").args[0][1].appOnly).to.be.true
          expect(Cypress.automation.withArgs("take:screenshot").args[0][1].capture).to.equal("viewport")

      it "passes through the existing $l subject", ->
        cy
        .get(".short-element").then ($el) ->
          cy
          .get(".short-element")
          .screenshot()
          .then ($el2) =>
            expect($el2.get(0)).to.equal($el.get(0))

      it "passes through window", ->
        cy
        .window()
        .then (win) ->
          cy.wrap(win)
          .screenshot()
          .then (w) ->
            expect(win is w).to.be.true

      it "passes through document", ->
        cy
        .document()
        .then (doc) ->
          cy.wrap(doc)
          .screenshot()
          .then (d) ->
            expect(doc is d).to.be.true

    describe "timeout", ->
      beforeEach ->
        Cypress.automation.withArgs("take:screenshot").resolves(@serverResult)

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

        @assertErrorMessage = (message, done) ->
          cy.on "fail", (err) =>
            lastErr = @lastLog.get("error")
            expect(lastErr.message).to.eq(message)
            done()

        return null

      it "throws if capture is not a string", (done) ->
        cy.on "fail", (err) =>
          lastErr = @lastLog.get("error")
          expect(lastErr.message).to.eq("`cy.screenshot()` `capture` option must be one of the following: `fullPage`, `viewport`, or `runner`. You passed: `true`")
          expect(lastErr.docsUrl).to.eq("https://on.cypress.io/screenshot")

          done()

        cy.screenshot({ capture: true })

      it "throws if capture is not a valid option", (done) ->
        cy.on "fail", (err) =>
          lastErr = @lastLog.get("error")
          expect(lastErr.message).to.eq("`cy.screenshot()` `capture` option must be one of the following: `fullPage`, `viewport`, or `runner`. You passed: `foo`")
          expect(lastErr.docsUrl).to.eq("https://on.cypress.io/screenshot")

          done()

        cy.screenshot({ capture: "foo" })

      it "throws if scale is not a boolean", (done) ->
        cy.on "fail", (err) =>
          lastErr = @lastLog.get("error")
          expect(lastErr.message).to.eq("`cy.screenshot()` `scale` option must be a boolean. You passed: `foo`")
          expect(lastErr.docsUrl).to.eq("https://on.cypress.io/screenshot")

          done()

        cy.screenshot({ scale: "foo" })

      it "throws if disableTimersAndAnimations is not a boolean", (done) ->
        cy.on "fail", (err) =>
          lastErr = @lastLog.get("error")
          expect(lastErr.message).to.eq("`cy.screenshot()` `disableTimersAndAnimations` option must be a boolean. You passed: `foo`")
          expect(lastErr.docsUrl).to.eq("https://on.cypress.io/screenshot")

          done()

        cy.screenshot({ disableTimersAndAnimations: "foo" })

      it "throws if blackout is not an array", (done) ->
        cy.on "fail", (err) =>
          lastErr = @lastLog.get("error")
          expect(lastErr.message).to.eq("`cy.screenshot()` `blackout` option must be an array of strings. You passed: `foo`")
          expect(lastErr.docsUrl).to.eq("https://on.cypress.io/screenshot")
          done()

        cy.screenshot({ blackout: "foo" })

      it "throws if blackout is not an array of strings", (done) ->
        cy.on "fail", (err) =>
          lastErr = @lastLog.get("error")
          expect(lastErr.message).to.eq("`cy.screenshot()` `blackout` option must be an array of strings. You passed: `true`")
          expect(lastErr.docsUrl).to.eq("https://on.cypress.io/screenshot")
          done()

        cy.screenshot({ blackout: [true] })

      it "throws if there is a 0px tall element height", (done) ->
        @assertErrorMessage("`cy.screenshot()` only works with a screenshot area with a height greater than zero.", done)
        cy.visit("/fixtures/screenshots.html")
        cy.get('.empty-element').screenshot()

      it "throws if padding is not a number", (done) ->
        @assertErrorMessage("`cy.screenshot()` `padding` option must be either a number or an array of numbers with a maximum length of 4. You passed: `50px`", done)
        cy.screenshot({ padding: '50px' })

      it "throws if padding is not an array of numbers", (done) ->
        @assertErrorMessage("`cy.screenshot()` `padding` option must be either a number or an array of numbers with a maximum length of 4. You passed: `bad, bad, bad, bad`", done)
        cy.screenshot({ padding: ['bad', 'bad', 'bad', 'bad'] })

      it "throws if padding is not an array with a length between 1 and 4", (done) ->
        @assertErrorMessage("`cy.screenshot()` `padding` option must be either a number or an array of numbers with a maximum length of 4. You passed: `20, 10, 20, 10, 50`", done)
        cy.screenshot({ padding: [20, 10, 20, 10, 50] })

      it "throws if padding is a large negative number that causes a 0px tall element height", (done) ->
        @assertErrorMessage("`cy.screenshot()` only works with a screenshot area with a height greater than zero.", done)
        cy.visit("/fixtures/screenshots.html")
        cy.get('.tall-element').screenshot({ padding: -161 })

      it "throws if clip is not an object", (done) ->
        @assertErrorMessage("`cy.screenshot()` `clip` option must be an object with the keys `{ width, height, x, y }` and number values. You passed: `true`", done)
        cy.screenshot({ clip: true })

      it "throws if clip is lacking proper keys", (done) ->
        @assertErrorMessage("`cy.screenshot()` `clip` option must be an object with the keys `{ width, height, x, y }` and number values. You passed: `{x: 5}`", done)
        cy.screenshot({ clip: { x: 5 } })

      it "throws if clip has extraneous keys", (done) ->
        @assertErrorMessage("`cy.screenshot()` `clip` option must be an object with the keys `{ width, height, x, y }` and number values. You passed: `Object{5}`", done)
        cy.screenshot({ clip: { width: 100, height: 100, x: 5, y: 5, foo: 10 } })

      it "throws if clip has non-number values", (done) ->
        @assertErrorMessage("`cy.screenshot()` `clip` option must be an object with the keys `{ width, height, x, y }` and number values. You passed: `Object{4}`", done)
        cy.screenshot({ clip: { width: 100, height: 100, x: 5, y: "5" } })

      it "throws if element capture with multiple elements", (done) ->
        cy.on "fail", (err) =>
          lastErr = @lastLog.get("error")
          expect(lastErr.message).to.eq("`cy.screenshot()` only works for a single element. You attempted to screenshot 4 elements.")
          expect(lastErr.docsUrl).to.eq("https://on.cypress.io/screenshot")
          done()

        cy.visit("/fixtures/screenshots.html")
        cy.get(".multiple").screenshot()

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
          expect(err.message).to.eq("`cy.screenshot()` timed out waiting `50ms` to complete.")
          expect(err.docsUrl).to.eq("https://on.cypress.io/screenshot")
          done()

        cy.screenshot("foo", {timeout: 50})

    describe ".log", ->
      beforeEach ->
        Cypress.automation.withArgs("take:screenshot").resolves(@serverResult)

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
        Cypress.automation.withArgs("take:screenshot").resolves(@serverResult)

        expected = _.extend({}, @serverResult, @screenshotConfig, {
          Command: "screenshot"
          scaled: true
          duration: "100ms"
        })

        expected = _.omit(expected, "blackout", "dimensions", "screenshotOnRunFailure", "scale", "size")

        cy.screenshot().then =>
          consoleProps = @lastLog.invoke("consoleProps")
          actual = _.omit(consoleProps, "blackout", "dimensions", "size")
          { width, height } = @serverResult.dimensions
          expect(actual).to.eql(expected)
          expect(consoleProps.size).to.eq("12 B")
          expect(consoleProps.blackout).to.eql(@screenshotConfig.blackout)
          expect(consoleProps.dimensions).to.equal("#{width}px x #{height}px")
