require('../../spec_helper')

const cp = require('child_process')

const info = require(`${lib}/tasks/info`)
const xvfb = require(`${lib}/exec/xvfb`)
const spawn = require(`${lib}/exec/spawn`)

describe('exec spawn', function () {
  beforeEach(function () {
    this.sandbox.stub(process, 'exit')
    this.spawnedProcess = this.sandbox.stub({
      on: () => {},
      unref: () => {},
    })
    this.sandbox.stub(cp, 'spawn').returns(this.spawnedProcess)
    this.sandbox.stub(xvfb, 'start').resolves()
    this.sandbox.stub(xvfb, 'stop').resolves()
    this.sandbox.stub(xvfb, 'isNeeded').returns(true)
    this.sandbox.stub(info, 'getPathToExecutable').returns('/path/to/cypress')
  })

  context('.start', function () {
    it('passes args + options to spawn', function () {
      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)
      return spawn.start('--foo', { foo: 'bar' }).then(() => {
        expect(cp.spawn).to.be.calledWithMatch('/path/to/cypress', ['--foo'], { foo: 'bar' })
      })
    })

    it('starts xvfb when needed', function () {
      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)
      return spawn.start('--foo').then(() => {
        expect(xvfb.start).to.be.calledOnce
      })
    })

    it('does not start xvfb when its not needed', function () {
      xvfb.isNeeded.returns(false)

      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)
      return spawn.start('--foo').then(() => {
        expect(xvfb.start).not.to.be.called
      })
    })

    it('stops xvfb when spawn closes', function () {
      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)
      this.spawnedProcess.on.withArgs('close').yields()
      return spawn.start('--foo').then(() => {
        expect(xvfb.stop).to.be.calledOnce
      })
    })

    it('resolves with spawned close code in the message', function () {
      this.spawnedProcess.on.withArgs('close').yieldsAsync(10)

      return spawn.start('--foo')
      .then((code) => {
        expect(code).to.equal(10)
      })
    })

    it('rejects with error from spawn', function () {
      const msg = 'the error message'
      this.spawnedProcess.on.withArgs('error').yieldsAsync(new Error(msg))

      return spawn.start('--foo')
      .then(() => {
        throw new Error('should have hit error handler but did not')
      }, (e) => {
        expect(e.message).to.include(msg)
      })
    })

    it('unrefs if options.detached is true', function () {
      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)
      return spawn.start(null, { detached: true }).then(() => {
        expect(this.spawnedProcess.unref).to.be.calledOnce
      })
    })

    it('does not unref by default', function () {
      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)
      return spawn.start().then(() => {
        expect(this.spawnedProcess.unref).not.to.be.called
      })
    })
  })
})
