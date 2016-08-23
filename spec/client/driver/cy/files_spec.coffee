describe "$Cypress.Cy Files Commands", ->
  enterCommandTestingMode()

  describe "#readFile", ->
    beforeEach ->
      @respondWith = (response, timeout = 10) =>
        @Cypress.once "read:file", (file, options, cb) ->
          _.delay (-> cb(response)), timeout

    it "triggers 'read:file' with the right options", (done)->
      @Cypress.on "read:file", (file, options, cb) ->
        expect(file).to.eql("foo.json")
        expect(options).to.eql({ encoding: "utf8" })
        cb("contents")
        done()

      @cy.readFile("foo.json")

    it "can take encoding as second argument", (done)->
      @Cypress.on "read:file", (file, options, cb) ->
        expect(options).to.eql({ encoding: "ascii" })
        cb("contents")
        done()

      @cy.readFile("foo.json", "ascii")

    it "sets the contents as the subject", ->
        @respondWith("contents")

        @cy.readFile('foo.json').then (subject) ->
          expect(subject).to.equal("contents")

    describe ".log", ->
      it "can turn off logging", ->
        @respondWith("contents")

        @Cypress.on "log", (@log) =>

        @cy.readFile('foo.json', { log: false }).then ->
          expect(@log).to.be.undefined

      it "logs immediately before resolving", ->
        @respondWith("contents")

        @Cypress.on "log", (@log) =>
          expect(@log.get("state")).to.eq("pending")
          expect(@log.get("message")).to.eq("foo.json")

        @cy.readFile("foo.json").then =>
          throw new Error("failed to log before resolving") unless @log

    describe "errors", ->

      beforeEach ->
        @allowErrors()

      it "throws when file argument is absent", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push(log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("cy.readFile() must be passed a non-empty string as its 1st argument. You passed: ''.")
          done()

        @cy.readFile()

      it "throws when file argument is not a string", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push(log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("cy.readFile() must be passed a non-empty string as its 1st argument. You passed: '2'.")
          done()

        @cy.readFile(2)

      it "throws when there is an error reading the file", (done) ->
        @respondWith({ __error: { code: "EISDIR", message: "EISDIR: illegal operation on a directory, read" } })

        logs = []

        @Cypress.on "log", (@log) =>
          logs.push(log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("cy.readFile(\"foo\") failed with the following error: EISDIR: illegal operation on a directory, read")
          done()

        @cy.readFile("foo")

      it "has implicit existence assertion and throws a specific error when file does not exist", (done) ->
        @Cypress.on "read:file", (file, options, cb) ->
          cb({ __error: { code: "ENOENT", message: "ENOENT: no such file or directory, open 'foo.json'" } })

        logs = []

        @Cypress.on "log", (@log) =>
          logs.push(log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("Timed out retrying: cy.readFile(\"foo.json\") failed because the file does not exist.")
          @Cypress.off "read:file"
          done()

        @cy.readFile("foo.json")

      it "throws a specific error when file exists when it shouldn't", (done) ->
        @Cypress.on "read:file", (file, options, cb) ->
          cb("contents")

        logs = []

        @Cypress.on "log", (@log) =>
          logs.push(log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("Timed out retrying: cy.readFile(\"foo.json\") failed because the file exists when expected not to exist.")
          @Cypress.off "read:file"
          done()

        @cy.readFile("foo.json").should("not.exist")

      it "passes through assertion error when not about existence", ->
        @Cypress.on "read:file", (file, options, cb) ->
          cb("contents")

        logs = []

        @Cypress.on "log", (@log) =>
          logs.push(log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("Timed out retrying: expected foo to equal contents")
          @Cypress.off "read:file"
          done()

        @cy.readFile("foo.json").should("equal", "contents")
