{ _, Promise } = window.testUtils

describe "$Cypress.Cy Exec Command", ->
  enterCommandTestingMode()

  okResponse = { code: 0 }

  context "#exec", ->
    beforeEach ->
      @Cypress.config("execTimeout", 2500)

      @respondWith = (response, timeout = 10) =>
        @Cypress.once "exec", (data, cb) ->
          _.delay (-> cb(response)), timeout

    it "triggers 'exec' with the right options", ->
      @Cypress.on "exec", (data, cb) ->
        expect(data).to.eql({
          cmd: "ls"
          timeout: 2500
          env: {}
        })
        cb(okResponse)

      @cy.exec("ls")

    it "passes through environment variables", ->
      @Cypress.on "exec", (data, cb) ->
        expect(data.env).to.eql({ FOO: "foo" })
        cb(okResponse)

      @cy.exec("ls", { env: { FOO: "foo" } })

    describe ".log", ->
      it "can turn off logging", ->
        @respondWith(okResponse)

        @Cypress.on "log", (attrs, @log) =>

        @cy.exec('ls', { log: false }).then ->
          expect(@log).to.be.undefined

      it "logs immediately before resolving", ->
        @respondWith(okResponse)

        @Cypress.on "log", (attrs, @log) =>
          expect(@log.get("state")).to.eq("pending")
          expect(@log.get("message")).to.eq("ls")

        @cy.exec("ls").then =>
          throw new Error("failed to log before resolving") unless @log

    describe "timeout", ->
      it "defaults timeout to Cypress.config(execTimeout)", ->
        @respondWith(okResponse)
        timeout = @sandbox.spy(Promise.prototype, "timeout")

        @cy.exec("ls").then ->
          expect(timeout).to.be.calledWith(2500)

      it "can override timeout", ->
        @respondWith(okResponse)
        timeout = @sandbox.spy(Promise.prototype, "timeout")

        @cy.exec("li", { timeout: 1000 }).then ->
          expect(timeout).to.be.calledWith(1000)

      it "clears the current timeout and restores after success", ->
        @respondWith(okResponse)
        @cy._timeout(100)
        _clearTimeout = @sandbox.spy(@cy, "_clearTimeout")

        @Cypress.on "exec", =>
          expect(_clearTimeout).to.be.calledOnce

        @cy.exec("ls").then ->
          expect(@cy._timeout()).to.eq(100)

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "throws when cmd is absent", (done) ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push(@log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("cy.exec() must be passed a non-empty string as its 1st argument. You passed: ''.")
          done()

        @cy.exec()

      it "throws when cmd isn't a string", (done) ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push(@log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("cy.exec() must be passed a non-empty string as its 1st argument. You passed: '3'.")
          done()

        @cy.exec(3)

      it "throws when cmd is an empty string", (done) ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push(@log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("cy.exec() must be passed a non-empty string as its 1st argument. You passed: ''.")
          done()

        @cy.exec('')

      it "throws when the execution errors", (done) ->
        @respondWith({ __error: "exec failed" })

        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push(@log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("cy.exec('ls') failed with the following error:\n\n> \"exec failed\"")
          done()

        @cy.exec("ls")

      it "throws after timing out", (done) ->
        @respondWith(okResponse, 250)

        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push(@log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("cy.exec('ls') timed out after waiting 50ms.")
          done()

        @cy.exec("ls", { timeout: 50 })

      it "logs once on error", (done) ->
        @respondWith({ __error: "exec failed" })

        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push(@log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          done()

        @cy.exec("ls")

      describe "when error code is non-zero", ->

        it "throws error that includes useful information and exit code", (done) ->
          @respondWith({ code: 1 })

          @cy.on "fail", (err) ->
            expect(err.message).to.contain("cy.exec('ls') failed because the command exited with a non-zero code.\n\nPass {failOnNonZeroExit: false} to ignore exit code failures.")
            expect(err.message).to.contain("Code: 1")
            done()

          @cy.exec("ls")

        it "throws error that includes stderr if it exists and is non-empty", (done) ->
          @respondWith({ code: 1, stderr: "error output", stdout: "" })

          @cy.on "fail", (err) ->
            expect(err.message).to.contain("Stderr:\nerror output")
            expect(err.message).not.to.contain("Stdout")
            done()

          @cy.exec("ls")

        it "throws error that includes stdout if it exists and is non-empty", (done) ->
          @respondWith({ code: 1, stderr: "", stdout: "regular output" })

          @cy.on "fail", (err) ->
            expect(err.message).to.contain("\nStdout:\nregular output")
            expect(err.message).not.to.contain("Stderr")
            done()

          @cy.exec("ls")

        it "throws error that includes stdout and stderr if they exists and are non-empty", (done) ->
          @respondWith({ code: 1, stderr: "error output", stdout: "regular output" })

          @cy.on "fail", (err) ->
            expect(err.message).to.contain("\nStdout:\nregular output\nStderr:\nerror output")
            done()

          @cy.exec("ls")

        it "truncates the stdout and stderr in the error message", (done) ->
          @respondWith({
            code: 1
            stderr: "#{_.range(200).join()}stderr should be truncated"
            stdout: "#{_.range(200).join()}stdout should be truncated"
          })

          @cy.on "fail", (err) ->
            expect(err.message).not.to.contain("stderr should be truncated")
            expect(err.message).not.to.contain("stdout should be truncated")
            expect(err.message).to.contain("...")
            done()

          @cy.exec("ls")

        describe "and failOnNonZeroExit is false", ->

          it "does not error", ->
            response = { code: 1, stderr: "error output", stdout: "regular output" }
            @respondWith(response)

            @cy.on "fail", (err) ->
              throw new Error("should not fail, but did with error: #{err}")

            @cy.exec("ls", { failOnNonZeroExit: false }).then (result)->
              expect(result).to.equal response
