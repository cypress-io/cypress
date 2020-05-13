_ = Cypress._

okResponse = {
  contents: "contents"
  filePath: "/path/to/foo.json"
}

describe "src/cy/commands/files", ->
  beforeEach ->
    ## call through normally on everything
    cy.stub(Cypress, "backend").callThrough()

  describe "#readFile", ->
    it "triggers 'read:file' with the right options", ->
      Cypress.backend.resolves(okResponse)

      cy.readFile("foo.json").then ->
        expect(Cypress.backend).to.be.calledWith(
          "read:file",
          "foo.json",
          { encoding: "utf8" }
        )

    it "can take encoding as second argument", ->
      Cypress.backend.resolves(okResponse)

      cy.readFile("foo.json", "ascii").then ->
        expect(Cypress.backend).to.be.calledWith(
          "read:file",
          "foo.json",
          { encoding: "ascii" }
        )

    it "sets the contents as the subject", ->
      Cypress.backend.resolves(okResponse)

      cy.readFile('foo.json').then (subject) ->
        expect(subject).to.equal("contents")

    it "retries to read when ENOENT", ->
      err = new Error("foo")
      err.code = "ENOENT"

      retries = 0

      cy.on "command:retry", ->
        retries += 1

      Cypress.backend
      .onFirstCall()
      .rejects(err)
      .onSecondCall()
      .resolves(okResponse)

      cy.readFile('foo.json').then ->
        expect(retries).to.eq(1)

    it "retries assertions until they pass", ->
      retries = 0

      cy.on "command:retry", ->
        retries += 1

      Cypress.backend
      .onFirstCall()
      .resolves({
        contents: "foobarbaz"
      })
      .onSecondCall()
      .resolves({
        contents: "quux"
      })

      cy.readFile("foo.json").should("eq", "quux").then ->
        expect(retries).to.eq(1)

    it "really works", ->
      cy.readFile("cypress.json").its("baseUrl").should("eq", "http://localhost:3500")

    it "works when contents are supposed to be null", ->
      cy.readFile("does-not-exist").should("be.null")

    describe ".log", ->
      beforeEach ->
        @logs = []

        cy.on "log:added", (attrs, log) =>
          @lastLog = log
          @logs.push(log)

        return null

      it "can turn off logging", ->
        Cypress.backend.resolves(okResponse)

        cy.readFile('foo.json', { log: false }).then ->
          logs = _.filter @logs, (log) ->
            log.get("name") is "readFile"

          expect(logs.length).to.eq(0)

      it "logs immediately before resolving", ->
        Cypress.backend.resolves(okResponse)

        cy.on "log:added", (attrs, log) =>
          if attrs.name is "readFile"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("message")).to.eq("foo.json")

        cy.readFile("foo.json").then =>
          throw new Error("failed to log before resolving") unless @lastLog

    describe "errors", ->
      beforeEach ->
        Cypress.config("defaultCommandTimeout", 50)

        @logs = []

        cy.on "log:added", (attrs, log) =>
          if attrs.name is "readFile"
            @lastLog = log
            @logs.push(log)

        return null

      it "throws when file argument is absent", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          expect(lastLog.get("state")).to.eq("failed")
          expect(err.message).to.eq("`cy.readFile()` must be passed a non-empty string as its 1st argument. You passed: `undefined`.")
          expect(err.docsUrl).to.eq("https://on.cypress.io/readfile")
          done()

        `cy.readFile()`

      it "throws when file argument is not a string", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          expect(lastLog.get("state")).to.eq("failed")
          expect(err.message).to.eq("`cy.readFile()` must be passed a non-empty string as its 1st argument. You passed: `2`.")
          expect(err.docsUrl).to.eq("https://on.cypress.io/readfile")
          done()

        cy.readFile(2)

      it "throws when file argument is an empty string", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          expect(lastLog.get("state")).to.eq("failed")
          expect(err.message).to.eq("`cy.readFile()` must be passed a non-empty string as its 1st argument. You passed: ``.")
          expect(err.docsUrl).to.eq("https://on.cypress.io/readfile")
          done()

        cy.readFile("")

      it "throws when there is an error reading the file", (done) ->
        err = new Error("EISDIR: illegal operation on a directory, read")
        err.name = "EISDIR"
        err.code = "EISDIR"
        err.filePath = "/path/to/foo"

        Cypress.backend.rejects(err)

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          expect(lastLog.get("state")).to.eq("failed")
          expect(err.message).to.eq """
          `cy.readFile(\"foo\")` failed while trying to read the file at the following path:

            `/path/to/foo`

          The following error occurred:

            > "EISDIR: illegal operation on a directory, read"
          """
          expect(err.docsUrl).to.eq("https://on.cypress.io/readfile")

          done()

        cy.readFile("foo")

      it "has implicit existence assertion and throws a specific error when file does not exist", (done) ->
        err = new Error("ENOENT: no such file or directory, open 'foo.json'")
        err.name = "ENOENT"
        err.code = "ENOENT"
        err.filePath = "/path/to/foo.json"

        Cypress.backend.rejects(err)

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          expect(lastLog.get("state")).to.eq("failed")

          expect(err.message).to.eq("""Timed out retrying: `cy.readFile(\"foo.json\")` failed because the file does not exist at the following path:

            `/path/to/foo.json`
          """)
          expect(err.docsUrl).to.eq("https://on.cypress.io/readfile")
          done()

        cy.readFile("foo.json")

      it "throws a specific error when file exists when it shouldn't", (done) ->
        Cypress.backend.resolves(okResponse)

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          expect(lastLog.get("state")).to.eq("failed")
          expect(err.message).to.eq("""
          Timed out retrying: `cy.readFile(\"foo.json\")` failed because the file exists when expected not to exist at the following path:

          `/path/to/foo.json`
          """)
          expect(err.docsUrl).to.eq("https://on.cypress.io/readfile")
          done()

        cy.readFile("foo.json").should("not.exist")

      it "passes through assertion error when not about existence", (done) ->
        Cypress.backend.resolves({
          contents: "foo"
        })

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          expect(lastLog.get("state")).to.eq("failed")
          expect(err.message).to.eq("Timed out retrying: expected 'foo' to equal 'contents'")
          done()

        cy.readFile("foo.json").should("equal", "contents")

  describe "#writeFile", ->
    it "triggers 'write:file' with the right options", ->
      Cypress.backend.resolves(okResponse)

      cy.writeFile("foo.txt", "contents").then ->
        expect(Cypress.backend).to.be.calledWith(
          "write:file",
          "foo.txt",
          "contents",
          {
            encoding: "utf8"
            flag: "w"
          }
        )

    it "can take encoding as third argument", ->
      Cypress.backend.resolves(okResponse)

      cy.writeFile("foo.txt", "contents", "ascii").then ->
        expect(Cypress.backend).to.be.calledWith(
          "write:file",
          "foo.txt",
          "contents",
          {
            encoding: "ascii"
            flag: "w"
          }
        )

    it "can take encoding as part of options", ->
      Cypress.backend.resolves(okResponse)

      cy.writeFile("foo.txt", "contents", {encoding: "ascii"}).then ->
        expect(Cypress.backend).to.be.calledWith(
          "write:file",
          "foo.txt",
          "contents",
          {
            encoding: "ascii"
            flag: "w"
          }
        )

    it "yields null", ->
      Cypress.backend.resolves(okResponse)

      cy.writeFile("foo.txt", "contents").then (subject) ->
        expect(subject).to.not.exist

    it "can write a string", ->
      Cypress.backend.resolves(okResponse)

      cy.writeFile("foo.txt", "contents")

    it "can write an array as json", ->
      Cypress.backend.resolves(okResponse)

      cy.writeFile("foo.json", [])

    it "can write an object as json", ->
      Cypress.backend.resolves(okResponse)

      cy.writeFile("foo.json", {})

    it "writes the file to the filesystem, overwriting existing file", ->
      cy
        .writeFile("cypress/fixtures/foo.txt", "")
        .writeFile("cypress/fixtures/foo.txt", "bar")
        .readFile("cypress/fixtures/foo.txt").should("equal", "bar")
        .exec("rm cypress/fixtures/foo.txt")

    describe ".flag", ->
      it "sends a flag if specified", ->
        Cypress.backend.resolves(okResponse)

        cy.writeFile("foo.txt", "contents", { flag: "a+" }).then ->
          expect(Cypress.backend).to.be.calledWith(
            "write:file",
            "foo.txt",
            "contents",
            {
              encoding: "utf8",
              flag: "a+"
            })

      it "appends content to existing file if specified", ->
        cy
          .writeFile("cypress/fixtures/foo.txt", "foo")
          .writeFile("cypress/fixtures/foo.txt", "bar", { flag: "a+"})
          .readFile("cypress/fixtures/foo.txt").should("equal", "foobar")
          .exec("rm cypress/fixtures/foo.txt")

    describe ".log", ->
      beforeEach ->
        @logs = []

        cy.on "log:added", (attrs, log) =>
          @lastLog = log
          @logs.push(log)

        return null

      it "can turn off logging", ->
        Cypress.backend.resolves(okResponse)

        cy.writeFile("foo.txt", "contents", { log: false }).then ->
          logs = _.filter @logs, (log) ->
            log.get("name") is "writeFile"

          expect(logs.length).to.eq(0)

      it "logs immediately before resolving", ->
        Cypress.backend.resolves(okResponse)

        cy.on "log:added", (attrs, log) =>
          if attrs.name is "writeFile"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("message")).to.eq("foo.txt", "contents")

        cy.writeFile("foo.txt", "contents").then =>
          throw new Error("failed to log before resolving") unless @lastLog

    describe "errors", ->
      beforeEach ->
        Cypress.config("defaultCommandTimeout", 50)

        @logs = []

        cy.on "log:added", (attrs, log) =>
          if attrs.name is "writeFile"
            @lastLog = log
            @logs.push(log)

        return null

      it "throws when file name argument is absent", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          expect(lastLog.get("state")).to.eq("failed")
          expect(err.message).to.eq("`cy.writeFile()` must be passed a non-empty string as its 1st argument. You passed: `undefined`.")
          expect(err.docsUrl).to.eq("https://on.cypress.io/writefile")
          done()

        `cy.writeFile()`

      it "throws when file name argument is not a string", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          expect(lastLog.get("state")).to.eq("failed")
          expect(err.message).to.eq("`cy.writeFile()` must be passed a non-empty string as its 1st argument. You passed: `2`.")
          expect(err.docsUrl).to.eq("https://on.cypress.io/writefile")
          done()

        cy.writeFile(2)

      it "throws when contents argument is absent", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          expect(lastLog.get("state")).to.eq("failed")
          expect(err.message).to.eq("`cy.writeFile()` must be passed a non-empty string, an object, or an array as its 2nd argument. You passed: `undefined`.")
          done()

        cy.writeFile("foo.txt")

      it "throws when contents argument is not a string, object, or array", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          expect(lastLog.get("state")).to.eq("failed")
          expect(err.message).to.eq("`cy.writeFile()` must be passed a non-empty string, an object, or an array as its 2nd argument. You passed: `2`.")
          done()

        cy.writeFile("foo.txt", 2)

      it "throws when there is an error writing the file", (done) ->
        err = new Error("WHOKNOWS: unable to write file")
        err.name = "WHOKNOWS"
        err.code = "WHOKNOWS"
        err.filePath = "/path/to/foo.txt"

        Cypress.backend.rejects(err)

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          expect(lastLog.get("state")).to.eq("failed")
          expect(err.message).to.eq """`cy.writeFile(\"foo.txt\")` failed while trying to write the file at the following path:

            `/path/to/foo.txt`

          The following error occurred:

            > "WHOKNOWS: unable to write file"
          """
          expect(err.docsUrl).to.eq("https://on.cypress.io/writefile")

          done()

        cy.writeFile("foo.txt", "contents")
