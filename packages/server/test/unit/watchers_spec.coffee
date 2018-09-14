require("../spec_helper")

_ = require("lodash")
chokidar = require("chokidar")
dependencyTree = require("dependency-tree")
Watchers = require("#{root}lib/watchers")

describe "lib/watchers", ->
  beforeEach ->
    @standardWatcher = sinon.stub({
      on:    ->
      close: ->
    })

    sinon.stub(chokidar, "watch").returns(@standardWatcher)
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

  context "#watchTree", ->
    beforeEach ->
      sinon.stub(dependencyTree, "toList").returns([
        "/foo/bar"
        "/dep/a"
        "/dep/b"
      ])
      @watchers.watchTree("/foo/bar")

    it "watches each file in dependency tree", ->
      expect(chokidar.watch).to.be.calledWith("/foo/bar")
      expect(chokidar.watch).to.be.calledWith("/dep/a")
      expect(chokidar.watch).to.be.calledWith("/dep/b")

    it "stores a reference to the watcher", ->
      expect(_.keys(@watchers.watchers)).to.have.length(3)
      expect(@watchers.watchers).to.have.property("/foo/bar")
      expect(@watchers.watchers).to.have.property("/dep/a")
      expect(@watchers.watchers).to.have.property("/dep/b")

    it "ignores node_modules", ->
      expect(dependencyTree.toList.lastCall.args[0].filter("/foo/bar")).to.be.true
      expect(dependencyTree.toList.lastCall.args[0].filter("/node_modules/foo")).to.be.false

  context "#close", ->
    it "removes each watched property", ->
      watched1 = {close: sinon.spy()}
      @watchers._add("/one", watched1)

      watched2 = {close: sinon.spy()}
      @watchers._add("/two", watched2)

      expect(_.keys(@watchers.watchers)).to.have.length(2)

      @watchers.close()

      expect(watched1.close).to.be.calledOnce
      expect(watched2.close).to.be.calledOnce

      expect(_.keys(@watchers.watchers)).to.have.length(0)
