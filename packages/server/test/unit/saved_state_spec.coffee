require("../spec_helper")

path = require("path")
Promise = require("bluebird")
fs = require("#{root}lib/util/fs")
FileUtil = require("#{root}lib/util/file")
appData = require("#{root}lib/util/app_data")
savedState = require("#{root}lib/saved_state")
savedStateUtil = require("#{root}lib/util/saved_state")

describe "lib/util/saved_state", ->
  describe "project name hash", ->
    projectPath = "/foo/bar"

    it "starts with folder name", ->
      hash = savedStateUtil.toHashName projectPath
      expect(hash).to.match(/^bar-/)

    it "computed for given path", ->
      hash = savedStateUtil.toHashName projectPath
      expected = "bar-1df481b1ec67d4d8bec721f521d4937d"
      expect(hash).to.equal(expected)

    it "does not handle empty project path", ->
      tryWithoutPath = () -> savedStateUtil.toHashName()
      expect(tryWithoutPath).to.throw "Missing project path"

describe "lib/saved_state", ->
  beforeEach ->
    fs.unlinkAsync(savedState.path).catch ->
      ## ignore error if file didn't exist in the first place

  it "is a function", ->
    expect(savedState).to.be.a("function")

  it "resolves with an instance of FileUtil", ->
    savedState()
    .then (state) ->
      expect(state).to.be.instanceof(FileUtil)

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

  it "sets path to project name + hash if projectPath", ->
    savedState("/foo/the-project-name")
    .then (state) ->
      expect(state.path).to.include("the-project-name")

  it "sets path __global__ if no projectPath", ->
    savedState()
    .then (state) ->
      expected = path.join(appData.path(), "projects", "__global__", "state.json")
      expect(state.path).to.equal(expected)
