fs         = require("fs-extra")
path       = require("path")
Promise    = require("bluebird")
Decompress = require("decompress")
utils      = require("../../lib/utils")
Install    = require("../../lib/commands/install")

fs = Promise.promisifyAll(fs)

describe "Install", ->
  context "cli interface", ->
    beforeEach ->
      mockery.registerMock("./commands/install", @spy = @sandbox.spy())
      @parse = (args) ->
        program.parse("node test #{args}".split(" "))

    it "calls install", ->
      @parse("install")
      expect(@spy).to.be.calledWith({})

    it "calls install with destination", ->
      @parse("install --destination /foo/bar/baz")
      expect(@spy).to.be.calledWith({destination: "/foo/bar/baz"})

  context "#download", ->
    beforeEach ->
      @options = {initialize: false}
      @install = new Install(@options)
      @exit    = @sandbox.stub(process, "exit")
      @sandbox.stub(@install, "unzip").resolves()
      @sandbox.stub(@install, "finish").resolves()

    afterEach ->
      delete process.env.CYPRESS_VERSION

    it "sets options.version to response x-version", ->
      nock("http://aws.amazon.com")
      .get("/some.zip")
      .reply 200, (uri, requestBody) ->
        fs.createReadStream("test/fixture/example.zip")

      nock("http://download.cypress.io")
      .get("/latest")
      .query(true)
      .reply 302, undefined, {
        "Location": "http://aws.amazon.com/some.zip"
        "x-version": "0.11.1"
      }

      @install.initialize(@options).then =>
        expect(@options.version).to.eq("0.11.1")

    it "can specify cypress version", ->
      process.env.CYPRESS_VERSION = "0.12.1"

      nock("http://aws.amazon.com")
      .get("/some.zip")
      .reply 200, (uri, requestBody) ->
        fs.createReadStream("test/fixture/example.zip")

      nock("http://download.cypress.io")
      .get("/version/0.12.1")
      .query(true)
      .reply 302, undefined, {
        "Location": "http://aws.amazon.com/some.zip"
        "x-version": "0.12.1"
      }

      @install.initialize(@options).then =>
        expect(@options.version).to.eq("0.12.1")

    it "catches download status errors and exits", ->
      @sandbox.stub(@install, "download").rejects({statusCode: 404, statusMessage: "Not Found"})
      @install.initialize(@options).then =>
        expect(@exit).to.be.calledWith(1)

  context "#unzip", ->
    beforeEach ->
      @options = {initialize: false}
      @install = new Install(@options)
      @console = @sandbox.spy(console, "log")
      @exit    = @sandbox.stub(process, "exit")
      @sandbox.stub(@install, "download").resolves(@options)
      @sandbox.stub(@install, "finish").resolves()

    it "catches unzip errors and exits", ->
      err = new Error("unzip failed")
      @sandbox.stub(@install, "unzip").rejects(err)
      @install.initialize(@options).then =>
        expect(@console).to.be.calledWithMatch(err.stack)
        expect(@exit).to.be.calledWith(1)

    it "catches decompression errors", ->
      err = new Error("fail whale")
      @sandbox.stub(Decompress.prototype, "run").callsArgWithAsync(0, err)
      @options.zipDestination = "test/fixture/example.zip"
      @install.initialize(@options).then =>
        expect(@console).to.be.calledWithMatch(err.stack)
        expect(@exit).to.be.calledWith(1)

  context "#cleanupZip", ->
    it "removes zip", (done) ->
      zipDestination = path.join(__dirname, "foo.zip")

      opts = {
        initialize: false
        zipDestination: zipDestination
      }

      fs.writeFileAsync(zipDestination, "foo bar baz").then =>
        @install = new Install(opts)

        @install.cleanupZip(opts).then ->
          fs.statAsync(zipDestination).catch -> done()

  context "#finish", ->
    beforeEach ->
      @options = {initialize: false, version: "0.11.2"}
      @install = new Install(@options)
      @console = @sandbox.spy(console, "log")
      @cleanupZip = @sandbox.spy(@install, "cleanupZip")
      @sandbox.stub(@install, "download").resolves()
      @sandbox.stub(@install, "unzip").resolves()

    it "calls #cleanupZip", ->
      @install.initialize(@options).then =>
        expect(@cleanupZip).to.be.calledWith(@options)

    it "logs out Finished Installing", ->
      @sandbox.stub(utils, "getPathToUserExecutable").returns("/foo/bar")

      @install.initialize(@options).then =>
        expect(@console).to.be.calledWithMatch("Finished Installing")
        expect(@console).to.be.calledWithMatch("/foo/bar")
        expect(@console).to.be.calledWithMatch("(version: 0.11.2)")

    it "displays opening app message", ->
      @install.initialize(@options).then =>
        expect(@console).to.be.calledWithMatch("You can now open Cypress by running:")
        expect(@console).to.be.calledWithMatch("cypress open")

    it "can silence opening app message", ->
      @options.displayOpen = false

      @install.initialize(@options).then =>
        expect(@console).not.to.be.calledWithMatch("cypress open")

    it "invokes options.after", (done) ->
      @options.after = -> done()
      @install.initialize(@options)
