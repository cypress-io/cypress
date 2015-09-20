fs        = require("fs-extra")
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

      @sandbox.stub(utils, "_fileExistsAtPath").resolves()
      @sandbox.stub(utils, "_cypressSmokeTest").resolves()
      @sandbox.stub(utils, "getPathToExecutable").returns("/path/to/cypress")

    it "passes args + options to spawn", ->
      @spawn = @sandbox.stub(cp, "spawn").returns({on: ->})
      utils.spawn("--foo", {foo: "bar"}).then =>
        expect(@spawn).to.be.calledWithMatch("/path/to/cypress", ["--foo"], {foo: "bar"})

    it "starts utils.xvfb", ->
      utils.spawn("--foo", {xvfb: true}).then =>
        expect(@startAsync).to.be.calledOnce

    it "stops utils.xvfb when spawn closes", (done) ->
      spawn.setDefault (cb) =>
        cb(0)
        expect(@stopAsync).to.be.calledOnce
        done()

      utils.spawn("--foo", {xvfb: true})

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

      utils.spawn(null, {detached: true, xvfb: false}).then ->
        expect(unref).to.be.calledOnce

    it "does not unref by default", ->
      unref = @sandbox.spy()

      @spawn = @sandbox.stub(cp, "spawn").returns({
        on: ->
        unref: unref
      })

      utils.spawn(null, {xvfb: false}).then ->
        expect(unref).not.to.be.called

  context "#_fileExistsAtPath", ->
    beforeEach ->
      fs.ensureFileAsync("./tmp/foo.txt")

    afterEach ->
      fs.removeAsync("./tmp")

    it "exits with 1 on err", ->
      utils._fileExistsAtPath("/does/not/exist").then =>
        expect(@exit).to.be.calledWith(1)

    it "returns path on success", ->
      utils._fileExistsAtPath("./tmp/foo.txt").then (p) ->
        expect(p).to.eq "./tmp/foo.txt"

  context "#_cypressSmokeTest", ->
    it "exits with 1 on err", ->
      @sandbox.stub(cp, "exec").callsArgWith(1, (new Error("foo")))

      utils._cypressSmokeTest("/does/not/exist")
        .catch (err) =>
          expect(err.message).to.eq("foo")
          expect(@exit).to.be.calledWith(1)

    it "exits with 1 if stdout isnt ping", ->
      @sandbox.stub(cp, "exec").callsArgWith(1, null, "asdf")
      @sandbox.stub(utils, "getPathToUserExecutable").returns("/foo/bar/baz")
      log = @sandbox.spy(console, "log")

      utils._cypressSmokeTest("/does/no/exist")
        .catch (err) =>
          expect(log).to.be.calledWithMatch("Cypress was found at this path:", "/foo/bar/baz")
          expect(@exit).to.be.calledWith(1)
