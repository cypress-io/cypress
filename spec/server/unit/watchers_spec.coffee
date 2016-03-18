require("../spec_helper")

_        = require("lodash")
chokidar = require("chokidar")
Watchers = require("#{root}lib/watchers")

describe "lib/watchers", ->
  beforeEach ->
    @w = @sandbox.stub({
      on:    ->
      close: ->
    })

    @sandbox.stub(chokidar, "watch").returns(@w)
    @watchers = Watchers()

  it "returns instance of watcher class", ->
    expect(@watchers).to.be.instanceof(Watchers)

  context "#watch", ->
    it "watches with chokidar", ->
      @watchers.watch("/foo/bar")
      expect(chokidar.watch).to.be.calledWith("/foo/bar")
      expect(_.keys(@watchers.watched)).to.have.length(1)
      expect(@watchers.watched).to.have.property("/foo/bar")

  context "#remove", ->
    it "calls close", ->
      @watchers._add("/foo/bar", @w)
      @watchers.remove("/foo/bar")
      expect(@w.close).to.be.calledOnce
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
