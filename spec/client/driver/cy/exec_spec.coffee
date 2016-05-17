describe "$Cypress.Cy Exec Command", ->
  enterCommandTestingMode()

  context "#exec", ->
    beforeEach ->
      @Cypress.config("execTimeout", 2500)

      @responseIs = (response) =>
        @Cypress.on "exec", (data, cb) ->
          cb(response)

    it "triggers 'exec' with the right options", ->
      @Cypress.on "exec", (data, cb) ->
        expect(data).to.eql({
          cmd: "ls"
          timeout: 2500
          env: {}
          failOnNonZeroExit: true
        })
        cb({})

      @cy.exec("ls")

    it "passes through environment variables", ->
      @Cypress.on "exec", (data, cb) ->
        expect(data.env).to.eql({ FOO: "foo" })
        cb({})

      @cy.exec("ls", { env: { FOO: "foo" } })

    it "can override failOnNonZeroExit", ->
      @Cypress.on "exec", (data, cb) ->
        expect(data.failOnNonZeroExit).to.be.false
        cb({})

      @cy.exec("ls", { failOnNonZeroExit: false })

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

      it "can turn off logging", ->
        @responseIs({})

        @cy.exec('ls', { log: false }).then ->
          expect(@log).to.be.undefined

      it "logs immediately before resolving", (done) ->
        @responseIs({})

        @Cypress.on "log", (log) ->
          if log.get("name") is "exec"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("message")).to.eq("ls")
            done()

        @cy.exec("ls")

    describe "timeout", ->
      it "defaults timeout to Cypress.config(execTimeout)", ->
        @responseIs({})
        timeout = @sandbox.spy(Promise.prototype, "timeout")

        @cy.exec("ls").then ->
          expect(timeout).to.be.calledWith(2500)

      it "can override timeout", ->
        @responseIs({})
        timeout = @sandbox.spy(Promise.prototype, "timeout")

        @cy.exec("li", { timeout: 1000 }).then ->
          expect(timeout).to.be.calledWith(1000)

      it "clears the current timeout and restores after success", ->
        @responseIs({})
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

        @Cypress.on "log", (@log) =>
          logs.push(log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("cy.exec() must be passed a non-empty string as its 1st argument. You passed: ''.")
          done()

        @cy.exec()

      it "throws when cmd isn't a string", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push(log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("cy.exec() must be passed a non-empty string as its 1st argument. You passed: '3'.")
          done()

        @cy.exec(3)

      it "throws when cmd is an empty string", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push(log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("cy.exec() must be passed a non-empty string as its 1st argument. You passed: ''.")
          done()

        @cy.exec('')

      it "throws when the execution errors", (done) ->
        @responseIs({ __error: "exec failed" })

        logs = []

        @Cypress.on "log", (@log) =>
          logs.push(log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("cy.exec('ls') failed with the following error: exec failed")
          done()

        @cy.exec("ls")

      it "throws after timing out", (done) ->
        @responseIs({}, 250)

        logs = []

        @Cypress.on "log", (@log) =>
          logs.push(log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("cy.exec('ls') timed out after waiting 50ms.")
          done()

        @cy.exec("ls", { timeout: 50 })

      it "logs once on error", (done) ->
        @responseIs({ __error: "exec failed" })

        logs = []

        @Cypress.on "log", (@log) =>
          logs.push(log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          done()

        @cy.exec("ls")
