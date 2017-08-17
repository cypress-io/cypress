{ _, Promise } = window.testUtils

describe "$Cypress.Cy Screenshot Commands", ->
  enterCommandTestingMode()

  describe "screenshot", ->
    beforeEach ->
      @cy._automateCookies.restore()

    context "test:after:hooks", ->
      beforeEach ->
        @sandbox.spy(@cy, "_takeScreenshot")

      it "no screenshot when no test.err", ->
        hooks = @Cypress.invoke("test:after:hooks", {err: null})

        Promise.all(hooks)
        .then =>
          expect(@cy._takeScreenshot).not.to.be.called

      it "no screenshot when not headless", ->
        @Cypress.isHeadless = false

        hooks = @Cypress.invoke("test:after:hooks", {err: {}})

        Promise.all(hooks)
        .then =>
          expect(@cy._takeScreenshot).not.to.be.called

      it "no screenshot when screenshotOnHeadlessFailure is false", ->
        @sandbox.stub(Cypress, "config").withArgs("screenshotOnHeadlessFailure").returns(false)

        @Cypress.isHeadless = true

        hooks = @Cypress.invoke("test:after:hooks", {err: {}})

        Promise.all(hooks)
        .then =>
          expect(@cy._takeScreenshot).not.to.be.called

      it "takes screenshot if test.err and isHeadless and screenshotOnHeadlessFailure is true", ->
        @sandbox.stub(Cypress, "config").withArgs("screenshotOnHeadlessFailure").returns(true)

        @Cypress.isHeadless = true

        @Cypress.on "take:screenshot", (data, cb) ->
          expect(data).to.deep.eq({
            name: undefined
            titles: ["foo", "bar"]
            testId: 1
          })

          cb({response: {}})

        hooks = @Cypress.invoke("test:after:hooks", {
          err: {}
        }, {
          id: 1
          title: "bar"
          parent: {
            title: "foo"
          }
        })

        Promise.all(hooks)
        .then =>
          expect(@cy._takeScreenshot).to.be.called

    context "#screenshot", ->
      beforeEach ->
        @respondWith = (resp, timeout = 10) =>
          @Cypress.once "take:screenshot", (data, cb) ->
            _.delay ->
              cb(resp)
            , timeout

      it "nulls out current subject", ->
        @respondWith({response: {path: "foo/bar.png", size: "100 kB"}})

        @cy.screenshot().should("be.null")

      it "sets name to undefined when not passed name", (done) ->
        runnable = @cy.privateState("runnable")
        runnable.title = "foo bar"

        @Cypress.once "take:screenshot", (data) ->
          expect(data.name).to.be.undefined
          done()

        @cy.screenshot()

      it "can pass name", (done) ->
        @Cypress.once "take:screenshot", (data) ->
          expect(data.name).to.eq("my/file")
          done()

        @cy.screenshot("my/file")

      describe "cancellation", ->
        it "cancels promise", (done) ->
          ## respond after 50 ms
          @respondWith({}, 50)

          @Cypress.on "take:screenshot", =>
            @cmd = @cy.queue.first()
            @Cypress.abort()

          @cy.on "cancel", (cancelledCmd) =>
            _.delay =>
              expect(cancelledCmd).to.eq(@cmd)
              expect(@cmd.get("subject")).to.be.undefined
              done()
            , 100

          @cy.screenshot()

      describe "timeout", ->
        it "sets timeout to Cypress.config(responseTimeout)", ->
          @Cypress.config("responseTimeout", 2500)

          @respondWith({response: {path: "foo/bar.png", size: "100 kB"}})

          timeout = @sandbox.spy(Promise.prototype, "timeout")

          @cy.screenshot().then ->
            expect(timeout).to.be.calledWith(2500)

        it "can override timeout", ->
          @respondWith({response: {path: "foo/bar.png", size: "100 kB"}})

          timeout = @sandbox.spy(Promise.prototype, "timeout")

          @cy.screenshot({timeout: 1000}).then ->
            expect(timeout).to.be.calledWith(1000)

        it "can override timeout and pass name", ->
          @respondWith({response: {path: "foo/bar.png", size: "100 kB"}})

          timeout = @sandbox.spy(Promise.prototype, "timeout")

          @cy.screenshot("foo", {timeout: 1000}).then ->
            expect(timeout).to.be.calledWith(1000)

        it "clears the current timeout and restores after success", ->
          @respondWith({response: {path: "foo/bar.png", size: "100 kB"}})

          @cy._timeout(100)

          calledTimeout = false
          _clearTimeout = @sandbox.spy(@cy, "_clearTimeout")

          @Cypress.on "take:screenshot", =>
            calledTimeout = true
            expect(_clearTimeout).to.be.calledOnce

          @cy.screenshot().then ->
            expect(calledTimeout).to.be.true
            ## restores the timeout afterwards
            expect(@cy._timeout()).to.eq(100)

      describe "errors", ->
        beforeEach ->
          @allowErrors()

        it "logs once on error", (done) ->
          logs = []

          @Cypress.on "take:screenshot", (data, cb) ->
            cb({__error: "some err message", __name: "foo", __stack: "stack"})

          @Cypress.on "log", (attrs, @log) =>
            logs.push @log

          @cy.on "fail", (err) =>
            expect(logs.length).to.eq(1)
            expect(@log.get("error").message).to.eq "some err message"
            expect(@log.get("error").name).to.eq "foo"
            expect(@log.get("error").stack).to.eq "stack"
            expect(@log.get("error")).to.eq(err)
            done()

          @cy.screenshot()

        it "throws after timing out", (done) ->
          @respondWith([], 1000)

          logs = []

          @Cypress.on "log", (attrs, @log) =>
            logs.push(@log)

          @cy.on "fail", (err) =>
            expect(logs.length).to.eq(1)
            expect(@log.get("error")).to.eq(err)
            expect(@log.get("state")).to.eq("failed")
            expect(@log.get("name")).to.eq("screenshot")
            expect(@log.get("message")).to.eq("foo")
            expect(err.message).to.eq("cy.screenshot() timed out waiting '50ms' to complete.")
            done()

          @cy.screenshot("foo", {timeout: 50})

      describe ".log", ->
        beforeEach ->
          @respondWith({response: {path: "foo/bar.png", size: "100 kB"}})

          @Cypress.on "log", (attrs, @log) =>

        it "can turn off logging", ->
          @cy.screenshot("bar", {log: false}).then ->
            expect(@log).to.be.undefined

        it "ends immediately", ->
          @cy.screenshot().then ->
            expect(@log.get("ended")).to.be.true
            expect(@log.get("state")).to.eq("passed")

        it "snapshots immediately", ->
          @cy.screenshot().then ->
            expect(@log.get("snapshots").length).to.eq(1)
            expect(@log.get("snapshots")[0]).to.be.an("object")

        it "#consoleProps", ->
          @cy.screenshot().then ->
            c = @log.attributes.consoleProps()
            expect(c["Saved"]).to.deep.eq "foo/bar.png"
            expect(c["Size"]).to.eq "100 kB"
