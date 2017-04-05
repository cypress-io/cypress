require('../spec_helper')

const _ = require('lodash')
const EE = require('events').EventEmitter
const cp = require('child_process')

const download = require('../../lib/download')
const xvfb = require('../../lib/cli/xvfb')
const utils = require('../../lib/cli/utils')

describe('cli utils', function () {
  beforeEach(function () {
    this.spawnedProcess = _.extend(new EE(), {
      unref: this.sandbox.stub(),
    })
    this.sandbox.stub(cp, 'spawn').returns(this.spawnedProcess)
    this.sandbox.stub(xvfb, 'start').resolves()
    this.sandbox.stub(xvfb, 'stop').resolves()
    this.sandbox.stub(xvfb, 'isNeeded').returns(true)
  })

  context('#spawn', function () {
    beforeEach(function () {
      this.sandbox.stub(download, 'verify').resolves()
      this.sandbox.stub(download, 'getPathToExecutable').resolves('/path/to/cypress')
    })

    it('passes args + options to spawn', function () {
      return utils.spawn('--foo', { foo: 'bar' }).then(() => {
        expect(cp.spawn).to.be.calledWithMatch('/path/to/cypress', ['--foo'], { foo: 'bar' })
      })
    })

    it('starts xvfb when needed', function () {
      return utils.spawn('--foo').then(() => {
        expect(xvfb.start).to.be.calledOnce
      })
    })

    it('does not start xvfb when its not needed', function () {
      xvfb.isNeeded.returns(false)

      return utils.spawn('--foo').then(() => {
        expect(xvfb.start).not.to.be.called
      })
    })

    it('stops xvfb when spawn closes', function () {
      return utils.spawn('--foo').then(() => {
        this.spawnedProcess.emit('close')
        expect(xvfb.stop).to.be.calledOnce
      })
    })

    it('exits with spawned exit code', function () {
      this.sandbox.stub(process, 'exit')
      return utils.spawn('--foo').then(() => {
        this.spawnedProcess.emit('exit', 10)
        expect(process.exit).to.be.calledWith(10)
      })
    })

    it('unrefs if options.detached is true', function () {
      return utils.spawn(null, { detached: true }).then(() => {
        expect(this.spawnedProcess.unref).to.be.calledOnce
      })
    })

    it('does not unref by default', function () {
      return utils.spawn(null).then(() => {
        expect(this.spawnedProcess.unref).not.to.be.called
      })
    })
  })
})
