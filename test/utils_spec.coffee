fs        = require("fs-extra")
os        = require("os")
mockSpawn = require("mock-spawn")

fs = Promise.promisifyAll(fs)
cp = {spawn: spawn = mockSpawn()}

utils = proxyquire("../lib/utils", {
  child_process: cp
})

describe "utils", ->
  beforeEach ->
    @exit = @sandbox.stub(process, "exit")

  context "#spawn", ->
    beforeEach ->
      @startAsync    = @sandbox.stub(utils.xvfb, "startAsync").resolves()
      @stopAsync     = @sandbox.stub(utils.xvfb, "stopAsync").resolves()

      @sandbox.stub(utils, "_fileExistsAtPath").resolves("/path/to/cypress")
      @sandbox.stub(utils, "getPathToExecutable").returns("/path/to/cypress")

    it "passes args + options to spawn", ->
      @spawn = @sandbox.stub(cp, "spawn").returns({on: ->})
      utils.spawn("--foo", {foo: "bar"}).then =>
        expect(@spawn).to.be.calledWithMatch("/path/to/cypress", ["--foo"], {foo: "bar"})

    it "does not call into startXvfb when its not needed", ->
      @sandbox.spy(utils, "startXvfb")
      @sandbox.stub(utils, "needsXfvb").returns(false)

      utils.spawn("--foo")
      .then ->
        expect(utils.startXvfb).not.to.be.called

    it "starts utils.xvfb", ->
      @sandbox.stub(utils, "needsXfvb").returns(true)

      utils.spawn("--foo")
      .then =>
        expect(@startAsync).to.be.calledOnce

    it "stops utils.xvfb when spawn closes", (done) ->
      @sandbox.stub(utils, "needsXfvb").returns(true)

      spawn.setDefault (cb) =>
        cb(0)
        expect(@stopAsync).to.be.calledOnce
        done()

      utils.spawn("--foo")

    it "exits with spawned exit code", (done) ->
      spawn.setDefault (cb) =>
        cb(10)
        expect(@exit).to.be.calledWith(10)
        done()

      utils.spawn("--foo")

    it "unref's if options.detached = true", ->
      unref = @sandbox.spy()

      @spawn = @sandbox.stub(cp, "spawn").returns({
        on: ->
        unref: unref
      })

      utils.spawn(null, {detached: true}).then ->
        expect(unref).to.be.calledOnce

    it "does not unref by default", ->
      unref = @sandbox.spy()

      @spawn = @sandbox.stub(cp, "spawn").returns({
        on: ->
        unref: unref
      })

      utils.spawn(null).then ->
        expect(unref).not.to.be.called

  context ".needsXfvb", ->
    afterEach ->
      delete process.env.DISPLAY

    it "does not need xvfb on osx", ->
      @sandbox.stub(os, "platform").returns("darwin")

      expect(utils.needsXfvb()).to.be.false

    it "does not need xvfb on linux when DISPLAY is set", ->
      @sandbox.stub(os, "platform").returns("linux")

      process.env.DISPLAY = ":99"

      expect(utils.needsXfvb()).to.be.false

    it "does need xvfb on linux when no DISPLAY is set", ->
      @sandbox.stub(os, "platform").returns("linux")

      expect(utils.needsXfvb()).to.be.true

  context "#getCypressPath", ->
    beforeEach ->
      @log = @sandbox.spy(console, "log")

    it "logs when Cypress is found", ->
      @sandbox.stub(utils, "_fileExistsAtPath").resolves()

      utils.getCypressPath().then =>
        expect(@log).to.be.calledWithMatch "Path to Cypress:", utils.getPathToUserExecutable()
        expect(@log).to.be.calledWithMatch "Cypress was found at this path."

    it "logs when Cypress isnt found", ->
      @sandbox.stub(utils, "_fileExistsAtPath").rejects()

      utils.getCypressPath().then =>
        expect(@log).to.be.calledWithMatch "Path to Cypress:", utils.getPathToUserExecutable()
        expect(@log).to.be.calledWithMatch "Cypress was not found at this path."

  context "#_fileExistsAtPath", ->
    beforeEach ->
      fs.ensureFileAsync("./tmp/foo.txt")

    afterEach ->
      fs.removeAsync("./tmp")

    it "exits with 1 on err", ->
      utils._fileExistsAtPath({pathToCypress: "/does/not/exist"}).then =>
        expect(@exit).to.be.calledWith(1)

    it "returns path on success", ->
      utils._fileExistsAtPath({pathToCypress: "./tmp/foo.txt"}).then (p) ->
        expect(p).to.eq "./tmp/foo.txt"
