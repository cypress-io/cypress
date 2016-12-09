require("../spec_helper")

_        = require("lodash")
chokidar = require("chokidar")
Watchers = require("#{root}lib/watchers")
bundle = require("#{root}lib/util/bundle")

describe "lib/watchers", ->
  beforeEach ->
    @standardWatcher = @sandbox.stub({
      on:    ->
      close: ->
    })

    @bundleWatcher = @sandbox.stub({
      addChangeListener: ->
      close: ->
      getLatestBundle: ->
    })

    @sandbox.stub(chokidar, "watch").returns(@standardWatcher)
    @sandbox.stub(bundle, "build").returns(@bundleWatcher)
    @watchers = Watchers()

  it "returns instance of watcher class", ->
    expect(@watchers).to.be.instanceof(Watchers)

  context "#watch", ->
    beforeEach ->
      @watchers.watch("/foo/bar")

    it "watches with chokidar", ->
      expect(chokidar.watch).to.be.calledWith("/foo/bar")

    it "stores a reference to the watcher", ->
      expect(_.keys(@watchers.watchers)).to.have.length(1)
      expect(@watchers.watchers).to.have.property("/foo/bar")

  context "#watchBundle", ->
    beforeEach ->
      @config = {}
      @bundleWatcher.getLatestBundle.returns("latest bundle")

    it "watches with bundle watcher", ->
      @watchers.watchBundle("/foo/bar", @config)
      expect(bundle.build).to.be.calledWith("/foo/bar", @config, true)

    it "stores a reference to the watcher", ->
      @watchers.watchBundle("/foo/bar", @config)
      expect(_.keys(@watchers.bundleWatchers)).to.have.length(1)
      expect(@watchers.bundleWatchers).to.have.property("/foo/bar")

    it "does not add change listener if not specified", ->
      expect(@bundleWatcher.addChangeListener).not.to.have.been.called

    it "returns the latest bundle", ->
      expect(@watchers.watchBundle("/foo/bar", @config)).to.equal("latest bundle")

    it "adds change listener if specified", ->
      changeListener = @sandbox.spy()
      @watchers.watchBundle("/foo/bar", @config, { onChange: changeListener })
      expect(@bundleWatcher.addChangeListener).to.have.been.calledWith(changeListener)

    it "does not watch builds when config.watchForFileChanges is false", ->
      @config.watchForFileChanges = false
      @watchers.watchBundle("/foo/bar", @config)
      expect(bundle.build).to.be.calledWith("/foo/bar", @config, false)

  context "#removeBundle", ->
    it "calls close on the bundle watcher", ->
      @watchers._addBundle("/foo/bar", @bundleWatcher)
      @watchers.removeBundle("/foo/bar")
      expect(@bundleWatcher.close).to.be.calledOnce
      expect(_.keys(@watchers.watchers)).to.have.length(0)
      expect(@watchers.watchers).not.to.have.property("/foo/bar")

  context "#close", ->
    it "removes each watched property", ->
      watched1 = {close: @sandbox.spy()}
      @watchers._add("/one", watched1)

      watched2 = {close: @sandbox.spy()}
      @watchers._add("/two", watched2)

      watchedBundle1 = {close: @sandbox.spy()}
      @watchers._addBundle("/bundleone", watchedBundle1)

      watchedBundle2 = {close: @sandbox.spy()}
      @watchers._addBundle("/bundletwo", watchedBundle2)

      expect(_.keys(@watchers.watchers)).to.have.length(2)
      expect(_.keys(@watchers.bundleWatchers)).to.have.length(2)

      @watchers.close()

      expect(watched1.close).to.be.calledOnce
      expect(watched2.close).to.be.calledOnce
      expect(watchedBundle1.close).to.be.calledOnce
      expect(watchedBundle2.close).to.be.calledOnce

      expect(_.keys(@watchers.watchers)).to.have.length(0)
      expect(_.keys(@watchers.bundleWatchers)).to.have.length(0)
