_ = Cypress._
Promise = Cypress.Promise

describe "src/cy/commands/exec", ->
  okResponse = { code: 0 }

  context "#exec", ->
    beforeEach ->
      Cypress.config("execTimeout", 2500)

      ## call through normally on everything
      cy.stub(Cypress, "backend").callThrough()

    it "triggers 'exec' with the right options", ->
      Cypress.backend.resolves(okResponse)

      cy.exec("ls").then ->
        expect(Cypress.backend).to.be.calledWith("exec", {
          cmd: "ls"
          timeout: 2500
          env: {}
        })

    it "passes through environment variables", ->
      Cypress.backend.resolves(okResponse)

      cy.exec("ls", { env: { FOO: "foo" } }).then ->
        expect(Cypress.backend).to.be.calledWith("exec", {
          cmd: "ls"
          timeout: 2500
          env: {
            FOO: "foo"
          }
        })

    it "really works", ->
      # output is trimmed
      cy.exec("echo foo", { timeout: 20000 }).its("stdout").should("eq", "foo")

    describe ".log", ->
      beforeEach ->
        @logs = []

        cy.on "log:added", (attrs, log) =>
          @lastLog = log
          @logs.push(log)

        return null

      it "can turn off logging", ->
        Cypress.backend.resolves(okResponse)

        cy.exec('ls', { log: false }).then ->
          logs = _.filter @logs, (log) ->
            log.get("name") is "exec"

          expect(logs.length).to.eq(0)

      it "logs immediately before resolving", ->
        Cypress.backend.resolves(okResponse)

        cy.on "log:added", (attrs, log) =>
          if attrs.name is "exec"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("message")).to.eq("ls")

        cy.exec("ls").then =>
          throw new Error("failed to log before resolving") unless @lastLog

    describe "timeout", ->
      it "defaults timeout to Cypress.config(execTimeout)", ->
        Cypress.backend.resolves(okResponse)

        timeout = cy.spy(Promise.prototype, "timeout")

        cy.exec("ls").then ->
          expect(timeout).to.be.calledWith(2500)

      it "can override timeout", ->
        Cypress.backend.resolves(okResponse)

        timeout = cy.spy(Promise.prototype, "timeout")

        cy.exec("li", { timeout: 1000 }).then ->
          expect(timeout).to.be.calledWith(1000)

      it "clears the current timeout and restores after success", ->
        Cypress.backend.resolves(okResponse)

        cy.timeout(100)

        clearTimeout = cy.spy(cy, "clearTimeout")

        cy.on "exec", =>
          expect(clearTimeout).to.be.calledOnce

        cy.exec("ls").then ->
          expect(cy.timeout()).to.eq(100)

    describe "errors", ->
      beforeEach ->
        Cypress.config("defaultCommandTimeout", 50)

        @logs = []

        cy.on "log:added", (attrs, log) =>
          if attrs.name is "exec"
            @lastLog = log
            @logs.push(log)

        return null

      it "throws when cmd is absent", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          expect(lastLog.get("state")).to.eq("failed")
          expect(err.message).to.eq("`cy.exec()` must be passed a non-empty string as its 1st argument. You passed: ''.")
          expect(err.docsUrl).to.eq("https://on.cypress.io/exec")
          done()

        `cy.exec()`

      it "throws when cmd isn't a string", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          expect(lastLog.get("state")).to.eq("failed")
          expect(err.message).to.eq("`cy.exec()` must be passed a non-empty string as its 1st argument. You passed: '3'.")
          expect(err.docsUrl).to.eq("https://on.cypress.io/exec")
          done()

        cy.exec(3)

      it "throws when cmd is an empty string", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          expect(lastLog.get("state")).to.eq("failed")
          expect(err.message).to.eq("`cy.exec()` must be passed a non-empty string as its 1st argument. You passed: ''.")
          expect(err.docsUrl).to.eq("https://on.cypress.io/exec")
          done()

        cy.exec('')

      it "throws when the execution errors", (done) ->
        Cypress.backend.rejects(new Error("exec failed"))

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          expect(lastLog.get("state")).to.eq("failed")

          expect(err.message).to.eq("`cy.exec('ls')` failed with the following error:\n\n> \"Error: exec failed\"")
          expect(err.docsUrl).to.eq("https://on.cypress.io/exec")
          done()

        cy.exec("ls")

      it "throws after timing out", (done) ->
        Cypress.backend.resolves(Promise.delay(250))

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          expect(lastLog.get("state")).to.eq("failed")
          expect(err.message).to.eq("`cy.exec('ls')` timed out after waiting `50ms`.")
          expect(err.docsUrl).to.eq("https://on.cypress.io/exec")
          done()

        cy.exec("ls", { timeout: 50 })

      it "logs once on error", (done) ->
        Cypress.backend.rejects(new Error("exec failed"))

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          expect(lastLog.get("state")).to.eq("failed")
          done()

        cy.exec("ls")

      it "can timeout from the backend's response", (done) ->
        err = new Error("timeout")
        err.timedOut = true

        Cypress.backend.rejects(err)

        cy.on "fail", (err) ->
          expect(err.message).to.include("`cy.exec('sleep 2')` timed out after waiting `100ms`.")
          expect(err.docsUrl).to.eq("https://on.cypress.io/exec")
          done()

        cy.exec("sleep 2", {
          timeout: 100
        })

      it "can really time out", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.include("`cy.exec('sleep 2')` timed out after waiting `100ms`.")
          expect(err.docsUrl).to.eq("https://on.cypress.io/exec")
          done()

        cy.exec("sleep 2", {
          timeout: 100
        })

      describe "when error code is non-zero", ->
        it "throws error that includes useful information and exit code", (done) ->
          Cypress.backend.resolves({ code: 1 })

          cy.on "fail", (err) ->
            expect(err.message).to.contain("`cy.exec('ls')` failed because the command exited with a non-zero code.\n\nPass `{failOnNonZeroExit: false}` to ignore exit code failures.")
            expect(err.message).to.contain("Code: 1")
            expect(err.docsUrl).to.contain("https://on.cypress.io/exec")
            done()

          cy.exec("ls")

        it "throws error that includes stderr if it exists and is non-empty", (done) ->
          Cypress.backend.resolves({ code: 1, stderr: "error output", stdout: "" })

          cy.on "fail", (err) ->
            expect(err.message).to.contain("Stderr:\nerror output")
            expect(err.message).not.to.contain("Stdout")
            done()

          cy.exec("ls")

        it "throws error that includes stdout if it exists and is non-empty", (done) ->
          Cypress.backend.resolves({ code: 1, stderr: "", stdout: "regular output" })

          cy.on "fail", (err) ->
            expect(err.message).to.contain("\nStdout:\nregular output")
            expect(err.message).not.to.contain("Stderr")
            done()

          cy.exec("ls")

        it "throws error that includes stdout and stderr if they exists and are non-empty", (done) ->
          Cypress.backend.resolves({ code: 1, stderr: "error output", stdout: "regular output" })

          cy.on "fail", (err) ->
            expect(err.message).to.contain("\nStdout:\nregular output\nStderr:\nerror output")
            done()

          cy.exec("ls")

        it "truncates the stdout and stderr in the error message", (done) ->
          Cypress.backend.resolves({
            code: 1
            stderr: "#{_.range(200).join()}stderr should be truncated"
            stdout: "#{_.range(200).join()}stdout should be truncated"
          })

          cy.on "fail", (err) ->
            expect(err.message).not.to.contain("stderr should be truncated")
            expect(err.message).not.to.contain("stdout should be truncated")
            expect(err.message).to.contain("...")
            done()

          cy.exec("ls")

        it "can really fail", (done) ->
          cy.on "fail", (err) =>
            lastLog = @lastLog

            { Yielded } = lastLog.invoke("consoleProps")

            # output is trimmed
            expect(Yielded).to.deep.eq({
              stdout: "foo"
              stderr: ""
              code: 1
            })

            done()

          cy.exec("echo foo && exit 1")

        describe "and failOnNonZeroExit is false", ->
          it "does not error", ->
            response = { code: 1, stderr: "error output", stdout: "regular output" }
            Cypress.backend.resolves(response)

            cy
            .exec("ls", { failOnNonZeroExit: false })
            .should("deep.eq", response)

          it "does not really fail", ->
            cy.exec("echo foo && exit 1", {
              failOnNonZeroExit: false
            })
