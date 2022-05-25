require('../spec_helper')

const _ = require('lodash')
const chokidar = require('chokidar')
const dependencyTree = require('dependency-tree')
const Watchers = require(`${root}lib/watchers`)

describe('lib/watchers', () => {
  let watchStub

  beforeEach(function () {
    this.standardWatcher = sinon.stub({
      on () {},
      close () {},
    })

    watchStub = sinon.stub(chokidar, 'watch').returns(this.standardWatcher)
    this.watchers = new Watchers()
  })

  it('returns instance of watcher class', function () {
    expect(this.watchers).to.be.instanceof(Watchers)
  })

  context('#watch', () => {
    beforeEach(function () {
      return this.watchers.watch('/foo/bar')
    })

    it('watches with chokidar', () => {
      expect(chokidar.watch).to.be.calledWith('/foo/bar')
    })

    it('chokidar watch falls back to polling on error', function () {
      watchStub.reset()
      watchStub.onFirstCall().throws(new Error()).onSecondCall().returns(this.standardWatcher)
      this.watchers.watch('/foo/bar')

      expect(chokidar.watch).to.be.calledWith('/foo/bar', {
        useFsEvents: true,
        ignored: null,
        onChange: null,
        onReady: null,
        onError: null,
        usePolling: true,
      })

      expect(chokidar.watch).to.be.callCount(2)
    })

    it('stores a reference to the watcher', function () {
      expect(_.keys(this.watchers.watchers)).to.have.length(1)

      expect(this.watchers.watchers).to.have.property('/foo/bar')
    })
  })

  context('#watchTree', () => {
    beforeEach(function () {
      sinon.stub(dependencyTree, 'toList').returns([
        '/foo/bar',
        '/dep/a',
        '/dep/b',
      ])

      return this.watchers.watchTree('/foo/bar')
    })

    it('watches each file in dependency tree', () => {
      expect(chokidar.watch).to.be.calledWith('/foo/bar')
      expect(chokidar.watch).to.be.calledWith('/dep/a')

      expect(chokidar.watch).to.be.calledWith('/dep/b')
    })

    it('stores a reference to the watcher', function () {
      expect(_.keys(this.watchers.watchers)).to.have.length(3)
      expect(this.watchers.watchers).to.have.property('/foo/bar')
      expect(this.watchers.watchers).to.have.property('/dep/a')

      expect(this.watchers.watchers).to.have.property('/dep/b')
    })

    it('ignores node_modules', () => {
      expect(dependencyTree.toList.lastCall.args[0].filter('/foo/bar')).to.be.true

      expect(dependencyTree.toList.lastCall.args[0].filter('/node_modules/foo')).to.be.false
    })
  })

  context('#close', () => {
    it('removes each watched property', function () {
      const watched1 = { close: sinon.spy() }

      this.watchers._add('/one', watched1)

      const watched2 = { close: sinon.spy() }

      this.watchers._add('/two', watched2)

      expect(_.keys(this.watchers.watchers)).to.have.length(2)

      this.watchers.close()

      expect(watched1.close).to.be.calledOnce
      expect(watched2.close).to.be.calledOnce

      expect(_.keys(this.watchers.watchers)).to.have.length(0)
    })
  })
})
