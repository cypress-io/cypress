{ _ } = window.testUtils

describe "$Cypress.Cy Files Commands", ->
  enterCommandTestingMode()

  describe "#readFile", ->
    beforeEach ->
      @respondWith = (response, timeout = 10) =>
        @Cypress.once "read:file", (file, options, cb) ->
          _.delay (-> cb(response)), timeout

    it "triggers 'read:file' with the right options", (done)->
      @Cypress.on "read:file", (file, options, cb) ->
        expect(file).to.equal("foo.json")
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
      @respondWith({ contents: "contents" })

      @cy.readFile('foo.json').then (subject) ->
        expect(subject).to.equal("contents")

    describe ".log", ->
      it "can turn off logging", ->
        @respondWith({ contents: "contents" })

        @Cypress.on "log", (attrs, @log) =>

        @cy.readFile('foo.json', { log: false }).then ->
          expect(@log).to.be.undefined

      it "logs immediately before resolving", ->
        @respondWith({ contents: "contents" })

        @Cypress.on "log", (attrs, @log) =>
          expect(@log.get("state")).to.eq("pending")
          expect(@log.get("message")).to.eq("foo.json")

        @cy.readFile("foo.json").then =>
          throw new Error("failed to log before resolving") unless @log

    describe "errors", ->
      beforeEach ->
        @cy._timeout(100)

        @allowErrors()

      it "throws when file argument is absent", (done) ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push(@log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("cy.readFile() must be passed a non-empty string as its 1st argument. You passed: 'undefined'.")
          done()

        @cy.readFile()

      it "throws when file argument is not a string", (done) ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push(@log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("cy.readFile() must be passed a non-empty string as its 1st argument. You passed: '2'.")
          done()

        @cy.readFile(2)

      it "throws when file argument is an empty string", (done) ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push(@log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("cy.readFile() must be passed a non-empty string as its 1st argument. You passed: ''.")
          done()

        @cy.readFile("")

      it "throws when there is an error reading the file", (done) ->
        @respondWith({ __error: { code: "EISDIR", message: "EISDIR: illegal operation on a directory, read", filePath: "/path/to/foo" } })

        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push(@log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq """cy.readFile(\"foo\") failed while trying to read the file at the following path:

            /path/to/foo

          The following error occurred:

            > "EISDIR: illegal operation on a directory, read"
          """
          done()

        @cy.readFile("foo")

      it "has implicit existence assertion and throws a specific error when file does not exist", (done) ->
        @Cypress.on "read:file", (file, options, cb) ->
          cb({ __error: { code: "ENOENT", message: "ENOENT: no such file or directory, open 'foo.json'", filePath: "/path/to/foo.json" } })

        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push(@log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("""Timed out retrying: cy.readFile(\"foo.json\") failed because the file does not exist at the following path:

            /path/to/foo.json
          """)
          @Cypress.off "read:file"
          done()

        @cy.readFile("foo.json")

      it "throws a specific error when file exists when it shouldn't", (done) ->
        @Cypress.on "read:file", (file, options, cb) ->
          cb({ contents: "contents", filePath: "/path/to/foo.json" })

        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push(@log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("""Timed out retrying: cy.readFile(\"foo.json\") failed because the file exists when expected not to exist at the following path:

            /path/to/foo.json
          """)
          @Cypress.off "read:file"
          done()

        @cy.readFile("foo.json").should("not.exist")

      it "passes through assertion error when not about existence", (done) ->
        @cy._timeout(100)

        @Cypress.on "read:file", (file, options, cb) ->
          cb({ contents: "foo", filePath: "/path/to/foo.json" })

        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push(@log)

        @cy.on "fail", (err) =>
          debugger
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("Timed out retrying: expected 'foo' to equal 'contents'")
          @Cypress.off "read:file"
          done()

        @cy.readFile("foo.json").should("equal", "contents")

  describe "#writeFile", ->
    beforeEach ->
      @respondWith = (response, timeout = 10) =>
        @Cypress.once "write:file", (file, contents, options, cb) ->
          _.delay (-> cb(response)), timeout

    it "triggers 'write:file' with the right options", (done)->
      @Cypress.on "write:file", (file, contents, options, cb) ->
        expect(file).to.equal("foo.txt")
        expect(contents).to.equal("contents")
        expect(options).to.eql({ encoding: "utf8" })
        cb("contents")
        done()

      @cy.writeFile("foo.txt", "contents")

    it "can take encoding as third argument", (done)->
      @Cypress.on "write:file", (file, contents, options, cb) ->
        expect(options).to.eql({ encoding: "ascii" })
        cb("contents")
        done()

      @cy.writeFile("foo.txt", "contents", "ascii")

    it "sets the contents as the subject", ->
      @respondWith({ contents: "contents" })

      @cy.writeFile("foo.txt", "contents").then (subject) ->
        expect(subject).to.equal("contents")

    it "can write a string", ->
      @respondWith({ contents: "contents" })

      @cy.writeFile("foo.txt", "contents")

    it "can write an array as json", ->
      @respondWith({ contents: "contents" })

      @cy.writeFile("foo.json", [])

    it "can write an object as json", ->
      @respondWith({ contents: "contents" })

      @cy.writeFile("foo.json", {})

    describe ".log", ->
      it "can turn off logging", ->
        @respondWith({ contents: "contents" })

        @Cypress.on "log", (attrs, @log) =>

        @cy.writeFile("foo.txt", "contents", { log: false }).then ->
          expect(@log).to.be.undefined

      it "logs immediately before resolving", ->
        @respondWith({ contents: "contents" })

        @Cypress.on "log", (attrs, @log) =>
          expect(@log.get("state")).to.eq("pending")
          expect(@log.get("message")).to.eq("foo.txt", "contents")

        @cy.writeFile("foo.txt", "contents").then =>
          throw new Error("failed to log before resolving") unless @log

    describe "errors", ->

      beforeEach ->
        @allowErrors()

      it "throws when file name argument is absent", (done) ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push(@log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("cy.writeFile() must be passed a non-empty string as its 1st argument. You passed: 'undefined'.")
          done()

        @cy.writeFile()

      it "throws when file name argument is not a string", (done) ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push(@log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("cy.writeFile() must be passed a non-empty string as its 1st argument. You passed: '2'.")
          done()

        @cy.writeFile(2)

      it "throws when contents argument is absent", (done) ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push(@log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("cy.writeFile() must be passed a non-empty string, an object, or an array as its 2nd argument. You passed: 'undefined'.")
          done()

        @cy.writeFile("foo.txt")

      it "throws when contents argument is not a string, object, or array", (done) ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push(@log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("cy.writeFile() must be passed a non-empty string, an object, or an array as its 2nd argument. You passed: '2'.")
          done()

        @cy.writeFile("foo.txt", 2)

      it "throws when there is an error writing the file", (done) ->
        @respondWith({ __error: { code: "WHOKNOWS", message: "WHOKNOWS: unable to write file", filePath: "/path/to/foo.txt" } })

        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push(@log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq """cy.writeFile(\"foo.txt\") failed while trying to write the file at the following path:

            /path/to/foo.txt

          The following error occurred:

            > "WHOKNOWS: unable to write file"
          """

          done()

        @cy.writeFile("foo.txt", "contents")
