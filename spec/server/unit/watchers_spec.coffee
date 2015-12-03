require("../spec_helper")

_ = require "lodash"

chokidar = {
  watch: ->
    {
      on: ->
    }
}

Watchers = proxyquire.noCallThru().load("../../lib/watchers", {
  chokidar: chokidar
})

describe "Watchers", ->
  beforeEach ->
    @watchers = Watchers()

  it "returns instance of watcher class", ->
    expect(@watchers).to.be.instanceof(Watchers)

  context "#watch", ->
    beforeEach ->
      @watch = @sandbox.spy(chokidar, "watch")

    it "watches with chokidar", ->
      @watchers.watch("/foo/bar")
      expect(@watch).to.be.calledWith("/foo/bar")
      expect(_.keys(@watchers.watched)).to.have.length(1)
      expect(@watchers.watched).to.have.property("/foo/bar")

  context "#remove", ->
    it "calls close", ->
      watched = {close: @sandbox.spy()}
      @watchers._add("/foo/bar", watched)
      @watchers.remove("/foo/bar")
      expect(watched.close).to.be.calledOnce
      expect(_.keys(@watchers.watched)).to.have.length(0)
      expect(@watchers.watched).not.to.have.property("/foo/bar")

  context "#_close", ->
    it "removes each watched property", ->
      watched1 = {close: @sandbox.spy()}
      @watchers._add("/one", watched1)

      watched2 = {close: @sandbox.spy()}
      @watchers._add("/two", watched2)

      expect(_.keys(@watchers.watched)).to.have.length(2)

      @watchers.close()

      expect(watched1.close).to.be.calledOnce
      expect(watched2.close).to.be.calledOnce

      expect(_.keys(@watchers.watched)).to.have.length(0)

  context "#watchAsync", ->
    it "resolves promise onReady", (done) ->
      options = {}

      _.delay ->
        options.onReady()
      , 50

      @watchers.watchAsync("/foo/bar", options).then -> done()
