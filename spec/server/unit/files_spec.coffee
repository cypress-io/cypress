require("../spec_helper")

Promise = require("bluebird")
human   = require("human-interval")
api     = require("#{root}lib/api")
user    = require("#{root}lib/user")
files   = require("#{root}lib/controllers/files")

describe "lib/controllers/files", ->
  beforeEach ->
    @clock = @sandbox.useFakeTimers("setInterval", "clearInterval")

  afterEach ->
    files.reset()

  context "setInterval", ->
    beforeEach ->
      @sandbox.stub(global, "setInterval")
      files.interval()

    it "calls check every 10 minutes", ->
      args = setInterval.getCall(0).args
      expect(args[0]).to.be.a("function")
      expect(args[1]).to.eq(human("10 minutes"))

  context "check", ->
    beforeEach ->
      @sandbox.stub(user, "ensureSession")
      @sandbox.stub(api,  "sendUsage")

    it "is no op if numRuns isnt > 0", ->
      expect(files.getStats().numRuns).to.eq(0)
      expect(files.check()).to.be.undefined

    it "sends numRuns, exampleSpec, allSpecs + session to api.sendUsage", ->
      user.ensureSession.resolves("session-123")
      api.sendUsage.resolves()

      files.increment("foo", {projectName: "foobar"})
      files.increment("__all")
      files.increment("integration/example_spec.js")

      expect(files.getStats()).to.deep.eq({
        numRuns: 3
        allSpecs: true
        exampleSpec: true
        projectName: "foobar"
      })

      files.check()
      .then ->
        expect(api.sendUsage).to.be.calledWith(3, true, true, "foobar", "session-123")

    it "sends exampleSpec false when no example_spec.js has run", ->
      user.ensureSession.resolves("session-123")
      api.sendUsage.resolves()

      files.increment("foo", {projectName: "foobar"})

      expect(files.getStats()).to.deep.eq({
        numRuns: 1
        allSpecs: false
        exampleSpec: false
        projectName: "foobar"
      })

      files.check()
      .then ->
        expect(api.sendUsage).to.be.calledWith(1, false, false, "foobar", "session-123")

    it "resets after successfully sending usage", ->
      user.ensureSession.resolves("session-123")
      api.sendUsage.resolves()

      files.increment("foo")
      files.increment("integration/example_spec.js")

      files.check()
      .then ->
        expect(files.getStats()).to.deep.eq({
          numRuns: 0
          allSpecs: false
          exampleSpec: false
          projectName: null
        })

    it "swallows errors ensuring session", ->
      user.ensureSession.rejects(new Error)

      files.increment("foo")

      files.check()
      .then ->
        expect(api.sendUsage).not.to.be.called

    it "swallows errors sending usage without resetting", ->
      user.ensureSession.resolves("session-123")
      api.sendUsage.rejects(new Error)

      files.increment("foo", {projectName: "foobar"})
      files.increment("__all")
      files.increment("integration/example_spec.js")

      files.check()
      .then ->
        expect(files.getStats()).to.deep.eq({
          numRuns: 3
          allSpecs: true
          exampleSpec: true
          projectName: "foobar"
        })
