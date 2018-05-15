require("../spec_helper")

cp   = require("child_process")
open = require("#{root}lib/util/open")

platform = (p) ->
  Object.defineProperty(process, "platform", {
    value: p
  })

describe "lib/util/open", ->
  beforeEach ->
    @platform = process.platform

    cpStub = sinon.stub({
      once: ->
      unref: ->
    })

    cpStub.once.withArgs("close").yieldsAsync(0)

    sinon.stub(cp, "spawn").returns(cpStub)

  afterEach ->
    ## reset the platform
    platform(@platform)

  it "spawns process with osx args", ->
    platform("darwin")

    open.opn("../foo", {args: "-R"})
    .then ->
      expect(cp.spawn).to.be.calledWith("open", ["-W", "-R", "../foo"])

  it "spawns process with linux args", ->
    platform("linux")

    open.opn("../foo", {args: "-R"})
    .then ->
      expect(cp.spawn).to.be.calledWithMatch("xdg-open", ["../foo"])
