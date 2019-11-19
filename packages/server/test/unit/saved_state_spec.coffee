require("../spec_helper")

path = require("path")
Promise = require("bluebird")

fs = require("#{root}lib/util/fs")
FileUtil = require("#{root}lib/util/file")
appData = require("#{root}lib/util/app_data")

{ savedState, toHashName } = require("#{root}lib/saved_state")

describe "lib/saved_state", ->
  context "#toHashName", ->
    projectRoot = "/foo/bar"

    it "starts with folder name", ->
      hash = toHashName(projectRoot)
      expect(hash).to.match(/^bar-/)

    it "computed for given path", ->
      hash = toHashName(projectRoot)
      expected = "bar-1df481b1ec67d4d8bec721f521d4937d"
      expect(hash).to.equal(expected)

    it "does not handle empty project path", ->
      tryWithoutPath = () -> toHashName()
      expect(tryWithoutPath).to.throw "Missing project path"

  context "#savedState", ->
    beforeEach ->
      savedState().then (state) ->
        fs.unlinkAsync(state.path)
      .catch ->
        ## ignore error if file didn't exist in the first place

    it "is a function", ->
      expect(savedState).to.be.a("function")

    it "resolves with an instance of FileUtil", ->
      savedState()
      .then (state) ->
        expect(state).to.be.instanceof(FileUtil)

    it "resolves with a noop instance if isTextTerminal", ->
      savedState("/foo/bar", true)
      .then (state) ->
        expect(state).to.equal(FileUtil.noopFile)

    it "caches state file instance per path", ->
      Promise.all([
        savedState("/foo/bar"),
        savedState("/foo/bar")
      ]).spread (a, b) ->
        expect(a).to.equal(b)

    it "returns different state file for different path", ->
      a = savedState("/foo/bar")
      b = savedState("/foo/baz")
      expect(a).to.not.equal(b)

    it "sets path to project name + hash if projectRoot", ->
      savedState("/foo/the-project-name")
      .then (state) ->
        expect(state.path).to.include("the-project-name")

    it "sets path __global__ if no projectRoot", ->
      savedState()
      .then (state) ->
        expected = path.join(appData.path(), "projects", "__global__", "state.json")
        expect(state.path).to.equal(expected)

    it "only saves whitelisted keys", ->
      savedState()
      .then (state) ->
        state.set({ foo: "bar", appWidth: 20 })
        .then ->
          state.get()
      .then (stateObject) ->
        expect(stateObject).to.eql({ appWidth: 20 })

    it "logs error when attempting to set invalid key(s)", ->
      sinon.spy(console, "error")
      savedState()
      .then (state) ->
        state.set({ foo: "bar", baz: "qux" })
      .then ->
        expect(console.error).to.be.calledWith("WARNING: attempted to save state for non-whitelisted key(s): foo, baz. All keys must be whitelisted in server/lib/saved_state.coffee")
