require("../spec_helper")

Promise        = require("bluebird")
human          = require("human-interval")
path           = require("path")

api            = require("#{root}lib/api")
config         = require("#{root}lib/config")
user           = require("#{root}lib/user")
filesUtil      = require("#{root}lib/controllers/files")
files          = require("#{root}lib/files")
FixturesHelper = require("#{root}/spec/server/helpers/fixtures")

describe "lib/controllers/files", ->
  beforeEach ->
    @clock = @sandbox.useFakeTimers("setInterval", "clearInterval")

  afterEach ->
    filesUtil.reset()

  context "setInterval", ->
    beforeEach ->
      @sandbox.stub(global, "setInterval")
      filesUtil.interval()

    it "calls check every 10 minutes", ->
      args = setInterval.getCall(0).args
      expect(args[0]).to.be.a("function")
      expect(args[1]).to.eq(human("10 minutes"))

  context "check", ->
    beforeEach ->
      @sandbox.stub(user, "ensureSession")
      @sandbox.stub(api,  "sendUsage")

    it "is no op if numRuns isnt > 0", ->
      expect(filesUtil.getStats().numRuns).to.eq(0)
      expect(filesUtil.check()).to.be.undefined

    it "sends numRuns, exampleSpec, allSpecs + session to api.sendUsage", ->
      user.ensureSession.resolves("session-123")
      api.sendUsage.resolves()

      filesUtil.increment("foo", {projectName: "foobar"})
      filesUtil.increment("__all")
      filesUtil.increment("integration/example_spec.js")

      expect(filesUtil.getStats()).to.deep.eq({
        numRuns: 3
        allSpecs: true
        exampleSpec: true
        projectName: "foobar"
      })

      filesUtil.check()
      .then ->
        expect(api.sendUsage).to.be.calledWith(3, true, true, "foobar", "session-123")

    it "sends exampleSpec false when no example_spec.js has run", ->
      user.ensureSession.resolves("session-123")
      api.sendUsage.resolves()

      filesUtil.increment("foo", {projectName: "foobar"})

      expect(filesUtil.getStats()).to.deep.eq({
        numRuns: 1
        allSpecs: false
        exampleSpec: false
        projectName: "foobar"
      })

      filesUtil.check()
      .then ->
        expect(api.sendUsage).to.be.calledWith(1, false, false, "foobar", "session-123")

    it "resets after successfully sending usage", ->
      user.ensureSession.resolves("session-123")
      api.sendUsage.resolves()

      filesUtil.increment("foo")
      filesUtil.increment("integration/example_spec.js")

      filesUtil.check()
      .then ->
        expect(filesUtil.getStats()).to.deep.eq({
          numRuns: 0
          allSpecs: false
          exampleSpec: false
          projectName: null
        })

    it "swallows errors ensuring session", ->
      user.ensureSession.rejects(new Error)

      filesUtil.increment("foo")

      filesUtil.check()
      .then ->
        expect(api.sendUsage).not.to.be.called

    it "swallows errors sending usage without resetting", ->
      user.ensureSession.resolves("session-123")
      api.sendUsage.rejects(new Error)

      filesUtil.increment("foo", {projectName: "foobar"})
      filesUtil.increment("__all")
      filesUtil.increment("integration/example_spec.js")

      filesUtil.check()
      .then ->
        expect(filesUtil.getStats()).to.deep.eq({
          numRuns: 3
          allSpecs: true
          exampleSpec: true
          projectName: "foobar"
        })

describe "lib/files", ->
  beforeEach ->
    FixturesHelper.scaffold()

    @todosPath = FixturesHelper.projectPath("todos")

    config.get(@todosPath).then (cfg) =>
      {@projectRoot} = cfg

  afterEach ->
    FixturesHelper.remove()

  context "#readFile", ->

    it "returns text as string", ->
      files.readFile(@projectRoot, "tests/_fixtures/message.txt").then (contents) ->
        expect(contents).to.eq "foobarbaz"

    it "returns uses utf8 by default", ->
      files.readFile(@projectRoot, "tests/_fixtures/ascii.foo").then (contents) ->
        expect(contents).to.eq "\n"

    it "uses encoding specified in options", ->
      files.readFile(@projectRoot, "tests/_fixtures/ascii.foo", {encoding: "ascii"}).then (contents) ->
        expect(contents).to.eq "o#?\n"

    it "parses json to valid JS object", ->
      files.readFile(@projectRoot, "tests/_fixtures/users.json").then (contents) ->
        expect(contents).to.eql [
          {
            id: 1
            name: "brian"
          },{
            id: 2
            name: "jennifer"
          }
        ]

  context "#writeFile", ->

    it "writes the file's contents", ->
      files.writeFile(@projectRoot, ".projects/write_file.txt", "foo").then =>
        files.readFile(@projectRoot, ".projects/write_file.txt").then (contents) ->
          expect(contents).to.equal("foo")

    it "uses encoding specified in options", ->
      files.writeFile(@projectRoot, ".projects/write_file.txt", "", {encoding: "ascii"}).then =>
        files.readFile(@projectRoot, ".projects/write_file.txt").then (contents) ->
          expect(contents).to.equal("�")

    it "overwrites existing file without issue", ->
      files.writeFile(@projectRoot, ".projects/write_file.txt", "foo").then =>
        files.readFile(@projectRoot, ".projects/write_file.txt").then (contents) =>
          expect(contents).to.equal("foo")
          files.writeFile(@projectRoot, ".projects/write_file.txt", "bar").then =>
            files.readFile(@projectRoot, ".projects/write_file.txt").then (contents) ->
              expect(contents).to.equal("bar")
