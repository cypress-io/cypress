require('../spec_helper')

const _ = require('lodash')
const EE = require('events').EventEmitter
const cp = require('child_process')

const downloadUtils = require('../../lib/download/utils')
const xvfb = require('../../lib/exec/xvfb')
const spawn = require('../../lib/exec/spawn')

describe('exec spawn', function () {
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
    it('passes args + options to spawn', function () {
      return spawn.start('/path/to/cypress', '--foo', { foo: 'bar' }).then(() => {
        expect(cp.spawn).to.be.calledWithMatch('/path/to/cypress', ['--foo'], { foo: 'bar' })
      })
    })

    it('starts xvfb when needed', function () {
      return spawn.start('/path/to/cypress', '--foo').then(() => {
        expect(xvfb.start).to.be.calledOnce
      })
    })

    it('does not start xvfb when its not needed', function () {
      xvfb.isNeeded.returns(false)

      return spawn.start('/path/to/cypress', '--foo').then(() => {
        expect(xvfb.start).not.to.be.called
      })
    })

    it('stops xvfb when spawn closes', function () {
      return spawn.start('/path/to/cypress', '--foo').then(() => {
        this.spawnedProcess.emit('close')
        expect(xvfb.stop).to.be.calledOnce
      })
    })

    it('exits with spawned exit code', function () {
      this.sandbox.stub(process, 'exit')
      return spawn.start('/path/to/cypress', '--foo').then(() => {
        this.spawnedProcess.emit('exit', 10)
        expect(process.exit).to.be.calledWith(10)
      })
    })

    it('unrefs if options.detached is true', function () {
      return spawn.start('/path/to/cypress', null, { detached: true }).then(() => {
        expect(this.spawnedProcess.unref).to.be.calledOnce
      })
    })

    it('does not unref by default', function () {
      return spawn.start('/path/to/cypress', null).then(() => {
        expect(this.spawnedProcess.unref).not.to.be.called
      })
    })
  })
})
