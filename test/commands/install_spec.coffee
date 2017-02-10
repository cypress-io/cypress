fs         = require("fs-extra")
path       = require("path")
Promise    = require("bluebird")
utils      = require("../../lib/utils")
install    = require("../../lib/commands/install")

fs = Promise.promisifyAll(fs)

describe "Install", ->
  context "cli interface", ->
    beforeEach ->
      @sandbox.stub(install, "start")

      @parse = (args) ->
        program.parse("node test #{args}".split(" "))

    it "calls install", ->
      @parse("install")
      expect(install.start).to.be.calledWith({})

    it "calls install with destination", ->
      @parse("install --destination /foo/bar/baz")
      expect(install.start).to.be.calledWith({destination: "/foo/bar/baz"})

    it "can pass version", ->
      @parse("install --cypress-version 0.13.0")
      expect(install.start).to.be.calledWith({cypressVersion: "0.13.0"})

  context "#download", ->
    beforeEach ->
      @options = {}
      @exit    = @sandbox.stub(process, "exit")
      @sandbox.stub(install, "unzip").resolves()
      @sandbox.stub(install, "finish").resolves()

    afterEach ->
      delete process.env.CYPRESS_VERSION

    it "sets options.version to response x-version", ->
      nock("https://aws.amazon.com")
      .get("/some.zip")
      .reply 200, (uri, requestBody) ->
        fs.createReadStream("test/fixture/example.zip")

      nock("https://download.cypress.io")
      .get("/desktop")
      .query(true)
      .reply 302, undefined, {
        "Location": "https://aws.amazon.com/some.zip"
        "x-version": "0.11.1"
      }

      install.start(@options)
      .then =>
        expect(@options.version).to.eq("0.11.1")

    it "can specify cypress version in env", ->
      process.env.CYPRESS_VERSION = "0.12.1"

      nock("https://aws.amazon.com")
      .get("/some.zip")
      .reply 200, (uri, requestBody) ->
        fs.createReadStream("test/fixture/example.zip")

      nock("https://download.cypress.io")
      .get("/desktop/0.12.1")
      .query(true)
      .reply 302, undefined, {
        "Location": "https://aws.amazon.com/some.zip"
        "x-version": "0.12.1"
      }

      install.start(@options)
      .then =>
        expect(@options.version).to.eq("0.12.1")

    it "can specify cypress version in arguments", ->
      @options.version = "0.13.0"

      nock("https://aws.amazon.com")
      .get("/some.zip")
      .reply 200, (uri, requestBody) ->
        fs.createReadStream("test/fixture/example.zip")

      nock("https://download.cypress.io")
      .get("/desktop/0.13.0")
      .query(true)
      .reply 302, undefined, {
        "Location": "https://aws.amazon.com/some.zip"
        "x-version": "0.13.0"
      }

      install.start(@options)
      .then =>
        expect(@options.version).to.eq("0.13.0")

    it "catches download status errors and exits", ->
      err = new Error
      err.statusCode = 404
      err.statusMessage = "Not Found"

      @sandbox.stub(install, "download").rejects(err)

      install.start(@options)
      .then =>
        expect(@exit).to.be.calledWith(1)

  context "#unzip", ->
    beforeEach ->
      @options = {}
      @console = @sandbox.spy(console, "log")
      @exit    = @sandbox.stub(process, "exit")

      @sandbox.stub(install, "download").resolves(@options)
      @sandbox.stub(install, "finish").resolves()

    it "catches unzip errors and exits", ->
      err = new Error("unzip failed")
      @sandbox.stub(install, "unzip").rejects(err)

      install.start(@options)
      .then =>
        expect(@console).to.be.calledWithMatch(err.stack)
        expect(@exit).to.be.calledWith(1)

    ## temporarily commenting out until we can
    ## add tests around new unzipping logic
    # it "catches decompression errors", ->
    #   err = new Error("fail whale")
    #   @sandbox.stub(Decompress.prototype, "run").callsArgWithAsync(0, err)
    #   @options.zipDestination = "test/fixture/example.zip"
    #   install.start(@options)
    #   .then =>
    #     expect(@console).to.be.calledWithMatch(err.stack)
    #     expect(@exit).to.be.calledWith(1)

  context "#cleanupZip", ->
    it "removes zip", (done) ->
      zipDestination = path.join(__dirname, "foo.zip")

      opts = {
        initialize: false
        zipDestination: zipDestination
      }

      fs.writeFileAsync(zipDestination, "foo bar baz")
      .then =>
        install.cleanupZip(opts)
      .then ->
        fs.statAsync(zipDestination)
        .catch -> done()

  context "#finish", ->
    beforeEach ->
      @options = {initialize: false, version: "0.11.2"}
      @console = @sandbox.spy(console, "log")
      @cleanupZip = @sandbox.spy(install, "cleanupZip")

      @sandbox.stub(install, "download").resolves()
      @sandbox.stub(install, "unzip").resolves()

    it "calls #cleanupZip", ->
      install.start(@options)
      .then =>
        expect(@cleanupZip).to.be.calledWith(@options)

    it "logs out Finished Installing", ->
      @sandbox.stub(utils, "getPathToUserExecutable").returns("/foo/bar")

      install.start(@options)
      .then =>
        expect(@console).to.be.calledWithMatch("Finished Installing")
        expect(@console).to.be.calledWithMatch("/foo/bar")
        expect(@console).to.be.calledWithMatch("(version: 0.11.2)")

    it "displays opening app message", ->
      install.start(@options)
      .then =>
        expect(@console).to.be.calledWithMatch("You can now open Cypress by running:")
        expect(@console).to.be.calledWithMatch("cypress open")

    it "can silence opening app message", ->
      @options.displayOpen = false

      install.start(@options)
      .then =>
        expect(@console).not.to.be.calledWithMatch("cypress open")

    it "invokes options.after", (done) ->
      @options.after = -> done()
      install.start(@options)
